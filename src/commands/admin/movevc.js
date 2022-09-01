const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { lang } = Utils.variables;

module.exports = {
    name: "movevc",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, guild, reply }) => {
        return new Promise(async resolve => {
            let invalidargs = Embed({
                title: lang.AdminModule.Commands.Movevc.Invalid.Title,
                color: Utils.variables.config.EmbedColors.Error,
                timestamp: new Date(),
                description: lang.AdminModule.Commands.Movevc.Invalid.Description.replace(/{usage}/g, prefixUsed + module.exports.usage)
            });
    
            if (!args.length) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            let currentVC;
    
            if (args.length == 2) {
                currentVC = Utils.findChannel(type == "message" ? args[0].replace(/_/g, " ") : args[1], guild, 'GUILD_VOICE', false);
    
                if (!currentVC) {
                    reply(invalidargs, { ephemeral: true });

                    return resolve();
                }
            } else {
                currentVC = member.voice.channel;
    
                if (!currentVC) {
                    reply(invalidargs, { ephemeral: true });

                    return resolve();
                }
            }

            if (!currentVC.members.size) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Movevc.NoMembers
                }), { ephemeral: true });

                return resolve();
            }

            let moveTo = Utils.findChannel(type == "message" ? args[args.length - 1].replace(/_/g, " ") : args[0], guild, 'GUILD_VOICE', false);
    
            if (!moveTo) {
                reply(invalidargs, { ephemeral: true });

                return resolve();
            }
    
            await currentVC.members.forEach(vcMember => {
                vcMember.voice.setChannel(moveTo, `Moved by ${member.tag} (${member.id})`);
            });
    
            reply(Embed({
                title: lang.AdminModule.Commands.Movevc.Moved.Title,
                description: lang.AdminModule.Commands.Movevc.Moved.Description.replace(/{channel-1}/g, currentVC.name).replace(/{channel-2}/g, moveTo.name),
                timestamp: new Date(),
                footer: {
                    text: bot.user.username,
                    icon: bot.user.displayAvatarURL({ dynamic: true })
                }
            }));

            return resolve(true);
        });
    },
    aliases: [],
    usage: "movevc [source] <destination>",
    description: "Move all members from a/your current voice channel to another one",
    arguments: [
        {
            name: "to",
            description: "The destination voice channel",
            required: true,
            type: "CHANNEL",
            channelTypes: [
                "GUILD_VOICE"
            ]
        },
        {
            name: "from",
            description: "The source voice channel",
            required: false,
            type: "CHANNEL",
            channelTypes: [
                "GUILD_VOICE"
            ]
        },
    ]
};
