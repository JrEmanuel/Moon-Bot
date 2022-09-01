const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;

module.exports = {
    name: 'say',
    run: async (bot, messageOrInteraction, args, { prefixUsed, commandUsed, type, guild, channel, reply }) => {
        return new Promise(async resolve => {
            const action = args[0]?.toLowerCase();
            if (action && args.length < 2 || !['embed', 'normal', 'advanced'].includes(action)) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            if (type == "message") messageOrInteraction.delete().catch(() => { });

            const mentionedChannel = (type == "message" ? Utils.ResolveChannel(messageOrInteraction, 1, false, false) : (args[2] ? guild.channels.cache.get(args[2]) : null)) || channel;

            let msg = type == "message" ? messageOrInteraction.content.slice((
                // Prefix + command length
                (prefixUsed + commandUsed).length +
                // Action (embed or normal) length 
                action.length) + 1, messageOrInteraction.content.length).trim() : args[1].trim();

            // Remove channel if it is added
            if (mentionedChannel.name !== channel.name && type == "message")
                msg = msg.split(" ").slice(1).join(" ");

            if (action == 'normal') mentionedChannel.send(msg);
            else if (action == 'embed') mentionedChannel.send(Embed({ description: msg }));
            else if (action == "advanced") {
                let embed = Utils.embedFromText(msg, messageOrInteraction);

                mentionedChannel.send(embed);
            }

            if (type !== "message") reply(Embed({
                color: Utils.variables.config.EmbedColors.Success,
                title: Utils.variables.lang.AdminModule.Commands.Say.Sent
            }), { ephemeral: true });
            return resolve(true);
        });
    },
    description: "Make the bot send a certain message",
    usage: 'say <normal/embed/advanced> [#channel] <message/embed properties>',
    aliases: [],
    arguments: [
        {
            name: "type",
            description: "The type of message to send",
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
            name: "content",
            description: "The message/embed properties",
            required: true,
            type: "STRING"
        },
        {
            name: "channel",
            description: "The channel to send the message in",
            required: false,
            type: "CHANNEL"
        }
    ]
};
