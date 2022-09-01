const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { lang, config } = Utils.variables;

module.exports = {
    name: "gedit",
    run: async (bot, messageOrInteraction, args, { member, guild: messageGuild, channel, reply }) => {
        return new Promise(async resolve => {
            const giveaway = args.length > 0 ? await Utils.variables.db.get.getGiveawayFromID(args[0]) || await Utils.variables.db.get.getGiveawayFromName(args.join(" ")) : await Utils.variables.db.get.getLatestGiveaway();
            const geditLang = lang.GiveawaySystem.Commands.Gedit;
            if (args.length > 0 && !giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.UnknownGiveaway
                }), { ephemeral: true });
                return resolve();
            }

            if (!giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NoGiveaways
                }), { ephemeral: true });
                return resolve();
            }

            if (giveaway.ended) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.AlreadyEnded
                }), { ephemeral: true });
                return resolve();
            }

            const link = `https://discordapp.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`;

            reply(Embed({
                title: geditLang.ThisGiveaway.Title,
                description: geditLang.ThisGiveaway.Description.replace(/{link}/g, link)
            }))
                .then(async m => {
                    await m.react("✅");
                    await m.react("❌");

                    Utils.waitForReaction(["✅", "❌"], member.id, m)
                        .then(reaction => {
                            m.delete().catch(() => { });

                            if (reaction.emoji.name == "❌") {
                                reply(Embed({
                                    preset: "error",
                                    description: geditLang.Canceled
                                }));
                                return resolve();
                            } else {
                                const questions = [
                                    geditLang.Questions[0],
                                    geditLang.Questions[1],
                                    geditLang.Questions[2],
                                    geditLang.Questions[3],
                                    geditLang.Questions[4],
                                ];
                                const emojis = new Array(6).fill().map((x, i) => Utils.getEmoji(i + 1));

                                emojis.push("✅", "❌");

                                channel.send(Embed({
                                    title: geditLang.Edit.Title,
                                    description: Object.values(geditLang.Edit.Description).map(d => d[0]).join(""),
                                    footer: geditLang.Edit.Footer
                                })).then(m => {
                                    emojis.forEach(async e => {
                                        await m.react(e);
                                    });

                                    giveaway.requirements = JSON.parse(giveaway.requirements);

                                    let collecting = true;
                                    let collector = m.createReactionCollector({ filter: (reaction, user) => emojis.includes(reaction.emoji.name) && user.id == member.id && collecting });
                                    let newGiveaway = JSON.parse(JSON.stringify(giveaway));

                                    collector.on("collect", async (reaction) => {
                                        collecting = false;
                                        reaction.users.remove(member);

                                        if (reaction.emoji.name == "✅") return collector.stop("finish");
                                        if (reaction.emoji.name == "❌") return collector.stop("canceled");

                                        await (async () => {
                                            return new Promise(async resolve => {
                                                if (reaction.emoji.name == Utils.getEmoji(6)) {
                                                    const emojis = new Array(6).fill().map((x, i) => Utils.getEmoji(i + 1));
                                                    const desc = geditLang.Requirements.Description;
                                                    let guild = newGiveaway.requirements && newGiveaway.requirements.server && newGiveaway.requirements.server.id ? bot.guilds.cache.get(newGiveaway.requirements.server.id) : undefined;

                                                    emojis.push("✅", "❌");

                                                    let rMsg = await reply(Embed({
                                                        title: geditLang.Requirements.Title,
                                                        description: [
                                                            newGiveaway.requirements.coins ? desc.Coins[0] : desc.Coins[1],
                                                            newGiveaway.requirements.xp ? desc.XP[0] : desc.XP[1],
                                                            newGiveaway.requirements.level ? desc.Level[0] : desc.Level[1],
                                                            newGiveaway.requirements.server ? desc.Server[0] : desc.Server[1],
                                                            newGiveaway.requirements.roles && (newGiveaway.requirements.roles.mustHave.length || newGiveaway.requirements.roles.cantHave.length) ? desc.Roles[0] : desc.Roles[1],
                                                            newGiveaway.requirements.messages ? desc.Messages[0] : desc.Messages[1]
                                                        ]
                                                            .join("")
                                                            .replace(/{coins}/g, newGiveaway.requirements.coins ? newGiveaway.requirements.coins.toLocaleString() : 0)
                                                            .replace(/{xp}/g, newGiveaway.requirements.xp ? newGiveaway.requirements.xp.toLocaleString() : 0)
                                                            .replace(/{level}/g, newGiveaway.requirements.level ? newGiveaway.requirements.level.toLocaleString() : 0)
                                                            .replace(/{server-name}/g, guild ? guild.name : lang.Global.None)
                                                            .replace(/{roles-must}/g, newGiveaway.requirements.roles && newGiveaway.requirements.roles.mustHave.length ? newGiveaway.requirements.roles.mustHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                                            .replace(/{roles-cant}/g, newGiveaway.requirements.roles && newGiveaway.requirements.roles.cantHave.length ? newGiveaway.requirements.roles.cantHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                                            .replace(/{messages}/g, newGiveaway.requirements.messages ? newGiveaway.requirements.messages.toLocaleString() : 0)
                                                    }));

                                                    emojis.forEach(emoji => rMsg.react(emoji).catch(() => { }));

                                                    let collecting2 = true;
                                                    let collector2 = rMsg.createReactionCollector({ filter: (reaction, user) => emojis.includes(reaction.emoji.name) && user.id == member.id && collecting2 });

                                                    collector2.on("collect", async (reaction) => {
                                                        collecting2 = false;
                                                        reaction.users.remove(member);

                                                        if (reaction.emoji.name == "✅") return collector2.stop("finish");
                                                        if (reaction.emoji.name == "❌") return collector2.stop("canceled");

                                                        let type = Utils.getEmoji(1) == reaction.emoji.name ? "coins" : Utils.getEmoji(2) == reaction.emoji.name ? "xp" : Utils.getEmoji(6) == reaction.emoji.name ? "messages" : "level";
                                                        let question;

                                                        if (reaction.emoji.name == Utils.getEmoji(4)) question = lang.GiveawaySystem.Commands.Gcreate.Requirements.Questions[0];
                                                        if (reaction.emoji.name == Utils.getEmoji(5)) question = lang.GiveawaySystem.Commands.Gcreate.Requirements.Questions[2];
                                                        if ([Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3), Utils.getEmoji(6)].includes(reaction.emoji.name)) question = lang.GiveawaySystem.Commands.Gcreate.Requirements.Questions[4].replace(/{type}/g, type == "coins" ? lang.GiveawaySystem.Commands.Gcreate.Requirements.Coins : type == "xp" ? lang.GiveawaySystem.Commands.Gcreate.Requirements.XP : type == "messages" ? lang.GiveawaySystem.Commands.Gcreate.Requirements.Messages : lang.GiveawaySystem.Commands.Gcreate.Requirements.Level);

                                                        let q = await reply(Embed({ title: question, footer: lang.GiveawaySystem.Commands.Gcreate.Requirements.Footer }));
                                                        let invalid = true;

                                                        while (invalid) {
                                                            await Utils.waitForResponse(member.id, channel)
                                                                .then(async response => {
                                                                    response.delete().catch(() => { });

                                                                    if (response.content.toLowerCase() == "cancel") return invalid = false;

                                                                    else if ([Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3), Utils.getEmoji(6)].includes(reaction.emoji.name)) {
                                                                        let amount = +response.content;

                                                                        if (response.content.toLowerCase() == "none") {
                                                                            newGiveaway.requirements[type] = undefined;
                                                                            return invalid = false;
                                                                        }

                                                                        if (isNaN(amount) || amount < 1) return reply(Embed({
                                                                            preset: "error",
                                                                            description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Number
                                                                        }), { ephemeral: true, deleteAfter: 3000 });

                                                                        newGiveaway.requirements[type] = amount;
                                                                        invalid = false;
                                                                    }

                                                                    else if (reaction.emoji.name == Utils.getEmoji(4)) {
                                                                        if (response.content.toLowerCase() == "none") {
                                                                            newGiveaway.requirements.server = undefined;
                                                                            return invalid = false;
                                                                        }

                                                                        let guild = bot.guilds.cache.get(response.content);

                                                                        if (!guild) return reply(Embed({
                                                                            preset: "error",
                                                                            description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Guild
                                                                        }), { ephemeral: true, deleteAfter: 3000 });

                                                                        let invalid2 = true;

                                                                        newGiveaway.requirements.server = {
                                                                            id: guild.id
                                                                        };

                                                                        q.delete();
                                                                        while (invalid2) {
                                                                            let q2 = await reply(Embed({ title: lang.GiveawaySystem.Commands.Gcreate.Requirements.Questions[1], footer: lang.GiveawaySystem.Commands.Gcreate.Requirements.Footer }));
                                                                            await Utils.waitForResponse(member.id, channel)
                                                                                .then(async response => {
                                                                                    response.delete().catch(() => { });

                                                                                    let c = Utils.findChannel(response.content, guild, 'GUILD_TEXT', false);

                                                                                    if (!c) return reply(Embed({
                                                                                        preset: "error",
                                                                                        description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Channel[1]
                                                                                    }), { ephemeral: true, deleteAfter: 3000 });

                                                                                    q2.delete();
                                                                                    await c.createInvite({ temporary: false, maxAge: 0 })
                                                                                        .then(invite => {
                                                                                            newGiveaway.requirements.server.link = invite.url;
                                                                                        })
                                                                                        .catch(() => {
                                                                                            reply(Embed({
                                                                                                preset: "error",
                                                                                                description: lang.GiveawaySystem.Commands.Gcreate.Requirements.InviteError
                                                                                            }), { ephemeral: true, deleteAfter: 3000 });

                                                                                            newGiveaway.requirements.server = undefined;
                                                                                        });
                                                                                    invalid2 = false;
                                                                                });
                                                                        }
                                                                        invalid = false;
                                                                    }

                                                                    else if (reaction.emoji.name == Utils.getEmoji(5)) {
                                                                        let promise = new Promise(async resolve => {
                                                                            q.delete().catch(() => { });
                                                                            newGiveaway.requirements.roles.cantHave = response.content.toLowerCase() == "none" ? [] : response.mentions.roles.map(role => role.id);

                                                                            const q2 = await reply(Embed({ title: lang.GiveawaySystem.Commands.Gcreate.Requirements.Questions[3], footer: lang.GiveawaySystem.Commands.Gcreate.Requirements.Footer }));

                                                                            await Utils.waitForResponse(member.id, channel)
                                                                                .then(response2 => {
                                                                                    response2.delete().catch(() => { });
                                                                                    newGiveaway.requirements.roles.mustHave = response2.content.toLowerCase() == "none" ? [] : response2.mentions.roles.map(role => role.id);

                                                                                    if (response2.content.toLowerCase() == "cancel") {
                                                                                        q2.delete().catch(() => { });
                                                                                        return resolve();
                                                                                    }

                                                                                    q2.delete().catch(() => { });
                                                                                    resolve();
                                                                                });
                                                                        });

                                                                        await promise;

                                                                        invalid = false;
                                                                    }
                                                                });
                                                        }

                                                        q.delete().catch(() => { });

                                                        if (newGiveaway.requirements.server) guild = bot.guilds.cache.get(newGiveaway.requirements.server.id);
                                                        else guild = undefined;

                                                        rMsg.edit(Embed({
                                                            title: geditLang.Requirements.Title,
                                                            description: [
                                                                newGiveaway.requirements.coins ? desc.Coins[0] : desc.Coins[1],
                                                                newGiveaway.requirements.xp ? desc.XP[0] : desc.XP[1],
                                                                newGiveaway.requirements.level ? desc.Level[0] : desc.Level[1],
                                                                newGiveaway.requirements.server ? desc.Server[0] : desc.Server[1],
                                                                newGiveaway.requirements.roles && (newGiveaway.requirements.roles.mustHave.length || newGiveaway.requirements.roles.cantHave.length) ? desc.Roles[0] : desc.Roles[1],
                                                                newGiveaway.requirements.messages ? desc.Messages[0] : desc.Messages[1],
                                                            ]
                                                                .join("")
                                                                .replace(/{coins}/g, newGiveaway.requirements.coins ? newGiveaway.requirements.coins.toLocaleString() : 0)
                                                                .replace(/{xp}/g, newGiveaway.requirements.xp ? newGiveaway.requirements.xp.toLocaleString() : 0)
                                                                .replace(/{level}/g, newGiveaway.requirements.level ? newGiveaway.requirements.level.toLocaleString() : 0)
                                                                .replace(/{server-name}/g, guild ? guild.name : lang.Global.None)
                                                                .replace(/{roles-must}/g, newGiveaway.requirements.roles && newGiveaway.requirements.roles.mustHave.length ? newGiveaway.requirements.roles.mustHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                                                .replace(/{roles-cant}/g, newGiveaway.requirements.roles && newGiveaway.requirements.roles.cantHave.length ? newGiveaway.requirements.roles.cantHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                                                .replace(/{messages}/g, newGiveaway.requirements.messages ? newGiveaway.requirements.messages.toLocaleString() : 0)
                                                        }));

                                                        collecting2 = true;
                                                    });

                                                    collector2.on("end", (collected, reason) => {
                                                        rMsg.delete().catch(() => { });
                                                        if (reason == "canceled") {
                                                            newGiveaway.requirements = giveaway.requirements;
                                                        }
                                                        collecting = true;
                                                        resolve();
                                                    });
                                                } else {
                                                    let index = emojis.indexOf(reaction.emoji.name);
                                                    let q = await reply(Embed({ title: questions[index], footer: lang.GiveawaySystem.Commands.Gedit.Edit.Footer }));
                                                    let newValue;

                                                    while (!newValue) {
                                                        await Utils.waitForResponse(member.id, channel)
                                                            .then(response => {
                                                                response.delete();

                                                                if (response.content.toLowerCase() == "cancel") {
                                                                    q.delete().catch(() => { });
                                                                    return newValue = "canceled";
                                                                }

                                                                if (index == 0 || index == 1) newValue = response.content;

                                                                if (index == 2) {
                                                                    if (!Utils.getMSFromText(response.content)) {
                                                                        reply(Embed({
                                                                            preset: "error",
                                                                            description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Time
                                                                        }), { ephemeral: true, deleteAfter: 3000 });
                                                                    } else newValue = Date.now() + Utils.getMSFromText(response.content);
                                                                }

                                                                if (index == 3) {
                                                                    if (!+response.content || +response.content < 1) {
                                                                        reply(Embed({
                                                                            preset: "error",
                                                                            description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Number
                                                                        }), { ephemeral: true, deleteAfter: 3000 });
                                                                    } else newValue = +response.content;
                                                                }

                                                                if (index == 4) {
                                                                    if (!response.mentions.members.size) {
                                                                        if (response.content.toLowerCase() == "me") {
                                                                            newValue = member.id;
                                                                        } else {
                                                                            reply(Embed({
                                                                                preset: "error",
                                                                                description: lang.GiveawaySystem.Commands.Gcreate.Invalid.Member
                                                                            }), { ephemeral: true, deleteAfter: 3000 });
                                                                        }
                                                                    } else newValue = response.mentions.members.first().id;
                                                                }
                                                            });
                                                    }

                                                    q.delete().catch(() => { });

                                                    if (newValue !== "canceled") {
                                                        if (index == 0) newGiveaway.prize = newValue;
                                                        if (index == 1) newGiveaway.description = newValue.toLowerCase() == "none" ? undefined : newValue;
                                                        if (index == 2) newGiveaway.end = newValue;
                                                        if (index == 3) newGiveaway.amount_of_winners = newValue;
                                                        if (index == 4) newGiveaway.host = newValue;
                                                    }

                                                    collecting = true;
                                                    resolve();
                                                }
                                            });
                                        })();

                                        const desc = geditLang.Edit.Description;
                                        m.edit(Embed({
                                            title: geditLang.Edit.Title,
                                            description: [
                                                giveaway.prize == newGiveaway.prize ? desc.Prize[0] : desc.Prize[1],
                                                giveaway.description == newGiveaway.description ? desc.Description[0] : desc.Description[1],
                                                giveaway.end == newGiveaway.end ? desc.Date[0] : desc.Date[1],
                                                giveaway.amount_of_winners == newGiveaway.amount_of_winners ? desc.Winners[0] : desc.Winners[1],
                                                giveaway.host == newGiveaway.host ? desc.Host[0] : desc.Host[1],
                                                JSON.stringify(giveaway.requirements) == JSON.stringify(newGiveaway.requirements) ? desc.Requirements[0] : desc.Requirements[1]
                                            ]
                                                .join("")
                                                .replace(/{prize}/g, newGiveaway.prize)
                                                .replace(/{description}/g, !newGiveaway.description ? lang.Global.None : (() => {
                                                    let newD = newGiveaway.description.substring(0, 10);
                                                    return newD + (newD !== newGiveaway.description ? "..." : "");
                                                })())
                                                .replace(/{date}/g, new Date(newGiveaway.end).toLocaleString())
                                                .replace(/{amount}/g, newGiveaway.amount_of_winners)
                                                .replace(/{host}/g, `<@${newGiveaway.host}>`)
                                                .replace(/{requirements}/g, JSON.stringify(giveaway.requirements) == JSON.stringify(newGiveaway.requirements) ? lang.Global.None : (() => {
                                                    let changedRequirements = [];

                                                    Object.keys(newGiveaway.requirements).forEach(r => {
                                                        if (r == "roles") {
                                                            if (newGiveaway.requirements.roles.cantHave && newGiveaway.requirements.roles.cantHave.length && JSON.stringify(newGiveaway.requirements.roles.cantHave) !== JSON.stringify(giveaway.requirements.roles.cantHave)) {
                                                                changedRequirements.push(geditLang.Edit.RequirementsList[0].replace(/{roles}/g, newGiveaway.requirements.roles.cantHave.map(role => `<@${role}>`)));
                                                            }

                                                            if (newGiveaway.requirements.roles.mustHave && newGiveaway.requirements.roles.mustHave.length && JSON.stringify(newGiveaway.requirements.roles.mustHave) !== JSON.stringify(giveaway.requirements.roles.mustHave)) {
                                                                changedRequirements.push(geditLang.Edit.RequirementsList[1].replace(/{roles}/g, newGiveaway.requirements.roles.mustHave.map(role => `<@${role}>`)));
                                                            }
                                                        }
                                                        else if (r == "server") {
                                                            if (newGiveaway.requirements.server && newGiveaway.requirements.server.id !== giveaway.requirements.server.id) {
                                                                let guild = bot.guilds.cache.get(newGiveaway.requirements.server.id);
                                                                changedRequirements.push(geditLang.Edit.RequirementsList[2].replace(/{server-name}/g, guild.name));
                                                            }
                                                        }
                                                        else {
                                                            if (newGiveaway.requirements[r] && newGiveaway.requirements[r] !== giveaway.requirements[r]) {
                                                                changedRequirements.push((r == "xp" ? geditLang.Edit.RequirementsList[3] : r == "coin" ? geditLang.Edit.RequirementsList[4] : r == "messages" ? geditLang.Edit.RequirementsList[6] : geditLang.Edit.RequirementsList[5]).replace(/{amount}/g, newGiveaway.requirements[r]));
                                                            }
                                                        }
                                                    });

                                                    return changedRequirements.map(d => `> ${d}`).join("\n");
                                                })()),
                                            footer: geditLang.Edit.Footer
                                        }));
                                    });

                                    collector.on("end", async (collected, reason) => {
                                        m.delete().catch(() => { });

                                        if (reason == "finish") {
                                            const msg = await messageGuild.channels.cache.get(newGiveaway.channel).messages.fetch(newGiveaway.message);

                                            await Utils.variables.db.update.giveaways.deleteGiveaway(newGiveaway.message);
                                            newGiveaway.channel = msg.channel;
                                            newGiveaway.host = messageGuild.members.cache.get(newGiveaway.host);
                                            await Utils.variables.db.update.giveaways.addGiveaway(newGiveaway);

                                            if (!Object.keys(newGiveaway.requirements).length) newGiveaway.requirements = undefined;

                                            const server = newGiveaway.requirements && newGiveaway.requirements.server ? bot.guilds.cache.get(newGiveaway.requirements.server.id) : undefined;
                                            const giveawayMessage = newGiveaway.requirements ? Utils.variables.embeds.Embeds.GiveawayWithRequirements : Utils.variables.embeds.Embeds.Giveaway;

                                            await msg.edit(Utils.setupMessage({
                                                configPath: giveawayMessage,
                                                description: giveawayMessage.description == "{description}" ? newGiveaway.description : giveawayMessage.description,
                                                variables: [
                                                    { searchFor: /{prize}/g, replaceWith: newGiveaway.prize },
                                                    { searchFor: /{description}/g, replaceWith: !newGiveaway.description ? "" : "\n" + newGiveaway.description + "\n" },
                                                    { searchFor: /{winners}/g, replaceWith: newGiveaway.amount_of_winners },
                                                    { searchFor: /{host}/g, replaceWith: newGiveaway.host.toString() },
                                                    { searchFor: /{time-left}/g, replaceWith: `<t:${Math.floor(newGiveaway.end / 1000)}:R>` },
                                                    { searchFor: /{requirements-coins}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.coins ? lang.GiveawaySystem.Requirements.Coins.replace(/{amount}/g, newGiveaway.requirements.coins.toLocaleString()) : "" },
                                                    { searchFor: /{requirements-xp}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.xp ? lang.GiveawaySystem.Requirements.XP.replace(/{amount}/g, newGiveaway.requirements.xp.toLocaleString()) : "" },
                                                    { searchFor: /{requirements-level}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.level ? lang.GiveawaySystem.Requirements.Level.replace(/{level}/g, newGiveaway.requirements.level.toLocaleString()) : "" },
                                                    { searchFor: /{requirements-server}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.server ? lang.GiveawaySystem.Requirements.Server.replace(/{server-name}/g, server.name).replace(/{server-invite}/g, newGiveaway.requirements.server.link) : "" },
                                                    { searchFor: /{requirements-roles-cant-have}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.roles && newGiveaway.requirements.roles.cantHave && newGiveaway.requirements.roles.cantHave.length ? newGiveaway.requirements.roles.cantHave.length == 1 ? lang.GiveawaySystem.Requirements.Roles.CantHave.One.replace(/{role}/g, `<@&${newGiveaway.requirements.roles.cantHave[0]}>`) : lang.GiveawaySystem.Requirements.Roles.CantHave.Multple.replace(/{roles}/g, newGiveaway.requirements.roles.cantHave.map(r => `<@&${r}>`)) : "" },
                                                    { searchFor: /{requirements-roles-must-have}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.roles && newGiveaway.requirements.roles.mustHave && newGiveaway.requirements.roles.mustHave.length ? newGiveaway.requirements.roles.mustHave.length == 1 ? lang.GiveawaySystem.Requirements.Roles.MustHave.One.replace(/{role}/g, `<@&${newGiveaway.requirements.roles.mustHave[0]}>`) : lang.GiveawaySystem.Requirements.Roles.MustHave.Multple.replace(/{roles}/g, newGiveaway.requirements.roles.mustHave.map(r => `<@&${r}>`)) : "" },
                                                    { searchFor: /{requirements-messages}/g, replaceWith: newGiveaway.requirements && newGiveaway.requirements.messages ? lang.GiveawaySystem.Requirements.Messages.replace(/{amount}/g, newGiveaway.requirements.messages.toLocaleString()) : "" },
                                                    {
                                                        searchFor: /{extra-entries}/g, replaceWith: Object.keys(config.Other.Giveaways.ExtraEntries).map(r => {
                                                            let role = Utils.findRole(r, messageGuild);
                                                            let entries = config.Other.Giveaways.ExtraEntries[r];
                                                            if (role) return lang.GiveawaySystem.ExtraEntries.replace(/{role}/g, `<@&${role.id}>`).replace(/{amount}/g, entries);
                                                            else return undefined;
                                                        }).filter(r => r).join("\n")
                                                    }
                                                ],
                                                timestamp: giveawayMessage.Timestamp ? new Date(newGiveaway.end) : undefined
                                            }));

                                            reply(Embed({
                                                title: geditLang.Edited.Title,
                                                description: geditLang.Edited.Description.replace(/{name}/g, giveaway.prize).replace(/{url}/g, msg.url)
                                            }));

                                            return resolve(true);
                                        }

                                        reply(Embed({
                                            preset: "error",
                                            description: geditLang.Canceled
                                        }));

                                        return resolve();
                                    });
                                });
                            }
                        });
                });
        });
    },
    aliases: [],
    usage: "gedit [giveaway name|message id]",
    description: "Edit a giveaway",
    arguments: [
        {
            name: "giveaway",
            description: "The giveaway to edit (giveaway name or message id)",
            required: false,
            type: "STRING"
        }
    ]
};
