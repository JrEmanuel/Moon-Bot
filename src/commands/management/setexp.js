const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "setexp",
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
                reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setexp.SetBot }));
                return resolve();
            }
            if (amount < 0) {
                reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Setexp.SetNegative }));
                return resolve();
            }

            let level = 0;
            let xpNeeded = ~~((level * (175 * level) * 0.5)) - amount;

            while (xpNeeded <= 0) {
                ++level;
                xpNeeded = ~~((level * (175 * level) * 0.5)) - amount;
            }

            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async members => {
                    await Utils.variables.db.update.experience.updateExperience(members, level, amount, 'set');
                });
            } else {
                await Utils.variables.db.update.experience.updateExperience(user, level, amount, 'set');
            }

            reply(Embed({
                title: lang.ManagementModule.Commands.Setexp.XPSet.Title,
                description: lang.ManagementModule.Commands.Setexp.XPSet.Description.replace(/{user}/g, user || lang.ManagementModule.Commands.Setexp.XPSet.Everyone).replace(/{xp}/g, amount.toLocaleString()).replace(/{level}/g, level.toLocaleString()),
                timestamp: new Date()
            }));
            return resolve(true);
        });
    },
    description: "Set the exp of all or a certain user",
    usage: "setexp <amount> <@user/all/everyone>",
    aliases: ['setxp', 'setexperience'],
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
