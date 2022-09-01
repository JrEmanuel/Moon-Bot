const Utils = require('../../modules/utils');
const { capitalize } = require('lodash');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;
const fs = require("fs");

module.exports = {
    name: "command",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            const CommandHandler = require('../../modules/handlers/CommandHandler');

            let listedCommands = await Promise.all(CommandHandler.commands.map(async c => {
                let cmd = await Utils.variables.db.get.getCommands(c.command);
                if (!cmd) return undefined;
                return `${cmd.enabled && c.enabled ? '✅ ' : '❌ '}` + '**' + capitalize(c.command) + '**';
            }));

            let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
            listedCommands = listedCommands.filter(command => command).sort((a, b) => {
                return alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase());
            });

            let p = +args[0] || 1;

            if (p > Math.ceil(listedCommands.length / 20)) p = 1;

            let page = listedCommands.slice((p - 1) * 20, 20 * p);

            if (args.length == 0) {
                reply(Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{current-page}/g, 1).replace(/{max-pages}/g, Math.ceil(listedCommands.length / 20)),
                    description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, page.join("\n")),
                    footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(guild.id))
                }));
                return resolve(true);
            } else if ((/\d+$/.test(args[0]) && args[0].length == 1)) {
                reply(Utils.Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.ManagementModule.Commands.Command.Embeds.List.Title.replace(/{current-page}/g, p).replace(/{max-pages}/g, Math.ceil(listedCommands.length / 20)),
                    description: lang.ManagementModule.Commands.Command.Embeds.List.Description.replace(/{commands}/g, page.join("\n")),
                    footer: lang.ManagementModule.Commands.Command.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(guild.id))
                }));
                return resolve(true);
            } else {
                const command = CommandHandler.commands.find(c => c.command == args[0].toLowerCase());

                if (!command) {
                    reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidCommand }));
                    return resolve();
                }

                if (args.length == 1) {
                    reply(Embed({
                        author: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        title: lang.ManagementModule.Commands.Command.Embeds.Command.Title.replace(/{command}/g, capitalize(args[0].toLowerCase())),
                        fields: [
                            {
                                name: lang.ManagementModule.Commands.Command.Embeds.Command.Fields[0],
                                value: command.enabled ? lang.ManagementModule.Commands.Command.Embeds.Command.Status[0] : lang.ManagementModule.Commands.Command.Embeds.Command.Status[1],
                                inline: true
                            }, {
                                name: "\u200b",
                                value: "\u200b",
                                inline: true
                            }, {
                                name: lang.ManagementModule.Commands.Command.Embeds.Command.Fields[1],
                                value: capitalize(command.type),
                                inline: true
                            }
                        ]
                    }));
                    return resolve(true);
                } else {
                    if (command.type == 'management') {
                        reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.StatusCantBeModified }));
                        return resolve();
                    }

                    const newStatus = args[1].toLowerCase();

                    if (!['enable', 'disable'].includes(newStatus)) {
                        reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Command.Errors.InvalidStatus }));
                        return resolve();
                    }

                    if ((command.enabled && newStatus == 'enable') || (!command.enabled && newStatus == 'disable')) {
                        reply(Embed({
                            preset: "error",
                            description: newStatus == "enable" ? lang.ManagementModule.Commands.Command.Errors.AlreadyEnabled : lang.ManagementModule.Commands.Command.Errors.AlreadyDisabled
                        }));

                        return resolve();
                    }

                    await Utils.variables.db.update.commands.setCommand(args[0].toLowerCase(), newStatus == 'enable' ? true : false);
                    command.enabled = newStatus == 'enable' ? true : false;

                    if ([true, false].includes(Utils.variables.commands.Enabled[command.command]) && command.enabled !== Utils.variables.commands.Enabled[command.command]) {
                        let file = fs.readFileSync("./configs/commands.yml", "utf8");

                        file = file.replace(`${command.command}: ${Utils.variables.commands.Enabled[command.command]}`, `${command.command}: ${command.enabled}`);
                        fs.writeFileSync("./configs/commands.yml", file);
                        await require("../../modules/methods/reloadBot")(bot, 'config');
                    }

                    reply(Embed({
                        author: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        title: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(newStatus) + 'd'),
                        description: lang.ManagementModule.Commands.Command.Embeds.EnabledDisabled.Description.replace(/{command}/g, command.command).replace(/{status}/g, newStatus + 'd')
                    }));
                    return resolve(true);
                }
            }
        });
    },
    description: "Enable or disable a command",
    usage: 'command [command] [enable|disable]',
    aliases: ['commands'],
    arguments: [
        {
            name: "list",
            description: "View a list of commands",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "page",
                    description: "The page number to view",
                    type: "NUMBER",
                    required: false
                }
            ]
        },
        {
            name: "info",
            description: "View or modify the enabled status of a command",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "name",
                    description: "The name of the command",
                    type: "STRING",
                    required: true
                },
                {
                    name: "status",
                    description: "Change whether the command is enabled or disabled",
                    required: false,
                    type: "STRING",
                    choices: [
                        { name: "enable", value: "enable" },
                        { name: "disable", value: "disable" }
                    ]
                }
            ]
        }
    ]
};
