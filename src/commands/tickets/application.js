/* eslint-disable no-case-declarations */
const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
module.exports = {
    name: "application",
    run: async (bot, messageOrInteraction, args, { slashCommand, type, member, user, guild, channel, reply }) => {
        return new Promise(async resolve => {
            const action = (type == "message" ? (args[0] ? args[0].toLowerCase() : "none") : slashCommand?.arguments?.action) || "none";
            const application = await Utils.variables.db.get.getApplications(channel.id);

            if (!application) {
                reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.NotApplication }), { ephemeral: true });

                return resolve();
            }

            const applyingUser = guild.members.cache.get(application.creator);
            if (!applyingUser) {
                reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.UserLeft }), { ephemeral: true });

                return resolve();
            }

            async function acceptApplication(reason) {
                const positions = config.Applications.Positions;
                const position = positions[application.rank];
                if (!position) {
                    reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Apply.Errors.PositionNotFound.replace(/{pos}/g, application.rank) }), { ephemeral: true });

                    return resolve();
                }

                if (config.Applications.AddRoleWhenAccepted) {
                    const role = Utils.findRole(position.Role, channel.guild);
                    if (!role) reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Apply.Errors.RoleNotFound.replace(/{role}/g, position.Role) }));
                    else applyingUser.roles.add(role);
                }

                const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Accepted.Title, description: lang.TicketModule.Commands.Application.Embeds.Accepted.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Success });
                if (config.Applications.DMDecision) applyingUser.send(embed).catch(() => reply({ title: lang.TicketModule.Commands.Application.Errors.CantNotify }));

                await Utils.variables.db.update.applications.setStatus(channel.id, 'Accepted');

                channel.send({ content: `<@${applyingUser.id}>`, embeds: embed.embeds });

                let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Accepted");
                await channel.setTopic(newTopic);

                bot.emit("applicationAccepted", application, member, reason);

                if (type == "interaction") {
                    reply(Embed({
                        title: lang.TicketModule.Commands.Application.Embeds.Accepted.Title
                    }), { ephemeral: true });
                }

                return resolve(true);
            }

            async function denyApplication(reason) {
                const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Denied.Title, description: lang.TicketModule.Commands.Application.Embeds.Denied.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Error });
                if (config.Applications.DMDecision) applyingUser.send(embed).catch(() => reply({ title: lang.TicketModule.Commands.Application.Errors.CantNotify }));

                await Utils.variables.db.update.applications.setStatus(channel.id, 'Denied');

                channel.send({ content: `<@${applyingUser.id}>`, embeds: embed.embeds });

                let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Denied");
                await channel.setTopic(newTopic);

                bot.emit("applicationDenied", application, member, reason);

                if (type == "interaction") reply(Embed({
                    title: lang.TicketModule.Commands.Application.Embeds.Denied.Title
                }), { ephemeral: true });

                return resolve(true);
            }

            function closeApplication(reason) {
                channel.delete();
                require('../../modules/transcript.js')(channel.id, false);

                bot.emit("applicationClosed", application, member, reason);
                return resolve(true);
            }

            async function lockApplication() {
                if (!channel.permissionsFor(applyingUser).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)) {
                    reply(Embed({
                        preset: 'error',
                        description: lang.TicketModule.Commands.Application.Errors.AlreadyLocked
                    }), { ephemeral: true });

                    return resolve();
                }

                await channel.permissionOverwrites.edit(applyingUser, { "SEND_MESSAGES": false, "VIEW_CHANNEL": true });
                reply(Embed({
                    title: lang.TicketModule.Commands.Application.Embeds.Locked.Title,
                    description: lang.TicketModule.Commands.Application.Embeds.Locked.Description
                }));

                bot.emit("applicationLocked", application, member);

                return resolve(true);
            }

            async function unlockApplication() {
                if (channel.permissionsFor(applyingUser).has(Utils.Discord.Permissions.FLAGS.SEND_MESSAGES)) {
                    reply(Embed({
                        preset: 'error',
                        description: lang.TicketModule.Commands.Application.Errors.AlreadyUnlocked
                    }), { ephemeral: true });

                    return resolve();
                }

                await channel.permissionOverwrites.edit(applyingUser, { "SEND_MESSAGES": true, "VIEW_CHANNEL": true });
                reply(Embed({
                    title: lang.TicketModule.Commands.Application.Embeds.Unlocked.Title,
                    description: lang.TicketModule.Commands.Application.Embeds.Unlocked.Description
                }));
                bot.emit("applicationUnlocked", application, member);

                return resolve(true);
            }

            async function getReason() {
                return new Promise(async resolve => {
                    if (args.slice(1).length > 0) return resolve(args.slice(1).join(" "));
                    await reply(Embed({ title: lang.TicketModule.Commands.Application.Embeds.Reason.Title, description: lang.TicketModule.Commands.Application.Embeds.Reason.Description })).then(async msg => {
                        await channel.awaitMessages({ filter: m => m.author.id == user.id, max: 1, time: 5 * 60000, errors: ['time'] }).then(m => {
                            msg.delete().catch(() => { });
                            m = m.first();
                            m.delete().catch(() => { });

                            if (['no', 'none'].includes(m.content)) return resolve("N/A");
                            else return resolve(m.content);
                        }).catch(() => {
                            msg.delete().catch(() => { });
                            reply(Embed({
                                preset: 'error',
                                description: lang.TicketModule.Commands.Application.Errors.NoReason
                            }), { ephemeral: true });
                            return resolve(undefined);
                        });
                    });
                });
            }

            if (!application.rank || !application.status) {
                reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.NotCompletedApplication }), { ephemeral: true });

                return resolve();
            }

            switch (action) {
                case 'accept':
                    if (application.status == 'Accepted') {
                        reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }));

                        return resolve();
                    }
                    let reason1 = await getReason();
                    if (!reason1) return resolve();
                    else return acceptApplication(reason1);
                case 'deny':
                    if (application.status == 'Denied') {
                        reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }), { ephemeral: true });

                        return resolve();
                    }
                    let reason2 = await getReason();
                    if (!reason2) return resolve();
                    else return denyApplication(reason2);
                case 'close':
                    let reason3 = await getReason();
                    if (!reason3) return resolve();
                    else return closeApplication(reason3);
                case 'lock':
                    return lockApplication();
                case 'unlock':
                    return unlockApplication();
                default:
                    reply(Embed({
                        title: lang.TicketModule.Commands.Application.Embeds.Menu.Title,
                        fields: [
                            { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[0], value: `<@${applyingUser.id}>`, inline: true },
                            { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[1], value: application.rank, inline: true },
                            { name: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[2], value: application.status, inline: true },
                            { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[3], inline: true },
                            { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[4], inline: true },
                            { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[5], inline: true },
                            { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[6], inline: true },
                            { name: "\u200B", value: lang.TicketModule.Commands.Application.Embeds.Menu.Fields[7], inline: true },

                        ]
                    })).then(async msg => {
                        let emojis = ["✅", "❌", "🗑️", "🔒", "🔓"];
                        emojis.forEach(emoji => {
                            msg.react(emoji);
                        });

                        await msg.awaitReactions({ filter: (reaction, reactionUser) => emojis.includes(reaction.emoji.name) && reactionUser.id == user.id, max: 1, time: 5 * 60000, errors: ['time'] }).then(async reaction => {
                            reaction = reaction.first();
                            msg.delete();
                            switch (reaction.emoji.name) {
                                case "✅":
                                    if (application.status == 'Accepted') {
                                        reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }), { ephemeral: true });

                                        return resolve();
                                    }
                                    let reason1 = await getReason();
                                    if (!reason1) return resolve();
                                    else return acceptApplication(reason1);
                                case "❌":
                                    if (application.status == 'Denied') {
                                        reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyDenied }), { ephemeral: true });

                                        return resolve();
                                    }
                                    let reason2 = await getReason();
                                    if (!reason2) return resolve();
                                    else return denyApplication(reason2);
                                case "🗑️":
                                    let reason3 = await getReason();
                                    if (!reason3) return resolve();
                                    else return closeApplication(reason3);
                                case "🔒":
                                    return lockApplication();
                                case "🔓":
                                    return unlockApplication();
                                default:
                                    return;
                            }
                        }).catch(() => {
                            msg.edit(Embed({
                                title: lang.TicketModule.Commands.Application.Embeds.SessionOver.Title,
                                description: lang.TicketModule.Commands.Application.Embeds.SessionOver.Description
                                    .replace(/{applicant}/g, `<@${applyingUser.id}>`)
                                    .replace(/{position}/g, application.rank)
                                    .replace(/{status}/g, application.status)
                            }));
                        });
                    });
            }
        });
    },
    description: "Open the application menu and perform actions on an application",
    usage: "application [accept/deny/close/lock/unlock] [reason]",
    aliases: [
        "applicationmenu",
        "app"
    ],
    arguments: [
        {
            name: "action",
            description: "The action to perform on the application",
            required: false,
            choices: [
                {
                    name: "accept",
                    value: "accept"
                },
                {
                    name: "deny",
                    value: "deny"
                },
                {
                    name: "close",
                    value: "close"
                },
                {
                    name: "lock",
                    value: "lock"
                },
                {
                    name: "unlock",
                    value: "unlock"
                }
            ],
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for the action",
            required: false,
            type: "STRING"
        }
    ]
};
