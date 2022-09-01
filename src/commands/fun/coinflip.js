const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
const coin = { 
    "Head": lang.FunModule.Commands.Coinflip.HeadIcon, 
    "Tail": lang.FunModule.Commands.Coinflip.TailIcon
};

module.exports = {
    name: "coinflip",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, reply }) => {
        return new Promise(async resolve => {
            const side = Object.keys(coin)[Math.floor(Math.random() * 2)];
    
            if (args.length == 0) {
                reply(Embed({
                    title: lang.FunModule.Commands.Coinflip.Embeds.Normal.Title,
                    description: lang.FunModule.Commands.Coinflip.Embeds.Normal.Description.replace(/{result}/g, side),
                    thumbnail: Object.values(coin)[Object.keys(coin).indexOf(side)],
                    footer: {
                        text: lang.FunModule.Commands.Coinflip.Embeds.Normal.Footer.replace(/{user}/g, user.tag),
                        icon: user.displayAvatarURL({ dynamic: true })
                    }
                }));

                return resolve();
            }
            else {
                // Remove the trailing "s"
                args[0] = args[0].toLowerCase().replace("s", "");
    
                if (args.length < 2 || !["head", "tail"].includes(args[0]) || isNaN(args[1])) {
                    reply(Embed({ 
                        preset: "invalidargs", 
                        usage: module.exports.usage
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }

                const amountToGamble = +args[1];

                if (amountToGamble < 1) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.FunModule.Commands.Coinflip.Errors.Atleast1 
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }

                if (amountToGamble > await Utils.variables.db.get.getCoins(member)) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Errors.NotEnoughCoins
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }

                if (amountToGamble > config.Coins.Amounts.MaxGamble) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Errors.MaxGamble.replace(/{amount}/g, config.Coins.Amounts.MaxGamble.toLocaleString()) 
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }
    
                const win = side.toLowerCase() == args[0] ? true : false;
    
                const currentCoins = await Utils.variables.db.get.getCoins(member);
                const newCoins = win ? currentCoins + amountToGamble : currentCoins - amountToGamble;
    
                await Utils.variables.db.update.coins.updateCoins(member, newCoins, 'set');
    
                reply(Embed({
                    title: lang.FunModule.Commands.Coinflip.Embeds.Gamble.Title,
                    description: lang.FunModule.Commands.Coinflip.Embeds.Gamble[win ? 'Won' : 'Lost'].replace(/{result}/g, side + 's').replace(/{earned-lost}/g, Math.abs(currentCoins - newCoins).toLocaleString()).replace(/{coins}/g, newCoins.toLocaleString()),
                    thumbnail: Object.values(coin)[Object.keys(coin).indexOf(side)],
                    footer: {
                        text: lang.FunModule.Commands.Coinflip.Embeds.Gamble.Footer.replace(/{user}/g, user.tag),
                        icon: user.displayAvatarURL({ dynamic: true })
                    }
                }));

                return resolve(true);
            }
        });
    },
    description: "Flip a coin",
    usage: "coinflip [heads/tails] [coins]",
    aliases: [
        "flipcoin"
    ],
    arguments: [
        {
            name: "side",
            description: "The side of the coin you want to flip",
            required: false,
            type: "STRING",
            choices: [
                {
                    name: "heads",
                    value: "heads"
                },
                {
                    name: "tails",
                    value: "tails"
                }
            ]
        },
        {
            name: "coins",
            description: "The number of coins you want to gamble",
            required: false,
            type: "INTEGER",
            minValue: 1,
            maxValue: config.Coins.Amounts.MaxGamble > 9007199254740991 ? 1000000 : config.Coins.Amounts.MaxGamble
        }
    ]
};
