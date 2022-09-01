const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "takelevels",
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
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Takelevels.TakeFromBot }), { ephemeral: true });

                return resolve();
            }

            if (amount < 1) {
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Takelevels.TakeNegative }), { ephemeral: true });

                return resolve();
            }

            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    let { level } = await Utils.variables.db.get.getExperience(member);
                    if (!level) level = 1;

                    level -= amount;
                    let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5));
                    if (level < 1) {
                        xpNeeded = 0;
                        level = 1;
                    }

                    await Utils.variables.db.update.experience.updateExperience(member, level, xpNeeded, 'set');
                });
            } else {
                let { level } = await Utils.variables.db.get.getExperience(mentionedUser);
                if (!level) level = 1;

                level -= amount;
                let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5));
                if (level < 1) {
                    xpNeeded = 0;
                    level = 1;
                }

                await Utils.variables.db.update.experience.updateExperience(mentionedUser, level, xpNeeded, 'set');
            }

            reply(Embed({
                title: lang.AdminModule.Commands.Takelevels.LevelsRemoved.Title,
                description: lang.AdminModule.Commands.Takelevels.LevelsRemoved.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Takelevels.LevelsRemoved.Everyone),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Take levels from all or a certain user",
    usage: "takelevels <amount> <@user/all/everyone>",
    aliases: ['takelevel', 'removelevel', 'removelevels'],
    arguments: [
        {
            name: "amount",
            description: "The amount of levels to take",
            required: true,
            type: "INTEGER"
        },
        {
            name: "target",
            description: "The user(s) to take levels from (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
