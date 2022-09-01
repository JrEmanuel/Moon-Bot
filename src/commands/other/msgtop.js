const Utils = require("../../modules/utils.js");
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: "msgtop",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let page = +args[0] || 1;

            if (page < 1) page = 1;                                                                                                                     

            const counts = (await Utils.variables.db.get.getMessageCount())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== 'unknown' &&
                    c.count &&
                    c.count >= 0 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(c.user) : true)
                );

            if (page > Math.ceil(counts.length / config.Leaderboards.UsersPerPage.Messages)) page = 1;

            const co = counts
                .sort((a, b) => b.count - a.count)
                .slice((page - 1) * config.Leaderboards.UsersPerPage.Messages, config.Leaderboards.UsersPerPage.Messages * page)
                .map((co, i) =>
                    lang.Other.OtherCommands.Msgtop.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Messages).replace(/{message_count}/g, co.count.toLocaleString()).replace(/{user}/g, guild.members.cache.get(co.user) || lang.Other.OtherCommands.Msgtop.UnknownUser)
                );

            if (co.length < 1) {
                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.Msgtop,
                    description: lang.Other.OtherCommands.Msgtop.LeaderboardEmpty,
                    variables: [
                        { searchFor: /{current-page}/g, replaceWith: page },
                        { searchFor: /{max-pages}/g, replaceWith: Math.ceil(counts.length / config.Leaderboards.UsersPerPage.Messages) },
                        { searchFor: /{total_messages}/g, replaceWith: "0" },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                    ]
                }));

                return resolve(true);
            }


            const total = counts.map(c => c.count || 0).reduce((acc, cv) => acc + cv);

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.Msgtop,
                description: co.join('\n'),
                variables: [
                    { searchFor: /{current-page}/g, replaceWith: page },
                    { searchFor: /{max-pages}/g, replaceWith: Math.ceil(counts.length / config.Leaderboards.UsersPerPage.Messages) },
                    { searchFor: /{total_messages}/g, replaceWith: total.toLocaleString() },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                ]
            }));

            return resolve(true);
        });
    },
    description: "Check the message count leaderboard",
    usage: "msgtop [page]",
    aliases: ["mtop", "messagestop", "messagetop"],
    arguments: [
        {
            name: "page",
            description: "The page to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
