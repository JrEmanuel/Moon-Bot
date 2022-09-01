const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang, commands, embeds } = Utils.variables;

module.exports = {
    name: "mute",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const reason = config.Moderation.RequireReason ? args.slice(1).join(" ") : (args.slice(1).join(" ") || "N/A");
            let muteRole = Utils.findRole(config.Moderation.MuteRole, guild, false);
    
            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ preset: 'console' }), { ephemeral: true });
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
            if (!reason) {
                reply(Embed({ 
                    preset: 'invalidargs', 
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
                        preset: 'error', 
                        description: lang.ModerationModule.Errors.CantPunishStaffHigher
                    }), { ephemeral: true });
                    return resolve();
                }
            } else {
                if (Utils.hasPermission(targetUser, commands.Permissions.mute)) {
                    reply(Embed({ 
                        preset: 'error', 
                        description: lang.ModerationModule.Errors.CantPunishStaff 
                    }), { ephemeral: true });
                    return resolve();
                }
            }
            if (targetUser.user.bot == true || targetUser.id == user.id) {
                reply(Embed({ 
                    preset: 'error', 
                    description: lang.ModerationModule.Errors.CantPunishUser 
                }), { ephemeral: true });
                return resolve();
            }
            if (guild.me.roles.highest.position <= targetUser.roles.highest.position) {
                reply(Embed({
                    preset: 'error', 
                    description: lang.ModerationModule.Errors.BotCantPunishUser 
                }), { ephemeral: true });
                return resolve();
            }
    
            let punishment = {
                type: module.exports.name,
                user: targetUser.id,
                tag: targetUser.user.tag,
                reason,
                time: Date.now(),
                executor: user.id
            };
    
            await Utils.variables.db.update.punishments.addPunishment(punishment);

            await Utils.variables.db.update.roles.setSavedMuteRoles(targetUser, JSON.stringify(targetUser.roles.cache.filter(r => r.name !== "@everyone" && !r.tags.premiumSubscriberRole).map(r => r.id)));
            await targetUser.roles.remove(targetUser.roles.cache.filter(r => r.name !== "@everyone" && !r.tags.premiumSubscriberRole));
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
                    bot.emit("userPunished", punishment, targetUser, member);
    
                    reply(Utils.setupMessage({
                        configPath: embeds.Embeds.UserMuted,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{reason}/g, replaceWith: reason }
                        ]
                    }));

                    return resolve(true);
                })
                .catch(err => {
                    Utils.error(err.message, err.stack, "mute.js:67", true);
                    reply(Embed({ preset: "console" }), { ephemeral: true });

                    return resolve();
                });
        });
    },
    description: "Mute a user in the Discord server",
    usage: "mute <@user> " + (config.Moderation.RequireReason ? "<reason>" : "[reason]"),
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to mute",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason for the mute",
            required: config.Moderation.RequireReason,
            type: "STRING"
        }
    ]
};
