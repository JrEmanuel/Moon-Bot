const Utils = require("../../modules/utils.js");
const { config, embeds, commands, lang } = Utils.variables;
const Embed = Utils.Embed;
const ms = require('ms');

module.exports = {
    name: "warn",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const reason = config.Moderation.RequireReason ? args.slice(1).join(" ") : (args.slice(1).join(" ") || "N/A");

            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({
                    preset: "console"
                }), { ephemeral: true });
                return resolve();
            }
            if (!targetUser || !reason) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
            if (config.Moderation.AreStaffPunishable === true) {
                if (targetUser.roles.highest.position >= member.roles.highest.position) {
                    reply(Embed({
                        preset: "error",
                        description: lang.ModerationModule.Errors.CantPunishStaffHigher
                    }), { ephemeral: true });
                    return resolve();
                }
            } else {
                if (Utils.hasPermission(targetUser, commands.Permissions.warn)) {
                    reply(Embed({
                        preset: "error",
                        description:
                            lang.ModerationModule.Errors.CantPunishStaff
                    }), { ephemeral: true });
                    return resolve();
                }
            }
            if (targetUser.user.bot == true || targetUser.id == user.id) {
                reply(Embed({
                    preset: "error",
                    description: lang.ModerationModule.Errors.CantPunishUser
                }), { ephemeral: true });
                return resolve();
            }

            let warning = {
                user: targetUser.id,
                tag: targetUser.user.tag,
                reason,
                time: Date.now(),
                executor: user.id,
                type: "warn"
            };

            await Utils.variables.db.update.punishments.addWarning(warning);

            const warns = await Utils.variables.db.get.getWarnings(targetUser);

            warning.warnCount = warns.length;
            warning.id = warns[warns.length - 1].id;

            bot.emit("userPunished", warning, targetUser, member);

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.UserWarned,
                variables: [
                    ...Utils.userVariables(targetUser, "user"),
                    ...Utils.userVariables(member, "executor"),
                    { searchFor: /{reason}/g, replaceWith: reason },
                    { searchFor: /{warning-count}/g, replaceWith: warns.length }
                ]
            }));

            targetUser.send(Utils.setupMessage({
                configPath: embeds.Embeds.Warned,
                variables: [
                    ...Utils.userVariables(targetUser, "user"),
                    ...Utils.userVariables(member, "executor"),
                    { searchFor: /{reason}/g, replaceWith: reason },
                    { searchFor: /{warning-count}/g, replaceWith: warns.length },
                    { searchFor: /{warning-id}/g, replaceWith: warning.id },
                    { searchFor: /{server-name}/g, replaceWith: guild.name }
                ]
            })).catch(() => { });

            resolve(true);

            if (config.Moderation.AutoWarnPunishments && Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length))) {
                let warnCount = Object.keys(config.Moderation.AutoWarnPunishments).find(key => parseInt(key) == parseInt(warns.length));
                let autoP = Object.values(config.Moderation.AutoWarnPunishments)[Object.keys(config.Moderation.AutoWarnPunishments).indexOf(warnCount)];
                let reason = autoP[1];
                let length = autoP[2];

                if (!reason) reason = lang.ModerationModule.DefaultAutoWarnReason;
                if (!length || !ms(length)) length = "3d";
                length = ms(length);

                if (autoP[0] == 'ban') {
                    if (embeds.Embeds.Banned) await targetUser.send(Utils.setupMessage({
                        configPath: embeds.Embeds.Banned,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{reason}/g, replaceWith: reason },
                            { searchFor: /{server-name}/g, replaceWith: guild.name }
                        ]
                    })).catch(() => { });

                    targetUser.ban({ reason });

                    let punishment = {
                        type: "ban",
                        user: targetUser.id,
                        tag: targetUser.user.tag,
                        reason: reason,
                        time: Date.now(),
                        executor: bot.user.id
                    };

                    await Utils.variables.db.update.punishments.addPunishment(punishment);
                    bot.emit("userPunished", punishment, targetUser, member);
                } else if (autoP[0] == 'kick') {
                    if (embeds.Embeds.Kicked) await targetUser.send(Utils.setupMessage({
                        configPath: embeds.Embeds.Kicked,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{reason}/g, replaceWith: reason },
                            { searchFor: /{server-name}/g, replaceWith: guild.name }
                        ]
                    })).catch(() => { });

                    targetUser.kick(reason);

                    let punishment = {
                        type: "kick",
                        user: targetUser.id,
                        tag: targetUser.user.tag,
                        reason,
                        time: Date.now(),
                        executor: bot.user.id
                    };

                    await Utils.variables.db.update.punishments.addPunishment(punishment);
                    bot.emit("userPunished", punishment, targetUser, member);
                } else if (autoP[0] == 'mute') {
                    let muteRole = Utils.findRole(config.Moderation.MuteRole, guild);
                    if (!muteRole) {
                        muteRole = await guild.roles.create({ name: config.Moderation.MuteRole, color: "#545454", permissions: 36800064 });

                        guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)).forEach(ch => {
                            ch.permissionOverwrites.create(muteRole, {
                                SEND_MESSAGES: false
                            });
                        });
                    }

                    await Utils.variables.db.update.roles.setSavedMuteRoles(targetUser, JSON.stringify(targetUser.roles.cache.filter(r => r.name !== "@everyone").map(r => r.id)));
                    await targetUser.roles.remove(targetUser.roles.cache);
                    targetUser.roles.add(muteRole.id)
                        .then(async () => {
                            if (embeds.Embeds.Muted) targetUser.send(Utils.setupMessage({
                                configPath: embeds.Embeds.Muted,
                                variables: [
                                    ...Utils.userVariables(targetUser, "user"),
                                    ...Utils.userVariables(member, "executor"),
                                    { searchFor: /{reason}/g, replaceWith: reason },
                                    { searchFor: /{server-name}/g, replaceWith: guild.name }
                                ]
                            })).catch(() => { });

                            let punishment = {
                                type: "mute",
                                user: targetUser.id,
                                tag: targetUser.user.tag,
                                reason,
                                time: Date.now(),
                                executor: bot.user.id
                            };

                            await Utils.variables.db.update.punishments.addPunishment(punishment);
                            bot.emit("userPunished", punishment, targetUser, member);
                        })
                        .catch(err => {
                            Utils.error(err.message, err.stack, "warn.js:156", true);
                            return reply(Embed({ preset: "console" }), { ephemeral: true });
                        });
                } else if (autoP[0] == 'tempban') {
                    if (embeds.Embeds.Tempbanned) await targetUser.send(Utils.setupMessage({
                        configPath: embeds.Embeds.Tempbanned,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{reason}/g, replaceWith: reason },
                            { searchFor: /{timestamp}/g, replaceWith: ~~((messageOrInteraction.createdAt.getTime() + length) / 1000) },
                            { searchFor: /{server-name}/g, replaceWith: guild.name }
                        ]
                    })).catch(() => { });

                    targetUser.ban({ reason: reason });

                    let punishment = {
                        type: "tempban",
                        user: targetUser.id,
                        tag: targetUser.user.tag,
                        reason,
                        time: Date.now(),
                        executor: bot.user.id,
                        length
                    };

                    await Utils.variables.db.update.punishments.addPunishment(punishment);
                    bot.emit("userPunished", punishment, targetUser, member);
                } else if (autoP[0] == 'tempmute') {
                    let muteRole = Utils.findRole(config.Moderation.MuteRole, guild);
                    if (!muteRole) {
                        muteRole = await guild.roles.create({ name: config.Moderation.MuteRole, color: "#545454", permissions: 36800064 });

                        guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)).forEach(ch => {
                            ch.permissionOverwrites.create(muteRole, {
                                SEND_MESSAGES: false
                            });
                        });
                    }

                    await Utils.variables.db.update.roles.setSavedMuteRoles(targetUser, JSON.stringify(targetUser.roles.cache.filter(r => r.name !== "@everyone").map(r => r.id)));
                    await targetUser.roles.remove(targetUser.roles.cache);
                    targetUser.roles.add(muteRole.id)
                        .then(async () => {
                            if (embeds.Embeds.Tempmuted) targetUser.send(Utils.setupMessage({
                                configPath: embeds.Embeds.Tempmuted,
                                variables: [
                                    ...Utils.userVariables(targetUser, "user"),
                                    ...Utils.userVariables(member, "executor"),
                                    { searchFor: /{reason}/g, replaceWith: reason },
                                    { searchFor: /{timestamp}/g, replaceWith: ~~((messageOrInteraction.createdAt.getTime() + length) / 1000) },
                                    { searchFor: /{server-name}/g, replaceWith: guild.name }
                                ]
                            })).catch(() => { });

                            let punishment = {
                                type: "tempmute",
                                user: targetUser.id,
                                tag: targetUser.user.tag,
                                reason,
                                time: Date.now(),
                                executor: bot.user.id,
                                length
                            };

                            await Utils.variables.db.update.punishments.addPunishment(punishment);
                            bot.emit("userPunished", punishment, targetUser, member);
                        })
                        .catch(err => {
                            Utils.error(err.message, err.stack, "warn.js:226", true);
                            return reply(Embed({ preset: "console" }), { ephemeral: true });
                        });
                }

                let extraInfo = autoP[0].includes("temp") ? embeds.Embeds.UserAutoPunished.TempPunishExtraInfo.replace(/{length}/g, Utils.DDHHMMSSfromMS(length)) : " ";

                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.UserAutoPunished,
                    variables: [
                        ...Utils.userVariables(targetUser, "user"),
                        { searchFor: /{extra}/g, replaceWith: extraInfo },
                        { searchFor: /{punishment}/g, replaceWith: (autoP[0].endsWith("e") ? autoP[0] + "d" : autoP[0].endsWith("n") ? autoP[0] + "ned" : autoP[0] + "ed") },
                        { searchFor: /{warning-count}/g, replaceWith: warns.length }
                    ]
                }));
            }
        });
    },
    description: "Warn a user on the Discord server",
    usage: "warn <@user> " + (config.Moderation.RequireReason ? "<reason>" : "[reason]"),
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to warn",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason for the warning",
            required: config.Moderation.RequireReason,
            type: "STRING"
        }
    ]
};
