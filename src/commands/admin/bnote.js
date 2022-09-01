const Utils = require('../../modules/utils');
const { config, lang } = Utils.variables;

module.exports = {
    name: "bnote",
    run: async (bot, messageOrInteraction, args, { prefixUsed, commandUsed, type, member, channel, reply }) => {
        return new Promise(async (resolve) => {
            if (type == "message") messageOrInteraction.delete().catch(() => { });

            let channels = Object.values(config.BugReports.Channels);
            let note = type == "message" ? messageOrInteraction.content.substring((prefixUsed + commandUsed).length) : args[0];

            if (!channels.includes(channel.id) && !channels.includes(channel.name)) {
                reply(Utils.Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Bnote.NotBugReportChannel
                }), { ephemeral: true, deleteAfter: 3000 });

                return resolve();
            }
            if (!note.length) {
                reply(Utils.Embed({
                    preset: 'invalidargs',
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true, deleteAfter: 3000 });

                return resolve();
            }

            let webhook = (await channel.fetchWebhooks()).find(webhook => webhook.name.toLowerCase() == "bug reports");

            if (!webhook) webhook = await channel.createWebhook("Bug Reports");

            let username = config.BugReports.Notes.Account.Username;
            let avatar = config.BugReports.Notes.Account.Avatar;
            let text = config.BugReports.Notes.Message.Text;

            Utils.userVariables(member, "user").forEach(variable => {
                username = username.replace(variable.searchFor, variable.replaceWith);
                avatar = avatar.replace(variable.searchFor, variable.replaceWith);
                text = text.replace(variable.searchFor, variable.replaceWith);
            });

            if (config.BugReports.Notes.Message.Type == "text") {
                webhook.send({
                    content: text.replace(/{note}/g, note),
                    username,
                    avatarURL: avatar
                });
            } else {
                webhook.send({
                    embeds: Utils.setupMessage({
                        configPath: config.BugReports.Notes.Message.Embed,
                        variables: [
                            ...Utils.userVariables(member, "user"),
                            { searchFor: /{note}/g, replaceWith: note }
                        ]
                    }).embeds,
                    username,
                    avatarURL: avatar
                });
            }

            if (type == "interaction") reply(Utils.Embed({
                title: lang.AdminModule.Commands.Bnote.Success.Title,
                description: lang.AdminModule.Commands.Bnote.Success.Description,
                color: config.EmbedColors.Success
            }), { ephemeral: true });

            return resolve(true);
        });
    },
    description: "Send a message in a bug channel",
    usage: "bnote <message>",
    aliases: ['bugreportnote', 'bugnote', 'bmsg', 'bugmessage'],
    arguments: [
        {
            name: "message",
            description: "The message to send",
            required: true,
            type: "STRING"
        }
    ]
};
