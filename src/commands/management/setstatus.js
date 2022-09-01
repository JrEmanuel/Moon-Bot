const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'setstatus',
    run: async (bot, messageOrInteraction, args, { member, reply }) => {
        return new Promise(resolve => {
            const types = ["online", "dnd", "idle", "invisible"];

            if (args.length && types.includes(args[0].toLowerCase())) {
                const type = args[0].toLowerCase();

                bot.user.setStatus(type);
                reply(Embed({
                    title: lang.ManagementModule.Commands.Setstatus.Embeds.Updated.Title,
                    description: lang.ManagementModule.Commands.Setstatus.Embeds.Updated.Description.replace(/{status}/g, type == 'dnd' ? lang.ManagementModule.Commands.Setstatus.Embeds.Updated.DND : type.charAt(0).toUpperCase() + type.substring(1))
                }));
                return resolve(true);
            }

            let menu = new Utils.Discord.MessageSelectMenu({
                customId: "setstatus-options",
                placeholder: "Choose a status",
                options: [
                    {
                        label: "Online",
                        value: "online",
                        emoji: {
                            name: "🟢"
                        }
                    },
                    {
                        label: "Do Not Disturb",
                        value: "dnd",
                        emoji: {
                            name: "🔴"
                        }
                    },
                    {
                        label: "Idle",
                        value: "idle",
                        emoji: {
                            name: "🟠"
                        }
                    },
                    {
                        label: "Invisible",
                        value: "invisible",
                        emoji: {
                            name: "⚫"
                        }
                    }
                ].filter(option => option.value !== bot.user.presence.status)
            });

            reply(Embed({
                title: "\\⚙️ Change Bot Status",
                description: "Select the status type by choosing an option from the menu⠀⠀⠀",
                timestamp: new Date(),
                components: [menu]
            })).then(async m => {
                await m.awaitMessageComponent({ filter: interaction => interaction.customId == "setstatus-options" && interaction.user.id == member.id })
                    .then(async result => {
                        let type = result.values[0];

                        result.deferUpdate();
                        m.delete();

                        bot.user.setPresence({ status: type });
                        reply(Embed({
                            title: "\\⚙️ Bot Status Changed",
                            description: `You've changed the bot status to **${type == 'dnd' ? lang.ManagementModule.Commands.Setstatus.Embeds.Updated.DND : type.charAt(0).toUpperCase() + type.substring(1)}**`,
                            timestamp: new Date()
                        }));
                    });
            });
        });
    },
    description: "Set the bot's status",
    usage: 'setstatus [online|dnd|idle|invisible]',
    aliases: [],
    arguments: [
        {
            name: "type",
            description: "The status type",
            required: false,
            type: "STRING",
            choices: [
                {
                    name: "online",
                    value: "online"
                },
                {
                    name: "dnd",
                    value: "dnd"
                },
                {
                    name: "idle",
                    value: "idle"
                },
                {
                    name: "invisible",
                    value: "invisible"
                }
            ]
        }
    ]
};
