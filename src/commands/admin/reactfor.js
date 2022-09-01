const { chunk, capitalize } = require("lodash");
const { getEmoji } = require("../../modules/utils");
const Utils = require("../../modules/utils");
const { Embed, variables: { lang } } = Utils;

module.exports = {
    name: "reactfor",
    run: async (bot, messageOrInteraction, args, { type, member, channel, reply }) => {
        return new Promise(async resolve => {
            let ticketOrApplication = type == "message" ? args[0] : messageOrInteraction.options.getSubcommand();

            if (!ticketOrApplication || !["ticket", "application"].includes(ticketOrApplication.toLowerCase())) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: "reactfor <ticket/application> [specific/all/general]"
                }));
                return resolve();
            }

            let success = () => {
                reply(Embed({ title: lang.AdminModule.Commands.Reactfor.Created.replace(/{type}/g, ticketOrApplication) })).then(Utils.delete);
            };

            if (ticketOrApplication.toLowerCase() == "ticket") {
                let config = Utils.variables.config.Tickets.ReactForTicket.Message;
                let button = Utils.variables.config.Tickets.ReactForTicket.Button;

                button.ID = "reactfor_ticket";

                channel.send(Utils.setupMessage({
                    configPath: config,
                    components: [[button]],
                    variables: [
                        ...Utils.userVariables(bot, "bot")
                    ]
                }));
                success();
                return resolve(true);
            } else {
                let t = type == "message" ? args[1] : args[0];

                if (!t || !["specific", "all", "general"].includes(t.toLowerCase())) {
                    reply(Embed({
                        preset: "invalidargs",
                        usage: "reactfor <ticket/application> [specific/all/general]"
                    }));
                    return resolve();
                }

                let apps = Utils.variables.config.Applications;

                if (t == "specific") {
                    let q = await reply(Embed({ title: lang.AdminModule.Commands.Reactfor.Application.WhichPosition }));
                    let valid = false;
                    while (!valid) {
                        await Utils.waitForResponse(member.id, channel)
                            .then(res => {
                                res.delete();

                                let position = apps.Positions[Object.keys(apps.Positions).find(p => p == res.content)];

                                if (!position) {
                                    if (res.content.toLowerCase() == "cancel") {
                                        q.delete();
                                        valid = true;
                                        return resolve();
                                    }
                                } else {
                                    let buttonSettings = position.Button;
                                    let button = {
                                        ID: "reactfor_application_" + res.content,
                                        Style: buttonSettings && buttonSettings.Style ? buttonSettings.Style : "PRIMARY",
                                        Emoji: buttonSettings && buttonSettings.Emoji && buttonSettings.Emoji.Enabled ? buttonSettings.Emoji : { Enabled: true, Emoji: getEmoji(1) },
                                        Label: buttonSettings && buttonSettings.Label ? buttonSettings.Label : capitalize(res.content)
                                    };


                                    let config = apps.ReactForApp.Message;

                                    channel.send(Utils.setupMessage({
                                        configPath: config,
                                        components: [[button]],
                                        variables: [
                                            ...Utils.userVariables(bot, "bot"),
                                            { searchFor: /{positions}/g, replaceWith: "" },
                                            { searchFor: /{position}/g, replaceWith: capitalize(res.content) }
                                        ]
                                    }));
                                    q.delete();
                                    valid = true;
                                    success();
                                    return resolve(true);
                                }
                            });
                    }
                } else if (t == "all") {
                    let buttons = Object.keys(apps.Positions).map((position, index) => {
                        let settings = apps.Positions[position];
                        let buttonSettings = settings.Button;
                        return {
                            ID: "reactfor_application_" + position,
                            Style: buttonSettings && buttonSettings.Style ? buttonSettings.Style : "PRIMARY",
                            Emoji: buttonSettings && buttonSettings.Emoji && buttonSettings.Emoji.Enabled ? buttonSettings.Emoji : { Enabled: true, Emoji: getEmoji(index + 1) },
                            Label: buttonSettings && buttonSettings.Label ? buttonSettings.Label : position
                        };
                    });


                    let config = apps.ReactForApp.Message;

                    channel.send(Utils.setupMessage({
                        configPath: config,
                        components: chunk(buttons, 5),
                        variables: [
                            ...Utils.userVariables(bot, "bot"),
                            { searchFor: /{positions}/g, replaceWith: buttons.map(b => `${b.Emoji.Emoji} ${b.Label}`) }
                        ]
                    }));

                    success();

                    return resolve(true);
                } else if (t == "general") {
                    let config = apps.ReactForApp.Message;
                    let button = apps.ReactForApp.Button;

                    button.ID = "reactfor_application";

                    channel.send(Utils.setupMessage({
                        configPath: config,
                        components: [[button]],
                        variables: [
                            ...Utils.userVariables(bot, "bot"),
                            { searchFor: /{positions}/g, replaceWith: "" }
                        ]
                    }));

                    success();

                    return resolve(true);
                }
            }
        });
    },
    aliases: [],
    description: "Create a react for ticket or react for application embed",
    usage: "reactfor <ticket/application> [specific/all/general]",
    arguments: [
        {
            name: "ticket",
            type: "SUB_COMMAND",
            description: "Create a react for ticket embed"
        },
        {
            name: "application",
            type: "SUB_COMMAND",
            description: "Create a react for application embed",
            options: [
                {
                    name: "type",
                    description: "The type of reaction embed (specific, all, or general)",
                    type: "STRING",
                    required: true,
                    choices: [
                        { name: "specific", value: "specific" },
                        { name: "all", value: "all" },
                        { name: "general", value: "general" }
                    ]
                }
            ]
        }
    ]
};
