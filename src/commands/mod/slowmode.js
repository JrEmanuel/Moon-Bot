const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "slowmode",
    run: async (bot, messageOrInteraction, args, { prefixUsed, user, channel, reply }) => {
        return new Promise(async resolve => {
            let amount = 2;
            if (!args[0]) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            if (args[0].toLowerCase() == 'on') {
                if (!amount) amount = 5;
                channel.setRateLimitPerUser(amount, `Slowmode enabled by ${user.tag}`);
                reply(Embed({ 
                    title: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Title, 
                    description: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Descriptions[0], 
                    color: config.EmbedColors.Success
                }));
                return resolve(true);
            } else if (args[0].toLowerCase() == 'off') {
                channel.setRateLimitPerUser(0, `Slow mode disabled by ${user.tag}`);
                reply(Embed({ 
                    title: lang.ModerationModule.Commands.Slowmode.Embeds.Disabled.Title, 
                    description: lang.ModerationModule.Commands.Slowmode.Embeds.Disabled.Description, 
                    color: config.EmbedColors.Error
                }));
                return resolve(true);
            } else {
                amount = +args[0];
                if (!amount) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.ModerationModule.Commands.Slowmode.Errors.InvalidTime, 
                        usage: module.exports.usage
                    }, { prefixUsed }), { ephemeral: true });
                    return resolve();
                }
    
                channel.setRateLimitPerUser(amount, `Slowmode enabled by ${user.tag}`);
                reply(Embed({ 
                    title: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Title, 
                    description: lang.ModerationModule.Commands.Slowmode.Embeds.Enabled.Descriptions[1].replace(/{amount}/g, amount), 
                    color: config.EmbedColors.Success
                }));
                return resolve(true);
            }
        });
    },
    description: "Turn on or off slowmode",
    usage: "slowmode <seconds/on/off>",
    aliases: [],
    arguments: [
        {
            name: "value",
            description: "The number of seconds, 'on', or 'off'",
            required: true,
            type: "STRING"
        }
    ]
};
