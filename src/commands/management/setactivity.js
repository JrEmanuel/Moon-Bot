const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'setactivity',
    run: async (bot, messageOrInteraction, args, { member, channel, reply }) => {
        return new Promise(async resolve => {
            const types = ['playing', 'watching', 'streaming', 'listening'];

            if (args.length >= 2 && types.includes(args[0].toLowerCase())) {
                const type = args[0].toUpperCase();

                await Utils.variables.db.update.status.setStatus(type, args.slice(1).join(" "));
                reply(Embed({
                    title: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Title,
                    description: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Descriptions[1].replace(/{activity}/g, type.charAt(0) + type.substring(1).toLowerCase() + ' **' + args.slice(1).join(" ") + '**')
                }));
                return resolve(true);
            }

            reply(Embed({
                title: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Title.replace(/{pos}/g, "1/2"),
                description: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Descriptions[0]
            })).then(async msg => {
                let emojis = ['🎮', '📺', '📹', '👂', '❌'];
                emojis.forEach(emoji => {
                    msg.react(emoji).catch(() => { });
                });

                Utils.waitForReaction(emojis, member.id, msg).then(async reaction => {
                    msg.delete();
                    let type;
                    if (reaction.emoji.name == '🎮') {
                        type = 'PLAYING';
                    } else if (reaction.emoji.name == '📺') {
                        type = 'WATCHING';
                    } else if (reaction.emoji.name == '📹') {
                        type = 'STREAMING';
                    } else if (reaction.emoji.name == '👂') {
                        type = 'LISTENING';
                    } else if (reaction.emoji.name == '❌') {
                        reply(Embed({ title: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Title, description: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Descriptions[0], color: config.EmbedColors.Success }));
                        await Utils.variables.db.update.status.setStatus('', '');
                        return resolve(true);
                    }

                    reply(Embed({
                        title: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Title.replace(/{pos}/g, "2/2"),
                        description: lang.ManagementModule.Commands.Setactivity.Embeds.Setup.Descriptions[1]
                    })).then(ms => {
                        channel.awaitMessages({ filter: msg => msg.author.id == member.id, max: 1, time: 60000 }).then(async m => {
                            ms.delete();
                            m.first().delete();

                            await Utils.variables.db.update.status.setStatus(type, m.first().content);
                            reply(Embed({
                                title: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Title,
                                description: lang.ManagementModule.Commands.Setactivity.Embeds.Updated.Descriptions[1].replace(/{activity}/g, type.charAt(0) + type.substring(1).toLowerCase() + ' **' + m.first().content + '**')
                            }));
                            resolve(true);
                        });
                    });
                });
            });
        });
    },
    description: "Set the bot's activity",
    usage: 'setactivty [playing|watching|streaming|listening] [activity]',
    aliases: [],
    arguments: [
        {
            name: "type",
            description: "The type of status",
            required: false,
            type: "STRING",
            choices: ["playing", "watching", "streaming", "listening"].map(t => { return { name: t, value: t }; })
        },
        {
            name: "text",
            description: "The text to go along with the activity type",
            type: "STRING",
            required: false
        }
    ]
};
