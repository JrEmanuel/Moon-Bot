const Utils = require('../../modules/utils');
const { Embed, variables: { config } } = Utils;

module.exports = {
    name: "verification",
    run: async (bot, messageOrInteraction, args, { type, guild, channel, reply }) => {
        return new Promise(async resolve => {
            if (config.Verification.Enabled) {
                const ch = Utils.findChannel(config.Verification.Channel, guild);

                if (!ch) {
                    reply(Embed({
                        preset: "error",
                        description: Utils.variables.lang.ManagementModule.Commands.Verification.InvalidChannel.replace(/{channel}/g, config.Verification.Channel)
                    }));
                    return resolve();
                }

                function cleanup() {
                    if (ch.id == channel.id) {
                        if (type == "message") messageOrInteraction.delete();
                        if (type == "interaction") reply(Embed({ title: Utils.variables.lang.ManagementModule.Commands.Verification.MessageSent }), { ephemeral: true, deleteAfter: 3000 });
                        resolve(true);
                    } else {
                        reply(Embed({
                            title: Utils.variables.lang.ManagementModule.Commands.Verification.MessageSent
                        }));
                        resolve(true);
                    }
                }

                if (config.Verification.Type == "button") {
                    const button = new Utils.Discord.MessageButton()
                        .setEmoji(config.Verification.Button.Emoji)
                        .setStyle(config.Verification.Button.Style)
                        .setLabel(config.Verification.Button.Label)
                        .setCustomId("verification_button");

                    const msg = Utils.setupMessage({
                        configPath: config.Verification.Button.Message
                    });

                    const component = new Utils.Discord.MessageActionRow()
                        .addComponents(button);

                    msg.components = [component];
                    ch.send(msg);
                    cleanup();
                }

                else if (config.Verification.Type == "reaction") {
                    if (config.Verification.Reaction.Message.ID) {
                        const msg = await ch.messages.fetch(config.Verification.Reaction.Message.ID);

                        if (msg) {
                            msg.react(config.Verification.Reaction.Emoji);
                        } else {
                            reply(Embed({
                                preset: "error",
                                description: Utils.variables.lang.ManagementModule.Commands.Verification.InvalidMessage
                            }));
                            return resolve();
                        }
                    } else {
                        ch.send(Utils.setupMessage({
                            configPath: config.Verification.Reaction.Message
                        })).then(m => {
                            m.react(config.Verification.Reaction.Emoji);
                        });
                    }

                    cleanup();
                }

                else if (config.Verification.Type == "code") {
                    ch.send(Utils.setupMessage({
                        configPath: config.Verification.Code.Message
                    }));

                    cleanup();
                }

                else {
                    reply(Embed({
                        preset: "error",
                        description: Utils.variables.lang.ManagementModule.Commands.Verification.InvalidType
                    }));
                    return resolve();
                }
            } else {
                reply(Embed({ preset: "error", description: Utils.variables.lang.ManagementModule.Commands.Verification.Disabled }));
                return resolve();
            }
        });
    },
    description: "Manage the verification system",
    usage: "verification",
    aliases: [],
    arguments: []
};
