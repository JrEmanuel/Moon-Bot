const Utils = require('../modules/utils.js');
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, channel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!channel.guild || !config.Logs.Enabled.includes("ChannelDeleted")) return;
        if (config.Other.IgnoredGuilds.includes(channel.guild.id)) return;

        let Tickets = await Utils.variables.db.get.getTickets();
        let Applications = await Utils.variables.db.get.getApplications();
        let IDs = [...Tickets.map(ticket => ticket.channel_id), ...Applications.map(application => application.channel_id)];

        if (IDs.includes(channel.id) || Utils.variables.channelLogBlacklist.has(channel.name) || config.Logs.ChannelBlacklist.includes(channel.name) || config.Logs.ChannelBlacklist.includes(channel.id)) return;

        const logs = Utils.findChannel(config.Logs.Channels.ChannelDeleted, channel.guild);
        let type = channel.type.replace("GUILD_", "").toLowerCase();

        if (Utils.variables.tempChannels && Array.from(Utils.variables.tempChannels.values()).find(tc => tc.channel.id == channel.id)) return;
        if (logs) logs.send(Utils.Embed({
            author: lang.LogSystem.ChannelDeleted.Author,
            description: lang.LogSystem.ChannelDeleted.Description
                .replace(/{type}/g, type.charAt(0).toUpperCase() + type.substring(1))
                .replace(/{channel}/g, channel.name)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    }
};
