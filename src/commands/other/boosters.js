const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const _ = require("lodash");

module.exports = {
    name: "boosters",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            const members = await guild.members.fetch();
            const boosters = members.filter(member => member.premiumSince).map(member => {
                return {
                    user: member.id,
                    boostedOn: `<t:${~~(member.premiumSince.getTime() / 1000)}:R>`
                };
            });

            if (!boosters || !boosters.length) {
                reply(Embed({
                    title: lang.Other.OtherCommands.Boosters.Title.replace(/{current-page}/g, 1).replace(/{max-pages}/g, 1),
                    description: lang.Other.OtherCommands.Boosters.NoBoosts
                }));

                return resolve(true);
            }

            const pages = _.chunk(boosters, config.Leaderboards.UsersPerPage.Boosters);
            const pageNum = +args[0] || 1;
            const actualPageNumber = pageNum > pages.length || !pages[pageNum - 1] ? 1 : pageNum;
            const page = pageNum > pages.length || !pages[pageNum - 1] ? pages[0] : pages[pageNum - 1];

            let description = "";

            // Add in the leaderboard
            page.forEach((booster, index) => {
                description += `**${++index + (config.Leaderboards.UsersPerPage.Boosters * (actualPageNumber - 1))}.** <@${booster.user}> - ${booster.boostedOn}`;
                if (!(index - 1 >= page.length)) description += "\n";
            });

            reply(Embed({
                title: lang.Other.OtherCommands.Boosters.Title.replace(/{current-page}/g, actualPageNumber).replace(/{max-pages}/g, pages.length),
                description,
                footer: lang.Other.OtherCommands.Boosters.Footer.replace(/{total}/g, boosters.length)
            }));

            return resolve(true);
        });
    },
    description: "View the server Nitro boosters",
    usage: "boosters [page]",
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
