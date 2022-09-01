const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, ticket, channel, reason) => {

    if (!config.Tickets.Logs.Enabled) return;

    let guild = bot.guilds.cache.get(ticket.guild);
    let creator = guild.members.cache.get(ticket.creator);
    let logs = Utils.findChannel(config.Tickets.Logs.Channel, guild);

    if (!logs) return;

    logs.send(Utils.Embed({
        author: lang.TicketModule.Logs.Tickets.Created.Author,
        description: lang.TicketModule.Logs.Tickets.Created.Description
            .replace(/{creator}/g, creator)
            .replace(/{ticket}/g, ticket.channel_name)
            .replace(/{channel}/g, channel)
            .replace(/{reason}/g, reason ? reason : lang.TicketModule.Logs.Tickets.NoReason)
            .replace(/{time}/g, ~~(Date.now() / 1000))
    }));
};
