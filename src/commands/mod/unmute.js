const Utils = require("../../modules/utils.js");
const { config, lang, commands, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: "unmute",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            let muteRole = Utils.findRole(config.Moderation.MuteRole, guild);
    
            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ preset: "console" }), { ephemeral: true});
                return resolve();
            }
            if (!muteRole) {
                reply(Embed({ preset: "console" }), { ephemeral: true });
                return resolve();
            }
            if (!args[0]) {
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
                }, {  prefixUsed }), { ephemeral: true });
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
                if (Utils.hasPermission(targetUser, commands.Permissions.unmute)) {
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
            if (guild.me.roles.highest.position <= targetUser.roles.highest.positon) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Errors.BotCantPunishUser
                }), { ephemeral: true });
                return resolve();
            }
            if (!targetUser.roles.cache.get(muteRole.id)) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Commands.Unmute.Errors.UserNotMuted
                }), { ephemeral: true });
                return resolve();
            }
    
            const savedRoles = await Utils.variables.db.get.getSavedMuteRoles(targetUser) || [];
            const rolesToAdd = savedRoles.map(role => Utils.findRole(role, guild, false)).filter(role => role);
            if(rolesToAdd?.length) await targetUser.roles.add(rolesToAdd);
            targetUser.roles.remove(muteRole.id)
                .then(() => {
                    if (embeds.Embeds.Unmuted) targetUser.send(Utils.setupMessage({
                        configPath: embeds.Embeds.Unmuted,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor"),
                            { searchFor: /{server-name}/g, replaceWith: guild.name }
                        ]
                    })).catch(() => { });
    
                    reply(Utils.setupMessage({
                        configPath: embeds.Embeds.UserUnmuted,
                        variables: [
                            ...Utils.userVariables(targetUser, "user"),
                            ...Utils.userVariables(member, "executor")
                        ]
                    }));
    
                    bot.emit("userUnpunished", "mute", targetUser, member);

                    return resolve(true);
                })
                .catch(err => {
                    Utils.error(err.message, err.stack, "unmute.js:46", true);
                    reply(Embed({ 
                        preset: "console" 
                    }), { ephemeral: true });

                    return resolve();
                });
        });
    },
    description: "Unmute a user on the Discord server",
    usage: "unmute <@user>",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to unmute",
            required: true,
            type: "USER"
        }
    ]
};
