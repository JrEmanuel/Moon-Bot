const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "takecoins",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, guild, reply }) => {
        return new Promise(async resolve => {
            let everyone = ["all", "everyone", "@everyone"].some(text => type == "interaction" ? args[1].toLowerCase() == text : args.includes(text)) ? true : false;
            let mentionedUser = Utils.ResolveUser(messageOrInteraction, 1);
            let amount = +args[0];
    
            if (args.length < 2 || !amount || (!everyone && !mentionedUser)) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
            if (!everyone && mentionedUser.user.bot) {
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Takecoins.TakeFromBot }), { ephemeral: true });

                return resolve();
            }

            if (amount < 1) {
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Takecoins.TakeNegative }), { ephemeral: true });

                return resolve();
            }

            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    await Utils.variables.db.update.coins.updateCoins(member, amount, 'remove');
                });
            } else {
                await Utils.variables.db.update.coins.updateCoins(mentionedUser, amount, 'remove');
            }

            reply(Embed({
                title: lang.AdminModule.Commands.Takecoins.CoinsRemoved.Title,
                description: lang.AdminModule.Commands.Takecoins.CoinsRemoved.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Takecoins.CoinsRemoved.Everyone),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Take coins from all or a certain user",
    usage: "takecoins <amount> <@user/all/everyone>",
    aliases: ['removecoins'],
    arguments: [
        {
            name: "amount",
            description: "The amount of coins to take",
            required: true,
            type: "INTEGER"
        },
        {
            name: "target",
            description: "The user(s) to take coins from (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
