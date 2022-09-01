const Utils = require("../../modules/utils.js");
const { config, embeds } = Utils.variables;

module.exports = {
    name: 'links',
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(resolve => {
            let fields = Object.keys(config.Links).map(name => {
                return { name: name, value: config.Links[name] };
            });

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.Links,
                fields: fields
            }));
            return resolve(true);
        });
    },
    description: "View links related to the Discord server",
    usage: 'links',
    aliases: [],
    arguments: []
};
