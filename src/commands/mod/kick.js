const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang, commands, embeds } = Utils.variables;

module.exports = {
    name: "kick",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const reason = config.Moderation.RequireReason ? args.slice(1).join(" ") : (args.slice(1).join(" ") || "N/A");

            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ preset: 'console' }), { ephemeral: true });
                return resolve();
            }

            if (!reason) {
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

            if (config.Moderation.AreStaffPunishable === true) {
                if (targetUser.roles.highest.position >= member.roles.highest.position) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.ModerationModule.Errors.CantPunishStaffHigher
                    }), { ephemeral: true });
                    return resolve();
                }
            } else {
                if (Utils.hasPermission(targetUser, commands.Permissions.kick)) {
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
                type: module.exports.name,
                user: targetUser.id,
                tag: targetUser.user.tag,
                reason: reason,
                time: Date.now(),
                executor: user.id
            };

            await Utils.variables.db.update.punishments.addPunishment(punishment);
            bot.emit("userPunished", punishment, targetUser, member);

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.UserKicked,
                variables: [
                    ...Utils.userVariables(targetUser, "user"),
                    ...Utils.userVariables(member, "executor"),
                    { searchFor: /{reason}/g, replaceWith: reason }
                ]
            }));
            
            return resolve(true);
        });
    },
    description: "Kick a user in the Discord server",
    usage: "kick <@user> " + (config.Moderation.RequireReason ? "<reason>" : "[reason]"),
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to kick",
            required: true,
            type: "USER"
        },
        {
            name: "reason",
            description: "The reason for the kick",
            required: config.Moderation.RequireReason,
            type: "STRING"
        }
    ]
};

