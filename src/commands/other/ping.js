const Utils = require("../../modules/utils.js");
const embeds = Utils.variables.embeds;

module.exports = {
    name: "ping",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            const apiPing = Math.round(1000 * bot.ws.ping) / 1000;

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.Ping[0],
                variables: [
                    { searchFor: /{api-ping}/g, replaceWith: apiPing }
                ]
            })).then(msg => {
                msg.edit(Utils.setupMessage({
                    configPath: embeds.Embeds.Ping[1],
                    variables: [
                        { searchFor: /{api-ping}/g, replaceWith: apiPing },
                        { searchFor: /{bot-ping}/g, replaceWith: msg.createdTimestamp - messageOrInteraction.createdTimestamp }
                    ]
                }));

                return resolve(true);
            });
        });
    },
    description: "Check the bot's latency",
    usage: "ping",
    aliases: [
        "latency"
    ],
    arguments: []
};
