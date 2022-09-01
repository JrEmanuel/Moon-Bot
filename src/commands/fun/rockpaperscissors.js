const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { lang } = Utils.variables;
const { capitalize } = require("lodash");
const getEmoji = choice => {
    return choice == "rock" ? "⛰️" : choice == "scissors" ? "✂️" : "🧻"; 
};

module.exports = {
    name: "rockpaperscissors",
    run: async (bot, messageOrInteraction, args, { prefixUsed, user, reply }) => {
        return new Promise(async resolve => {
            if (!args.length) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            const choices = ["rock", "paper", "scissors"];
            const choice = args[0].toLowerCase();
    
    
            if (!choices.includes(choice)) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            choices.splice(choices.indexOf(choice), 1);
    
            const botsChoice = choices[~~(Math.random() * choices.length)];
    
            let winner;
    
            if (botsChoice == "rock" && choice == "paper") winner = user;
            if (botsChoice == "rock" && choice == "scissors") winner = bot.user;
    
            if (botsChoice == "paper" && choice == "scissors") winner = user;
            if (botsChoice == "paper" && choice == "rock") winner = bot.user;
    
            if (botsChoice == "scissors" && choice == "rock") winner = user;
            if (botsChoice == "scissors" && choice == "paper") winner = bot.user;
    
    
            reply(Embed({
                title: lang.FunModule.Commands.RockPaperScissors.Title,
                description: lang.FunModule.Commands.RockPaperScissors.Description.replace(/{you}/g, `${capitalize(choice)} ${getEmoji(choice)}`).replace(/{bot}/g, `${capitalize(botsChoice)} ${getEmoji(botsChoice)}`).replace(/{user}/g, `<@${winner.id}>`)
            })); 
            
            return resolve(true);
        });
    },
    description: "Rock paper scissors game",
    usage: "rps <rock/paper/scissors>",
    aliases: [
        "rps"
    ],
    arguments: [
        {
            name: "choice",
            description: "The choice you want to make",
            required: true,
            type: "STRING",
            choices: [
                {
                    name: "rock",
                    value: "rock"
                },
                {
                    name: "paper",
                    value: "paper"
                },
                {
                    name: "scissors",
                    value: "scissors"
                }
            ]
        }
    ]
};
