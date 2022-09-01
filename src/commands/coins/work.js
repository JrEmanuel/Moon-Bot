const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const applyCooldown = [];
module.exports = {
    name: "work",
    run: async (bot, messageOrInteraction, args, { slashCommand, prefixUsed, type, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            let jobs = config.Coins.Work.Jobs;
    
            // Make sure all jobs are setup correctly
            let error = false;
            jobs.forEach(job => {
                let name = Object.keys(jobs)[jobs.indexOf(job)];
                if (!job.Tiers || job.Tiers.length < 1) {
                    error = true;
                    console.log(Utils.errorPrefix + `[WORK COMMAND] ${name} is missing tiers!`);
                }
                if (job.Tiers && !job.Tiers.every((tier, i) => {
                    if (i == 0) {
                        return tier.HourlyPay && tier.Name;
                    } else {
                        return Object.keys(tier.Requirements).length > 0 && !!tier.Requirements.TimesWorked && tier.HourlyPay && tier.Name;
                    }
                })) {
                    error = true;
                    console.log(Utils.errorPrefix + `[WORK COMMAND] All tiers in the ${name} job must have an hourly pay setting, required amount of times worked (Except for first tier), and name!`);
                }
            });
            if (error) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Work.Errors.InvalidJobSetup
                }), { ephemeral: true });
                return resolve();
            }
    
            let userJob = await Utils.variables.db.get.getJobs(member);
            // Tell to apply if no job and send help menu
            if (((type == "message" ? !args[0] : slashCommand?.subcommand == "shift") && !userJob) || (type == "interaction" ? slashCommand?.subcommand == "help" : args[0] && args[0] == 'help')) {
                reply(Embed({
                    title: lang.CoinModule.Commands.Work.Embeds.Help.Title,
                    description: lang.CoinModule.Commands.Work.Embeds.Help.Description,
                    fields: [
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[0], value: prefixUsed + "work jobs" },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[1], value: prefixUsed + "work apply <job>" },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[2], value: prefixUsed + (type == "interaction" ? "work shift" : "work") },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[3], value: prefixUsed + "work quit" },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[4], value: prefixUsed + "work info" },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[5], value: prefixUsed + "work jobinfo <job>" },
                        { name: lang.CoinModule.Commands.Work.Embeds.Help.Fields[6], value: prefixUsed + "work help" },
                    ]
                }));
                if (type == "message" && !args[0] && !userJob) reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Work.Errors.ConsiderApplying 
                }), { ephemeral: true }).then(m => {
                    if (type == "message") Utils.delete(m, 2500);
                });

                return resolve(true);
            }
    
            // Work
            if (type == "interaction" ? slashCommand?.subcommand == "shift" && userJob : !args[0] && userJob) {
                let workCooldown = await Utils.variables.db.get.getWorkCooldowns(member);
                if (workCooldown && +workCooldown.date > Date.now()) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Work.Errors.WorkCooldown.replace(/{time}/g, Utils.getTimeDifference(Date.now(), +workCooldown.date)) 
                    }), { ephemeral: true });
                    return resolve(true);
                }
    
                let job = jobs.find(job => job.Name == userJob.job);
                let shift = [4, 6, 8][Math.floor(Math.random() * 3)];
                let pay = shift * job.Tiers[userJob.tier].HourlyPay * (config.Coins.Multipliers.Multiplies.Work ? Utils.getMultiplier(member) : 1);
                let nextWorkTime = new Date();
                let cooldown = config.Coins.Work.Cooldown;
                cooldown >= 1 ? nextWorkTime.setHours(nextWorkTime.getHours() + cooldown) : nextWorkTime.setMinutes(nextWorkTime.getMinutes() + (cooldown * 60));
    
                await Utils.variables.db.update.coins.setWorkCooldown(member, nextWorkTime.getTime());
                await Utils.variables.db.update.coins.setWorkAmount(member, userJob.amountOfTimesWorked + 1);
                await Utils.variables.db.update.coins.updateCoins(member, pay, "add");
                reply(Embed({ 
                    color: config.EmbedColors.Success, 
                    title: lang.CoinModule.Commands.Work.Embeds.WorkComplete.Title, 
                    description: lang.CoinModule.Commands.Work.Embeds.WorkComplete.Description.replace(/{shift}/g, shift).replace(/{pay}/g, pay.toLocaleString()).replace(/{time}/g, config.Coins.Work.Cooldown == 0 ? ' now ' : Utils.getTimeDifference(new Date(), nextWorkTime)) 
                }));
    
                if (job.Tiers[userJob.tier + 1]) {
                    let requirements = Object.assign({}, job.Tiers[userJob.tier + 1].Requirements);
    
                    await Utils.asyncForEach(Object.keys(requirements).filter(requirement => requirements[requirement]), async (requirement) => {
                        if (requirement == "Coins" && !isNaN(requirements.Coins)) {
                            let coins = await Utils.variables.db.get.getCoins(member);
    
                            if (+requirements.Coins <= coins)
                                requirements.Coins = true;
                        }
    
                        else if (["Exp", "XP", "Experience"].includes(requirement) && !isNaN(requirements[requirement])) {
                            let xp = await Utils.variables.db.get.getExperience(member);
    
                            if (+requirements[requirement] <= xp.xp)
                                requirements[requirement] = true;
                        }
    
                        else if (requirement == "Level" && !isNaN(requirements.Level)) {
                            let xp = await Utils.variables.db.get.getExperience(member);
    
                            if (+requirements.Level <= xp.level)
                                requirements.Level = true;
                        }
    
                        else if (requirement == "Role") {
                            let role = guild.roles.cache.find(r => r.name == requirements.Role || r.id == requirements.Role);
    
                            if (role && member.roles.cache.get(role.id))
                                requirements.Role = true;
                        }
    
                        else if (requirement == "TimesWorked" && !isNaN(requirements.TimesWorked)) {
                            let jobData = await Utils.variables.db.get.getJobs(member);
    
                            if (+requirements.TimesWorked <= jobData.amountOfTimesWorked)
                                requirements.TimesWorked = true;
                        }
                    });
    
                    if (Object.values(requirements).every(requirement => requirement == true)) {
                        await Utils.variables.db.update.coins.setJob(member, userJob.job, (userJob.tier + 1));
                        reply(Embed({ 
                            color: config.EmbedColors.Success, 
                            title: lang.CoinModule.Commands.Work.Embeds.Promotion.Title, 
                            description: lang.CoinModule.Commands.Work.Embeds.Promotion.Description.replace(/{tier}/g, job.Tiers[userJob.tier + 1].Name).replace(/{pay}/g, job.Tiers[userJob.tier + 1].HourlyPay) 
                        }));
                    }
                }
    
                return resolve(true);
            } else if (type == "interaction" ? slashCommand?.subcommand == "apply" : args[0] == "apply") {
                if (userJob) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Work.Errors.AlreadyHaveJob.replace(/{prefix}/g, prefixUsed) 
                    }), { ephemeral: true });
                    return resolve(true);
                }
    
                if (applyCooldown.find(c => c.id == user.id)) {
                    let aCooldown = applyCooldown.find(c => c.id == user.id);
                    if (aCooldown.date.getTime() <= Date.now()) {
                        applyCooldown.splice(applyCooldown.indexOf(applyCooldown.find(c => c.id == user.id)));
                    }
                }
    
                if (!applyCooldown.find(c => c.id == user.id)) {
                    if (type == "interaction" ? !args[0] : !args[1]) {
                        reply(Embed({ 
                            preset: "invalidargs", 
                            usage: "work apply <job>" 
                        }, { prefixUsed }), { ephemeral: true });
                        return resolve();
                    }
    
                    const jobName = type == "interaction" ? args[0] : args.slice(1).join(" ");
                    let job = jobs.find(job => job.Name.toLowerCase() == jobName?.toLowerCase());
    
                    if (!job) {
                        reply(Embed({ 
                            preset: "error", 
                            description: lang.CoinModule.Commands.Work.Errors.InvalidJob.replace(/{prefix}/g, prefixUsed) 
                        }), { ephemeral: true });
                        return resolve();
                    }
    
                    let requirements = job.Tiers[0].Requirements ? Object.assign({}, job.Tiers[0].Requirements) : undefined;
    
                    if (requirements) await Utils.asyncForEach(Object.keys(requirements).filter(requirement => requirements[requirement]), async (requirement) => {
                        if (requirement == "Coins" && !isNaN(requirements.Coins)) {
                            let coins = await Utils.variables.db.get.getCoins(member);
    
                            if (+requirements.Coins <= coins)
                                requirements.Coins = true;
                        }
    
                        if (["Exp", "XP", "Experience"].includes(requirement) && !isNaN(requirements[requirements])) {
                            let xp = await Utils.variables.db.get.getExperience(member);
    
                            if (+requirements[requirements] <= xp.xp)
                                requirements[requirements] = true;
                        }
    
                        if (requirement == "Level" && !isNaN(requirements.Level)) {
                            let xp = await Utils.variables.db.get.getExperience(member);
    
                            if (+requirements.Level <= xp.level)
                                requirements.Level = true;
                        }
    
                        if (requirement == "TimesWorked" && !isNaN(requirements.TimesWorked)) {
                            let timesWorked = await Utils.variables.db.get.getGlobalTimesWorked(member);
    
                            if (+requirements.TimesWorked <= timesWorked)
                                requirements.TimesWorked = true;
                        }
    
                        if (requirement == "Role") {
                            let role = guild.roles.cache.find(r => r.name == requirements.Role || r.id == requirements.Role);
                            if (role && member.roles.cache.get(role.id))
                                requirements.Role = true;
                        }
                    });
    
                    if ((requirements && Object.values(requirements).every(requirement => requirement == true)) || !requirements) {
                        await Utils.variables.db.update.coins.setJob(member, job.Name, 0);
                        
                        reply(Embed({ 
                            color: config.EmbedColors.Success, 
                            title: lang.CoinModule.Commands.Work.Embeds.Applied.Title, 
                            description: lang.CoinModule.Commands.Work.Embeds.Applied.Description.replace(/{job}/g, job.Tiers[0].Name).replace(/{workplace}/g, job.Name) 
                        }));

                        let d = new Date();
                        d.setHours(d.getHours() + 24);
                        applyCooldown.push({ id: user.id, date: d });
                    } else {
                        reply(Embed({
                            preset: "error",
                            description: lang.CoinModule.Commands.Work.Errors.FailedRequirements
                        }), { ephemeral: true });
                    }

                    return resolve(true);
                } else {
                    let date = applyCooldown.find(c => c.id == user.id).date;
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Work.Errors.ApplyCooldown.replace(/{time}/g, Utils.getTimeDifference(new Date(), date)) 
                    }), { ephemeral: true });
                    return resolve(true);
                }
    
            } else if (["jobs", "list"].includes(type == "interaction" ? slashCommand?.subcommand : args[0])) {
                reply(Embed({
                    title: lang.CoinModule.Commands.Work.Embeds.List.Title,
                    fields: jobs.map(job => {
                        let jobInfo = job.Tiers[0];
                        let requirements = Object.keys(jobInfo.Requirements).filter(requirementName => {
                            let requirement = jobInfo.Requirements[requirementName];
                            return !!requirement;
                        }).map(requirementName => {
                            let requirement = jobInfo.Requirements[requirementName];
                            if (requirementName == "TimesWorked") return lang.CoinModule.Commands.Work.Requirements.TimesWorked.replace(/{requirement}/g, requirement);
                            return lang.CoinModule.Commands.Work.Requirements.Other.replace(/{requirement-name}/g, requirementName.charAt(0).toUpperCase() + requirementName.substring(1)).replace(/{requirement}/g, requirement);
                        });
    
                        let replace = text => {
                            return text
                                .replace(/{job-name}/g, job.Name)
                                .replace(/{job-displayName}/g, job.DisplayName)
                                .replace(/{job-pay}/g, jobInfo.HourlyPay.toLocaleString())
                                .replace(/{job-requirements}/g, requirements.join("\n") || lang.CoinModule.Commands.Work.Requirements.NoRequirements);
                        };
    
                        return {
                            name: replace(lang.CoinModule.Commands.Work.Embeds.List.Format[0]),
                            value: replace(lang.CoinModule.Commands.Work.Embeds.List.Format[1])
                        };
                    })
                }));
                return resolve(true);
            } else if (["leave", "quit"].includes(type == "interaction" ? slashCommand?.subcommand : args[0])) {
                if (!userJob) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Work.Errors.NoJob
                    }), { ephemeral: true });
                    return resolve(true);
                }
    
                let msg = await reply(Embed({ title: lang.CoinModule.Commands.Work.Embeds.Quit.Confirmation }));
                await msg.react("✅");
                await msg.react("❌");
                Utils.waitForReaction(["❌", "✅"], user.id, msg).then(async reaction => {
                    msg.reactions.removeAll().catch(() => {});

                    if (reaction.emoji.name == '✅') {
                        await Utils.variables.db.update.coins.quitJob(member);
                        msg.edit(Embed({ 
                            color: config.EmbedColors.Success, 
                            title: lang.CoinModule.Commands.Work.Embeds.Quit.Left 
                        }));

                        return resolve(true);
                    } else {
                        msg.edit(Embed({ 
                            preset: "error", 
                            description: lang.CoinModule.Commands.Work.Embeds.Quit.Cancel
                        }));

                        return resolve();
                    }
                });
            } else if (type == "interaction" ? slashCommand?.subcommand == "jobinfo" : args[0] == "jobinfo") {
                if (type == "interaction" ? !args[0] : !args[1]) {
                    reply(Embed({ 
                        preset: "invalidargs", 
                        usage: "work jobinfo <job>" 
                    }, { prefixUsed }), { ephemeral: true });
                    return resolve();
                }
    
                const jobName = type == "interaction" ? args[0] : args.slice(1).join(" ");
                let job = jobs.find(job => job.Name.toLowerCase() == jobName?.toLowerCase() || job.DisplayName.toLowerCase() == jobName?.toLowerCase());
    
                if (!job) {
                    reply(Embed({ 
                        preset: "error", 
                        title: lang.CoinModule.Commands.Work.Embeds.JobInfo.NoJob.replace(/{jobs}/g, jobs.map(job => job.Name).join(", ")) 
                    }), { ephemeral: true });
                    return resolve();
                }
    
                reply(Embed({
                    title: `${job.DisplayName}`,
                    fields: job.Tiers.map(tier => {
                        let requirements = Object.keys(tier.Requirements).filter(requirementName => {
                            let requirement = tier.Requirements[requirementName];
                            return !!requirement;
                        }).map(requirementName => {
                            let requirement = tier.Requirements[requirementName];
                            if (requirementName == "TimesWorked") return lang.CoinModule.Commands.Work.Requirements.TimesWorked.replace(/{requirement}/g, requirement);
                            return lang.CoinModule.Commands.Work.Requirements.Other.replace(/{requirement-name}/g, requirementName.charAt(0).toUpperCase() + requirementName.substring(1)).replace(/{requirement}/g, requirement);
                        });
    
                        let replace = text => {
                            return text
                                .replace(/{tier-name}/g, tier.Name)
                                .replace(/{job-displayName}/g, job.DisplayName)
                                .replace(/{tier-pay}/g, tier.HourlyPay.toLocaleString())
                                .replace(/{tier-requirements}/g, requirements.join("\n") || lang.CoinModule.Commands.Work.Requirements.NoRequirements);
                        };
    
                        return {
                            name: replace(lang.CoinModule.Commands.Work.Embeds.JobInfo.Field.Name),
                            value: replace(lang.CoinModule.Commands.Work.Embeds.JobInfo.Field.Value)
                        };
                    })
                }));
    
                return resolve(true);
            } else if (type == "interaction" ? slashCommand?.subcommand == "info" : args[0] == "info") {
                if (!userJob) {
                    let timesWorked = await Utils.variables.db.get.getGlobalTimesWorked(member);
                    let availableJobs = [];
    
                    await jobs.forEach(async job => {
                        let requirements = job.Tiers[0].Requirements ? Object.assign({}, job.Tiers[0].Requirements) : undefined;
    
                        if (requirements) await Utils.asyncForEach(Object.keys(requirements).filter(requirement => requirements[requirement]), async (requirement) => {
                            if (requirement == "Coins" && !isNaN(requirements.Coins)) {
                                let coins = await Utils.variables.db.get.getCoins(member);
    
                                if (+requirements.Coins <= coins)
                                    requirements.Coins = true;
                            }
    
                            if (["Exp", "XP", "Experience"].includes(requirement) && !isNaN(requirements[requirement])) {
                                let xp = await Utils.variables.db.get.getExperience(member);
    
                                if (+requirements[requirement] <= xp.xp)
                                    requirements[requirement] = true;
                            }
    
                            if (requirement == "Level" && !isNaN(requirements.Level)) {
                                let xp = await Utils.variables.db.get.getExperience(member);
    
                                if (+requirements.Level <= xp.level)
                                    requirements.Level = true;
                            }
    
                            if (requirement == "TimesWorked" && !isNaN(requirements.TimesWorked)) {
                                let timesWorked = await Utils.variables.db.get.getGlobalTimesWorked(member);
    
                                if (+requirements.TimesWorked <= timesWorked)
                                    requirements.TimesWorked = true;
                            }
    
                            if (requirement == "Role") {
                                let role = guild.roles.cache.find(r => r.name == requirements.Role || r.id == requirements.Role);
                                if (role && member.roles.cache.get(role.id))
                                    requirements.Role = true;
                            }
                        });
    
                        if ((requirements && Object.values(requirements).every(requirement => requirement == true)) || !requirements) {
                            availableJobs.push(job);
                        }
                    });
    
    
                    reply(Embed({
                        title: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Title,
                        fields: [
                            { name: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Fields[0].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Fields[0].Value, inline: true },
                            { name: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Fields[1].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Fields[1].Value.replace(/{amount}/g, timesWorked), inline: true },
                            { name: lang.CoinModule.Commands.Work.Embeds.Info.NoJob.Fields[2], value: availableJobs.length ? availableJobs.map(job => lang.CoinModule.Commands.Work.Embeds.Info.NoJob.AvailableJobsFormat.replace(/{job-name}/g, job.DisplayName).replace(/{tier-name}/g, job.Tiers[0].Name).replace(/{tier-pay}/g, job.Tiers[0].HourlyPay)).join("\n\n") : lang.Global.None }
                        ],
                        color: availableJobs.length ? config.EmbedColors.Success : config.EmbedColors.Error
                    }));

                    return resolve(true);
                }
    
                let job = jobs.find(job => job.Name == userJob.job);
                let currentTier = job.Tiers[userJob.tier];
                let nextTier = job.Tiers[userJob.tier + 1];
                let workCooldown = await Utils.variables.db.get.getWorkCooldowns(member);
    
                let promotionStatus = nextTier && nextTier.Requirements ? await Promise.all(Object.keys(nextTier.Requirements).map(async requirementName => {
                    if (requirementName == "TimesWorked") {
                        let amt = nextTier.Requirements[requirementName] - userJob.amountOfTimesWorked;
                        if (amt < 1) return false;
                        return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.TimesWorked.replace(/{amount}/g, amt);
                    }
                    if (requirementName == "Level" || requirementName == "XP") {
                        const neededLevel = nextTier.Requirements[requirementName];
                        const level = await Utils.variables.db.get.getExperience(member);
                        const xpNeeded = ~~((neededLevel * (175 * neededLevel) * 0.5)) - level.xp;
    
                        if (requirementName == "Level") {
                            if (level.level >= neededLevel) return false;
                            return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Level.replace(/{level}/g, neededLevel).replace(/{xp}/g, xpNeeded);
                        }
                        if (["Exp", "XP", "Experience"].includes(requirementName)) {
                            let amt = neededLevel - level.xp;
                            if (amt < 1) return false;
                            return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.XP.replace(/{xp}/g, neededLevel).replace(/{amount}/g, amt);
                        }
                    }
                    if (requirementName == "Coins") {
                        let coins = await Utils.variables.db.get.getCoins(member);
                        let amt = nextTier.Requirements[requirementName] - coins;
                        if (amt < 1) return false;
                        return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Coins.replace(/{coins}/g, nextTier.Requirements[requirementName]).replace(/{amount}/g, amt);
                    }
                    if (requirementName == "Role") {
                        if (!Utils.hasRole(member, nextTier.Requirements[requirementName])) return false;
                        return lang.CoinModule.Commands.Work.Embeds.Info.Requirements.Role.replace(/{role}/g, nextTier.Requirements[requirementName]);
                    }
                })) : [];
    
                let nextTierFields = nextTier ? [
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Name, value: !promotionStatus.filter(req => req).length ? lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[0] : lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[1].replace(/{requirements}/g, promotionStatus.filter(req => req).join("\n")) },
                    { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[5].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[5].Value.replace(/{tier-name}/g, nextTier.Name).replace(/{tier-pay}/g, nextTier.HourlyPay) }
                ] : [{ name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[4].Value[2] }];
    
                reply(Embed({
                    title: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Title,
                    fields: [
                        { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[0], value: userJob.job, inline: true },
                        { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[1], value: currentTier.Name, inline: true },
                        { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[2].Name, value: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[2].Value.replace(/{tier-pay}/g, currentTier.HourlyPay).replace(/{times-worked}/g, userJob.amountOfTimesWorked).replace(/{global-times-worked}/g, userJob.globalTimesWorked), inline: true },
                        { name: lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Name, value: workCooldown && +workCooldown.date > Date.now() ? lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Value[0] : lang.CoinModule.Commands.Work.Embeds.Info.Embed.Fields[3].Value[1] },
                        ...nextTierFields,
                    ],
                    color: nextTier && !promotionStatus.filter(req => req).length ? config.EmbedColors.Success : nextTier ? config.EmbedColors.Error : "#ffd500"
                }));

                return resolve(true);
            }
        });
    },
    description: "Work at a job to earn coins",
    usage: "work [apply/jobs/quit/jobinfo/info]",
    aliases: ["job"],
    arguments: [
        {
            name: "help",
            description: "Get help with the work command",
            type: "SUB_COMMAND"
        },
        {
            name: "shift",
            description: "Work a shift to earn coins",
            type: "SUB_COMMAND"
        },
        {
            name: "apply",
            description: "Apply for a job",
            options: [
                {
                    name: "job",
                    description: "The job you want to apply for",
                    required: true,
                    type: "STRING"
                }
            ],
            type: "SUB_COMMAND"
        },
        {
            name: "jobs",
            description: "View the existing jobs",
            type: "SUB_COMMAND"
        },
        {
            name: "quit",
            description: "Quit your job",
            type: "SUB_COMMAND"
        },
        {
            name: "jobinfo",
            description: "Get info on a job",
            options: [
                {
                    name: "job",
                    description: "The job you want to apply for",
                    required: true,
                    type: "STRING"
                }
            ],
            type: "SUB_COMMAND"
        },
        {
            name: "info",
            description: "Get status on your job",
            type: "SUB_COMMAND"
        }
    ]
};
