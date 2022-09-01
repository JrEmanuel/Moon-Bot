const Utils = require("../../modules/utils.js");
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: "cointop",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let page = +args[0] || 1;
            if (page < 1) page = 1;
    
            const allCoins = (await Utils.variables.db.get.getCoins())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== "unknown" &&
                    c.coins &&
                    c.coins >= 0 &&
                    (config.Leaderboards.FilterUnknown ? guild.members.cache.get(c.user) : true)
                );
    
            if (page > Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins)) page = 1;
    
            const coins = allCoins
                .sort((a, b) => b.coins - a.coins)
                .slice((page - 1) * config.Leaderboards.UsersPerPage.Coins, config.Leaderboards.UsersPerPage.Coins * page)
                .map((coins, i) =>
                    lang.CoinModule.Commands.Cointop.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Coins).replace(/{coins}/g, coins.coins.toLocaleString()).replace(/{user}/g, guild.members.cache.get(coins.user) || lang.CoinModule.Command.Cointop.UnknownUser)
                );
    
            if (coins.length < 1) {
                reply(Utils.setupMessage({
                    configPath: embeds.Embeds.CoinTop,
                    description: lang.CoinModule.Commands.Cointop.LeaderboardEmpty,
                    variables: [
                        { searchFor: /{current-page}/g, replaceWith: page },
                        { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins) },
                        { searchFor: /{totalcoins}/g, replaceWith: "0" },
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                    ]
                }), { ephemeral: true });
                return resolve(true);
            }
    
    
            const total = allCoins.map(c => c.coins || 0).reduce((acc, cv) => acc + cv);
    
            reply(Utils.setupMessage({
                configPath: embeds.Embeds.CoinTop,
                description: coins.join('\n'),
                variables: [
                    { searchFor: /{current-page}/g, replaceWith: page },
                    { searchFor: /{max-pages}/g, replaceWith: Math.ceil(allCoins.length / config.Leaderboards.UsersPerPage.Coins) },
                    { searchFor: /{totalcoins}/g, replaceWith: total.toLocaleString() },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                ]
            }));
    
            return resolve(true);
        });
    },
    description: "Check the coin leaderboard",
    usage: "cointop [page]",
    aliases: [
        "coinlb",
        "baltop",
        "balancetop",
        "ballb",
        "balancelb"
    ],
    arguments: [
        {
            name: "page",
            description: "The page of the leaderboard to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
