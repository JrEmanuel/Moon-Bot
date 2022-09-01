const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "weekly",
    run: async (bot, messageOrInteraction, args, { member, reply }) => {
        return new Promise(async resolve => {
            let time = (new Date(Math.floor(await Utils.variables.db.get.getWeeklyCoinsCooldown(member)))).getTime();
            if (time > (new Date()).getTime()) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.CoinModule.Commands.Weekly.Cooldown.replace(/{time}/g, Utils.getTimeDifference(new Date(), time)) 
                }), { ephemeral: true });
                return resolve();
            }

            const amount = Math.round(config.Coins.Amounts.Weekly * (config.Coins.Multipliers.Multiplies.Weekly ? Utils.getMultiplier(member) : 1));
            const nextTime = new Date();
            nextTime.setHours(nextTime.getHours() + 168);

            await Utils.variables.db.update.coins.updateCoins(member, amount, "add");
            await Utils.variables.db.update.coins.setWeeklyCooldown(member, nextTime.getTime());
            
            reply(Embed({ 
                title: lang.CoinModule.Commands.Weekly.Collected.replace(/{coins}/g, amount.toLocaleString()), 
                color: config.EmbedColors.Success 
            }));

            return resolve(true);
        });
    },
    description: "Claim your weekly coins",
    usage: "weekly",
    aliases: ["weeklycoins"],
    arguments: []
};
