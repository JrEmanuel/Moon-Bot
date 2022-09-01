const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "coins",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, reply }) => {
        return new Promise(async resolve => {
            if (args.length == 0) {
                reply(Embed({
                    author: {
                        icon: member.user.displayAvatarURL({ dynamic: true }),
                        text: member.user.username
                    },
                    title: lang.CoinModule.Commands.Coins.Embeds.YourCoins.Title, 
                    description: lang.CoinModule.Commands.Coins.Embeds.YourCoins.Description.replace(/{coins}/g, (await Utils.variables.db.get.getCoins(member) || 0).toLocaleString()) 
                }));

                return resolve(true);
            } else {
                const targetUser = Utils.ResolveUser(messageOrInteraction);
                if (!targetUser || targetUser.user.bot) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.Global.InvalidUser, 
                        usage: module.exports.usage 
                    }, { prefixUsed }), { ephemeral: true });
                    return resolve();
                }

                let coins = await Utils.variables.db.get.getCoins(targetUser);
                if (!coins || !+coins) coins = 0;

                reply(Embed({
                    author: {
                        icon: targetUser.user.displayAvatarURL({ dynamic: true }),
                        text: targetUser.user.username
                    },
                    title: lang.CoinModule.Commands.Coins.Embeds.UserCoins.Title.replace(/{user}/g, targetUser.user.username), 
                    description: lang.CoinModule.Commands.Coins.Embeds.UserCoins.Description.replace(/{user}/g, targetUser).replace(/{coins}/g, coins >= 0 ? coins.toLocaleString() : 0) 
                }));

                return resolve(true);
            }
        });
    },
    description: "Check how many coins you or another user has",
    usage: "coins [@user]",
    aliases: [
        "bal",
        "balance"
    ],
    arguments: [
        {
            name: "user",
            description: "The user to check the coins of",
            required: false,
            type: "USER"
        }
    ]
};


