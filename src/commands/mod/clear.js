const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "clear",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, channel: messageChannel, reply }) => {
        return new Promise(async resolve => {
            let channel = Utils.ResolveChannel(messageOrInteraction, 1, false, true);
            if (!channel) channel = messageChannel;
            let error = false;
    
            if (args.length == 0) {
                reply(Embed({ 
                    preset: 'invalidargs', 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            if (isNaN(args[0]) || +args[0] < 1) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.ModerationModule.Commands.Clear.Errors.InvalidNumb, 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            let amount = +args[0] + (type == "message" ? 1 : 0);
            let fullBulkDeleteAmts = new Array(Math.floor(amount / 100));
            let bulkDeleteAmts = [...fullBulkDeleteAmts, (amount - (fullBulkDeleteAmts.length * 100))];
    
            await Utils.asyncForEach(bulkDeleteAmts, async (amount, i) => {
                if (error) return;

                await channel.bulkDelete(amount ? amount : 100, false).then(() => {
                }).catch(async err => {
                    error = true;
                    if (err.code == 50013) {
                        reply(Embed({ 
                            preset: 'error', 
                            description: lang.ModerationModule.Commands.Clear.Errors.BotNoPerms
                        }), { ephemeral: true });
                        return resolve();
                    }
                    else if (err.code == 50034) {
                        reply(Embed({ 
                            preset: 'error', 
                            description: lang.ModerationModule.Commands.Clear.Errors.OlderThan14Days
                        }), { ephemeral: true });
                        return resolve();
                    }
                    else {
                        console.log(err);
                        reply(Embed({ preset: 'console' }), { ephemeral: true });
                        return resolve();
                    }
                });
                if ((i+1) !== bulkDeleteAmts.length) await Utils.delay(2);
            });
    
            if (!error) reply(Embed({ 
                title: lang.ModerationModule.Commands.Clear.Cleared.replace(/{amt}/g, args[0]), 
                color: config.EmbedColors.Success 
            }), { ephemeral: true, deleteAfter: 1500 }).then(() => {
                return resolve(true);
            });
        });
    },
    description: "Clear a certain amount of messages",
    usage: "clear <amount> [channel]",
    aliases: [
        "purge",
        "clean"
    ],
    arguments: [
        {
            name: "amount",
            description: "The number of messages to delete",
            required: true,
            type: "INTEGER"
        },
        {
            name: "channel",
            description: "The channel to delete messages from",
            required: false,
            type: "CHANNEL"
        }
    ]
};
