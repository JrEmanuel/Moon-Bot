const Utils = require('../../modules/utils');
const { capitalize, chunk } = require('lodash');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "modules",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            const CommandHandler = require('../../modules/handlers/CommandHandler');

            if (args.length == 0) {
                let listedModules = await Promise.all([...new Set(CommandHandler.commands.map(c => c.type))].map(async m => {
                    let module = await Utils.variables.db.get.getModules(m);
                    if (!module) return undefined;
                    return (module.enabled ? '✅ ' : '❌ ') + '**' + capitalize(m) + '**';
                }));

                let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
                listedModules = listedModules.filter(module => module).sort((a, b) => {
                    return alphabet.indexOf(a.slice(4).charAt(0).toLowerCase()) - alphabet.indexOf(b.slice(4).charAt(0).toLowerCase());
                });

                reply(Utils.Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.ManagementModule.Commands.Module.Embeds.List.Title,
                    description: lang.ManagementModule.Commands.Module.Embeds.List.Description.replace(/{modules}/g, listedModules.join("\n")),
                    footer: lang.ManagementModule.Commands.Module.Embeds.List.Footer.replace(/{prefix}/g, await Utils.variables.db.get.getPrefixes(guild.id))
                }));

                return resolve(true);
            } else {
                if (!CommandHandler.commands.map(c => c.type).includes(args[0].toLowerCase())) {
                    reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.InvalidModule }));
                    return resolve();
                }

                const module = await Utils.variables.db.get.getModules(args[0].toLowerCase());

                if (args.length == 1) {
                    reply(Embed({
                        author: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        title: lang.ManagementModule.Commands.Module.Embeds.Module.Title.replace(/{module}/g, capitalize(args[0])),
                        fields: [
                            {
                                name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[0],
                                value: module.enabled ? lang.ManagementModule.Commands.Module.Embeds.Module.Status[0] : lang.ManagementModule.Commands.Module.Embeds.Module.Status[1],
                                inline: false
                            },
                            {
                                name: lang.ManagementModule.Commands.Module.Embeds.Module.Fields[1],
                                value: chunk(CommandHandler.commands.filter(c => c.type == args[0].toLowerCase()).map(c => "`" + c.command.toLowerCase() + "`"), 3).map(a => a.join(" ")).join("\n"),
                                inline: false
                            },
                        ]
                    }));
                    return resolve(true);
                } else {
                    if (args[0].toLowerCase() == 'management') {
                        reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.StatusCantBeModified }));
                        return resolve();
                    }

                    const newStatus = args[1].toLowerCase();

                    if (!['enable', 'disable'].includes(newStatus)) {
                        reply(Embed({ preset: 'error', description: lang.ManagementModule.Commands.Module.Errors.InvalidStatus }));
                        return resolve();
                    }
                    const module = await Utils.variables.db.get.getModules(args[0].toLowerCase());

                    if ((module.enabled && newStatus == 'enable') || (!module.enabled && newStatus == 'disable')) {
                        reply(Embed({
                            preset: "error",
                            description: newStatus == "enable" ? lang.ManagementModule.Commands.Module.Errors.AlreadyEnabled : lang.ManagementModule.Commands.Module.Errors.AlreadyDisabled
                        }));
                        return resolve();
                    }

                    await Utils.variables.db.update.modules.setModule(args[0].toLowerCase(), newStatus == 'enable' ? true : false);

                    CommandHandler.commands.filter(command => command.type == args[0].toLowerCase()).forEach(command => {
                        command.enabled = newStatus == 'enable' ? true : false;
                    });

                    reply(Embed({
                        author: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        title: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Title.replace(/{status}/g, capitalize(newStatus) + 'd'),
                        description: lang.ManagementModule.Commands.Module.Embeds.EnabledDisabled.Description.replace(/{module}/g, args[0].toLowerCase()).replace(/{status}/g, newStatus + 'd')
                    }));
                    return resolve(true);
                }
            }
        });
    },
    description: "Enable or disable a module",
    usage: 'modules [module] [enable|disable]',
    aliases: [
        'module'
    ],
    arguments: [
        {
            name: "list",
            description: "View a list of modules",
            type: "SUB_COMMAND"
        },
        {
            name: "info",
            description: "View or modify the enabled status of a module",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "name",
                    description: "The name of the module",
                    type: "STRING",
                    required: true
                },
                {
                    name: "status",
                    description: "Change whether the module is enabled or disabled",
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
