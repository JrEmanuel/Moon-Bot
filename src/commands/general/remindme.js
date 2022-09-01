const ReminderHandler = require("../../modules/handlers/ReminderHandler.js");
const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = {
    name: 'remindme',
    run: async (bot, messageOrInteraction, args, { type, user, member, guild, reply }) => {
        return new Promise(async resolve => {
            let reminders = await Utils.variables.db.get.getReminders();
            let action;

            if (type == "message") {
                action = args.length ? args[0].toLowerCase() : undefined;
            } else {
                action = messageOrInteraction.options.getSubcommand(false);
            }

            let userReminders = reminders.filter(r => r.member == user.id);

            let permission = Utils.hasPermission(member, config.Other.RemindmeAdmin);

            if (action == "list") {
                if (!userReminders.length) {
                    reply(Embed({
                        title: lang.GeneralModule.Commands.Remindme.List.NoReminders.Title,
                        description: lang.GeneralModule.Commands.Remindme.List.NoReminders.Description,
                        footer: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date()
                    }));

                    return resolve();
                }

                reply(Embed({
                    title: lang.GeneralModule.Commands.Remindme.List.Reminders.Title,
                    fields: reminders.map((reminder, i) => {
                        return {
                            name: lang.GeneralModule.Commands.Remindme.List.Reminders.Format[0].replace(/{id}/g, i + 1),
                            value: lang.GeneralModule.Commands.Remindme.List.Reminders.Format[1].replace(/{description}/g, reminder.reminder).replace(/{timer}/g, Utils.getTimeDifference(new Date(), reminder.time, false))
                        };
                    }),
                    timestamp: new Date(),
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    }
                }));

                resolve(true);
            }

            else if (action == "cancel") {
                let id = type == "message" ? args[1] : args[0];
                if (id && parseInt(id)) {
                    if (!userReminders.length) {
                        reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Remindme.Cancel.NoReminders }));
                        return resolve();
                    }

                    let reminder = userReminders[parseInt(id) - 1];
                    if (!reminder) {
                        reply(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Remindme.Cancel.InvalidID }));
                        return resolve();
                    }

                    await ReminderHandler.remove(reminder);

                    reply(Embed({
                        title: lang.GeneralModule.Commands.Remindme.Cancel.Canceled.Title,
                        description: lang.GeneralModule.Commands.Remindme.Cancel.Canceled.Description.replace(/{reminder}/g, reminder.reminder),
                        footer: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date()
                    }));
                    resolve(true);
                } else {
                    reply(Embed({ preset: 'invalidargs', usage: 'remindme cancel <reminder id>' }));
                    resolve();
                }
            }

            else if (args.length > 0 && action !== "help") {
                let mem = permission && /<@(!|)[0-9]{18}>/g.test(args[0]) && type == "message" ? messageOrInteraction.mentions.members.first() : undefined;

                if (!Utils.getMSFromText(args[mem ? 1 : 0])) {
                    reply(Embed({ preset: 'error', description: lang.GeneralModule.Commands.Remindme.Set.InvalidTime }));
                    return resolve();
                }

                if (type == "message" ? args.length < 3 : args.length < 2) {
                    reply(Embed({ preset: "invalidargs", usage: permission ? 'remindme [@user] <time> <reminder>' : 'remindme <time> <reminder>' }));
                    return resolve();
                }

                const reminder = args.slice(mem ? 2 : 1).join(" ");
                const total = Utils.getMSFromText(args[mem ? 1 : 0]);
                const start = messageOrInteraction.createdAt.getTime();
                const end = start + total;

                await ReminderHandler.add({
                    member: mem || member,
                    time: end,
                    reminder
                });

                reply(Embed({
                    title: member ? lang.GeneralModule.Commands.Remindme.Set.ReminderSet.SomeoneElse.Title : lang.GeneralModule.Commands.Remindme.Set.ReminderSet.You.Title,
                    description: (member ? lang.GeneralModule.Commands.Remindme.Set.ReminderSet.SomeoneElse.Description : lang.GeneralModule.Commands.Remindme.Set.ReminderSet.You.Description).replace(/{reminder}/g, reminder).replace(/{timer}/g, Utils.getTimeDifference(start, end, false)).replace(/{user}/g, (mem || member).toString()),
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    timestamp: new Date()
                }));
                return resolve(true);
            }

            else {
                let prefix = await Utils.variables.db.get.getPrefixes(guild.id);

                reply(Embed({
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.GeneralModule.Commands.Remindme.Help.Title,
                    description: lang.GeneralModule.Commands.Remindme.Help.Description,
                    fields: [
                        { name: lang.GeneralModule.Commands.Remindme.Help.Fields[0], value: prefix + 'remindme list', inline: false },
                        { name: lang.GeneralModule.Commands.Remindme.Help.Fields[1], value: prefix + (permission ? 'remindme [@user] <time> <reminder>' : 'remindme <time> <reminder>'), inline: false },
                        { name: lang.GeneralModule.Commands.Remindme.Help.Fields[2], value: prefix + 'remindme cancel <id>', inline: false },
                    ],
                    timestamp: new Date()
                }));
                return resolve(true);
            }
        });
    },
    description: "Make the bot remind you to do something",
    usage: 'remindme <list/cancel/time> [id/reminder description]',
    aliases: ['reminders', 'reminder', 'remind'],
    arguments: [
        {
            name: "help",
            description: "View the help menu for reminders",
            type: "SUB_COMMAND"
        },
        {
            name: "list",
            description: "List your reminders",
            type: "SUB_COMMAND"
        },
        {
            name: "cancel",
            description: "Cancel a reminder",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "id",
                    description: "The ID of the reminder you want to cancel",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "create",
            description: "Create a reminder",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "time",
                    description: "When you want the reminder to go off (1d2m3s)",
                    type: "STRING",
                    required: true
                },
                {
                    name: "reminder",
                    description: "The actual reminder you want sent to you",
                    type: "STRING",
                    required: true
                }
            ]
        }
    ]
};
