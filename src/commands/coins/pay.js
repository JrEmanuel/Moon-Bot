const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const db = Utils.variables.db;
const lang = Utils.variables.lang;

module.exports = {
    name: "pay",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction, 0);
            const senderCoins = await db.get.getCoins(member);
    
            if (args.length < 2) {
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

            if (targetUser.id == user.id) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Pay.Errors.PaySelf
                }), { ephemeral: true });
                return resolve();
            }

            if (targetUser.user.bot) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Pay.Errors.PayBot
                }), { ephemeral: true });
                return resolve();
            }

            if (!+args[1] || +args[1] < 1) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Pay.Errors.InvalidAmount, 
                    usage: module.exports.usage 
                }), { ephemeral: true });
                return resolve();
            }

            if (senderCoins < +args[1]) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Errors.NotEnoughCoins, 
                    usage: module.exports.usage 
                }), { ephemeral: true });
                return resolve();
            }

            const receiverCoins = await db.get.getCoins(targetUser);
    
            await db.update.coins.updateCoins(member, +args[1], "remove");
            await db.update.coins.updateCoins(targetUser, +args[1], "add");
            
            reply(Embed({
                title: lang.CoinModule.Commands.Pay.Embed.Title,
                color: config.EmbedColors.Success,
                description: lang.CoinModule.Commands.Pay.Embed.Description.replace(/{amt}/g, (+args[1]).toLocaleString()).replace(/{user}/g, `<@${targetUser.user.id}>`),
                fields: [
                    { name: lang.CoinModule.Commands.Pay.Embed.Fields[0], value: `${senderCoins.toLocaleString()} **->** ${(await db.get.getCoins(member)).toLocaleString()}`, inline: true},
                    { name: lang.CoinModule.Commands.Pay.Embed.Fields[1], value: `${receiverCoins ? receiverCoins.toLocaleString() : 0} **->** ${(await db.get.getCoins(targetUser)).toLocaleString()}`, inline: true}
                ]
            }));

            return resolve(true);
        });
    },
    description: "Send money to a user",
    usage: "pay <@user> <amount>",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to send the coins to",
            required: true,
            type: "USER"
        },
        {
            name: "amount",
            description: "The number of coins to send",
            required: true,
            type: "INTEGER"
        }
    ]
};
