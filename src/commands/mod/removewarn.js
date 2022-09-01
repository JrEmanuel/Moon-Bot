const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "removewarn",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const warningID = args[1]?.toString();
    
            if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, guild)) {
                reply(Embed({ preset: "console" }), { ephemeral: true });
                return resolve();
            }

            if (!targetUser || args.length < 2) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            const warnings = await Utils.variables.db.get.getWarnings(targetUser.id);
    
            if (!warnings || warnings.length == 0) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Commands.Removewarn.Errors.NoHistory, 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            const warning = await Utils.variables.db.get.getWarning(warningID);
    
            if (!warning) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Commands.Removewarn.Errors.InvalidID, 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            await Utils.variables.db.update.punishments.removeWarning(warning.id);
    
            reply(Embed({ 
                title: lang.ModerationModule.Commands.Removewarn.Embeds.Removed.Title,
                color: config.EmbedColors.Success
            }));
    
            bot.emit("userUnpunished", "warn", targetUser, member, warning);

            return resolve(true);
        });
    },
    description: "Remove a warning from a user",
    usage: "remwarn <@user> <id>",
    aliases: ["remwarn", "deletewarn", "delwarn"],
    arguments: [
        {
            name: "user",
            description: "The user to remove a warning from",
            required: true,
            type: "USER"
        },
        {
            name: "id",
            description: "The ID of the warning to remove",
            required: true,
            type: "INTEGER",
            minValue: 0
        }
    ]
};
