const Utils = require("../../utils");
const { variables: { config, embeds } } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve) => {
        // Updates
        if (message && [channel.name, channel.id].includes(config.Channels.DefaultUpdates) && config.Other.PostUpdatesByMessagingInChannel && !command) {
            message.delete();
            message.channel.send(Utils.setupMessage({
                configPath: embeds.Embeds.Update,
                variables: [
                    ...Utils.userVariables(member, "user"),
                    { searchFor: /{update}/g, replaceWith: message.content },
                    { searchFor: /{update-version}/g, replaceWith: "" }
                ]
            }));
        }

        return resolve();
    });
};
