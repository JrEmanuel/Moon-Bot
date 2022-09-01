const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "setcoins",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let everyone = ["all", "everyone", "@everyone"].some(text => args.includes(text)) ? true : false;
            let user = Utils.ResolveUser(messageOrInteraction, 0) || Utils.ResolveUser(messageOrInteraction, 1);
            let amount = /<@![0-9]{18}>/.test(args[0]) || ["all", "everyone", "@everyone"].includes(args[0]) ? parseInt(args[1]) : parseInt(args[0]);

            if (args.length < 1 || !amount || (!everyone && !user)) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }));
                return resolve();
            }
            if (!everyone && user.user.bot) {
                reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setcoins.SetBot }));
                return resolve();
            }
            if (amount < 0) {
                reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setcoins.SetNegative }));
                return resolve();
            }

            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    await Utils.variables.db.update.coins.updateCoins(member, amount, 'set');
                });
            } else {
                await Utils.variables.db.update.coins.updateCoins(user, amount, 'set');
            }

            reply(Embed({
                title: lang.ManagementModule.Commands.Setcoins.CoinsSet.Title,
                description: lang.ManagementModule.Commands.Setcoins.CoinsSet.Description.replace(/{user}/g, user || lang.ManagementModule.Commands.Setcoins.CoinsSet.Everyone).replace(/{amount}/g, amount.toLocaleString()),
                timestamp: new Date()
            }));
            return resolve(true);
        });
    },
    description: "Set the coins of all or a certain user",
    usage: "setcoins <amount> <@user/all/everyone>",
    aliases: [],
    arguments: [
        {
            name: "amount",
            description: "The amount to change it to",
            type: "NUMBER",
            required: true
        },
        {
            name: "user",
            description: "The user to apply the change to or \"all\" or \"everyone\"",
            type: "STRING",
            required: true
        }
    ]
};
