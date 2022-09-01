const Utils = require("../../modules/utils.js");
const { config, lang, commands, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: "tempmute",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const length = Utils.getMSFromText(args[1]);
            const reason = config.Moderation.RequireReason ? args.slice(2).join(" ") : (args.slice(2).join(" ") || "N/A");
            let muteRole = Utils.findRole(config.Moderation.MuteRole, guild);

            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ 
                    preset: "console" 
                }), { ephemeral: true });
                return resolve();
            }
            if (!muteRole) {
                muteRole = await guild.roles.create({ name: config.Moderation.MuteRole, color: "#545454", permissions: 36800064 });

                guild.channels.cache.filter(ch => ch.permissionsFor(muteRole).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)).forEach(ch => {
                    ch.permissionOverwrites.create(muteRole, {
                        SEND_MESSAGES: false
                    });
                });
            }
            if (!length || !reason) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
            if (!targetUser) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.Global.InvalidUser, 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
            if (targetUser.roles.cache.get(muteRole.id)) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Errors.UserAlreadyPunished
                }), { ephemeral: true });
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
                if (Utils.hasPermission(targetUser, commands.Permissions.tempmute)) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.ModerationModule.Errors.CantPunishStaff
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
            if (guild.me.roles.highest.position <= targetUser.roles.highest.position) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Errors.BotCantPunishUser
                }), { ephemeral: true });
                return resolve();
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
                            { searchFor: /{ends-in}/g, replaceWith: Utils.getTimeDifference(Date.now(), Date.now() + length) },
                            { searchFor: /{end-date}/g, replaceWith: new Date(Date.now() + length).toLocaleString() },
                            { searchFor: /{server-name}/g, replaceWith: guild.name },
                            { searchFor: /{timestamp}/g, replaceWith: Math.floor((Date.now() + length) / 1000) }
                        ]
                    })).catch(() => { });

                    let punishment = {
                        type: "tempmute",
                        user: targetUser.id,
                        tag: targetUser.user.tag,
                        reason,
                        time: Date.now(),
                        executor: user.id,
                        length
                    };

                    await Utils.variables.db.update.punishments.addPunishment(punishment);
                    bot.emit("userPunished", punishment, targetUser, member);

                    reply(Utils.setupMessage({
                        configPath: embeds.Embeds.UserTempmuted,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{reason}/g, replaceWith: reason },
                            { searchFor: /{duration}/g, replaceWith: Utils.getTimeDifference(Date.now(), Date.now() + length) },
                            { searchFor: /{end-date}/g, replaceWith: new Date(Date.now() + length).toLocaleString() },
                            { searchFor: /{timestamp}/g, replaceWith: Math.floor((Date.now() + length) / 1000) }
                        ]
                    }));
                    return resolve(true);
                })
                .catch(err => {
                    Utils.error(err.message, err.stack, "tempmute.js:73", true);
                    reply(Embed({ 
                        preset: "console" 
                    }), { ephemeral: true });
                    return resolve();
                });
        });
    },
    description: "Temporarily mute a user on the Discord server",
    usage: "tempmute <@user> <length> " + (config.Moderation.RequireReason ? "<reason>" : "[reason]"),
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to temporarily mute",
            required: true,
            type: "USER"
        },
        {
            name: "length",
            description: "The time length of the mute",
            required: true,
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for the mute",
            required: config.Moderation.RequireReason,
            type: "STRING"
        }
    ]
};
