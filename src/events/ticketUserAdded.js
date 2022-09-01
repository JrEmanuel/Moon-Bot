const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, ticket, executor, addedUser) => {

    if (!config.Tickets.Logs.Enabled) return;

    let guild = bot.guilds.cache.get(ticket.guild);
    let logs = Utils.findChannel(config.Tickets.Logs.Channel, guild);

    if (!logs) return;

    logs.send(Utils.Embed({
        author: lang.TicketModule.Logs.Tickets.UserAdded.Author,
        description: lang.TicketModule.Logs.Tickets.UserAdded.Description
            .replace(/{executor}/g, executor)
            .replace(/{user}/g, addedUser)
            .replace(/{ticket}/g, ticket.channel_name)
            .replace(/{channel}/g, `<#${ticket.channel_id}>`)
            .replace(/{time}/g, ~~(Date.now() / 1000))
    }));
};
