const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
const stringify = require("safe-stable-stringify");

module.exports = async (bot, event) => {
    if (!["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE"].includes(event.t)) return;

    const { d: data } = event;
    const channel = bot.channels.cache.get(data.channel_id);
    const user = await bot.users.fetch(data.user_id || data.member.user.id);
    const emojiKey = (data.emoji.id) ? data.emoji.id : data.emoji.name;

    let message = await channel.messages.fetch(data.message_id);

    if (!user || message.channel.type == 'DM') return;

    const member = message.guild.members.cache.get(user.id);

    if (!member) return;

    const prefix = await Utils.variables.db.get.getPrefixes(message.guild.id);

    if (user.bot && event.t == "MESSAGE_REACTION_REMOVE"
        && message.id == config.Verification.Reaction.MessageID
        && config.Verification.Enabled == true
        && config.Verification.Type == 'reaction'
        && emojiKey == config.Verification.Reaction.Emoji
        && user.id == bot.user.id) {
        message.react(emojiKey);
    }

    if (user.bot) return;

    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (config.Other.IgnoredGuilds.includes(channel.guild.id)) return;

        // HELP MENU
        if (message.embeds.length > 0 && message.embeds[0].title && config.Help.Type == "categorized" && event.t == "MESSAGE_REACTION_ADD") {
            if (message.embeds[0].title.startsWith(config.Help.NormalTitle) || message.embeds[0].title.startsWith(config.Help.StaffTitle)) {
                let CommandList = require("../modules/methods/generateHelpMenu");
                if (!CommandList.general) await CommandList.setup();

                let category = config.Help.Categories;

                if (message.embeds[0].title.startsWith(config.Help.NormalTitle)) {
                    if (emojiKey == "🔙") {
                        message.edit(Utils.setupMessage({
                            title: Utils.variables.config.Help.NormalTitle,
                            configPath: Utils.variables.embeds.Embeds.CategorizedHelp,
                            variables: [
                                ...Utils.userVariables(message.guild.me, "bot"),
                                { searchFor: /{prefix}/g, replaceWith: prefix }
                            ]
                        }));
                        return message.reactions.cache.get('🔙').remove();
                    }

                    category = category.filter(c => !c.Staff);
                }

                if (message.embeds[0].title.startsWith(config.Help.StaffTitle)) {
                    if (emojiKey == "🔙") {
                        message.edit(Utils.setupMessage({
                            title: Utils.variables.config.Help.StaffTitle,
                            configPath: Utils.variables.embeds.Embeds.CategorizedStaffHelp,
                            variables: [
                                ...Utils.userVariables(message.guild.me, "bot"),
                                { searchFor: /{prefix}/g, replaceWith: prefix }
                            ]
                        }));
                        return message.reactions.cache.get('🔙').remove();
                    }

                    category = category.filter(c => c.Staff);
                }

                category = category
                    .find(category => {
                        const customEmoji = Utils.findEmoji(category.Emoji, bot, false);
                        return emojiKey == (customEmoji ? customEmoji.id : category.Emoji);
                    });

                if (category) {
                    message.edit(Utils.Embed({
                        title: (category.Staff ? Utils.variables.config.Help.StaffTitle : Utils.variables.config.Help.NormalTitle) + " | " + category.DisplayNames[1],
                        description: category.Modules.filter(module => CommandList[module]).map(module => CommandList[module]).join("\n").replace(/{prefix}/g, prefix),
                        footer: {
                            text: message.guild.me.displayName,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date()
                    }));
                    message.reactions.cache.get(emojiKey).users.remove(user);
                    return message.react('🔙');
                }
            }

            let category = config.Help.Categories.find(category => message.embeds[0].title.startsWith(`${category.Emoji} ${category.DisplayNames[1]}`));

            if (category) {
                let CommandList = require("../modules/methods/generateHelpMenu");
                if (!CommandList.general) await CommandList.setup();

                let commands = category.Modules.filter(module => CommandList[module]).map(module => CommandList[module]).join("\n");
                let pages = Math.ceil(commands.split("\n").length / 20);
                let currentPage = parseInt(message.embeds[0].title.split("Page ")[1].split("/")[0]);

                if (emojiKey == "◀️" && currentPage != 1) message.edit(Utils.Embed({
                    title: `${category.Emoji} ${category.DisplayNames[1]} (Page ${currentPage - 1}/${pages})`,
                    description: commands.split("\n").slice((currentPage - 2) * 20, (currentPage - 1) * 20).join("\n").replace(/{prefix}/g, prefix),
                    footer: {
                        text: message.guild.me.displayName,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    timestamp: new Date()
                }));

                else if (emojiKey == "▶️" && currentPage != pages) message.edit(Utils.Embed({
                    title: `${category.Emoji} ${category.DisplayNames[1]} (${lang.Global.Page} ${currentPage + 1}/${pages})`,
                    description: commands.split("\n").slice((currentPage) * 20, (currentPage + 1) * 20).join("\n").replace(/{prefix}/g, prefix),
                    footer: {
                        text: message.guild.me.displayName,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    timestamp: new Date()
                }));

                return message.reactions.cache.get(emojiKey).users.remove(user);
            }
        }

        // GIVEAWAYS
        let customEmoji = Utils.findEmoji(config.Other.Giveaways.UnicodeEmoji, bot, false);
        if (emojiKey == (customEmoji ? customEmoji.id : config.Other.Giveaways.UnicodeEmoji)) {
            const giveawaysModule = await Utils.variables.db.get.getModules('giveaways');
            if (giveawaysModule && giveawaysModule.enabled) {
                const Giveaway = await Utils.variables.db.get.getGiveaways(message.id);
                if (Giveaway && !Giveaway.ended) {
                    const failed = [];
                    Giveaway.requirements = JSON.parse(Giveaway.requirements);

                    if (Object.values(Giveaway.requirements).length) {
                        if (Giveaway.requirements.coins) {
                            let coins = await Utils.variables.db.get.getCoins(member);

                            if (coins < Giveaway.requirements.coins) failed.push(lang.GiveawaySystem.FailedRequirements.Coins.replace(/{coins}/g, Giveaway.requirements.coins).replace(/{needed}/g, Giveaway.requirements.coins - coins));
                        }

                        if (Giveaway.requirements.xp) {
                            let xp = await Utils.variables.db.get.getExperience(member);

                            if (xp.xp < Giveaway.requirements.xp) failed.push(lang.GiveawaySystem.FailedRequirements.XP.replace(/{xp}/g, Giveaway.requirements.xp).replace(/{needed}/g, Giveaway.requirements.xp - xp.xp));
                        }

                        if (Giveaway.requirements.level) {
                            let xp = await Utils.variables.db.get.getExperience(member);

                            if (xp.level < Giveaway.requirements.level) failed.push(lang.GiveawaySystem.FailedRequirements.Level.replace(/{level}/g, Giveaway.requirements.level).replace(/{needed}/g, Giveaway.requirements.level - xp.level));
                        }

                        if (Giveaway.requirements.server) {
                            let server = bot.guilds.cache.get(Giveaway.requirements.server.id);

                            if (server && !server.members.cache.get(member.id)) failed.push(lang.GiveawaySystem.FailedRequirements.Server.replace(/{server-name}/g, server.name).replace(/{url}/g, Giveaway.requirements.server.link));
                        }

                        if (Giveaway.requirements.roles.cantHave && Giveaway.requirements.roles.cantHave.length) {
                            if (member.roles.cache.some(r => Giveaway.requirements.roles.cantHave.includes(r.id))) failed.push(lang.GiveawaySystem.FailedRequirements.Roles.CantHave.replace(/{roles}/g, Giveaway.requirements.roles.cantHave.map(r => message.guild.roles.cache.get(r).name).join(", ")));
                        }

                        if (Giveaway.requirements.roles.mustHave && Giveaway.requirements.roles.mustHave.length) {
                            if (!Giveaway.requirements.roles.mustHave.every(r => member.roles.cache.get(r))) failed.push(lang.GiveawaySystem.FailedRequirements.Roles.MustHave.replace(/{roles}/g, Giveaway.requirements.roles.mustHave.map(r => message.guild.roles.cache.get(r).name).join(", ")));
                        }

                        if (Giveaway.requirements.messages) {
                            let messages = await Utils.variables.db.get.getMessageCount(member);

                            if (messages < Giveaway.requirements.messages) failed.push(lang.GiveawaySystem.FailedRequirements.Messages.replace(/{message-count}/g, Giveaway.requirements.messages).replace(/{needed}/g, Giveaway.requirements.messages - messages));
                        }
                    }


                    if (event.t == "MESSAGE_REACTION_ADD") {
                        if (failed.length) {
                            message.reactions.cache.get(emojiKey).users.remove(member);
                            return member.send(Embed({
                                title: lang.GiveawaySystem.CantParticipate.Title,
                                description: lang.GiveawaySystem.CantParticipate.Description.replace(/{name}/g, Giveaway.prize).replace(/{url}/g, message.url).replace(/{failed-requirements}/g, failed.join("\n")),
                                timestamp: new Date()
                            }));
                        }

                        let entries = 1;

                        await Object.keys(config.Other.Giveaways.ExtraEntries).forEach(async r => {
                            if (Utils.hasRole(member, r, false)) entries = config.Other.Giveaways.ExtraEntries[r];
                        });

                        bot.emit("giveawayJoined", member, message, Giveaway);
                        Utils.variables.db.update.giveaways.reactions.addReaction(message.id, user.id, entries);
                        member.send(Embed({
                            title: lang.GiveawaySystem.Joined.Title,
                            description: lang.GiveawaySystem.Joined.Description
                                .replace(/{name}/g, Giveaway.prize)
                                .replace(/{url}/g, message.url)
                                .replace(/{amount}/g, entries),
                            timestamp: new Date()
                        }));
                    }

                    else if (event.t == "MESSAGE_REACTION_REMOVE" && !failed.length) {
                        let reactions = await Utils.variables.db.get.getGiveawayReactions(message.id);
                        if (!reactions.find(r => r.user == member.id)) return;

                        bot.emit("giveawayLeft", member, message, Giveaway);
                        Utils.variables.db.update.giveaways.reactions.removeReaction(message.id, user.id);
                        member.send(Embed({
                            title: lang.GiveawaySystem.Left.Title,
                            description: lang.GiveawaySystem.Left.Description.replace(/{name}/g, Giveaway.prize).replace(/{url}/g, message.url),
                            timestamp: new Date()
                        }));
                    }
                }
            }
        }

        // ROLE MENU
        let menu = await Utils.variables.db.get.getRoleMenu(message.id);
        if (menu) {
            menu = config.ReactionRoles.find(r => r.Name.toLowerCase() == menu.name.toLowerCase());
            const option = menu.Options.find(o => {
                const customEmoji = Utils.findEmoji(o.Emoji, bot, false);
                return (customEmoji ? customEmoji.id : o.Emoji) == emojiKey;
            });

            if (menu && option) {
                const role = Utils.findRole(option.Name, message.guild);
                if (role) {
                    if (event.t == "MESSAGE_REACTION_ADD") {
                        if (!member.roles.cache.has(role.id)) {
                            if (menu.OnlyOne) {
                                let roleToRemove = menu.Options.find(o => Utils.hasRole(member, o.Name, false));
                                let emojiToRemove = roleToRemove ? menu.Options[menu.Options.indexOf(roleToRemove)].Emoji : undefined;
                                if (roleToRemove) message.reactions.cache.get(emojiToRemove).users.remove(member);
                            }

                            await member.roles.add(role);

                            if ([true, undefined].includes(menu.DMOnAdd)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleAdded.replace(/{role}/g, role.name) })).catch(() => { });
                            bot.emit("roleMenuRoleAdded", member, menu, role);
                        }
                    } else {
                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);

                            if ([true, undefined].includes(menu.DMOnRemove)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleRemoved.replace(/{role}/g, role.name) })).catch(() => { });
                            bot.emit("roleMenuRoleRemoved", member, menu, role);
                        }
                    }
                } else {
                    member.send(Embed({
                        color: config.EmbedColors.Error,
                        title: lang.AdminModule.Commands.Rolemenu.RoleMenuRoleNotCreated.replace(/{role}/g, option.Name)
                    })).catch(() => { });
                }
            }
        }

        // VERIFICATION
        const verificationEmoji = Utils.findEmoji(config.Verification.Reaction.Emoji, bot, false);
        if (config.Verification.Enabled == true
            && event.t == "MESSAGE_REACTION_ADD"
            && config.Verification.Type.toLowerCase() == "reaction"
            && (config.Verification.Reaction.Message.ID ? config.Verification.Reaction.Message.ID == message.id : true)
            && emojiKey == (verificationEmoji ? verificationEmoji.id : config.Verification.Reaction.Emoji)) {
            
            function verify() {
                message.reactions.cache.find(reaction => [reaction.emoji.name, reaction.emoji.id, reaction.emoji.toString()].includes(config.Verification.Reaction.Emoji)).users.remove(user);

                if (config.Verification.VerifiedRoles?.some(r => member.roles.cache.find(role => role.id == r || role.name.toLowerCase() == r.toLowerCase()))) return;

                return require("../modules/methods/verifyUser")(bot, member);
            }

            if (!config.Verification.Reaction.Message.ID) {
                if (config.Verification.Reaction.Message.Content ? (message.content ? config.Verification.Reaction.Message.Content == message.content : false) : !message.content) {
                    let configEmbed = Utils.setupMessage({ configPath: config.Verification.Reaction.Message }).embeds[0];
                    if (stringify((new Utils.Discord.MessageEmbed(configEmbed)).toJSON()) == stringify((new Utils.Discord.MessageEmbed(message.embeds[0])).toJSON())) {
                        return verify();
                    }
                }
            } else {
                return verify();
            }
        }

        // SUGGESTIONS
        if (config.Suggestions.Enabled == true && event.t == "MESSAGE_REACTION_ADD") {
            let channels = [config.Suggestions.Channels.Suggestions, config.Suggestions.Channels.Accepted, config.Suggestions.Channels.Denied, config.Suggestions.Channels.Implemented];
            if (channels.includes(channel.id) || channels.includes(channel.name)) {
                let suggestion = await Utils.variables.db.get.getSuggestionByMessage(message.id);

                if (suggestion) {
                    let hasPermission = Utils.hasPermission(member, config.Suggestions.ManageSuggestionsRole);

                    if (emojiKey == config.Suggestions.Emojis.Delete && (suggestion.creator == member.id || hasPermission)) {
                        return message.delete();
                    }

                    if (emojiKey == config.Suggestions.Emojis.Upvote || emojiKey == config.Suggestions.Emojis.Downvote) {
                        let reaction = message.reactions.cache.find(reaction => [reaction.emoji.name, reaction.emoji.id].includes(emojiKey == config.Suggestions.Emojis.Upvote ? config.Suggestions.Emojis.Downvote : config.Suggestions.Emojis.Upvote));

                        if (reaction) {
                            let users = await reaction.users.fetch();
                            if (users.get(user.id)) reaction.users.remove(user.id);
                        }
                    }

                    if (!config.Suggestions.ReactToOwnSuggestion) {
                        if (emojiKey == config.Suggestions.Emojis.Upvote && suggestion.creator == member.id) {
                            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

                            return member.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).catch(() => { });
                        }
                        else if (emojiKey == config.Suggestions.Emojis.Downvote && suggestion.creator == member.id) {
                            message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey).users.remove(user);

                            return member.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Suggest.ReactToOwnSuggestion })).catch(() => { });
                        }
                    }

                    if (!hasPermission) return;

                    let emojis = [config.Suggestions.Emojis.Denied, config.Suggestions.Emojis.Accepted, config.Suggestions.Emojis.Implemented, config.Suggestions.Emojis.Reset]
                        .map(e => {
                            let find = Utils.findEmoji(e, bot, false);

                            return find ? find.id : e;
                        });
                    let status;

                    if (emojiKey == emojis[0]) status = "denied";
                    if (emojiKey == emojis[1]) status = "accepted";
                    if (emojiKey == emojis[2]) status = "implemented";
                    if (emojiKey == emojis[3]) status = "pending";

                    if (status) {
                        if (status !== suggestion.status) {
                            let update = require("../modules/methods/updateSuggestion");

                            update(message, status, "N/A", member);
                        }

                        let reaction = message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey);

                        return reaction ? reaction.users.remove(user) : undefined;
                    }
                }
            }
        }

        // BUG REPORTS
        if (config.BugReports.Enabled == true && event.t == "MESSAGE_REACTION_ADD") {
            if (!Utils.hasPermission(member, config.BugReports.ManageBugReportsRole)) return;
            let channels = [config.BugReports.Channels.Pending, config.BugReports.Channels.Accepted, config.BugReports.Channels.Denied, config.BugReports.Channels.Fixed];
            if (channels.includes(channel.id) || channels.includes(channel.name)) {
                let bugreport = await Utils.variables.db.get.getBugreport(message.id);

                if (bugreport) {
                    let emojis = [config.BugReports.Emojis.Denied, config.BugReports.Emojis.Accepted, config.BugReports.Emojis.Fixed, config.BugReports.Emojis.Reset]
                        .map(e => {
                            let find = Utils.findEmoji(e, bot, false);

                            return find ? find.id : e;
                        });
                    let status;

                    if (emojiKey == emojis[0]) status = "denied";
                    if (emojiKey == emojis[1]) status = "accepted";
                    if (emojiKey == emojis[2]) status = "fixed";
                    if (emojiKey == emojis[3]) status = "pending";

                    if (status) {
                        if (status !== bugreport.status) {
                            let update = require("../modules/methods/updateBugreport");

                            update(message, status, "N/A", member);
                        }

                        let reaction = message.reactions.cache.find(reaction => reaction.emoji.name == emojiKey || reaction.emoji.id == emojiKey);

                        return reaction ? reaction.users.remove(user) : undefined;
                    }
                }
            }
        }
    }
};
