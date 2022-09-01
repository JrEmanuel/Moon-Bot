const Utils = require("../../modules/utils.js");
const { config, lang, commands, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: "tempban",
    run: async (bot, messageOrInteraction, args, { member, user, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const length = Utils.getMSFromText(args[1]);
            const reason = config.Moderation.RequireReason ? args.slice(2).join(" ") : (args.slice(2).join(" ") || "N/A");
    
            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ 
                    preset: "console" 
                }), { ephemeral: true });
                return resolve();
            }
            if (!length || !reason) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }), { ephemeral: true });
                return resolve();
            }
            if (!targetUser) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.Global.InvalidUser,
                    usage: module.exports.usage 
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
                if (Utils.hasPermission(targetUser, commands.Permissions.tempban)) {
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
    
            if (embeds.Embeds.Tempbanned) await targetUser.send(Utils.setupMessage({
                configPath: embeds.Embeds.Tempbanned,
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
    
            targetUser.ban({ reason });
    
            let punishment = {
                type: "tempban",
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
                configPath: embeds.Embeds.UserTempbanned,
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
        });
    },
    description: "Temporarily ban a user on the Discord server",
    usage: "tempban <@user> <length> " + (config.Moderation.RequireReason ? "<reason>" : "[reason]"),
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to temporarily ban",
            required: true,
            type: "USER"
        },
        {
            name: "length",
            description: "The time length of the ban",
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

