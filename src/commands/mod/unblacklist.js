const { capitalize } = require("lodash");
const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { config, embeds, lang } = Utils.variables;

module.exports = {
    name: "unblacklist",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const command = args[1] ? args[1].toLowerCase() : undefined;

            if (!targetUser || !command) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            if (Utils.hasPermission(targetUser, config.Moderation.CommandBlacklistBypass)) {
                reply(Embed({
                    preset: "error",
                    description: lang.ModerationModule.Commands.Unblacklist.Errors.CannotBeBlacklisted
                }), { ephemeral: true });
                return resolve();
            }

            const currentBlacklists = await Utils.variables.db.get.getBlacklists(targetUser);

            if (!currentBlacklists) {
                reply(Embed({
                    preset: "error",
                    description: lang.ModerationModule.Commands.Unblacklist.Errors.NotBlacklisted[0]
                }), { ephemeral: true });
                return resolve();
            }

            if (!currentBlacklists.includes(command)) {
                reply(Embed({
                    preset: "error",
                    description: lang.ModerationModule.Commands.Unblacklist.Errors.NotBlacklisted[1]
                }), { ephemeral: true });
                return resolve();
            }

            await Utils.variables.db.update.blacklists.removeBlacklist(targetUser, command);

            reply(Utils.setupMessage({
                configPath: {},
                title: lang.ModerationModule.Commands.Unblacklist.Embeds.Unblacklisted.Title,
                description: (command == "all" ? lang.ModerationModule.Commands.Unblacklist.Embeds.Unblacklisted.Description[0] : lang.ModerationModule.Commands.Unblacklist.Embeds.Unblacklisted.Description[1].replace(/{command}/g, command)).replace(/{user}/g, targetUser),
                timestamp: true,
                color: config.EmbedColors.Success,
                variables: [
                    ...Utils.userVariables(targetUser, "user"),
                    ...Utils.userVariables(member, "executor"),
                    { searchFor: /{command}/g, replaceWith: command }
                ]
            }));

            if (embeds.Embeds.Unblacklisted) targetUser.send(Utils.setupMessage({
                configPath: embeds.Embeds.Unblacklisted,
                variables: [
                    ...Utils.userVariables(targetUser, "user"),
                    ...Utils.userVariables(member, "executor"),
                    { searchFor: /{command}/g, replaceWith: capitalize(command) },
                    { searchFor: /{server-name}/g, replaceWith: guild.name }
                ]
            })).catch(() => { });

            resolve(true);

            if (!config.Moderation.Logs.Enabled) return;

            let logs = Utils.findChannel(config.Moderation.Logs.Channel, guild);
            if (!logs) return;

            logs.send(Utils.Embed({
                author: lang.ModerationModule.Commands.Unblacklist.Embeds.Log.Author,
                description: lang.ModerationModule.Commands.Unblacklist.Embeds.Log.Description.replace(/{executor}/g, member).replace(/{user}/g, targetUser).replace(/{command}/g, command).replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        });
    },
    aliases: [],
    description: "Unblacklist a user",
    usage: "unblacklist <@user> <all/command>",
    arguments: [
        {
            name: "user",
            description: "The user to unblacklist",
            required: true,
            type: "USER"
        },
        {
            name: "command",
            description: "The command to unblacklist (or \"all\" to unblacklist all commands)",
            required: true,
            type: "STRING"
        }
    ]
};
