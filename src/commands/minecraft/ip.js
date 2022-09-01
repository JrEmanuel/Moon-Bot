const Utils = require("../../modules/utils.js");
const { embeds } = Utils.variables;

module.exports = {
    name: "ip",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            reply(Utils.setupMessage({
                configPath: embeds.Embeds.IP
            }));

            return resolve(true);
        });
    },
    description: "View the Minecraft server's IP",
    usage: "ip",
    aliases: [
        "serverip"
    ],
    arguments: []
};

