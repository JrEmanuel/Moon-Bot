const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
module.exports = {
    name: "tempchannel",
    run: async (bot, messageOrInteraction, args, { user, member, guild, channel, reply }) => {
        return new Promise(async resolve => {
            let tempChannel = await Utils.variables.db.get.getTempchannelByUser(user.id);

            if (!tempChannel || (tempChannel && !guild.channels.cache.get(tempChannel.channel_id))) {
                reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoTC }));
                return resolve();
            }
            let managerLang = lang.GeneralModule.Commands.Tempchannels.Manager;
            let getFields = async () => {
                let tempChannel = await Utils.variables.db.get.getTempchannelByUser(user.id);

                let PrivateStatus = tempChannel.public
                    ? [
                        {
                            name: managerLang.Fields[1],
                            value: "✅",
                            inline: true,
                        },
                    ]
                    : [
                        {
                            name: managerLang.Fields[1],
                            value: "❌",
                            inline: true,
                        },
                        {
                            name: managerLang
                                .Fields[2],
                            value: tempChannel.allowed_users
                                .map((id) => "<@" + id + ">")
                                .join(", "),
                            inline: true,
                        },
                    ];

                return [
                    {
                        name: managerLang.Fields[0],
                        value: tempChannel.channel_name,
                        inline: true,
                    },
                    ...PrivateStatus,
                    {
                        name: managerLang.Fields[3],
                        value: tempChannel.max_members
                            ? tempChannel.max_members
                            : managerLang.NoMaxMembers,
                        inline: true,
                    }
                ];
            };

            let privateActions = tempChannel.public ? [{ text: managerLang.Fields[5], id: "private" }] : [{ text: managerLang.Fields[6], id: "public" }, { text: managerLang.Fields[7], id: "change_users" }];
            let actions = [{ text: managerLang.Fields[4], id: "transfer" }, { text: managerLang.Fields[8], id: "change_max" }, { text: managerLang.Fields[9], id: "change_name" }, ...privateActions];
            let buttons = [];

            actions.forEach((action) => {
                buttons.push(
                    new Utils.Discord.MessageButton()
                        .setLabel(action.text)
                        .setCustomId(`tempchannel_${member.id}_action_${action.id}`)
                        .setStyle("SECONDARY")
                );
            });

            let components = Utils.createAutomaticComponents(buttons);
            const msg = Embed({
                title: managerLang.Title,
                author: {
                    icon: user.displayAvatarURL({ dynamic: true }),
                    text: user.username
                },
                fields: await getFields(),
                components
            });

            reply(msg).then(msg => {
                let updateEmbed = async () => {
                    let tempChannel = await Utils.variables.db.get.getTempchannelByUser(user.id);
                    if (!tempChannel || (tempChannel && !guild.channels.cache.get(tempChannel.channel_id))) {
                        reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.TCDeleted }));

                        let e = msg.embeds[0];
                        e.title = managerLang.SessionEnded;
                        e.color = config.EmbedColors.Error;
                        msg.edit(e);
                    } else {
                        msg.edit(Embed({
                            title: managerLang.Title,
                            author: {
                                icon: user.displayAvatarURL({ dynamic: true }),
                                text: user.username
                            },
                            fields: await getFields(),
                            components
                        }));
                    }
                };

                let deleteMessage = m => {
                    Utils.delete(m, 3000);
                };

                let checkChannel = async () => {
                    let tempChannel = await Utils.variables.db.get.getTempchannelByUser(user.id);

                    if (!tempChannel) return false;

                    let channel = guild.channels.cache.get(tempChannel.channel_id);
                    if (!channel) reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoLongerHave })).then(Utils.delete);
                    return !!channel;
                };

                let checkError = (err) => {
                    if (err.message == "Unknown Channel") {
                        return;
                    }

                    if (err.message == "Missing Permission") {
                        return reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.NoPermission }));
                    }

                    else {
                        console.log(err);
                        return reply(Embed({ preset: "console" }));
                    }
                };

                let collector = msg.createMessageComponentCollector({ componentType: "BUTTON", filter: (interaction) => interaction.customId.startsWith(`tempchannel_${user.id}_action_`) && interaction.member.id == user.id, time: 5 * 60 * 1000 });
                let editing = false;

                collector.on('collect', async interaction => {
                    let voiceChannel = guild.channels.cache.get(tempChannel.channel_id);
                    interaction.deferUpdate();

                    if (editing) return reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.Errors.FinishCurrentAction })).then(m => Utils.delete(m, 3000));

                    if (!await checkChannel()) return collector.emit('end');

                    editing = true;
                    let retry = true;
                    if (interaction.customId.endsWith("transfer")) { // Transfer Ownership
                        let m = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Questions }));
                        let user;
                        let cancelled = false;
                        while (retry) {
                            await Utils.waitForResponse(member.user.id, channel).then(res => {
                                res.delete();
                                if (res.content == 'cancel') {
                                    cancelled = true;
                                    retry = false;
                                    m.delete();
                                    return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Canceled })).then(deleteMessage);
                                }
                                if (res.mentions.users.size) {
                                    user = res.mentions.users.first();
                                    if (user.bot) {
                                        return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.TransferToBot })).then(deleteMessage);
                                    }
                                    if (!voiceChannel.members.has(user.id)) {
                                        return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.NotInTC })).then(deleteMessage);
                                    }
                                    m.delete();
                                    retry = false;
                                } else {
                                    return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Errors.NoMention })).then(deleteMessage);
                                }
                            });
                        }
                        if (cancelled) return editing = false;
                        if (!await checkChannel()) return collector.emit('end');

                        m.delete();

                        await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "owner", user.id);

                        channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Transferred })).then(deleteMessage);
                        channel.send(lang.GeneralModule.Commands.Tempchannels.TransferOwnership.Notification.replace(/{new-owner}/g, `<@${user.id}>`).replace(/{old-owner}/g, member));
                        collector.emit('end');
                    } else if (interaction.customId.endsWith("change_max")) { // Change Max Members
                        let m = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Question }));
                        while (retry) {
                            await Utils.waitForResponse(user.id, channel)
                                .then(async res => {
                                    res.delete();

                                    if (res.content == "none") {
                                        retry = false;
                                        tempChannel.max_members = null;
                                        await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "max_members", null);
                                        return voiceChannel.setUserLimit(0);
                                    }

                                    if (!parseInt(res.content)) return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Errors.InvalidResponse })).then(deleteMessage);

                                    let number = parseInt(res.content);

                                    if (number < 2 || number > 99) return channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Errors.InvalidRange })).then(deleteMessage);

                                    retry = false;
                                    tempChannel.max_members = number;
                                    await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "max_members", number);
                                    voiceChannel.setUserLimit(number).catch(checkError);
                                });
                        }
                        m.delete();
                        if (!await checkChannel()) return collector.emit('end');
                        channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeLimit.Updated })).then(deleteMessage);
                        updateEmbed();
                    } else if (interaction.customId.endsWith("change_name")) { // Change name
                        let m = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeName.Question }));

                        Utils.variables.noAnnounceFilter.add(user.id);
                        Utils.variables.noAnnounceAntiAd.add(user.id);

                        while (retry) {
                            await Utils.waitForResponse(user.id, channel)
                                .then(async res => {
                                    res.delete();

                                    if (await Utils.variables.db.get.getCommands('filter') && (await Utils.variables.db.get.getCommands('filter')).enabled) {
                                        if (!Utils.hasPermission(member, config.Other.FilterBypassRole.toLowerCase())) {
                                            const filter = await Utils.variables.db.get.getFilter();
                                            let words = res.content.split(" ");

                                            if (words.some(word => filter.map(w => w.toLowerCase()).includes(word.toLowerCase()))) return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeName.Errors.Filter })).then(deleteMessage);
                                        }
                                    }
                                    if (Utils.hasAdvertisement(res.content) && config.AntiAdvertisement.Chat.Enabled && !Utils.hasPermission(member, config.AntiAdvertisement.BypassRole)) {
                                        return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeName.Errors.AntiAd })).then(deleteMessage);
                                    }
                                    retry = false;
                                    tempChannel.channel_name = res.content;
                                    await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "channel_name", res.content);
                                    voiceChannel.setName(res.content).catch(checkError);
                                });
                        }
                        Utils.variables.noAnnounceFilter.delete(user.id);
                        Utils.variables.noAnnounceAntiAd.delete(user.id);

                        m.delete();
                        if (!await checkChannel()) return collector.emit('end');
                        channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeName.Updated })).then(deleteMessage);
                        updateEmbed();
                    } else if (interaction.customId.endsWith("private")) { // Make Private
                        let m = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Question }));
                        let perms;
                        while (retry) {
                            await Utils.waitForResponse(user.id, channel)
                                .then(async res => {
                                    res.delete();
                                    let allowedUsers = [bot.user.id];

                                    if (res.content == 'none') {
                                        retry = false;
                                    }

                                    else if (res.mentions.users.size) {
                                        retry = false;
                                        allowedUsers.push(...res.mentions.users.map(u => u.id));
                                    }

                                    else {
                                        return channel.send(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Errors.InvalidResponse })).then(deleteMessage);
                                    }

                                    retry = false;
                                    tempChannel.allowed_users = allowedUsers;
                                    if (!Array.isArray(config.TempChannels.ChannelLockBypassRoles)) config.TempChannels.ChannelLockBypassRoles = [config.TempChannels.ChannelLockBypassRoles];
                                    let bypassRoles = config.TempChannels.ChannelLockBypassRoles.filter(r => Utils.findRole(r, guild));

                                    perms = [
                                        {
                                            id: guild.id,
                                            allow: ['VIEW_CHANNEL'],
                                            deny: ['CONNECT'],
                                        },
                                        {
                                            id: user.id,
                                            allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK']
                                        },
                                        ...bypassRoles.map(r => {
                                            return {
                                                id: Utils.findRole(r, guild),
                                                allow: ["VIEW_CHANNEL", "CONNECT", "SPEAK"]
                                            };
                                        }),
                                        ...allowedUsers.map(user => {
                                            return {
                                                id: user,
                                                allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK']
                                            };
                                        })
                                    ];
                                });
                        }

                        if (!await checkChannel()) return collector.emit('end');

                        voiceChannel.permissionOverwrites.set(perms).catch(checkError);
                        voiceChannel.members.filter(member => !tempChannel.allowed_users.includes(member.id) && member.id !== user.id).forEach(member => {
                            member.voice.disconnect();
                        });

                        m.delete();
                        tempChannel.public = false;
                        await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "public", 0);
                        privateActions = [{ text: managerLang.Fields[6], id: "public" }, { text: managerLang.Fields[7], id: "change_users" }];
                        actions = [{ text: managerLang.Fields[4], id: "transfer" }, { text: managerLang.Fields[8], id: "change_max" }, { text: managerLang.Fields[9], id: "change_name" }, ...privateActions];
                        buttons = [];

                        actions.forEach((action) => {
                            buttons.push(
                                new Utils.Discord.MessageButton()
                                    .setLabel(action.text)
                                    .setCustomId(`tempchannel_${user.id}_action_${action.id}`)
                                    .setStyle("SECONDARY")
                            );
                        });

                        components = Utils.createAutomaticComponents(buttons);
                        channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePrivate.Privated })).then(deleteMessage);
                        updateEmbed();
                    } else if (interaction.customId.endsWith("public")) { // Make Public
                        tempChannel.public = true;
                        tempChannel.allowed_users = [];
                        await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "public", 1);
                        await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "allowed_users", JSON.stringify([]));
                        if (!await checkChannel()) return collector.emit('end');
                        voiceChannel.permissionOverwrites.set([{
                            id: guild.id,
                            allow: ['CONNECT']
                        }]).catch(checkError);
                        channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.MakePublic.Public })).then(deleteMessage);


                        privateActions = [{ text: managerLang.Fields[5], id: "private" }];
                        actions = [{ text: managerLang.Fields[4], id: "transfer" }, { text: managerLang.Fields[8], id: "change_max" }, { text: managerLang.Fields[9], id: "change_name" }, ...privateActions];
                        buttons = [];

                        actions.forEach((action) => {
                            buttons.push(
                                new Utils.Discord.MessageButton()
                                    .setLabel(action.text)
                                    .setCustomId(`tempchannel_${user.id}_action_${action.id}`)
                                    .setStyle("SECONDARY")
                            );
                        });

                        components = Utils.createAutomaticComponents(buttons);
                        updateEmbed();
                    } else if (interaction.customId.endsWith("change_users")) { // Change Allowed Users
                        let m = await channel.send(Embed({
                            title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[0],
                            components: [
                                new Utils.Discord.MessageButton()
                                    .setLabel("Add")
                                    .setEmoji("➕")
                                    .setCustomId(`tempchannel_${user.id}_action_change_users_add`)
                                    .setStyle("SECONDARY"),
                                new Utils.Discord.MessageButton()
                                    .setLabel("Remove")
                                    .setEmoji("➖")
                                    .setCustomId(`tempchannel_${user.id}_action_change_users_remove`)
                                    .setStyle("SECONDARY")
                            ]
                        }));

                        let announce = true;
                        await m.awaitMessageComponent({ componentType: "BUTTON", filter: (interaction) => interaction.customId.startsWith(`tempchannel_${user.id}_action_change_users_`) && interaction.member.id == user.id })
                            .then(async interaction => {
                                if (interaction.customId.endsWith("add")) {
                                    m.delete();
                                    let mesg = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[1] }));

                                    while (retry) {
                                        await Utils.waitForResponse(user.id, channel).then(async res => {
                                            res.delete();
                                            if (res.mentions.users.size) {
                                                retry = false;
                                                mesg.delete();
                                                res.mentions.users = res.mentions.users.filter(u => !tempChannel.allowed_users.includes(u.id) || u.id == user.id);
                                                if (!res.mentions.users.size) {
                                                    retry = false;
                                                    announce = false;
                                                    return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.AlreadyAdded })).then(deleteMessage);
                                                }
                                                tempChannel.allowed_users.push(...res.mentions.users.map(u => u.id).filter(u => !tempChannel.allowed_users.includes(u)));
                                                await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "allowed_users", JSON.stringify(tempChannel.allowed_users));
                                                res.mentions.users.forEach(user => {
                                                    voiceChannel.permissionOverwrites.create(user.id, {
                                                        CONNECT: true,
                                                        SPEAK: true,
                                                        VIEW_CHANNEL: true
                                                    }).catch(checkError);
                                                });
                                            } else {
                                                return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.InvalidResponse })).then(deleteMessage);
                                            }
                                        });
                                    }
                                } else {
                                    m.delete();
                                    let mesg = await channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Questions[2] }));

                                    while (retry) {
                                        await Utils.waitForResponse(user.id, channel).then(async res => {
                                            res.delete();
                                            if (res.mentions.users.size) {
                                                retry = false;
                                                mesg.delete();
                                                res.mentions.users = res.mentions.users.filter(user => ![bot.user.id, member.id].includes(user.id) && tempChannel.allowed_users.includes(user.id));
                                                if (!res.mentions.users.size) {
                                                    retry = false;
                                                    announce = false;
                                                    return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.CantRemoveUsers })).then(deleteMessage);
                                                }
                                                res.mentions.users.forEach(user => {
                                                    tempChannel.allowed_users.splice(tempChannel.allowed_users.indexOf(user.id), 1);

                                                    voiceChannel.permissionOverwrites.create(user.id, {
                                                        CONNECT: false,
                                                        VIEW_CHANNEL: true
                                                    }).catch(checkError);

                                                    if (voiceChannel.members.has(user.id)) voiceChannel.members.get(user.id).voice.disconnect();
                                                });
                                                await Utils.variables.db.update.temp_channels.update(tempChannel.channel_id, "allowed_users", JSON.stringify(tempChannel.allowed_users));
                                            } else {
                                                return channel.send(Embed({ preset: "error", description: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Errors.InvalidResponse })).then(deleteMessage);
                                            }
                                        });
                                    }
                                }
                            });
                        if (!await checkChannel()) return collector.emit('end');
                        if (announce) channel.send(Embed({ title: lang.GeneralModule.Commands.Tempchannels.ChangeUsers.Updated })).then(deleteMessage);
                        updateEmbed();
                    }
                    editing = false;
                });

                collector.on('end', async () => {
                    try {
                        let e = msg.embeds[0];
                        e.title = managerLang.SessionEnded;
                        e.color = config.EmbedColors.Error;
                        msg.edit({ embeds: [e], components: [] });
                    } catch (e) {
                        Utils.error(e);
                    }
                });
            });
            resolve(true);
        });
    },
    description: "Manage your temp channel",
    usage: "tempchannel",
    aliases: ['tc'],
    arguments: []
};
