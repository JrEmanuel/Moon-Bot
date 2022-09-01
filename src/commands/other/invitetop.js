const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "invitetop",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let page = +args[0] || 1;
            if (page < 1) page = 1;
            
            let invites = await Utils.variables.db.get.getInviteData();
            invites = invites.filter(i => i.guild == guild.id).map(i => {
                i.invites = i.regular + i.bonus - i.leaves;
                return i;
            }).filter(i => i.invites || i.leaves || i.fake);

            if (!invites.length) {
                reply(Embed({
                    title: lang.Other.OtherCommands.Invitetop.Title.replace(/{current-page}/g, 1).replace(/{max-pages}/g, 1),
                    description: lang.Other.OtherCommands.Invitetop.NoInvites
                }));

                return resolve(true);
            }

            if (page > Math.ceil(invites.length / config.Leaderboards.UsersPerPage.Invites)) page = 1;

            const topUsers = invites.sort((a, b) => b.invites - a.invites).slice((page - 1) * config.Leaderboards.UsersPerPage.Invites, config.Leaderboards.UsersPerPage.Invites * page);

            reply(Embed({
                title: lang.Other.OtherCommands.Invitetop.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(invites.length / config.Leaderboards.UsersPerPage.Invites)).replace(/{page}/g, page),
                description: topUsers.map((u, i) => lang.Other.OtherCommands.Invitetop.Format
                    .replace(/{position}/g, i + 1)
                    .replace(/{user}/g, `<@${u.user}>`)
                    .replace(/{amount}/g, u.invites)
                    .replace(/{invite-word}/g, u.invites == 1 ? lang.Other.OtherCommands.Invitetop.Invites.Singular : lang.Other.OtherCommands.Invitetop.Invites.Plural)
                    .replace(/{regular}/g, u.regular + u.fake)
                    .replace(/{bonus}/g, u.bonus)
                    .replace(/{leaves}/g, u.leaves ? `-` + u.leaves : 0)
                    .replace(/{fake}/g, u.fake ? `-` + u.fake : 0)).join('\n'),
                footer: lang.Other.OtherCommands.Invitetop.Footer.replace(/{total}/g, invites.map(i => i.invites).reduce((acc, curr) => acc + curr))
            }));

            return resolve(true);
        });
    },
    description: "View the invite leaderboard",
    usage: "invitetop [page]",
    aliases: [],
    arguments: [
        {
            name: "page",
            description: "The page to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
