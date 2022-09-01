const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = {
    name: "edit",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, guild, channel, reply }) => {
        return new Promise(async resolve => {        
            if (!args.length) {
                reply(Embed({ preset: "invalidargs", usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            const editChannel = (type == "message" ? Utils.ResolveChannel(messageOrInteraction, 0, false, true) : guild.channels.cache.get(args[0])) || channel;
            
            editChannel.messages.fetch(args[1])
                .then(msg => {

                    if (msg.author.id !== bot.user.id) {
                        reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Edit.Errors.NotBotMessage }), { ephemeral: true });

                        return resolve();
                    }

                    let action = args[2] ? args[2].toLowerCase() : undefined;

                    if (!action || !["normal", "embed", "advanced"].includes(action)) {
                        reply(Embed({ preset: "invalidargs", usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                        return resolve();
                    }

                    let content = type == "message" ? args.slice(3).join(" ") : args[3];

                    if (action == 'normal') msg.edit(content);
                    else if (action == 'embed') msg.edit(Embed({ description: content }));
                    else if (action == "advanced") {
                        let embed = Utils.embedFromText(content, messageOrInteraction);

                        msg.edit(embed);
                    }

                    reply(Embed({
                        title: lang.AdminModule.Commands.Edit.Edited
                    }), { ephemeral: true, deleteAfter: 5000 });

                    if (type == "message") messageOrInteraction.delete().catch(() => {});

                    return resolve(true);
                })
                .catch((err) => {
                    console.log(err);
                    reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Edit.Errors.ErrorOccured }), { ephemeral: true });

                    return resolve();
                });
        });
    },
    aliases: [],
    description: "Edit a message sent by the bot",
    usage: "edit <channel> <message ID> <normal/embed/advanced> <message/embed properties>",
    arguments: [
        {
            name: "channel",
            description: "The channel to edit the message in",
            required: true,
            type: "CHANNEL"
        },
        {
            name: "message-id",
            description: "The ID of the message that you want to edit",
            required: true,
            type: "STRING"
        },
        {
            name: "type",
            description: "The new type of message content",
            required: true,
            type: "STRING",
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
            ]
        },
        {
            name: "content",
            description: "The new message/embed properties",
            required: true,
            type: "STRING"
        }
    ]
};
