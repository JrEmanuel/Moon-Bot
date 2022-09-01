const Utils = require("../../modules/utils.js");
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: "vctop",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let page = +args[0] || 1;
            if (page < 1) page = 1;

            const time = (await Utils.variables.db.get.getVoiceData())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== 'unknown' &&
                    c.total_time &&
                    c.total_time > 0 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(c.user) : true)
                );

            if (page > Math.ceil(time.length / config.Leaderboards.UsersPerPage.Voice)) page = 1;

            const t = time
                .sort((a, b) => b.total_time - a.total_time)
                .slice((page - 1) * config.Leaderboards.UsersPerPage.Voice, config.Leaderboards.UsersPerPage.Voice * page)
                .map((data, i) =>
                    lang.Other.OtherCommands.VCTop.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Voice).replace(/{time}/g, Utils.DDHHMMSSfromMS(data.total_time)).replace(/{user}/g, guild.members.cache.get(data.user) || lang.Other.OtherCommands.VCTop.UnknownUser)
                );

            if (t.length < 1) {
                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.VCtop,
                    description: lang.Other.OtherCommands.VCTop.LeaderboardEmpty,
                    variables: [
                        { searchFor: /{current-page}/g, replaceWith: page },
                        { searchFor: /{max-pages}/g, replaceWith: "1" },
                        { searchFor: /{total_time}/g, replaceWith: "0" },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                    ]
                }));

                return resolve(true);
            }


            const total = time.map(c => c.total_time || 0).reduce((acc, cv) => acc + cv);

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.VCtop,
                description: t.join('\n'),
                variables: [
                    { searchFor: /{current-page}/g, replaceWith: page },
                    { searchFor: /{max-pages}/g, replaceWith: Math.ceil(time.length / config.Leaderboards.UsersPerPage.Voice) },
                    { searchFor: /{total_time}/g, replaceWith: Utils.DDHHMMSSfromMS(total) },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                ]
            }));

            return resolve(true);
        });
    },
    description: "Check the message count leaderboard",
    usage: "vctop [page]",
    aliases: [ 
        "vtop", 
        "voicetopv", 
        "voicechanneltop"
    ],
    arguments: [
        {
            name: "page",
            description: "The page to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
