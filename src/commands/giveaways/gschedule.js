const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = {
    name: "gschedule",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            let giveaways = await Utils.variables.db.get.getGiveaways();

            giveaways = giveaways.filter(g => !g.ended);

            if (!giveaways.length) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NoGiveawaysRunning
                }), { ephemeral: true });
                return resolve(true);
            }

            reply(Embed({
                title: lang.GiveawaySystem.Commands.Gschedule.Title,
                description: giveaways.map(giveaway => {
                    const link = `https://discord.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`;
                    return lang.GiveawaySystem.Commands.Gschedule.Format
                        .replace(/{name}/g, giveaway.prize)
                        .replace(/{link}/g, link)
                        .replace(/{date}/g, new Date(giveaway.end).toLocaleString())
                        .replace(/{timer}/g, `<t:${~~(giveaway.end / 1000)}:R>`)
                        .replace(/{amount}/g, giveaway.amount_of_winners)
                        .replace(/{winners}/g, giveaway.amount_of_winners == 1 ? lang.GiveawaySystem.Commands.Gschedule.Winners.Singular : lang.GiveawaySystem.Commands.Gschedule.Winners.Plural);
                }).join("\n"),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    aliases: [],
    usage: "gschedule",
    description: "View a list of giveaways and when they end",
    arguments: []
};
