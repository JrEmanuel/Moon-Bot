const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

const diceSides = {
    1: lang.FunModule.Commands.Rolldice.Sides[0],
    2: lang.FunModule.Commands.Rolldice.Sides[1],
    3: lang.FunModule.Commands.Rolldice.Sides[2],
    4: lang.FunModule.Commands.Rolldice.Sides[3],
    5: lang.FunModule.Commands.Rolldice.Sides[4],
    6: lang.FunModule.Commands.Rolldice.Sides[5]
};

module.exports = {
    name: "rolldice",
    run: async (bot, messageOrInteraction, args, { type, user, channel, reply }) => {
        return new Promise(async resolve => {
            const dice = Object.keys(diceSides)[Math.floor(Math.random() * Object.keys(diceSides).length)];
    
            if (type == "message") await channel.send(lang.FunModule.Commands.Rolldice.RollingDice);

            reply(Embed({
                title: lang.FunModule.Commands.Rolldice.Embed.Title,
                description: lang.FunModule.Commands.Rolldice.Embed.Description.replace(/{result}/g, dice),
                thumbnail: Object.values(diceSides)[Object.keys(diceSides).indexOf(dice)],
                footer: { text: lang.FunModule.Commands.Rolldice.Embed.Footer.replace(/{user}/g, user.tag), icon: user.displayAvatarURL({ dynamic: true }) }
            }));

            return resolve(true);
        });
    },
    description: "Roll a dice",
    usage: "rolldice",
    aliases: [
        "roll",
        "dice"
    ],
    arguments: []
};
