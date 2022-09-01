const Utils = require('../utils');
const { paste } = Utils;
const chalk = require('chalk');

module.exports = (bot) => {
    (async () => {
        const warnings = await require('./getWarnings')(bot);
        let index = 0;

        if (index == bot.guilds.cache.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).size - 1) {
            if (warnings.length > 0) {
                paste(`Created At: ${new Date().toLocaleString()}\nBot Info:\n  Tag => ${bot.user.tag}\n  ID => ${bot.user.id}\n  Guilds => ${bot.guilds.cache.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).size}\n  Users => ${bot.users.cache.size}\n\nWarnings:\n${warnings.map(warning => '- ' + warning).join('\n')}`)
                    .then(res => {
                        console.log(Utils.warningPrefix + "One or more errors have automatically been detected, you can view them here: " + chalk.red(res));
                    })
                    .catch(() => {
                        paste(`Created At: ${new Date().toLocaleString()}\nBot Info:\n  Tag => ${bot.user.tag}\n  ID => ${bot.user.id}\n  Guilds => ${bot.guilds.cache.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).size}\n  Users => ${bot.users.cache.size}\n\nWarnings:\n${warnings.map(warning => '- ' + warning).join('\n')}`, "https://paste.corebot.dev")
                            .then(res => {
                                console.log(Utils.warningPrefix + "One or more errors have automatically been detected, you can view them here: " + chalk.red(res));
                            })
                            .catch(err => {
                                console.log(Utils.errorPrefix + 'An error occured while creating the startup report.');
                                require('../error')(err.message, err.stack, "generateReport.js:23", false);
                            });
                    });
            }
        }
        index++;
    })();
};
