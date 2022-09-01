const Utils = require('../utils.js');
const { error } = Utils;
const fs = require('fs');
const commands = Utils.variables.commands;
const chalk = require("chalk");

const { transformCommand } = require("discord.js").ApplicationCommandManager;

module.exports = {
  commands: [],
  find: function (message, ignoreCase = true, checkForAliases = true) {
    if (ignoreCase) message = message.toLowerCase();

    let cmds = this.commands.filter(c => {
      if (!Array.isArray(c.aliases)) c.aliases = [];
      // If the actual command equals the query 
      return (ignoreCase ? c.command.toLowerCase() : c.command) == message ||
        (// If the aliases has the query
          checkForAliases &&
          c.aliases.filter(a => typeof a == "string").map(a =>
            // If ignoreCase, set the alias to lower case
            ignoreCase ? a.toLowerCase() : a
          )
            .includes(message));
    });

    return cmds.find(c => c.priority == Math.max(...cmds.map(c => c.priority)));
  },
  set: async function (command, folder) {
    if (['name', 'run', 'description', 'usage', 'aliases'].some(p => !command[p])) {
      return error('Command object does not have all properties needed.\nCurrent Properties: ' + Object.values(command).filter(p => !!p).map((p, i) => {
        let propertyName = Object.keys(command).filter(pName => !!Object.values(command)[Object.keys(command).indexOf(pName)])[i];
        if (propertyName == "run") {
          return `run: Async Function`;
        } else {
          return `${propertyName}: ${p}`;
        }
      }).join(", ") + '\nMissing Properties: ' + ['name', 'run', 'description', 'usage', 'aliases'].filter(p => !command[p]).join(', '));
    }
    const { cmds, modules } = module.exports;
    const cmdDisabled = !((
      cmds.find(c => c.name == command.name) ||
      // Default to true if it's not in the list for some reason
      { enabled: true }
    ).enabled && ([true, false].includes(commands.Enabled[command.name]) ? commands.Enabled[command.name] : true));
    const moduleName = folder || command.type || "other";
    const moduleDisabled = !!modules.find(m => !m.enabled && m.name.toLowerCase() == moduleName.toLowerCase());

    const CommandObject = {
      command: command.name,
      run: command.run,
      description: commands.Descriptions[command.name] || command.description || "Unknown",
      usage: command.usage,
      aliases: commands.Aliases[command.name] || command.aliases || [],
      type: moduleName,
      enabled: !(cmdDisabled || moduleDisabled),
      priority: typeof command.priority == "number" ? command.priority : 1,
      cooldown: command.cooldown
    };

    const caller = Utils.getLine(3) || "Unknown";

    if (caller.includes('\\addons\\') || caller.includes('\\addons\\') || caller.includes('//addons//') || caller.includes('/addons/')) {
      const name = caller.replace(/(\\\\|\\|\/\/|\/)addons(\\\\|\\|\/\/|\/)/g, '').match(/[^\.]+/)[0];
      CommandObject.addonName = name;
      CommandObject.priority = typeof command.priority == "number" ? command.priority : 2;
    }

    if (CommandObject.enabled && command.arguments) {
      const slashCommandData = transformCommand({
        name: CommandObject.command,
        description: CommandObject.description,
        options: command.arguments || [],
        defaultPermission: command.defaultPermission
      });

      if (slashCommandData.name && slashCommandData.description) CommandObject.slashCommand = slashCommandData;
    }

    this.commands.push(CommandObject);
  },
  init: async () => {
    return new Promise((resolve, reject) => {
      fs.readdir('./src/commands', async (err, files) => {
        if (err) {
          if (err.message.startsWith("ENOENT: no such file or directory, scandir")) return console.log('\x1b[91m%s\x1b[0m', 'The commands folder could not be found. 0 commands have been loaded.\nIf your bot key is valid, corebot will install the commands shortly...');
          else reject(err);
        }
        const modules = await Utils.variables.db.get.getModules();
        module.exports.modules = modules;
        const cmds = await Utils.variables.db.get.getCommands();
        module.exports.cmds = cmds || [];

        files = files.filter(f => !f.includes("."));

        files.forEach((category, index) => {
          fs.readdir('./src/commands/' + category, (err, commandFiles) => {
            if (err) {
              if (err.message.startsWith("ENOENT: no such file or directory, scandir"));
              else reject(err);
            }

            commandFiles = commandFiles.filter(f => f.endsWith('.js'));
            commandFiles.forEach(async (commandName, i) => {
              try {
                const command = require('../../commands/' + category + '/' + commandName);
                await module.exports.set(command, category);
              } catch (e) {
                console.log(Utils.errorPrefix + "An unexpected error occured while loading the " + chalk.bold(commandName.slice(0, -3)) + " command! Please contact the Corebot support team. " + chalk.bold("https://corebot.dev/support"));
                error(e.message, e.stack, undefined, false);
              }

              if (index == (files.length - 1) && i == (commandFiles.length - 1)) {
                Utils.variables.bot.emit("commandsLoaded", module.exports.commands);
                resolve(module.exports);
              }
            });
          });
        });

        module.exports.set({
          name: 'code',
          run: async (bot, messageOrInteraction, args, { reply }) => {
              return new Promise(resolve => {
                  require("request-promise").post({
                      uri: 'https://corebot.dev/getCode',
                      headers: {
                          'Authorization': Utils.variables.config.Key
                      },
                      json: true
                  })
                      .then(res => {
                          reply(Utils.Embed({ title: "Code", description: "Your code is ``" + res.code + "``. You can go to https://corebot.dev/code to see if this is a legitimate copy of Corebot. This will also show you the owner of the copy." }));
                          resolve(true);
                      });
              });
          },
          description: "Users can use this to determine if you are using a legitimate copy of Corebot.",
          usage: 'code',
          aliases: [],
          arguments: []
      }, "management");
      });
    });
  }
};
