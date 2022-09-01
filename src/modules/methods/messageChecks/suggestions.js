const Utils = require("../../utils");
const { variables: { config }, Embed } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (!config.Suggestions.Enabled) return resolve();
        if (![channel.name, channel.id].includes(config.Suggestions.Channels.Suggestions)) return resolve();

        if (interaction && command.command !== "snote") {
            reply(Embed({ preset: "error", description: "You cannot use slash commands in this channel" })).then(Utils.delete);
            return reject();
        }

        if (message ? (command ? command.command !== "snote" : true) : false) {
            if (["revivenode", "send-message", "both"].includes(config.Suggestions.Type.toLowerCase())) {
                if (message?.attachments?.size) {
                    const imageLogs = Utils.findChannel(config.Channels.ImageLogs, guild, "GUILD_TEXT");
                    const attachment = message.attachments.first();

                    if (imageLogs) {
                        imageLogs.send(attachment)
                            .then(m => {
                                message.delete();

                                require("../createSuggestion")(message.content, member, m.attachments.first());
                                return reject();
                            });
                    } else {
                        reply(Embed({ preset: "console" }));
                        return reject();
                    }
                } else {
                    message.delete();

                    require("../createSuggestion")(message.content, member);
                    return reject();
                }
            }
        }

        return resolve();
    });
};
