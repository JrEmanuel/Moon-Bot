const Utils = require("../../modules/utils");
const { Embed, variables: { lang } } = Utils;
const CommandHandler = require("../../modules/handlers/CommandHandler");
const { MessageButton } = require("discord.js");
const { capitalize } = require("lodash");

module.exports = {
    name: "commandchannels",
    run: async (bot, messageOrInteraction, args, { member, guild, channel, reply }) => {
        return new Promise(async resolve => {
            let type = args[0] ? args[0].toLowerCase() : undefined;

            if (!type) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: "cc <global | channel name/id>"
                }));

                return resolve();
            } else {
                let data;

                if (type == "global") {
                    data = await Utils.variables.db.get.getCommandChannelData("_global");
                } else {
                    let command = CommandHandler.commands.find(c => c.command.toLowerCase() == type);

                    if (!command) {
                        reply(Embed({
                            preset: "error",
                            description: lang.ManagementModule.Commands.CommandChannels.Errors.InvalidCommand
                        }));

                        return resolve();
                    }

                    data = await Utils.variables.db.get.getCommandChannelData(command.command);
                }

                let getEmbed = () => {
                    let global = data.command == "_global";
                    let usingGlobalSettings = data.command != type;

                    return Embed({
                        title: lang.ManagementModule.Commands.CommandChannels.Manager.Title,
                        description: type == "global" ? lang.ManagementModule.Commands.CommandChannels.Manager.Description[1] : usingGlobalSettings ? lang.ManagementModule.Commands.CommandChannels.Manager.Description[0] : undefined,
                        fields: [
                            {
                                name: lang.ManagementModule.Commands.CommandChannels.Manager.Fields[0],
                                value: "`" + (global ? (usingGlobalSettings ? type : lang.ManagementModule.Commands.CommandChannels.Global) : data.command) + "`",
                                inline: true
                            }, {
                                name: lang.ManagementModule.Commands.CommandChannels.Manager.Fields[1],
                                value: capitalize(data.type),
                                inline: true
                            }, {
                                name: data.type == "whitelist" ? lang.ManagementModule.Commands.CommandChannels.Manager.Fields[2] : lang.ManagementModule.Commands.CommandChannels.Manager.Fields[3],
                                value: data.channels.filter(c => Utils.findChannel(c, guild, "GUILD_TEXT", false)).map(c => `<#${c}>`).join("\n") || lang.Global.None,
                                inline: true
                            }
                        ],
                        timestamp: new Date(),
                        components: [
                            new MessageButton().setCustomId("cc_action_change_type").setStyle("SECONDARY").setEmoji("⌨️").setLabel(lang.ManagementModule.Commands.CommandChannels.Manager.Buttons[0]),
                            new MessageButton().setCustomId("cc_action_add").setStyle("SECONDARY").setEmoji("✅").setLabel(lang.ManagementModule.Commands.CommandChannels.Manager.Buttons[1]),
                            (data.channels.length ? new MessageButton().setCustomId("cc_action_remove").setStyle("SECONDARY").setEmoji("❌").setLabel(lang.ManagementModule.Commands.CommandChannels.Manager.Buttons[2]) : undefined),
                            (usingGlobalSettings ? undefined : new MessageButton().setCustomId("cc_action_use_global").setStyle("SECONDARY").setEmoji("🌎").setLabel(lang.ManagementModule.Commands.CommandChannels.Manager.Buttons[3])),
                            new MessageButton().setCustomId("cc_action_finish").setStyle("SECONDARY").setEmoji("🚪").setLabel(lang.ManagementModule.Commands.CommandChannels.Manager.Buttons[4])
                        ].filter(b => b)
                    });
                };

                reply(getEmbed()).then(msg => {
                    let collector = msg.createMessageComponentCollector({ componentType: "BUTTON", filter: interaction => interaction.customId.startsWith("cc_action_") && interaction.user.id == member.id, time: 5 * 60 * 1000 });
                    let editing = false;

                    collector.on('collect', async interaction => {
                        if (editing) {
                            interaction.deferUpdate();
                            return channel.send(Embed({
                                preset: "error",
                                description: lang.ManagementModule.Commands.CommandChannels.Errors.AlreadyEditing
                            })).then(m => Utils.delete(m, 3000));
                        }

                        editing = true;

                        if (interaction.customId == "cc_action_change_type") {
                            interaction.deferUpdate();
                            let newType = data.type == "whitelist" ? "blacklist" : "whitelist";

                            if (data.channels.length) {
                                let question = await channel.send(Embed({
                                    title: lang.ManagementModule.Commands.CommandChannels.RestrictionType.Question,
                                    components: [
                                        new MessageButton().setEmoji("✅").setStyle("SUCCESS").setLabel(lang.Global.Yes).setCustomId("change_type_reset_channels"),
                                        new MessageButton().setEmoji("❌").setStyle("DANGER").setLabel(lang.Global.No).setCustomId("change_type_dont_reset_channels"),
                                    ]
                                }));

                                await question.awaitMessageComponent({ componentType: "BUTTON", filter: interaction => interaction.customId.startsWith("change_type_") && interaction.user.id == member.id })
                                    .then(async interaction => {
                                        question.delete();
                                        if (interaction.customId == "change_type_reset_channels") {
                                            if (type !== "global" && data.command != type) {
                                                data.command = type;
                                                await Utils.variables.db.update.commands.channels.add(data);
                                            }
                                            await Utils.variables.db.update.commands.channels.updateChannels(data.command, []);
                                        }
                                    });
                            }
                            if (type !== "global" && data.command != type) {
                                data.command = type;
                                await Utils.variables.db.update.commands.channels.add(data);
                            }
                            await Utils.variables.db.update.commands.channels.updateType(data.command, newType);

                            data = await Utils.variables.db.get.getCommandChannelData(data.command);
                            msg.edit(getEmbed());
                            msg.reply(Embed({
                                title: lang.ManagementModule.Commands.CommandChannels.RestrictionType.Updated
                            })).then(m => Utils.delete(m, 3000));

                        } else if (interaction.customId == "cc_action_add") {
                            await interaction.reply(Object.assign(Embed({
                                title: lang.ManagementModule.Commands.CommandChannels.AddChannel.Question
                            }), { fetchReply: true }))
                                .then(async m => {
                                    let valid = false;

                                    while (!valid) {
                                        await Utils.waitForResponse(member.id, channel)
                                            .then(async response => {
                                                response.delete();

                                                if (response.content.toLowerCase() !== "cancel") {
                                                    let c = response.mentions.channels.first() || Utils.findChannel(response.content, guild, "GUILD_TEXT", false);

                                                    if (!c || c.type != "GUILD_TEXT") {
                                                        return channel.send(Embed({
                                                            preset: "error",
                                                            description: lang.ManagementModule.Commands.CommandChannels.Errors.InvalidChannel
                                                        })).then(m => Utils.delete(m, 2500));
                                                    }

                                                    if (data.channels.includes(c.id)) {
                                                        return channel.send(Embed({
                                                            preset: "error",
                                                            description: lang.ManagementModule.Commands.CommandChannels.Errors.AlreadyInList
                                                        })).then(m => Utils.delete(m, 2500));
                                                    }

                                                    valid = true;
                                                    if (type !== "global" && data.command != type) {
                                                        data.command = type;
                                                        await Utils.variables.db.update.commands.channels.add(data);
                                                    }
                                                    data.channels.push(c.id);
                                                    await Utils.variables.db.update.commands.channels.updateChannels(data.command, data.channels);
                                                    m.delete();
                                                    msg.reply(Embed({ title: lang.ManagementModule.Commands.CommandChannels.AddChannel.Added })).then(m => Utils.delete(m, 3000));
                                                    msg.edit(getEmbed());
                                                } else {
                                                    m.delete();
                                                    valid = true;
                                                }
                                            });
                                    }
                                });
                        } else if (interaction.customId == "cc_action_remove") {
                            await interaction.reply(Object.assign(Embed({
                                title: lang.ManagementModule.Commands.CommandChannels.RemoveChannel.Question
                            }), { fetchReply: true }))
                                .then(async m => {
                                    let valid = false;

                                    while (!valid) {
                                        await Utils.waitForResponse(member.id, channel)
                                            .then(async response => {
                                                response.delete();

                                                if (response.content.toLowerCase() !== "cancel") {
                                                    let c = response.mentions.channels.first() || Utils.findChannel(response.content, guild, "GUILD_TEXT", false);

                                                    if (!c || c.type != "GUILD_TEXT") {
                                                        return channel.send(Embed({
                                                            preset: "error",
                                                            description: lang.ManagementModule.Commands.CommandChannels.Errors.InvalidChannel
                                                        })).then(m => Utils.delete(m, 2500));
                                                    }

                                                    if (!data.channels.includes(c.id)) {
                                                        return channel.send(Embed({
                                                            preset: "error",
                                                            description: lang.ManagementModule.Commands.CommandChannels.Errors.NotInList
                                                        })).then(m => Utils.delete(m, 2500));
                                                    }

                                                    valid = true;
                                                    if (type !== "global" && data.command != type) {
                                                        data.command = type;
                                                        await Utils.variables.db.update.commands.channels.add(data);
                                                    }
                                                    data.channels.splice(data.channels.indexOf(c.id), 1);
                                                    await Utils.variables.db.update.commands.channels.updateChannels(data.command, data.channels);
                                                    m.delete();
                                                    msg.reply(Embed({ title: lang.ManagementModule.Commands.CommandChannels.RemoveChannel.Removed })).then(m => Utils.delete(m, 3000));
                                                    msg.edit(getEmbed());
                                                } else {
                                                    m.delete();
                                                    valid = true;
                                                }
                                            });
                                    }
                                });
                        } else if (interaction.customId == "cc_action_use_global") {
                            interaction.deferUpdate();
                            await Utils.variables.db.update.commands.channels.remove(data.command);
                            data = await Utils.variables.db.get.getCommandChannelData("_global");
                            msg.reply(Embed({ title: lang.ManagementModule.Commands.CommandChannels.UseGlobal.Switched })).then(m => Utils.delete(m, 3000));
                            msg.edit(getEmbed());
                        } else if (interaction.customId == "cc_action_finish") {
                            interaction.deferUpdate();
                            collector.emit("end");
                        }

                        editing = false;
                    });


                    collector.on('end', async () => {
                        let global = data.command == "_global";
                        let usingGlobalSettings = data.command != type;

                        msg.edit(Embed({
                            title: lang.ManagementModule.Commands.CommandChannels.Manager.Title,
                            description: type == "global" ? lang.ManagementModule.Commands.CommandChannels.Manager.Description[1] : usingGlobalSettings ? lang.ManagementModule.Commands.CommandChannels.Manager.Description[0] : undefined,
                            fields: [
                                {
                                    name: lang.ManagementModule.Commands.CommandChannels.Manager.Fields[0],
                                    value: "`" + (global ? (usingGlobalSettings ? type : lang.ManagementModule.Commands.CommandChannels.Global) : data.command) + "`",
                                    inline: true
                                }, {
                                    name: lang.ManagementModule.Commands.CommandChannels.Manager.Fields[1],
                                    value: capitalize(data.type),
                                    inline: true
                                }, {
                                    name: data.type == "whitelist" ? lang.ManagementModule.Commands.CommandChannels.Manager.Fields[2] : lang.ManagementModule.Commands.CommandChannels.Manager.Fields[3],
                                    value: data.channels.filter(c => Utils.findChannel(c, guild, "GUILD_TEXT", false)).map(c => `<#${c}>`).join("\n") || lang.Global.None,
                                    inline: true
                                }
                            ],
                            timestamp: new Date()
                        }));

                        return resolve(true);
                    });
                });
            }
        });
    },
    aliases: ["cmdchannel", "cmdchannels", "commandchannel", "cc"],
    description: "Manage the channels commands can be ran in",
    usage: "cc <global | command name>",
    arguments: [
        {
            name: "command",
            description: "The command to manage channels for or \"global\"",
            required: true,
            type: "STRING"
        },
    ]
};
