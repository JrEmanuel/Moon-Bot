/* eslint-disable no-undef */
if (process.platform !== "win32") require("child_process").exec("npm install n && n lts");
if (+process.version.slice(1).split('.')[0] < 16) {
  console.log("\u001b[31mCorebot requires Node JS version 16 or higher. Please go to https://nodejs.org/en/ then download and install the LTS version.\033[0m");
  process.exit();
}

const installModules = async () => {
  return new Promise(async (resolve) => {
    if (process.argv.slice(2).map(a => a.toLowerCase()).includes("--no-install")) resolve();
    else {
      const showInfo = process.argv.slice(2).map(a => a.toLowerCase()).includes("--show-install-output");

      const { spawn } = require('child_process');

      const npmCmd = process.platform == "win32" ? 'npm.cmd' : 'npm';

      const modules = Object.keys(require('./package.json').dependencies);

      const info = "[90m>[39m          [38;2;87;255;107m[1m[INFO][22m[39m";

      const missingModules = modules.filter(module => {
        try {
          require.resolve(module);
          return;
        } catch (err) {
          return module !== "n" && !err.toString().includes("Error [ERR_PACKAGE_PATH_NOT_EXPORTED]");
        }
      });

      if (missingModules.length == 0) {
        console.log(info, 'No modules are missing... Bot is starting up');
        resolve();
      } else {
        console.log(info, missingModules.length, `module${missingModules.length == 1 ? ' is' : 's are'} not installed... Installing...`);

        if (missingModules.length == 21) {
          await new Promise(resolve => {
            const install = spawn(npmCmd, ['i']);

            install.stdout.on('data', (data) => {
              if (showInfo) console.log(data.toString().trim());
            });

            install.stderr.on('data', (data) => {
              if (showInfo) console.log("\u001b[31m" + data.toString().trim());
            });

            install.on('exit', () => {
              resolve();
            });
          });
        } else {
          for (let i = 0; i < missingModules.length; i++) {
            const module = missingModules[i];
  
            console.log(info, `Installing module ${i + 1}/${missingModules.length} (${module})`);
  
            await new Promise(resolve => {
              const install = spawn(npmCmd, ['i', module]);
  
              install.stdout.on('data', (data) => {
                if (showInfo) console.log(data.toString().trim());
              });
  
              install.stderr.on('data', (data) => {
                if (showInfo) console.log("\u001b[31m" + data.toString().trim());
              });
  
              install.on('exit', () => {
                console.log(info, `Finished installing module ${i + 1}/${missingModules.length} (${((i + 1) / missingModules.length * 100).toFixed(2)}% done)`);
                resolve();
              });
            });
          }
        }

        console.log(info, 'All missing modules have been installed! Please restart the bot');
        process.exit();
      }
    }
  });
};
installModules().then(async () => {
  require('console-stamp')(console, { label: false, pattern: 'HH:MM:ss', colors: { stamp: 'gray' } });

  const fs = require('fs');
  if (!fs.existsSync("./data/")) fs.mkdirSync("./data/");

  const Utils = require("./src/modules/utils");
  const variables = Utils.variables;

  let config;
  let lang;
  let commands;
  let embeds;
  let TLDs;
  let buttons;

  try {
    config = await Utils.yml('./configs/config.yml');
    lang = await Utils.yml('./configs/lang.yml');
    commands = await Utils.yml('./configs/commands.yml');
    embeds = await Utils.yml('./configs/embeds.yml');
    TLDs = await Utils.yml('./configs/TLDs.yml');
    buttons = await Utils.yml('./configs/buttons.yml');
  } catch (e) {
    if (['YAMLSemanticError', 'YAMLSyntaxError'].includes(e.name)) console.log(Utils.errorPrefix + "An error has occured while loading the config or lang file. Bot shutting down..." + Utils.color.Reset);
    else console.log(e);

    return process.exit();
  }

  variables.set('config', config);
  variables.set('lang', lang);
  variables.set('commands', commands);
  variables.set('embeds', embeds);
  variables.set('TLDs', TLDs);
  variables.set('buttons', buttons);
  variables.set('tempChannels', new Map());
  
  const Discord = require("discord.js");
  const intents = Discord.Intents.FLAGS;
  const bot = new Discord.Client({ autoReconnect: true, partials: ["CHANNEL"], intents: [intents.GUILDS,
    intents.GUILD_MEMBERS,
    intents.GUILD_BANS,
    intents.GUILD_EMOJIS_AND_STICKERS,
    intents.GUILD_INTEGRATIONS,
    intents.GUILD_WEBHOOKS,
    intents.GUILD_INVITES,
    intents.GUILD_VOICE_STATES,
    intents.GUILD_PRESENCES,
    intents.GUILD_MESSAGES,
    intents.GUILD_MESSAGE_REACTIONS,
    intents.GUILD_MESSAGE_TYPING,
    intents.DIRECT_MESSAGES,
    intents.DIRECT_MESSAGE_REACTIONS,
    intents.DIRECT_MESSAGE_TYPING
  ] });

  // DATABASE
  const Database = await require('./src/modules/database.js').setup(config, bot);

  // Set variables
  variables.set('errors', []);
  variables.set('addon_errors', []);
  variables.set('db', Database);
  variables.set('channelLogBlacklist', new Set());
  variables.set('bot', bot);
  variables.set('noAnnounceFilter', new Set());
  variables.set('noAnnounceAntiAd', new Set());

  // COMMAND HANDLER
  require('./src/modules/handlers/CommandHandler').init();

  // EVENT HANDLER
  require('./src/modules/handlers/EventHandler').init(bot);

  const error = require('./src/modules/error');
  process.on('uncaughtException', () => {
    return;
  });

  const { inspect } = require("util");
  process.on('unhandledRejection', async (reason, promise) => {
    const promiseText = inspect(promise) || "";

    try {
      error(reason.toString(), promiseText, promiseText ? promiseText.split("\n")[2].split(" ")[8].split(/\/|\\/).pop().replace(/\)|\(/g, '') : "Unknown", undefined, reason);
    } catch (err) {
      error(reason.toString(), "Unknown", promiseText);
    }
  });

  Utils.yml('./configs/config.yml')
    .then(config => {
      bot.login(config.Token).catch(error => {
        if (error.message.includes("An invalid token was provided")) {
          console.log(Utils.errorPrefix + "Your bot token is incorrect! Shutting down...");
        } else {
          console.log(Utils.errorPrefix + "An error occured while attempting to login to the bot:");
          console.log(error);
        }
        process.exit();
      });
      variables.set('bot', bot);
    });


  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input == 'stop') {
      console.log('Bot shutting down...');
      process.exit();
    }
  });

  if (Utils.getStartupParameters().includes("clear-errors")) {
    if (fs.existsSync("./data/errors.txt")) {
      fs.unlink("./data/errors.txt", (err) => {
        if (err) console.log(err);
        else {
          console.log(Utils.infoPrefix + 'Cleared errors.txt');
        }
      });
    }
  }

  if (Utils.getStartupParameters().includes("clear-backups")) {
    if (fs.existsSync("./data/backups")) {
      const backups = fs.readdirSync("./data/backups");

      backups.forEach(backup => {
        fs.rmdirSync(`./data/backups/${backup}`, {
          recursive: true
        });
      });

      console.log(Utils.infoPrefix + 'Cleared backups');
    }
  }
});