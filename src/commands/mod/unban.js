/* eslint-disable no-useless-escape */
const Utils = require("../../modules/utils.js");
const { config, lang, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: "unban",
    run: async (bot, messageOrInteraction, args, { prefixUsed, commandUsed, type, member, guild, reply }) => {
        return new Promise(async resolve => {
            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ 
                    preset: "console" 
                }), { ephemeral: true });
                return resolve();
            }
            if (args.length == 0) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
            const idBans = await Utils.variables.db.get.getIDBans(guild);

            if (idBans.find(b => b.id == args[0])) {
                await Utils.variables.db.update.id_bans.remove(guild, args[0]);

                reply(Embed({
                    title: embeds.Embeds.UserUnbanned.Title,
                    description: lang.ModerationModule.Commands.IDUnban.Description.replace(/{id}/g, args[0]),
                    color: config.EmbedColors.Success,
                    timestamp: new Date()
                }));

                return resolve(true);
            }

            const bans = await guild.bans.fetch();

            const content = type == "message" ? messageOrInteraction.content.replace(prefixUsed + commandUsed, "").trim() : args.join(" ").trim();
            const userTag = content.replace(/(@|<|>|!)/g, "").trim().split("#");
            const userID = content.replace(/(@|<|>|!)/g, "").trim();
            let ban = bans.get(userID) || bans.find(ban => ban.user.username == userTag[0].replace("'", "\'") || (ban.user.username == userTag[0] && ban.user.discriminator == userTag[1]));

            if (ban) {
                await guild.members.unban(ban.user.id);
                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.UserUnbanned,
                    variables: [
                        ...Utils.userVariables(member, "executor"),
                        ...Utils.userVariables(ban.user, "user")
                    ]
                }));
                bot.emit("userUnpunished", "ban", ban.user, member);
                return resolve(true);
            } else {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Commands.Unban.Errors.UserNotBanned
                }), { ephemeral: true });
                return resolve();
            }
        });
    },
    description: "Unban a user on the Discord server",
    usage: "unban <user ID/user tag>",
    aliases: ["idunban", "unbanid", "unidban"],
    arguments: [
        {
            name: "user",
            description: "The user to unban (user ID or tag)",
            required: true,
            type: "STRING"
        }
    ]
};
