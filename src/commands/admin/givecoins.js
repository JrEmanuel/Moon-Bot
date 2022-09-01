const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "givecoins",
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
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Givecoins.GiveToBot }), { ephemeral: true });

                return resolve();
            }
    
            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    await Utils.variables.db.update.coins.updateCoins(member, amount, 'add');
                });
            } else {
                await Utils.variables.db.update.coins.updateCoins(mentionedUser, amount, 'add');
            }
    
            reply(Embed({
                title: lang.AdminModule.Commands.Givecoins.CoinsAdded.Title,
                description: lang.AdminModule.Commands.Givecoins.CoinsAdded.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Givecoins.CoinsAdded.Everyone),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Give coins to all or a certain user",
    usage: "givecoins <amount> <@user/all/everyone>",
    aliases: ['addcoins'],
    arguments: [
        {
            name: "amount",
            description: "The amount of coins to give",
            required: true,
            type: "INTEGER"
        },
        {
            name: "target",
            description: "The user(s) to give the coins to (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
