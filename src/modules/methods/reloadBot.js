module.exports = async (bot, type) => {
    const CommandHandler = require('../handlers/CommandHandler');
    const EventHandler = require('../handlers/EventHandler');
    const Utils = require("../utils");
    const fs = require("fs");

    async function reloadCommands() {
        CommandHandler.commands.forEach(c => {
            try {
                delete require.cache[require.resolve('../../commands/' + c.type + '/' + c.command + '.js')];
            } catch (err) {
                // Command doesn't exist (it's an addon)
            }
        });
        CommandHandler.commands = [];
        await CommandHandler.init(bot);
    }

    async function reloadEvents() {
        EventHandler.events.forEach(e => {
            try {
                bot.removeListener(e.name, e.call);
                delete require.cache[require.resolve('../../events/' + e.name + '.js')];
            } catch (err) {
                // Event doesn't exist (it's an addon)
            }
        });
        EventHandler.events = [];
        EventHandler.init(bot);
    }

    async function reloadAddons() {
        CommandHandler.commands = CommandHandler.commands.filter(c => !c.addonName);
        EventHandler.events.filter(e => e.addonName).forEach(e => bot.removeListener(e.name, e.call));
        EventHandler.events = EventHandler.events.filter(e => !e.addonName);
        const AddonHandler = require('../handlers/AddonHandler');
        const addons = AddonHandler.addons;
        addons.forEach(addon => {
            delete require.cache[require.resolve('../../../addons/' + addon.name)];
        });

        AddonHandler.addons = [];
        AddonHandler.init(bot);
    }

    async function reloadConfig() {
        const updatedConfig = await require('../yml')('./configs/config.yml');
        Utils.variables.set('config', updatedConfig);

        const updatedLang = await require('../yml')('./configs/lang.yml');
        Utils.variables.set('lang', updatedLang);

        const updatedCommands = await require('../yml')('./configs/commands.yml');
        Utils.variables.set('commands', updatedCommands);

        const updatedEmbeds = await require('../yml')('./configs/embeds.yml');
        Utils.variables.set('embeds', updatedEmbeds);

        const updatedTLDs = await require('../yml')('./configs/TLDs.yml');
        Utils.variables.set('TLDs', updatedTLDs);
    }

    async function reloadMethods() {
        fs.readdir("./src/modules/methods", (err, files) => {
            if (err) return console.log(err);
            files.forEach(method => {
                if (method.endsWith(".js")) {
                    delete require.cache[require.resolve('./' + method)];
                    require('./' + method);
                } else if (!method.includes(".")) {
                    fs.readdir("./src/modules/methods/" + method, (err, files) => {
                        if (err) return console.log(err);
                        files.forEach(f => {
                            delete require.cache[require.resolve('./' + method + "/" + f)];
                            require('./' + method + "/" + f);
                        });
                    });
                }
            });

            console.log(Utils.infoPrefix + "Reloaded all methods");
        });
    }

    if (type == 'addons') return reloadAddons();
    else if (type == 'config') return reloadConfig();
    else if (type == 'commands') return reloadCommands();
    else if (type == 'events') return reloadEvents();
    else if (type == 'methods') return reloadMethods();
    else if (!type || type == 'all') {
        await Promise.all([
            await reloadConfig(),
            await reloadCommands(),
            reloadEvents(),
            reloadMethods(),
            reloadAddons(),
        ]);
        return;
    }
};
