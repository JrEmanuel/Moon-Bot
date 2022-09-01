const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'msg',
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, guild, reply }) => {
        return new Promise(async resolve => {
            if (args.length < 3) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
            let content = type == "message" ? args.slice(2).join(" ") : args[2];
            
            if (!["normal", "embed", "advanced"].includes(args[1].toLowerCase())) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            async function send(destinationChannel, sendError = false) {
                if (args[1].toLowerCase() == 'normal') destinationChannel.send(content).catch(() => {
                    if (sendError) reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Msg.CouldntSend }));
                    return false;
                });
    
                else if (args[1].toLowerCase() == 'embed') destinationChannel.send(Embed({ description: content })).catch(() => {
                    if (sendError) reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Msg.CouldntSend }));
                    return false;
                });
    
                else if (args[1].toLowerCase() == "advanced") {
                    let embed = Utils.embedFromText(content, messageOrInteraction);
    
                    destinationChannel.send(embed).catch(() => {
                        if (sendError) reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Msg.CouldntSend }));
                        return false;
                    });
                }
    
                return true;
            }
    
            // USER
            let mentionedUser = Utils.ResolveUser(messageOrInteraction, 0);
            if (mentionedUser) {
                let sent = await send(mentionedUser, true);
                if (sent) reply(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
                
                return resolve(true);
            }
    
            // ROLE
            let msgRole = (type == "message" ? messageOrInteraction.mentions.roles.first() : guild.roles.cache.get(args[0].replace(/([<@&]|[>])/g, ""))) || guild.roles.cache.get(args[0].replace(/([<@&]|[>])/g, ""));
            if (msgRole) {
                let members = guild.members.cache.filter(u => u.roles.cache.has(msgRole.id));
                await members.forEach(async m => {
                    await send(m);
                });

                await reply(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
                return resolve(true);
            }
    
            // ALL USERS
            if (args[0].toLowerCase() == 'users') {
                guild.members.cache.forEach(send);

                await reply(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));
                return resolve(true);
            }
    
            // TICKETS
            else if (args[0].toLowerCase() == 'tickets') {
                let tickets = await Utils.getOpenTickets(guild);
                tickets.forEach(send);
                await reply(Embed({ color: config.EmbedColors.Success, title: lang.AdminModule.Commands.Msg.Sent }));

                return resolve(true);
            } else {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

                return resolve();
            }
        });
    },
    description: "Message all or certain users",
    usage: 'msg <@user/@role/users/tickets> <normal/embed/advanced> <message>',
    aliases: ['message'],
    arguments: [
        {
            name: "target",
            description: "The target to send messages to (@user/@role/users/tickets)",
            required: true,
            type: "STRING"
        },
        {
            name: "type",
            description: "The type of message",
            required: true,
            choices: [
                {
                    name: "normal",
                    value: "normal"
                },
                {
                    name: "embed",
                    value: "embed"
                },
                {
                    name: "advanced",
                    value: "advanced"
                }
            ],
            type: "STRING"
        },
        {
            name: "message-content",
            description: "The content of the message",
            required: true,
            type: "STRING"
        }
    ]
};
