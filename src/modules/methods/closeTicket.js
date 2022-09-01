const Utils = require("../utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, args, member, channel, closeConfirmation = config.Tickets.CloseConfirmation, reply) => {
    return new Promise(async resolve => {
        const sendToChannel = (embed, ephemeral = false) => {
            return new Promise(async resolve => {
                if (reply) reply(embed, { ephemeral }).then(msg => resolve(msg));
                else channel.send(embed).then(msg => resolve(msg));
            });
        };

        const ticket = await Utils.variables.db.get.getTickets(channel.id);
        // The ticket doesn't exist, check to see if it is an application
        if (!ticket) {
            const application = await Utils.variables.db.get.getApplications(channel.id);
            if (!application) {
                sendToChannel(Embed({ preset: 'error', description: lang.TicketModule.Errors.TicketNotExist }), true);

                return resolve();
            } else {
                channel.delete();
                require('../../modules/transcript.js')(channel.id, false);

                bot.emit("applicationClosed", application, member, args.length > 0 ? args.join(" ") : undefined);

                return resolve(true);
            }
        }

        const closeTicket = async () => {
            channel.delete();
            require('../../modules/transcript.js')(channel.id);

            bot.emit("ticketClosed", ticket, member, args.length > 0 ? args.join(" ") : undefined);

            if (config.Tickets.DMClosureReason) {
                const creatorMember = channel.guild.members.cache.get(ticket.creator);
                if (creatorMember)
                    creatorMember.send(Embed({
                        title: lang.TicketModule.Commands.Close.Embeds.DM.Title,
                        description: lang.TicketModule.Commands.Close.Embeds.DM.Description
                            .replace(/{ticket}/g, ticket.channel_name.split('-')[1])
                            .replace(/{reason}/g, args.length > 0 ? args.join(' ') : lang.TicketModule.Commands.Close.NoReason)
                    })).catch(() => { });
            }

            return resolve(true);
        };

        if (closeConfirmation) {
            const msg = await sendToChannel(Embed({ title: lang.TicketModule.Commands.Close.Confirmation }));

            // React
            await msg.react('✅');
            await msg.react('❌');

            // Wait for the user to confirm or deny
            Utils.waitForReaction(['✅', '❌'], member.id, msg).then(reaction => {
                msg.delete();

                if (reaction.emoji.name == '✅') {
                    closeTicket();
                } else {
                    sendToChannel(Embed({ title: lang.TicketModule.Commands.Close.Canceled }), false);

                    return resolve();
                }
            });
        } else closeTicket();
    });
};
