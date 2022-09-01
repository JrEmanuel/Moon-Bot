const { capitalize } = require("lodash");
const CommandHandler = require("../../modules/handlers/CommandHandler");
const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { config, embeds, lang } = Utils.variables;

module.exports = {
    name: "blacklist",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction);
            const command = args[1] ? args[1].toLowerCase() : undefined;
            const cmd = command == "all" ? true : CommandHandler.commands.find(c => c.command == command);

            if (!targetUser) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            if (Utils.hasPermission(targetUser, config.Moderation.CommandBlacklistBypass)) {
                reply(Embed({
                    preset: "error",
                    description: lang.ModerationModule.Commands.Blacklist.Errors.CantBeBlacklisted
                }), { ephemeral: true });
                return resolve();
            }

            const currentBlacklists = await Utils.variables.db.get.getBlacklists(targetUser);

            if (command) {
                if (!cmd) {
                    reply(Embed({
                        preset: "error",
                        description: lang.ModerationModule.Commands.Blacklist.Errors.InvalidCommand
                    }), { ephemeral: true });
                    return resolve();
                }

                if (currentBlacklists && (currentBlacklists.includes(command) || currentBlacklists.includes("all"))) {
                    reply(Embed({
                        preset: "error",
                        description: currentBlacklists.includes("all") ? lang.ModerationModule.Commands.Blacklist.Errors.AlreadyBlacklistedAll : lang.ModerationModule.Commands.Blacklist.Errors.AlreadyBlacklistedCommand.replace(/{command}/g, command)
                    }));
                    return resolve(true);
                }

                await Utils.variables.db.update.blacklists.addBlacklist(targetUser, command);

                reply(Utils.setupMessage({
                    configPath: command == "all" ? embeds.Embeds.UserBlacklisted.All : embeds.Embeds.UserBlacklisted.Command,
                    variables: [
                        ...Utils.userVariables(targetUser, "user"),
                        ...Utils.userVariables(member, "executor"),
                        { searchFor: /{command}/g, replaceWith: command }
                    ]
                }));

                if (embeds.Embeds.Blacklisted) targetUser.send(Utils.setupMessage({
                    configPath: embeds.Embeds.Blacklisted,
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
                    author: lang.ModerationModule.Commands.Blacklist.Embeds.Log.Author,
                    description: lang.ModerationModule.Commands.Blacklist.Embeds.Log.Description.replace(/{executor}/g, member).replace(/{user}/g, targetUser).replace(/{command}/g, command).replace(/{time}/g, ~~(Date.now() / 1000))
                }));
            } else {
                if (!currentBlacklists || !currentBlacklists.length) {
                    reply(Embed({
                        preset: "error",
                        description: lang.ModerationModule.Commands.Blacklist.Errors.NotBlacklisted
                    }));
                    return resolve(true);
                }

                reply(Embed({
                    title: lang.ModerationModule.Commands.Blacklist.Embeds.List.Title,
                    description: (currentBlacklists.includes("all") ? lang.ModerationModule.Commands.Blacklist.Embeds.List.Description[0] : lang.ModerationModule.Commands.Blacklist.Embeds.List.Description[1].replace(/{commands}/g, currentBlacklists.map(b => {
                        return `\`${b}\``;
                    }).join(", "))).replace(/{user}/g, targetUser),
                    timestamp: new Date()
                }));

                return resolve(true);
            }
        });
    },
    aliases: [],
    description: "Blacklist a user from running all or a specific command",
    usage: "blacklist <@user> [all/command]",
    arguments: [
        {
            name: "user",
            description: "The user to blacklist",
            required: true,
            type: "USER"
        },
        {
            name: "command",
            description: "The command to blacklist (or \"all\" for all commands)",
            required: false,
            type: "STRING"
        }
    ]
};
