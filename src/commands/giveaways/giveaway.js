const Utils = require("../../modules/utils");
const { lang } = Utils.variables;

module.exports = {
    name: "giveaway",
    run: async (bot, messageOrInteraction, args, { prefixUsed, reply }) => {
        return new Promise(async resolve => {
            reply(Utils.Embed({
                footer: {
                    text: bot.user.username,
                    icon: bot.user.displayAvatarURL({ dynamic: true })
                },
                timestamp: new Date(),
                title: lang.GiveawaySystem.Commands.Giveaways.Title,
                fields: [
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[0], value: prefixUsed + "gcreate", inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[1], value: prefixUsed + "gedit [giveaway name|message id]", inline: true },
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[2], value: prefixUsed + "gschedule", inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[3], value: prefixUsed + "gstop [giveaway name|message id]", inline: true },
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[4], value: prefixUsed + "greroll [giveaway name|message id]", inline: true },
                    { name: "\u200b", value: "\u200b", inline: true },
                    { name: lang.GiveawaySystem.Commands.Giveaways.Fields[5], value: prefixUsed + "gdelete [giveaway name|message id]", inline: true }
                ]
            }));

            return resolve(true);
        });
    },
    aliases: ["giveaways"],
    description: "View the help menu for giveaways",
    usage: "giveaway",
    arguments: []
};
