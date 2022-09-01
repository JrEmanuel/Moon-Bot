const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;
module.exports = {
    name: "givexp",
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
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Givexp.GiveToBot }), { ephemeral: true });
    
                return resolve();
            }
            
            if (everyone) {
                await guild.members.cache.filter(m => !m.user.bot).forEach(async member => {
                    await Utils.variables.db.update.experience.updateExperience(member, (await Utils.variables.db.get.getExperience(member)).level, amount, 'add');
                    let { level, xp } = await Utils.variables.db.get.getExperience(member);
                    if (!level) level = 1;
                    if (!xp) xp = 0;
                    let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
    
                    while (xpNeeded <= 0) {
                        ++level;
                        xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
                    }
    
                    await Utils.variables.db.update.experience.updateExperience(member, level, xp, 'set');
                });
            } else {
                await Utils.variables.db.update.experience.updateExperience(mentionedUser, (await Utils.variables.db.get.getExperience(mentionedUser)).level, amount, 'add');
        
                let { level, xp } = await Utils.variables.db.get.getExperience(mentionedUser);
                if (!level) level = 1;
                if (!xp) xp = 0;
                let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
    
                while (xpNeeded <= 0) {
                    ++level;
                    xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
                }
    
                await Utils.variables.db.update.experience.updateExperience(mentionedUser, level, xp, 'set');
            }
    
            reply(Embed({
                title: lang.AdminModule.Commands.Givexp.XPAdded.Title,
                description: lang.AdminModule.Commands.Givexp.XPAdded.Description.replace(/{amount}/g, amount.toLocaleString()).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Givexp.XPAdded.Everyone),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Give XP to all or a certain user",
    usage: "givexp <amount> <@user/all/everyone>",
    aliases: [ 'giveexp', 'giveexperience', 'addxp', 'addexp'],
    arguments: [
        {
            name: "amount",
            description: "The amount of exp to give",
            required: true,
            type: "INTEGER"
        },
        {
            name: "target",
            description: "The user(s) to give the exp to (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
