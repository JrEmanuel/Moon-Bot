const AddonHandler = require("../../modules/handlers/AddonHandler");
const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { capitalize } = require("lodash");
const { lang } = Utils.variables;

module.exports = {
    name: "addon",
    run: async (bot, messageOrInteraction, args, { type, reply }) => {
        return new Promise(resolve => {
            if (type == "message" && args.length == 0) {
                reply(Embed({ preset: "invalidargs", usage: module.exports.usage }));
                return resolve();
            }

            const action = type == "message" ? args[0].toLowerCase() : messageOrInteraction.options.getSubcommand();

            if (action == "list") {
                let loaded = AddonHandler.addons.filter(a => a.loaded).map(a => a.name);
                let unloaded = AddonHandler.addons.filter(a => !a.loaded).map(a => a.name);
                reply(Embed({
                    title: lang.ManagementModule.Commands.Addons.List.Title,
                    description: lang.ManagementModule.Commands.Addons.List.Description,
                    fields: [
                        { name: lang.ManagementModule.Commands.Addons.List.Fields[0], value: loaded.length ? loaded.join("\n") : lang.Global.None, inline: true },
                        { name: lang.ManagementModule.Commands.Addons.List.Fields[1], value: unloaded.length ? unloaded.join("\n") : lang.Global.None, inline: true }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    }
                }));
                return resolve(true);
            }

            if (type == "message" && args.length < 2) {
                reply(Embed({ preset: "invalidargs", usage: module.exports.usage }));
                return resolve();
            }

            const name = (type == "message" ? args[1] : args[0]).replace(/\.js/, "");

            if (action == "unload") {
                AddonHandler.unload(name)
                    .then(() => {

                        Utils.variables.db.update.addons.setUnloaded(name);

                        reply(Embed({
                            title: lang.ManagementModule.Commands.Addons.Unload.Title,
                            description: lang.ManagementModule.Commands.Addons.Unload.Description.replace(/{name}/g, name),
                            timestamp: new Date(),
                            footer: {
                                text: bot.user.username,
                                icon: bot.user.displayAvatarURL({ dynamic: true })
                            }
                        }));

                        resolve(true);
                    })
                    .catch(e => {
                        if (e == "That addon does not exist") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.NotExist }));
                            return resolve();
                        } else if (e == "That addon is already unloaded") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.AlreadyUnloaded }));
                            return resolve();
                        } else {
                            reply(Embed({ preset: "console" }));
                            throw e;
                        }
                    });
            } else if (action == "load") {
                AddonHandler.load(name)
                    .then(() => {

                        Utils.variables.db.update.addons.setLoaded(name);

                        reply(Embed({
                            title: lang.ManagementModule.Commands.Addons.Load.Title,
                            description: lang.ManagementModule.Commands.Addons.Load.Description.replace(/{name}/g, name),
                            timestamp: new Date(),
                            footer: {
                                text: bot.user.username,
                                icon: bot.user.displayAvatarURL({ dynamic: true })
                            }
                        }));

                        resolve(true);
                    })
                    .catch(e => {
                        if (e == "That addon does not exist") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.NotExist }));
                            return resolve();
                        } else if (e == "That addon is already loaded") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.AlreadyLoaded }));
                            return resolve();
                        } else {
                            reply(Embed({ preset: "console" }));
                            throw e;
                        }
                    });
            } else if (action == "reload") {
                AddonHandler.unload(name)
                    .then(() => {
                        AddonHandler.load(name)
                            .then(() => {

                                Utils.variables.db.update.addons.setLoaded(name);

                                reply(Embed({
                                    title: lang.ManagementModule.Commands.Addons.Reload.Title,
                                    description: lang.ManagementModule.Commands.Addons.Reload.Description.replace(/{name}/g, name),
                                    timestamp: new Date(),
                                    footer: {
                                        text: bot.user.username,
                                        icon: bot.user.displayAvatarURL({ dynamic: true })
                                    }
                                }));

                                resolve(true);
                            })
                            .catch(e => {
                                if (e == "That addon does not exist") {
                                    reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.NotExist }));
                                    return resolve();
                                } else if (e == "That addon is already loaded") {
                                    reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.AlreadyLoaded }));
                                    return resolve();
                                } else {
                                    reply(Embed({ preset: "console" }));
                                    throw e;
                                }
                            });
                    })
                    .catch(e => {
                        if (e == "That addon does not exist") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.NotExist }));
                            return resolve();
                        } else if (e == "That addon is already unloaded") {
                            reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.AlreadyUnloaded }));
                            return resolve();
                        } else {
                            reply(Embed({ preset: "console" }));
                            throw e;
                        }
                    });
            } else if (action == "info") {
                const addon = AddonHandler.addons.find(addon => addon.name.toLowerCase() == name.toLowerCase());

                if (!addon) {
                    reply(Embed({ preset: "error", description: lang.ManagementModule.Commands.Addons.Errors.NotExist }));
                    return resolve();
                }

                const addon_errors = Utils.variables.addon_errors ? Utils.variables.addon_errors.filter(error => error.addon.toLowerCase() == addon.name.toLowerCase()) : [];

                reply(Embed({
                    title: lang.ManagementModule.Commands.Addons.Info.Title.replace(/{name}/g, capitalize(addon.name)),
                    fields: [
                        {
                            name: lang.ManagementModule.Commands.Addons.Info.Fields[0].Name,
                            value: addon.loaded ? lang.ManagementModule.Commands.Addons.Info.Fields[0].Value[0] : lang.ManagementModule.Commands.Addons.Info.Fields[0].Value[1]
                        },
                        {
                            name: lang.ManagementModule.Commands.Addons.Info.Fields[1],
                            value: addon.events.length > 0 ? addon.events.map(event => "> **" + event.name + "**").join("\n") : lang.Global.None
                        },
                        {
                            name: lang.ManagementModule.Commands.Addons.Info.Fields[2],
                            value: addon.commands.length > 0 ? addon.commands.map(command => "> **" + command.command + "**" + (command.aliases.length > 0 ? ` (${command.aliases.join(', ')})` : '')).join('\n') : lang.Global.None
                        },
                        {
                            name: lang.ManagementModule.Commands.Addons.Info.Fields[3].Name,
                            value: lang.ManagementModule.Commands.Addons.Info.Fields[3].Value.replace(/{errors-length}/g, addon_errors.length).replace(/{unique-length}/g, (addon_errors.length > 0 ? [...new Set(addon_errors.map(error => error.error))] : []).length)
                        }
                    ],
                    timestamp: new Date(),
                    footer: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    }
                }));

                return resolve(true);
            } else {
                reply(Embed({ preset: "invalidargs", usage: module.exports.usage }));
                return resolve();
            }
        });
    },
    description: "Manage your addons",
    aliases: [],
    usage: "addon <unload/load/reload/info/list> <file name>",
    arguments: [
        {
            name: "info",
            description: "View info on an addon",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "addon",
                    description: "The file name of the addon",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "list",
            description: "View a list of all addons",
            type: "SUB_COMMAND"
        },
        {
            name: "unload",
            description: "Unload an addon",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "addon",
                    description: "The file name of the addon",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "load",
            description: "Load an addon",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "addon",
                    description: "The file name of the addon",
                    type: "STRING",
                    required: true
                }
            ]
        },
        {
            name: "reload",
            description: "Reload an addon",
            type: "SUB_COMMAND",
            options: [
                {
                    name: "addon",
                    description: "The file name of the addon",
                    type: "STRING",
                    required: true
                }
            ]
        }
    ]
};
