const AnnouncementHandler = require('../../modules/handlers/AnnouncementHandler');
const { Embed } = require('../../modules/utils');
const Utils = require('../../modules/utils');
const { config, db, lang } = Utils.variables;

module.exports = {
    name: "autoannounce",
    run: async (bot, messageOrInteraction, args, { prefixUsed, guild, reply }) => {
        return new Promise(async (resolve) => {
            let action = args.length ? args[0].toLowerCase() : undefined;
            let announcements = await db.get.getAnnouncements();

            if (!config.AutoAnnouncements.Enabled) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.AutoAnnounce.Errors.Disabled
                }), {
                    ephemeral: true
                });
                return resolve();
            }

            if (!announcements.length) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.AutoAnnounce.Errors.NoAnnouncements
                }), {
                    ephemeral: true
                });

                return resolve();
            }

            if (action == "list") {
                let page = +args[1] ? +args[1] : 1;

                if (page > Math.ceil(announcements.length / 5) || page < 1) page = 1;

                reply(Embed({
                    title: lang.AdminModule.Commands.AutoAnnounce.Embeds.List.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(announcements.length / 5)),
                    fields: announcements.slice((page - 1) * 5, 5 * page).map(a => {
                        let data = JSON.parse(a.announcement_data);

                        return {
                            name: lang.AdminModule.Commands.AutoAnnounce.Embeds.List.Field.Name.replace(/{id}/g, a.id),
                            value: lang.AdminModule.Commands.AutoAnnounce.Embeds.List.Field.Value.replace(/{channel}/g, Utils.findChannel(data.Channel, guild, 'GUILD_TEXT', false) || data.Channel).replace(/{date}/g, new Date(a.next_broadcast).toLocaleString()).replace(/{timer}/g, Utils.getTimeDifference(Date.now(), a.next_broadcast))
                        };
                    }),
                    timestamp: new Date(),
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    }
                }));

                return resolve(true);
            }

            else if (action == "restart") {
                if (parseInt(args[1])) {
                    let a = announcements.find(a => a.id == +args[1]);

                    if (!a) {
                        reply(Embed({
                            preset: "invalidargs",
                            usage: "autoannounce restart [id|all]"
                        }, { prefixUsed }), {
                            ephemeral: true
                        });

                        return resolve();
                    }

                    let data = JSON.parse(a.announcement_data);

                    await AnnouncementHandler.send(bot, a);

                    reply(Embed({
                        title: lang.AdminModule.Commands.AutoAnnounce.Embeds.Restart.Title,
                        description: lang.AdminModule.Commands.AutoAnnounce.Embeds.Restart.Description.replace(/{channel}/g, Utils.findChannel(data.Channel, guild, 'GUILD_TEXT', false) || data.Channel),
                        timestamp: new Date(),
                        footer: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        }
                    }));

                    return resolve(true);
                } else if (args[1] == "all" || !args[1]) {
                    announcements.forEach(a => {
                        AnnouncementHandler.send(bot, a);
                    });

                    reply(Embed({
                        title: lang.AdminModule.Commands.AutoAnnounce.Embeds.All.Title,
                        description: lang.AdminModule.Commands.AutoAnnounce.Embeds.All.Description,
                        timestamp: new Date(),
                        footer: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        }
                    }));

                    return resolve(true);
                } else {
                    reply(Embed({
                        preset: "invalidargs",
                        usage: "autoannounce restart [id|all]"
                    }, { prefixUsed }), {
                        ephemeral: true
                    });

                    return resolve();
                }
            }

            else {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), {
                    ephemeral: true
                });

                return resolve();
            }
        });
    },
    description: "Manage auto announcements",
    usage: "autoannounce <list|restart> [id|all|page number]",
    aliases: ["aa"],
    arguments: [
        {
            name: "action",
            description: "Whether to list or restart announcements",
            required: true,
            type: "STRING",
            choices: [
                {
                    name: "list",
                    value: "list"
                },
                {
                    name: "restart",
                    value: "restart"
                }
            ]
        },
        {
            name: "id_or_page",
            description: "The ID (to restart an announcement) or the page number (or all) (to list announcements)",
            required: true,
            type: "STRING"
        }
    ]
};
