const Utils = require("../modules/utils");
const { config } = Utils.variables;

const DEBUG_MODE = Utils.getStartupParameters().includes("debug");

const debug = message => {
    if (DEBUG_MODE) console.log(Utils.debugPrefix + message);
};

// Import the REST API package because Discord.js has not implemented bulk command overwrites yet
const { REST } = require("@discordjs/rest");

// Create a new REST client
const rest = new REST({ version: "9" }).setToken(config.Token);

// Import the discord-api-types package
const { Routes } = require("discord-api-types/v9");
const chalk = require("chalk");

module.exports = async (bot, commands, last) => {
    /*
      Check if all commands have been loaded
      because this event fires twice
      (once for normal commands and again for addons)
    */
    if (last) {
        const enabledCommands = commands.filter(command => command.enabled && command.slashCommand);

        const existingGlobalCommands = [];

        // An array of commands that need to be added
        const newCommands = [];

        const fetchNewCommands = async () => {
            return new Promise(async resolve => {
                // Get all existing bot commands
                const existingBotCommands = [...(await bot.application.commands.fetch()).values()].map(command => command.name);

                // Get the first guild's command list
                const mainGuild = bot.guilds.cache.first();

                const existingGuildCommands = [...(await mainGuild.commands.fetch()).values()].map(command => command.name);

                const allExistingCommands = [...existingBotCommands, ...existingGuildCommands];

                const commandsNotLoaded = [];

                enabledCommands.forEach(command => {
                    // If there is room for another command, add it to the array
                    if (allExistingCommands.length < 200) {
                        if (!allExistingCommands.includes(command.slashCommand.name)) {
                            newCommands.push({
                                name: command.slashCommand.name,
                                description: command.slashCommand.description,
                                options: command.slashCommand.options,
                                default_permission: command.slashCommand.default_permission
                            });
                        }
                    } else {
                        commandsNotLoaded.push(command.slashCommand.name);
                    }
                });

                debug(`${newCommands.length} new command${newCommands.length == 1 ? "" : "s"} will be created${newCommands.length > 0 ? ` (${newCommands.map(command => command.name).join(", ")})` : ""}`);
                if (commandsNotLoaded.length > 0) debug(`The following commands were not loaded because there was not enough room: ${commandsNotLoaded.join(", ")}`);

                debug(`${allExistingCommands.length + newCommands.length} total slash command${(allExistingCommands.length + newCommands.length) == 1 ? "" : "s"}`);

                resolve();
            });
        };

        const updateGuildCommands = async () => {
            return new Promise(async resolve => {
                debug("Updating guild commands");
                // Get the first guild's command list and update it so that it is consistent across all guilds

                // Get a list of all of the guilds
                const guilds = [...bot.guilds.cache.values()];

                // Get the first guild
                const mainGuild = guilds[0];

                const existingCommands = [...(await mainGuild.commands.fetch()).values()];

                // An array to store commands to update/create so that we can do a bulk update request
                const commandList = [];

                // Go through each existing command and see if it has been deleted, otherwise add it to the commandList
                existingCommands.forEach(command => {
                    // Check to see if an existing guild command has been deleted or disabled
                    const corebotCommand = enabledCommands.find(enabledCommand => enabledCommand.slashCommand.name == command.name);

                    if (!corebotCommand) {
                        debug(`${command.name} slash command for guilds has been deleted`);
                    } else {
                        // Add the command to the existingGlobalCommands array
                        const commandData = {
                            name: corebotCommand.slashCommand.name,
                            description: corebotCommand.slashCommand.description,
                            options: corebotCommand.slashCommand.options,
                            default_permission: corebotCommand.slashCommand.default_permission
                        };

                        existingGlobalCommands.push(commandData);
                        commandList.push(commandData);
                    }
                });

                // Check if there are new commands and room for new commands
                if (newCommands.length && commandList.length < 100) {
                    const commandsToAdd = newCommands.splice(0, 100 - commandList.length);

                    commandList.push(...commandsToAdd);
                }

                // Update the commands for all of the guilds that the bot is in
                for (const guild of guilds) {
                    debug(`Updating commands for ${guild.name}`);

                    await rest.put(
                        Routes.applicationGuildCommands(bot.user.id, guild.id), { body: commandList }
                    )
                        .catch(error => {
                            if (DEBUG_MODE) console.log(error);
                            debug(`Could not update commands for ${guild.name}`);
                        });

                    debug(`Done updating commands for ${guild.name}`);
                }

                debug("Done updating guild commands");

                resolve();
            });
        };

        const updateBotCommands = async () => {
            return new Promise(async resolve => {
                debug("Updating bot commands");
                // Get all of the current commands registered to the bot
                const existingCommands = [...(await bot.application.commands.fetch()).values()];

                // An array to store commands to update/create so that we can do a bulk update request
                const commandList = [];

                // Check the existing commands to see if any have been deleted, if not, add them to the commandList
                existingCommands.forEach(command => {
                    const corebotCommand = enabledCommands.find(enabledCommand => enabledCommand.slashCommand.name == command.name);

                    if (!corebotCommand) {
                        debug(`${command.name} slash command has been deleted`);
                    } else {
                        const commandData = {
                            name: corebotCommand.slashCommand.name,
                            description: corebotCommand.slashCommand.description,
                            options: corebotCommand.slashCommand.options,
                            default_permission: corebotCommand.slashCommand.default_permission
                        };

                        existingGlobalCommands.push(commandData);
                        commandList.push(commandData);
                    }
                });

                // Check if there are new commands and room for new commands
                if (newCommands.length && commandList.length < 100) {
                    const commandsToAdd = newCommands.splice(0, 100 - commandList.length);

                    commandList.push(...commandsToAdd);
                }

                debug("Sending request to update bot commands");
                // Update the commands for the bot
                await rest.put(
                    Routes.applicationCommands(bot.user.id), { body: commandList }
                )
                    .catch(error => {
                        if (DEBUG_MODE) console.log(error);
                        debug(`Could not update commands for the bot`);
                    });

                debug("Done updating bot commands");

                resolve();
            });
        };

        const resetSlashCommands = async () => {
            return new Promise(async resolve => {
                debug("Deleting all slash commands");

                // Reset the commands for all of the guilds that the bot is in
                const guilds = [...bot.guilds.cache.values()];

                for (const guild of guilds) {
                    debug(`Deleting commands for ${guild.name}`);
                    await rest.put(
                        Routes.applicationGuildCommands(bot.user.id, guild.id), { body: [] }
                    )
                        .catch(() => {
                            debug(`Could not reset commands for ${guild.name}`);
                        });

                    debug(`Done deleting guild commands for ${guild.name}`);
                }

                debug("Deleting application commands");
                // Reset the commands for the bot
                await rest.put(
                    Routes.applicationCommands(bot.user.id), { body: [] }
                )
                    .catch(() => {
                        debug(`Could not reset commands for the bot`);
                    });

                debug("Done deleting application commands");

                resolve();
            });
        };

        if (Utils.getStartupParameters().includes("delete-slash-commands")) {
            // Delay the resetting of the slash commands so that the user can see the status messages
            setTimeout(async () => {
                console.log(Utils.infoPrefix + chalk.bold("Deleting all slash commands..."));
                await resetSlashCommands();
                console.log(Utils.infoPrefix + chalk.bold("All slash commands have been deleted. Please restart the bot without the delete-slash-commands startup parameter to recreate the commands."));
            }, 3500);
        } else {
            await fetchNewCommands();
            await updateGuildCommands();
            await updateBotCommands();
        }
    }
};
