const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "givelevels",
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
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Givelevels.GiveToBot }), { ephemeral: true });

                return resolve();
            }
    
            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    let { level, xp } = await Utils.variables.db.get.getExperience(member);
                    if (!level) level = 1;
                    if (!xp) xp = 0;
                    level += amount;
                    let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5)) - xp;

                    await Utils.variables.db.update.experience.updateExperience(member, level, xpNeeded, 'add');
                });
            } else {
                let { level, xp } = await Utils.variables.db.get.getExperience(mentionedUser);
    
                level += amount;
                let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5)) - xp;
    
                await Utils.variables.db.update.experience.updateExperience(mentionedUser, level, xpNeeded, 'add');
            }
    
            reply(Embed({
                title: lang.AdminModule.Commands.Givelevels.LevelsAdded.Title,
                description: lang.AdminModule.Commands.Givelevels.LevelsAdded.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Givelevels.LevelsAdded.Everyone),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Give levels to all or a certain user",
    usage: "givelevels <amount> <@user/all/everyone>",
    aliases: ['givelevel', 'addlevel', 'addlevels'],
    arguments: [
        {
            name: "amount",
            description: "The number of levels to give",
            required: true,
            type: "INTEGER"
        },
        {
            name: "target",
            description: "The user(s) to give the levels to (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
