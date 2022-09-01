const Utils = require('../modules/utils');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!channel.guild || !config.Logs.Enabled.includes("ChannelPinsUpdated")) return;
        if (config.Other.IgnoredGuilds.includes(channel.guild.id)) return;

        const logs = Utils.findChannel(config.Logs.Channels.ChannelPinsUpdated, channel.guild);

        if (!logs || Utils.variables.channelLogBlacklist.has(channel.name) || config.Logs.ChannelBlacklist.includes(channel.name) || config.Logs.ChannelBlacklist.includes(channel.id)) return;

        logs.send(Embed({
            author: lang.LogSystem.ChannelPinsUpdated.Author,
            description: lang.LogSystem.ChannelPinsUpdated.Description
                .replace(/{channel}/g, channel)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    }
};
