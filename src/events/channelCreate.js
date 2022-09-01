const Utils = require('../modules/utils.js');
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!channel.guild || !config.Logs.Enabled.includes("ChannelCreated")) return;
        if (config.Other.IgnoredGuilds.includes(channel.guild.id)) return;
        if (channel.name.startsWith('ticket-') || channel.name.startsWith('application-')) return;

        const logs = Utils.findChannel(config.Logs.Channels.ChannelCreated, channel.guild);
        let type = channel.type.replace("GUILD_", "").toLowerCase();

        if (Utils.variables.channelLogBlacklist.has(channel.name) || config.Logs.ChannelBlacklist.includes(channel.name) || config.Logs.ChannelBlacklist.includes(channel.id)) return;
        if (logs) logs.send(Utils.Embed({
            author: lang.LogSystem.ChannelCreated.Author,
            description: lang.LogSystem.ChannelCreated.Description
                .replace(/{type}/g, type.charAt(0).toUpperCase() + type.substring(1))
                .replace(/{channel}/g, `<#${channel.id}>`)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));

    }
};
