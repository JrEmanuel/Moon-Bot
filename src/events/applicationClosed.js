const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, application, executor, reason) => {

    if (!config.Applications.Logs.Enabled) return;

    let guild = bot.guilds.cache.get(application.guild);
    let applicant = guild.members.cache.get(application.creator);
    let logs = Utils.findChannel(config.Applications.Logs.Channel, guild);

    if (!logs) return;

    logs.send(Utils.Embed({
        author: lang.TicketModule.Logs.Applications.Closed.Author,
        description: lang.TicketModule.Logs.Applications.Closed.Description
            .replace(/{executor}/g, executor)
            .replace(/{applicant}/g, applicant ? applicant : application.creator)
            .replace(/{rank}/g, application.rank)
            .replace(/{channel}/g, application.channel_name)
            .replace(/{channel-id}/g, application.channel_id)
            .replace(/{reason}/g, reason ? reason : lang.TicketModule.Logs.Applications.NoReason)
            .replace(/{time}/g, ~~(Date.now() / 1000))
    }));
};
