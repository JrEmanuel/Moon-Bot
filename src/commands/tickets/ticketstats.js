const Utils = require("../../modules/utils");

module.exports = {
    name: "ticketstats",
    run: async (bot, messageOrInteraction, args, { reply, member, guild }) => {
        return new Promise(async resolve => {
            let user = args[0] ? Utils.ResolveUser(messageOrInteraction) || member : member;
            let messages = await Utils.variables.db.get.ticket_messages.getMessages();
            let prefixes = [Utils.variables.config.Prefix, bot.toString(), await Utils.variables.db.get.getPrefixes(guild.id), "/"];
            let getStats = (after) => {
                let userMessages = messages.filter(m => m.author == user.id && m.created_at >= after);

                return {
                    total_messages: userMessages.length,
                    tickets_messages_in: (new Set(userMessages.map(m => m.ticket))).size,
                    tickets_closed: userMessages.filter(m => prefixes.some(p => m.content.startsWith(p + "close"))).length
                };
            };

            let now = Date.now();
            let allTime = getStats(0);
            let month = getStats(now - 2592000000);
            let week = getStats(now - 604800000);
            let day = getStats(now - 86400000);

            reply(Utils.setupMessage({
                configPath: Utils.variables.embeds.Embeds.TicketStats,
                variables: [
                    ...Utils.userVariables(user, "user"),
                    ...Utils.userVariables(bot, "bot"),
                    { searchFor: /{all-msgs}/g, replaceWith: allTime.total_messages },
                    { searchFor: /{all-tickets}/g, replaceWith: allTime.tickets_messages_in },
                    { searchFor: /{all-closes}/g, replaceWith: allTime.tickets_closed },
                    { searchFor: /{month-msgs}/g, replaceWith: month.total_messages },
                    { searchFor: /{month-tickets}/g, replaceWith: month.tickets_messages_in },
                    { searchFor: /{month-closes}/g, replaceWith: month.tickets_closed },
                    { searchFor: /{week-msgs}/g, replaceWith: week.total_messages },
                    { searchFor: /{week-tickets}/g, replaceWith: week.tickets_messages_in },
                    { searchFor: /{week-closes}/g, replaceWith: week.tickets_closed },
                    { searchFor: /{day-msgs}/g, replaceWith: day.total_messages },
                    { searchFor: /{day-tickets}/g, replaceWith: day.tickets_messages_in },
                    { searchFor: /{day-closes}/g, replaceWith: day.tickets_closed }
                ]
            }));

            resolve(true);
        });
    },
    description: "View your ticket message stats",
    aliases: [],
    usage: "ticketstats [@user]",
    arguments: [
        {
            name: "user",
            description: "The user to view the stats of",
            type: "USER",
            required: false
        }
    ]
};
