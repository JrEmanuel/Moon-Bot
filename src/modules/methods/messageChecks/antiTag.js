const Utils = require("../../utils");
const ms = require("ms");
const { variables: { config, embeds, lang, bot }, Embed } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member) => {
    return new Promise(async (resolve, reject) => {
        if (type == "interaction") return resolve();
        if (message.mentions.members.size || message.mentions.roles.size) {
            if (config.AntiTag.Enabled && !Utils.hasPermission(message.member, config.AntiTag.Bypass)) {
                let openTickets = (await Utils.getOpenTickets(message.guild)).map(c => c.id);
                let openApplications = (await Utils.getOpenApplications(message.guild)).map(c => c.id);

                if ((openTickets.includes(message.channel.id) || openApplications.includes(message.channel.id)) ? config.AntiTag.TicketsAndApplications : true) {
                    let warn = async (mentioned) => {
                        let warning = {
                            user: message.author.id,
                            tag: message.author.tag,
                            reason: config.AntiTag.Warning.Reason.replace(/{mentioned}/g, mentioned instanceof Utils.Discord.Role ? mentioned.id + ` (Role: ${mentioned.name})` : mentioned.id + ` (User: ${mentioned.username}#${mentioned.discriminator})`),
                            time: message.createdAt.getTime(),
                            executor: bot.user.id,
                            type: "warn"
                        };

                        await Utils.variables.db.update.punishments.addWarning(warning);

                        let warns = await Utils.variables.db.get.getWarnings(message.member);

                        warning.warnCount = warns.length;
                        warning.id = warns[warns.length - 1].id;

                        bot.emit('userPunished', warning, message.member, message.guild.me);

                        message.member.send(Utils.setupMessage({
                            configPath: embeds.Embeds.Warned,
                            variables: [
                                ...Utils.userVariables(message.member, "user"),
                                ...Utils.userVariables(message.guild.me, "executor"),
                                { searchFor: /{reason}/g, replaceWith: config.AntiTag.Warning.Reason.replace(/{mentioned}/g, mentioned instanceof Utils.Discord.Role ? mentioned.name : `<@${mentioned.id}>`) },
                                { searchFor: /{warning-count}/g, replaceWith: warns.length },
                                { searchFor: /{warning-id}/g, replaceWith: warning.id },
                                { searchFor: /{server-name}/g, replaceWith: message.guild.name }
                            ]
                        })).catch(() => { });

                        if (config.Moderation.AutoWarnPunishments && Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length))) {
                            let warnCount = Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length));
                            let autoP = Object.values(config.Moderation.AutoWarnPunishments)[Object.keys(config.Moderation.AutoWarnPunishments).indexOf(warnCount)];
                            let reason = autoP[1];
                            let length = autoP[2];

                            if (!reason) reason = lang.ModerationModule.DefaultAutoWarnReason;
                            if (!length || !ms(length)) length = "3d";
                            length = ms(length);
                            if (autoP[0] == 'ban') {
                                if (embeds.Embeds.Banned) await message.member.send(Utils.setupMessage({
                                    configPath: embeds.Embeds.Banned,
                                    variables: [
                                        ...Utils.userVariables(message.member, "user"),
                                        ...Utils.userVariables(message.guild.me, "executor"),
                                        { searchFor: /{reason}/g, replaceWith: reason },
                                        { searchFor: /{server-name}/g, replaceWith: message.guild.name }
                                    ]
                                })).catch(() => { });

                                message.member.ban({ reason: reason });

                                let punishment = {
                                    type: "ban",
                                    user: message.member.id,
                                    tag: message.member.user.tag,
                                    reason: reason,
                                    time: message.createdAt.getTime(),
                                    executor: bot.user.id
                                };

                                await Utils.variables.db.update.punishments.addPunishment(punishment);
                                bot.emit('userPunished', punishment, message.member, message.guild.me);
                            } else if (autoP[0] == 'kick') {
                                if (embeds.Embeds.Kicked) await message.member.send(Utils.setupMessage({
                                    configPath: embeds.Embeds.Kicked,
                                    variables: [
                                        ...Utils.userVariables(message.member, "user"),
                                        ...Utils.userVariables(message.guild.me, "executor"),
                                        { searchFor: /{reason}/g, replaceWith: reason },
                                        { searchFor: /{server-name}/g, replaceWith: message.guild.name }
                                    ]
                                })).catch(() => { });

                                message.member.kick(reason);

                                let punishment = {
                                    type: "kick",
                                    user: message.member.id,
                                    tag: message.member.user.tag,
                                    reason: reason,
                                    time: message.createdAt.getTime(),
                                    executor: bot.user.id
                                };

                                await Utils.variables.db.update.punishments.addPunishment(punishment);
                                bot.emit('userPunished', punishment, message.member, message.guild.me);
                            } else if (autoP[0] == 'mute') {
                                let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);
                                if (!muteRole) {
                                    muteRole = await message.guild.roles.create({ name: config.Moderation.MuteRole, color: "#545454", permissions: 36800064 });

                                    message.guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)).forEach(ch => {
                                        ch.permissionOverwrites.create(muteRole, {
                                            SEND_MESSAGES: false
                                        });
                                    });
                                }

                                await Utils.variables.db.update.roles.setSavedMuteRoles(message.member, JSON.stringify(message.member.roles.cache.filter(r => r.name !== "@everyone").map(r => r.id)));
                                await message.member.roles.remove(message.member.roles.cache);
                                message.member.roles.add(muteRole.id)
                                    .then(async () => {
                                        if (embeds.Embeds.Muted) message.member.send(Utils.setupMessage({
                                            configPath: embeds.Embeds.Muted,
                                            variables: [
                                                ...Utils.userVariables(message.member, "user"),
                                                ...Utils.userVariables(message.guild.me, "executor"),
                                                { searchFor: /{reason}/g, replaceWith: reason },
                                                { searchFor: /{server-name}/g, replaceWith: message.guild.name }
                                            ]
                                        })).catch(() => { });

                                        let punishment = {
                                            type: "mute",
                                            user: message.member.id,
                                            tag: message.member.user.tag,
                                            reason: reason,
                                            time: message.createdAt.getTime(),
                                            executor: bot.user.id
                                        };

                                        await Utils.variables.db.update.punishments.addPunishment(punishment);
                                        bot.emit('userPunished', punishment, message.member, message.guild.me);
                                    })
                                    .catch(err => {
                                        Utils.error(err.message, err.stack, "warn.js:156", true);
                                        return message.channel.send(Embed({ preset: "console" }));
                                    });
                            } else if (autoP[0] == 'tempban') {
                                if (embeds.Embeds.Tempbanned) await message.member.send(Utils.setupMessage({
                                    configPath: embeds.Embeds.Tempbanned,
                                    variables: [
                                        ...Utils.userVariables(message.member, "user"),
                                        ...Utils.userVariables(message.guild.me, "executor"),
                                        { searchFor: /{reason}/g, replaceWith: reason },
                                        { searchFor: /{server-name}/g, replaceWith: message.guild.name },
                                        { searchFor: /{timestamp}/g, replaceWith: ~~((message.createdAt.getTime() + length) / 1000) }
                                    ]
                                })).catch(() => { });

                                message.member.ban({ reason: reason });

                                let punishment = {
                                    type: "tempban",
                                    user: message.member.id,
                                    tag: message.member.user.tag,
                                    reason: reason,
                                    time: message.createdAt.getTime(),
                                    executor: bot.user.id
                                };

                                await Utils.variables.db.update.punishments.addPunishment(punishment);
                                bot.emit('userPunished', punishment, message.member, message.guild.me);
                            } else if (autoP[0] == 'tempmute') {
                                let muteRole = Utils.findRole(config.Moderation.MuteRole, message.guild);
                                if (!muteRole) {
                                    muteRole = await message.guild.roles.create({ name: config.Moderation.MuteRole, color: "#545454", permissions: 36800064 });

                                    message.guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)).forEach(ch => {
                                        ch.permissionOverwrites.create(muteRole, {
                                            SEND_MESSAGES: false
                                        });
                                    });
                                }

                                message.member.roles.add(muteRole.id)
                                    .then(async () => {
                                        if (embeds.Embeds.Tempmuted) message.member.send(Utils.setupMessage({
                                            configPath: embeds.Embeds.Tempmuted,
                                            variables: [
                                                ...Utils.userVariables(message.member, "user"),
                                                ...Utils.userVariables(message.guild.me, "executor"),
                                                { searchFor: /{reason}/g, replaceWith: reason },
                                                { searchFor: /{timestamp}/g, replaceWith: ~~((message.createdAt.getTime() + length) / 1000) },
                                                { searchFor: /{server-name}/g, replaceWith: message.guild.name }
                                            ]
                                        })).catch(() => { });

                                        let punishment = {
                                            type: "tempmute",
                                            user: message.member.id,
                                            tag: message.member.user.tag,
                                            reason: reason,
                                            time: message.createdAt.getTime(),
                                            executor: bot.user.id,
                                            length
                                        };

                                        await Utils.variables.db.update.punishments.addPunishment(punishment);
                                        bot.emit('userPunished', punishment, message.member, message.guild.me);
                                    })
                                    .catch(err => {
                                        Utils.error(err.message, err.stack, "antiTag.js:209", true);
                                        return message.channel.send(Embed({ preset: "console" }));
                                    });
                            }

                            let extraInfo = autoP[0].includes("temp") ? embeds.Embeds.UserAutoPunished.TempPunishExtraInfo.replace(/{length}/g, Utils.DDHHMMSSfromMS(length)) : " ";

                            message.channel.send(Utils.setupMessage({
                                configPath: embeds.Embeds.UserAutoPunished,
                                variables: [
                                    ...Utils.userVariables(message.member, "user"),
                                    { searchFor: /{extra}/g, replaceWith: extraInfo },
                                    { searchFor: /{punishment}/g, replaceWith: (autoP[0].endsWith("e") ? autoP[0] + "d" : autoP[0].endsWith("n") ? autoP[0] + "ned" : autoP[0] + "ed") },
                                    { searchFor: /{warning-count}/g, replaceWith: warns.length }
                                ]
                            }));
                        }
                    };

                    let bypass = config.AntiTag.Bypass;
                    if (!bypass || !bypass.some(bypass => Utils.hasPermission(message.member, bypass) || message.member.id == bypass)) {
                        if (message.mentions.members.size) {
                            let users = config.AntiTag.Users;

                            config.AntiTag.UsersWithRoles.forEach(roleName => {
                                let role = Utils.findRole(roleName, message.guild);
                                users.push(...role.members.map(m => m.id));
                            });

                            let user = users.filter(u => u !== message.member.id).find(user => message.mentions.members.get(user));

                            if (user) {
                                if (config.AntiTag.Warning.Enabled) warn(bot.users.cache.get(user));
                                if (config.AntiTag.DeleteMessageAfter) Utils.delete(message, config.AntiTag.DeleteMessageAfter * 1000);

                                message.channel.send(Utils.setupMessage({
                                    configPath: config.AntiTag.Response.Embed,
                                    variables: [
                                        ...Utils.userVariables(member, "user"),
                                        { searchFor: /{role-or-user}/g, replaceWith: "<@" + user + ">" }
                                    ]
                                })).then(m => {
                                    if (config.AntiTag.Response.DeleteAfter) Utils.delete(m, config.AntiTag.DeleteMessageAfter * 1000);
                                });
                                return reject();
                            }
                        } else if (message.mentions.roles.size) {
                            let roles = config.AntiTag.Roles.map(r => Utils.findRole(r, message.guild, false)).filter(r => r);
                            let role = roles.find(role => message.mentions.roles.get(role.id));
                            if (role) {
                                if (config.AntiTag.Warning.Enabled) warn(role);
                                if (config.AntiTag.DeleteMessageAfter) Utils.delete(message, config.AntiTag.DeleteMessageAfter * 1000);

                                message.channel.send(Utils.setupMessage({
                                    configPath: config.AntiTag.Response.Embed,
                                    variables: [
                                        ...Utils.userVariables(member, "user"),
                                        { searchFor: /{role-or-user}/g, replaceWith: role }
                                    ]
                                })).then(m => {
                                    if (config.AntiTag.Response.DeleteAfter) Utils.delete(m, config.AntiTag.DeleteMessageAfter * 1000);
                                });

                                return reject();
                            }
                        }
                    }
                }
            }
        }

        return resolve();
    });
};
