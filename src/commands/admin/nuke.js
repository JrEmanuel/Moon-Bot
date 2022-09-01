const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = {
    name: "nuke",
    run: async (bot, messageOrInteraction, args, { type, user, guild, channel, reply }) => {
        return new Promise(async resolve => {
            const mentionedChannel = (type == "message" ? Utils.ResolveChannel(messageOrInteraction, 0, true, true) : guild.channels.cache.get(args[0])) || channel;

            reply(Embed({
                title: lang.AdminModule.Commands.Nuke.Confirmation.Title,
                description: lang.AdminModule.Commands.Nuke.Confirmation.Description.replace(/{channel}/g, mentionedChannel)
            }))
                .then(async m => {
                    m.react("✅");
                    m.react("❌");
    
                    Utils.waitForReaction(["✅", "❌"], user.id, m)
                        .then(reaction => {
                            m.reactions.removeAll();

                            if (reaction.emoji.name == "✅") {
                                try {
                                    mentionedChannel.delete()
                                        .then(() => {
                                            guild.channels.create(mentionedChannel.name, {
                                                type: mentionedChannel.type,
                                                topic: mentionedChannel.topic,
                                                nsfw: mentionedChannel.nsfw,
                                                bitrate: mentionedChannel.bitrate,
                                                userLimit: mentionedChannel.userLimit,
                                                parent: mentionedChannel.parent,
                                                permissionOverwrites: mentionedChannel.permissionOverwrites.cache,
                                                position: mentionedChannel.rawPosition,
                                                rateLimitPerUser: mentionedChannel.rateLimitPerUser,
                                                reason: `Channel nuked by ${user.tag} (${user.id})`
                                            })
                                                .then(newChannel => {
                                                    if (mentionedChannel.id !== channel.id) m.edit(Embed({
                                                        title: lang.AdminModule.Commands.Nuke.Nuked.Title,
                                                        description: lang.AdminModule.Commands.Nuke.Nuked.Description.replace(/{channel}/g, mentionedChannel.name).replace(/{new-channel}/g, newChannel)
                                                    }));

                                                    return resolve(true);
                                                });
                                        });
                                } catch (error) {
                                    require("../../modules/error")(error.message, error.stack,);
                                    reply(Embed({ preset: "console" }), { ephemeral: true }).catch(() => { });

                                    return resolve();
                                }
                            } else {
                                m.edit(Embed({
                                    title: ":x: Cancelled"
                                }));

                                return resolve();
                            }
                        });
                });
        });
    },
    usage: "nuke [#channel]",
    description: "Delete a channel and recreate it",
    aliases: [],
    arguments: [
        {
            name: "channel",
            description: "The channel to nuke",
            required: false,
            type: "CHANNEL"
        }
    ]
};
