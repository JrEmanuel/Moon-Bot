const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: 'topic',
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, channel, reply }) => {
        return new Promise(async resolve => {
            let newTopic;
            const messageChannel = type == "message" ? messageOrInteraction.mentions.channels.first() : Utils.ResolveChannel(messageOrInteraction, 1, false, true);
            const mentionedChannel = messageChannel || channel;
    
            if (messageChannel) {
                if (!(type == "message" ? args[1] : args[0])) {
                    reply(Embed({ 
                        preset: 'invalidargs', 
                        usage: module.exports.usage 
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }
                else newTopic = (type == "message" ? args.slice(1).join(" ") : args[0]);
            } else {
                if (!args[0]) {
                    reply(Embed({ 
                        preset: 'invalidargs', 
                        usage: module.exports.usage 
                    }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }
                else newTopic = (type == "message" ? args.join(" ") : args[0]);
            }
    
            mentionedChannel.setTopic(newTopic);
            reply(Embed({ 
                title: lang.AdminModule.Commands.Topic.Title, 
                description: lang.AdminModule.Commands.Topic.Description.replace(/{newtopic}/g, newTopic), 
                color: config.EmbedColors.Success 
            }));

            return resolve(true);
        });
    },
    description: "Change the topic of a channel",
    usage: 'topic [#channel] (new topic)',
    aliases: ['settopic'],
    arguments: [
        {
            name: "topic",
            description: "The new topic",
            required: true,
            type: "STRING"
        },
        {
            name: "channel",
            description: "The channel to change the topic of",
            required: false,
            type: "CHANNEL"
        }
    ]
};
