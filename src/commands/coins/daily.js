const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "daily",
    run: async (bot, messageOrInteraction, args, { member, reply }) => {
        return new Promise(async resolve => {
            const time = (new Date(Math.floor(await Utils.variables.db.get.getDailyCoinsCooldown(member)))).getTime();
            if (time > (new Date()).getTime()) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Daily.Cooldown.replace(/{time}/g, Utils.getTimeDifference(new Date(), time)) 
                }), { ephemeral: true });
                return resolve(true);
            }

            const amount = Math.round(config.Coins.Amounts.Daily * (config.Coins.Multipliers.Multiplies.Daily ? Utils.getMultiplier(member) : 1));
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + 24);

            await Utils.variables.db.update.coins.updateCoins(member, amount, "add");
            await Utils.variables.db.update.coins.setDailyCooldown(member, nextTime.getTime());

            reply(Embed({ 
                title: lang.CoinModule.Commands.Daily.Collected.replace(/{coins}/g, amount.toLocaleString()), 
                color: config.EmbedColors.Success
            }));

            return resolve(true);
        });
    },
    description: "Claim your daily coins",
    usage: "daily",
    aliases: ["dailycoins"],
    arguments: []
};
