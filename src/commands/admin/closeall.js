const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'closeall',
    run: async (bot, messageOrInteraction, args, { type, user, member, guild, reply }) => {
        return new Promise(async (resolve) => {
            async function closeAllTickets() {
                let channels = await Utils.getOpenTickets(guild);

                channels.forEach(async ch => {
                    const ticket = await Utils.variables.db.get.getTickets(ch.id);
                    if (!ticket) return ch.send(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }));

                    ch.delete();
                    require('../../modules/transcript.js')(ch.id);

                    bot.emit("ticketClosed", ticket, member, undefined);
                });

                await reply(Embed({ title: lang.TicketModule.Commands.Closeall.Complete, color: config.Success_Color }));
            }

            if (config.Tickets.Logs.Enabled) {
                const logsChannel = Utils.findChannel(config.Tickets.Logs.Channel, guild);
                if (!logsChannel) {
                    reply(Embed({ preset: 'console' }), { ephemeral: true });
                }
            }

            if (config.Tickets.CloseAllConfirmation) {
                let msg = await reply(Embed({ title: lang.TicketModule.Commands.Closeall.Confirmation }));
                await msg.react('✅');
                await msg.react('❌');
                Utils.waitForReaction(['✅', '❌'], user.id, msg).then(reaction => {
                    if (type == "message") msg.delete();
                    (reaction.emoji.name == '✅') ? closeAllTickets() : reply(Embed({ title: lang.TicketModule.Commands.Closeall.Canceled }));
                    return resolve();
                });
            } else {
                closeAllTickets();
                resolve();
            }
        });
    },
    description: "Close all open tickets",
    usage: 'closeall',
    aliases: [],
    arguments: []
};
