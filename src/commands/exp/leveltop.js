const Utils = require("../../modules/utils.js");
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: "leveltop",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let page = +args[0] || 1;

            const allXP = (await Utils.variables.db.get.getExperience())
                .filter(x => x.guild == guild.id &&
                    x.user &&
                    x.user.toLowerCase() !== "unknown" &&
                    x.xp >= 0 &&
                    x.level >= 1 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(x.user) : true)
                );
    
            if (page > Math.ceil(allXP.length / config.Leaderboards.UsersPerPage.Levels) || page < 1) page = 1;
    
            let xp = allXP
                .sort((a, b) => b.xp - a.xp)
                .map(x => JSON.stringify(x));
    
            xp = [...new Set(xp)]
                .map(x => JSON.parse(x))
                .slice((page - 1) * config.Leaderboards.UsersPerPage.Levels, config.Leaderboards.UsersPerPage.Levels * page)
                .map((xp, i) =>
                    lang.XPModule.Commands.Leveltop.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Levels).replace(/{level}/g, xp.level.toLocaleString()).replace(/{xp}/g, xp.xp.toLocaleString()).replace(/{user}/g, guild.members.cache.get(xp.user) || lang.XPModule.Commands.Leveltop.UnknownUser)
                );
    
            if (xp.length < 1) {
                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.LevelTop,
                    description: lang.XPModule.Commands.Leveltop.LeaderboardEmpty,
                    variables: [
                        { searchFor: /{current-page}/g, replaceWith: page },
                        { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allXP.length / config.Leaderboards.UsersPerPage.Levels) },
                        { searchFor: /{totalxp}/g, replaceWith: "0" },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                    ]
                }));

                return resolve(true);
            }
    
            const total = allXP.map(x => x.xp || 0).reduce((acc, cv) => acc + cv);
    
            reply(Utils.setupMessage({
                configPath: embeds.Embeds.LevelTop,
                description: xp.join('\n'),
                variables: [
                    { searchFor: /{current-page}/g, replaceWith: page },
                    { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allXP.length / config.Leaderboards.UsersPerPage.Levels) },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                    { searchFor: /{totalxp}/g, replaceWith: total }
                ]
            }));

            return resolve(true);
        });
    },
    description: "Check the experience leaderboard",
    usage: "leveltop [page]",
    aliases: [
        "levellb"
    ],
    arguments: [
        {
            name: "page",
            description: "The page number to view",
            requried: false,
            type: "INTEGER",
            minValue: 1
        }
    ]
};

