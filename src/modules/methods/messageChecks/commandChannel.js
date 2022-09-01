const Utils = require("../../utils");
const { variables: { config, lang, bot }, Embed } = Utils;
module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (!Utils.hasPermission(member, config.Commands.ChannelBypassRole)) {
            if (!['install', 'verify'].includes(command.command)) {

                let restriction = await Utils.variables.db.get.checkChannelCommandDataExists(command.command) ? await Utils.variables.db.get.getCommandChannelData(command.command) : await Utils.variables.db.get.getCommandChannelData("_global");
                let type = restriction.type;
                let isTicketOrApp = !!(await Utils.variables.db.get.getTickets(channel.id) || await Utils.variables.db.get.getApplications(channel.id));

                let allowed = () => {
                    if (isTicketOrApp) {
                        if (command.type == "tickets") return true;
                        return !!config.Commands.AllowCommandsInTickets;
                    } else {
                        if (type == "blacklist") {
                            if (restriction.channels.includes(channel.id)) return false;
                            return true;
                        }

                        if (type == "whitelist") {
                            if (!restriction.channels.length) return true;
                            if (restriction.channels.includes(channel.id)) return true;
                            return false;
                        }
                    }
                };

                let plural = restriction.channels.length > 1;

                if (!allowed()) {
                    if (type == "message") message.delete();
                    reply(Embed({
                        content: member.toString(),
                        footer: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        color: config.EmbedColors.Error,
                        title: lang.Other.NotCommandsChannel.Title,
                        description: (type == "blacklist" ? `This command must be ran in any channel besides ${plural ? "the following: {channels}" : "{channels}"}` : `This command can only be ran in ${plural ? "the following channels: {channels}" : "{channels}"}`)
                        .replace(/{channels}/g, restriction.channels.filter(id => Utils.findChannel(id, guild, "GUILD_TEXT", false)).map(id => `<#${id}> `).join(" "))
                        .replace(/{user}/g, member)
                    })).then(Utils.delete);

                    return reject();
                }
            }

            return resolve();
        }

        return resolve();
    });
};
