const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "remove",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, user, channel, reply }) => {
        return new Promise(async resolve => {
            const ticket = await Utils.variables.db.get.getTickets(channel.id);
            if (!ticket) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.TicketModule.Errors.TicketNotExist 
                }), { ephemeral: true });

                return resolve();
            }
    
            const targetUser = Utils.ResolveUser(messageOrInteraction, 0, true);
    
            if (args.length == 0 || !targetUser) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            if (targetUser.id == user.id) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.TicketModule.Commands.Remove.Errors.RemoveOwnAccess 
                }), { ephemeral: true });

                return resolve();
            }
    
            const AddedUsers = await Utils.variables.db.get.getAddedUsers(channel.id);
            if (!AddedUsers.map(u => u.user).includes(targetUser.id) && !channel.members.get(targetUser.id)) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.TicketModule.Commands.Remove.Errors.NoAccess 
                }), { ephemeral: true });

                return resolve();
            }
    
            await Utils.variables.db.update.tickets.addedUsers.remove(channel.id, targetUser.id);
    
            if (!channel.permissionsFor(targetUser.id).has("VIEW_CHANNEL")) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.TicketModule.Commands.Remove.Errors.CantBeRemoved 
                }), { ephemeral: true });

                return resolve();
            }
    
            await channel.permissionOverwrites.create(targetUser.id, {
                VIEW_CHANNEL: null, SEND_MESSAGES: null, ADD_REACTIONS: null, READ_MESSAGE_HISTORY: null, ATTACH_FILES: null, EMBED_LINKS: null, USE_EXTERNAL_EMOJIS: null
            });
    
            reply(Embed({ 
                title: lang.TicketModule.Commands.Remove.Embeds.Removed.Title, 
                description: lang.TicketModule.Commands.Remove.Embeds.Removed.Description.replace(/{user}/g, `<@${targetUser.id}>`) 
            }));
    
            bot.emit("ticketUserRemoved", ticket, member, targetUser);

            return resolve(true);
        });
    },
    description: "Remove a user from the ticket you are typing in",
    usage: "remove <@user>",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to remove from the ticket",
            required: true,
            type: "USER"
        }
    ]
};
