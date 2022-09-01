const Utils = require("../../utils");
const chalk = require("chalk");
const { variables: { config } } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (config.Other.MissingRolesAndChannelsNotification && (command ? !["command", "modules", "reload", "setup"].includes(command.command) : true)) {

            let missingRequirements = false;
            let getMissingRolesAndChannels = require("../getMissingRolesAndChannels");

            let missingLog = [];
            await getMissingRolesAndChannels(Utils.variables.bot, guild).then(missing => {
                let spacing = `${chalk.gray(">")}          `;

                if (missing.channels.categories.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Categories:")}\n${spacing}${missing.channels.categories.map(c => `${c.name}${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`);
                }
                if (missing.channels.text.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Text Channels:")}\n${spacing}${missing.channels.text.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`);
                }
                if (missing.channels.voice.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Voice Channels:")}\n${spacing}${missing.channels.voice.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`);
                }
                if (missing.roles.length > 0) {
                    missingLog.push(`\n${spacing}\n${spacing}${chalk.bold("Missing Roles:")}\n${spacing}${missing.roles.map(c => `${c.name} ${chalk.yellow(`(Setting: ${chalk.white(c.setting.join(`\n${spacing}`))})`)}`).join(`\n${spacing}`)}`);
                }
                if (missingLog.length > 0) {
                    missingRequirements = true;

                    console.log(Utils.warningPrefix + chalk.red(chalk.bold("Missing Channels or Roles: ")) + `\n${spacing}The ${chalk.bold(message.guild.name)} guild is missing roles and/or channels.${missingLog}\n${spacing}\n${spacing}${chalk.green(chalk.bold("How To Resolve:"))}\n${spacing}Run the ${chalk.bold("/setup")} command in your server, or configure the config to match your Discord\n${spacing}-----------------------------------------------------------------------------------------------------------------------`);

                    return reject();
                }
            });

            if (missingRequirements) return reject();
        }

        return resolve();
    });
};
