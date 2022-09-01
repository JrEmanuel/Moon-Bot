const Utils = require("../../utils");
const { variables: { commands, config }, Embed } = Utils;
const chalk = require("chalk");

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (!command) return resolve();

        let permission = commands.Permissions[command.command];

        if (!permission) {
            // Checks if it's a default command and should be in the commands.yml
            // If it is not a default command and is from an addon, the addon will need to deal with permissions.
            if (!command.addonName) {
                permission = ["@everyone"];
            }
        }

        if (permission) {
            if (typeof permission == "string") permission = [permission];

            let role = permission.some(perm => !!Utils.findRole(perm, guild, false));
            let user = permission.some(perm => !!guild.members.cache.get(perm));

            if (!role && !user) {
                console.log(Utils.errorPrefix + `Invalid permissions were set for the ${chalk.bold(command.command)} command.\n${chalk.gray(">")}          The following role names, role IDs, or user IDs do not exist in your server:\n${chalk.gray(">")}          ` + permission.join(", "));
                reply(Embed({ preset: 'console' }));
                return reject();
            }

            if (!Utils.hasPermission(member, permission)) {
                reply(Embed({ preset: 'nopermission', roles: role ? permission.map(perm => Utils.findRole(perm, guild, false)).filter(r => r) : undefined })).then(m => {
                    if (command.command == "snote") {
                        if ([channel.name, channel.id].includes(config.Suggestions.Channels.Suggestions)) {
                            Utils.delete(m);
                        }
                    } else if (command.command == "bnote") {
                        if ([channel.name, channel.id].includes(config.BugReports.Channels.Pending)) {
                            Utils.delete(m);
                        }
                    }
                });
                return reject();
            }
        }

        return resolve();
    });
};
