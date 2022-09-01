const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "gdelete",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            const giveaway = args.length > 0 ? await Utils.variables.db.get.getGiveawayFromID(args[0]) || await Utils.variables.db.get.getGiveawayFromName(args.join(" ")) : await Utils.variables.db.get.getLatestGiveaway();

            if (args.length > 0 && !giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.UnknownGiveaway
                }), { ephemeral: true });
                return resolve();
            }

            if (!giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NoGiveaways
                }), { ephemeral: true });
                return resolve(true);
            }

            const link = `https://discordapp.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`;

            await Utils.variables.db.update.giveaways.deleteGiveaway(giveaway.message);

            reply(Embed({
                title: lang.GiveawaySystem.Commands.Gdelete.Title,
                description: lang.GiveawaySystem.Commands.Gdelete.Description.replace(/{name}/g, giveaway.prize).replace(/{link}/g, link),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "Delete the ongoing giveaway",
    usage: "gdelete [giveaway name|message id]",
    aliases: [
        "giveawaydelete",
        "deletegiveaway"
    ],
    arguments: [
        {
            name: "giveaway",
            description: "The giveaway to delete (name or message ID)",
            required: false,
            type: "STRING"
        }
    ]
};
