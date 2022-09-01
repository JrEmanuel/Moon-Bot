const Utils = require("../../modules/utils");
const { lang, config } = Utils.variables;

module.exports = {
    name: "gametop",
    run: async (bot, messageOrInteraction, args, { slashCommand, type, guild, reply }) => {
        return new Promise(async resolve => {
            let page = type == "interaction" ? slashCommand?.arguments?.page || 1 : +args[0] || +args[1] || 1;
            if (page < 1) page = 1;

            let data = await Utils.variables.db.get.getGameData();
    
            data = data.filter(d => d.guild == guild.id);
            
            const gameName = type == "interaction" ? slashCommand?.arguments?.game : (["connect4", "c4", "tictactoe", "ttt"].includes(args[0]?.toLowerCase()) ? args[0]?.toLowerCase() : null); 
    
            if (gameName && ["connect4", "c4"].includes(gameName)) {
    
                data = data
                    .filter(d => {
                        return JSON.parse(d.data).connect4 && 
                            (config.Leaderboards.FilterUnknown ? guild.members.cache.get(d.user) : true);
                    })
                    
                    .map(d => {
                        let wins = JSON.parse(d.data).connect4.wins;
                        return { user: d.user, wins };
                    })
                    .sort((a, b) => b.wins - a.wins);
    
                if (!data.length) {
                    reply(Utils.Embed({ 
                        preset: "error", 
                        description: lang.FunModule.Commands.Gametop.Errors.NoOnePlayed[0] 
                    }), { ephemeral: true });

                    return resolve();
                }

                if (page > Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)) page = 1;
    
                reply(Utils.Embed({
                    title: lang.FunModule.Commands.Gametop.Embeds.Connect4.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)),
                    description: data
                        .slice((page - 1) * config.Leaderboards.UsersPerPage.Games, config.Leaderboards.UsersPerPage.Games * page)
                        .map((d, i) => lang.FunModule.Commands.Gametop.Embeds.Connect4.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Games).replace(/{amount}/g, d.wins.toLocaleString()).replace(/{user}/g, guild.members.cache.get(d.user) || lang.FunModule.Commands.Gametop.Unknown))
                        .join("\n"),
                    timestamp: new Date()
                }));
    
                return resolve(true);
            } else if (gameName && ["tictactoe", "ttt"].includes(gameName)) {
                data = data
                    .filter(d => {
                        return JSON.parse(d.data).tictactoe &&
                            (config.Leaderboards.FilterUnknown ? guild.members.cache.get(d.user) : true);
                    })
                    .map(d => {
                        let wins = JSON.parse(d.data).tictactoe.wins;
                        return { user: d.user, wins };
                    })
                    .sort((a, b) => b.wins - a.wins);
    
                if (!data.length) {
                    reply(Utils.Embed({ 
                        preset: "error", 
                        description: lang.FunModule.Commands.Gametop.Errors.NoOnePlayed[1] 
                    }), { ephemeral: true });

                    return resolve();
                }

                if (page > Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)) page = 1;
    
                reply(Utils.Embed({
                    title: lang.FunModule.Commands.Gametop.Embeds.TicTacToe.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)),
                    description: data
                        .slice((page - 1) * config.Leaderboards.UsersPerPage.Games, config.Leaderboards.UsersPerPage.Games * page)
                        .map((d, i) => lang.FunModule.Commands.Gametop.Embeds.TicTacToe.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Games).replace(/{amount}/g, d.wins.toLocaleString()).replace(/{user}/g, guild.members.cache.get(d.user) || lang.FunModule.Commands.Gametop.Unknown))
                        .join("\n"),
                    timestamp: new Date()
                }));
    
                return resolve(true);
            } else {
                data = data
                    .filter(d => {
                        return config.Leaderboards.FilterUnknown ? guild.members.cache.get(d.user) : true;
                    })
                    .map(d => {
                        let connect4 = JSON.parse(d.data).connect4;
                        let tictactoe = JSON.parse(d.data).tictactoe;
    
                        return { user: d.user, wins: (tictactoe ? tictactoe.wins : 0) + (connect4 ? connect4.wins : 0) };
                    })
                    .sort((a, b) => b.wins - a.wins);
    
                if (!data.length) {
                    reply(Utils.Embed({ 
                        preset: "error", 
                        description: lang.FunModule.Commands.Gametop.Errors.NoOnePlayed[2] 
                    }), { ephemeral: true });

                    return resolve();
                }

                if (page > Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)) page = 1;
                
                reply(Utils.Embed({
                    title: lang.FunModule.Commands.Gametop.Embeds.All.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(data.length / config.Leaderboards.UsersPerPage.Games)),
                    description: data
                        .slice((page - 1) * config.Leaderboards.UsersPerPage.Games, config.Leaderboards.UsersPerPage.Games * page)
                        .map((d, i) => lang.FunModule.Commands.Gametop.Embeds.All.Format.replace(/{pos}/g, ++i + (page - 1) * config.Leaderboards.UsersPerPage.Games).replace(/{amount}/g, d.wins.toLocaleString()).replace(/{user}/g, bot.users.cache.get(d.user) || lang.FunModule.Commands.Gametop.Unknown))
                        .join("\n"),
                    timestamp: new Date()
                }));

                return resolve(true);
            }
        });
    },
    usage: "gametop [connect4/c4/tictactoe/ttt] [page #]",
    description: "View who has won the most games",
    aliases: [],
    arguments: [
        {
            name: "game",
            description: "The game to view the leaderboard of",
            required: false,
            type: "STRING",
            choices: [
                {
                    name: "connect4",
                    value: "connect4"
                },
                {
                    name: "tictactoe",
                    value: "tictactoe"
                },
                {
                    name: "all",
                    value: "all"
                }
            ]
        },
        {
            name: "page",
            description: "The page to view",
            required: false,
            type: "NUMBER",
            minValue: 1
        }
    ]
};
