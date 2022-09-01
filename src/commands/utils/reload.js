const Utils = require("../../modules/utils");
const lang = Utils.variables.lang;

module.exports = {
    name: "reload",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            const reload = require("../../modules/methods/reloadBot");

            if (args.length == 0) {
                const msg = await reply(Utils.Embed({
                    title: lang.ManagementModule.Commands.Reload.Bot[0]
                }));
    
                await reload(bot, "all");
    
                msg.edit(Utils.Embed({
                    color: Utils.variables.config.EmbedColors.Success,
                    title: lang.ManagementModule.Commands.Reload.Bot[1]
                }));
            } else {
                const action = args[0].toLowerCase();
    
                if (action == "addons") {
                    const msg = await reply(Utils.Embed({
                        title: lang.ManagementModule.Commands.Reload.Addons[0]
                    }));
    
                    await reload(bot, "addons");
    
                    msg.edit(Utils.Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: lang.ManagementModule.Commands.Reload.Addons[1]
                    }));
                } else if (action == "commands") {
                    const msg = await reply(Utils.Embed({
                        title: lang.ManagementModule.Commands.Reload.Commands[0]
                    }));
    
                    await reload(bot, "commands");
    
                    msg.edit(Utils.Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: lang.ManagementModule.Commands.Reload.Commands[1]
                    }));
                } else if (action == "events") {
                    const msg = await reply(Utils.Embed({
                        title: lang.ManagementModule.Commands.Reload.Events[0]
                    }));
    
                    await reload(bot, "events");
    
                    msg.edit(Utils.Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: lang.ManagementModule.Commands.Reload.Events[1]
                    }));
                } else if (action == "config") {
                    const msg = await reply(Utils.Embed({
                        title: "Reloading..."
                    }));
    
                    await reload(bot, "config");
    
                    msg.edit(Utils.Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: "Reloaded config"
                    }));
                } else if (action == "method" || action == "methods") {
                    const msg = await reply(Utils.Embed({
                        title: "Reloading..."
                    }));
    
                    await reload(bot, "methods");
    
                    msg.edit(Utils.Embed({
                        color: Utils.variables.config.EmbedColors.Success,
                        title: "Reloaded methods"
                    }));
                } else {
                    reply(Utils.Embed({
                        preset: "error",
                        description: lang.ManagementModule.Commands.Reload.Errors.UnknownAction.replace(/{action}/g, action)
                    }), { ephemeral: true });
                }
            }

            resolve(true);
        });
    },
    description: "Reload certain aspects of the bot",
    usage: "reload [addons|commands|events|config]",
    aliases: [],
    arguments: [
        {
            name: "action",
            description: "The action to reload",
            required: false,
            choices: [
                {
                    name: "addons",
                    value: "addons"
                },
                {
                    name: "commands",
                    value: "commands"
                },
                {
                    name: "events",
                    value: "events"
                },
                {
                    name: "config",
                    value: "config"
                }
            ],
            type: "STRING"
        }
    ]
};
