const Utils = require("../../modules/utils.js");
const { lang } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: "warnings",
    run: async (bot, messageOrInteraction, args, { member, guild, reply }) => {
        return new Promise(async resolve => {
            const isID = /^[0-9]{18}$/.test(args[0]);
            let targetUser = isID ? args[0] : Utils.ResolveUser(messageOrInteraction);
            const warnings = member ? (isID ? await Utils.variables.db.get.getWarningsFromUserByID(targetUser) : await Utils.variables.db.get.getWarnings(targetUser)) : await Utils.variables.db.get.getWarnings();
            
            if (isID) targetUser = await bot.users.fetch(targetUser);
            if (targetUser && targetUser.user) targetUser = targetUser.user;
            if (!warnings || warnings.length == 0) {
                reply(Embed({ 
                    preset: "error", 
                    description: targetUser ? lang.ModerationModule.Commands.Warnings.Errors.NoHistory.replace(/{user}/g, targetUser.tag) : lang.ModerationModule.Commands.Warnings.Errors.NoWarnings 
                }), { ephemeral: true });
                return resolve(true);
            }
    
            let page = +args[1] || 1;
            if (page < 1) page = 1;
    
            reply(Embed({
                author: targetUser ? {
                    icon: targetUser.displayAvatarURL({ dynamic: true }),
                    text: targetUser.username
                } : { 
                    icon: bot.user.displayAvatarURL({ dynamic: true }),
                    text: lang.ModerationModule.Commands.Warnings.Embed.Author
                },
                title: lang.ModerationModule.Commands.Warnings.Embed.Title.replace(/{current-page}/g, page).replace(/{max-pages}/, Math.ceil(warnings.length / 5)),
                fields: warnings
                    .slice((page - 1) * 5, 5 * page)
                    .map(warning => {
                        let warnedUser = guild.members.cache.get(warning.user);
                        let warnedBy = guild.members.cache.get(warning.executor);
                        return targetUser ? {
                            name: lang.ModerationModule.Commands.Warnings.Embed.Format[0].replace(/{id}/g, warning.id),
                            value: lang.ModerationModule.Commands.Warnings.Embed.Format[1].replace(/{user}/g, warnedBy || warning.executor).replace(/{reason}/g, warning.reason).replace(/{date}/g, "<t:" + Math.floor(warning.time / 1000) + ":f>")
                        } : {
                            name: lang.ModerationModule.Commands.Warnings.Embed.Format[2].replace(/{id}/g, warning.id),
                            value: lang.ModerationModule.Commands.Warnings.Embed.Format[3].replace(/{user}/g, warnedUser || warning.user).replace(/{executor}/g, warnedBy || warning.executor).replace(/{reason}/g, warning.reason).replace(/{date}/g, new Date(warning.time).toLocaleString())
                        };
                    }),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "View the warnings of a user on the Discord server",
    usage: "warnings <@user/all> [page #]",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to view the warnings of (or \"all\" to view all warnings)",
            required: true,
            type: "STRING"
        },
        {
            name: "page",
            description: "The page number to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
