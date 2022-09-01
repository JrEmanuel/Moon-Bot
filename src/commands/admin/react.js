const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = {
    name: "react",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, channel, reply }) => {
        return new Promise(async resolve => {
            if (args.length < 2 || !/[0-9]{18}/.test(args[0])) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            channel.messages.fetch(args[0])
                .then(msg => {
                    let customEmojiRegex = /[0-9]{18}/;
                    let emoji = customEmojiRegex.test(args[1]) ? bot.emojis.cache.find(e => e.id == args[1].substring(args[1].lastIndexOf(":") + 1, args[1].length - 1)) : undefined;
    
                    if (customEmojiRegex.test(args[1]) && !emoji) {
                        reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidEmoji }), { ephemeral: true });

                        return resolve();
                    }
    
                    msg.react(emoji || args[1])
                        .then(() => {
                            if (type == "message") messageOrInteraction.delete();
                            reply(Embed({ title: lang.AdminModule.Commands.React.Reacted.replace(/{emoji}/g, args[1]) }), { deleteAfter: 3000 });

                            return resolve(true);
                        })
                        .catch(err => {
                            if (err.message == "Unknown Emoji") reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidEmoji }), { ephemeral: true });
                            else {
                                console.log(err);
                                reply(Embed({ preset: "console" }), { ephemeral: true });
                            }

                            return resolve();
                        });
                })
                .catch(err => {
                    if (err.message == "Unknown Message") reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.React.InvalidMessage }), { ephemeral: true });
                    else {
                        console.log(err);
                        reply(Embed({ preset: 'console' }), { ephemeral: true });
                    }

                    return resolve();
                });
        });
    },
    description: "React to a message with an emoji",
    usage: "react <message id> <emoji>",
    aliases: [],
    arguments: [
        {
            name: "message-id",
            description: "The ID of the message to react to",
            required: true,
            type: "STRING"
        },
        {
            name: "emoji",
            description: "The emoji to react with",
            required: true,
            type: "STRING"
        }
    ]
};
