const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "deny",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member,  guild, reply }) => {
        return new Promise(async resolve => {
            let id = args[0];

            if (!id) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Deny.NoID,
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            let suggestion = await Utils.variables.db.get.getSuggestionByMessage(id);
            let bugreport = suggestion ? undefined : await Utils.variables.db.get.getBugreport(id);
            let application = suggestion || bugreport ? undefined : await Utils.variables.db.get.getApplications(id);
    
            if (suggestion) {
                if (!Utils.hasPermission(member, config.Suggestions.ManageSuggestionsRole)) {
                    reply(Embed({ preset: "nopermission" }), { ephemeral: true });
                    return resolve();
                }
    
                const update = require("../../modules/methods/updateSuggestion");
                const suggestionMessage = await guild.channels.cache.get(suggestion.channel)?.messages.fetch(suggestion.message);
                const reason = (type == "message" ? args.slice(1).join(" ") : args[1]) || "N/A";
    
                update(suggestionMessage, "denied", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Deny.Suggestion
                }));

                return resolve(true);
            }
    
            else if (bugreport) {
                if (!Utils.hasPermission(member, config.BugReports.ManageBugReportsRole)) {
                    reply(Embed({ preset: "nopermission" }), { ephemeral: true });

                    return resolve();
                }
    
                const update = require("../../modules/methods/updateBugreport");
                const bugreportMessage = await guild.channels.cache.get(bugreport.channel)?.messages.fetch(bugreport.message);
                const reason = (type == "message" ? args.slice(1).join(" ") : args[1]) || "N/A";
    
                update(bugreportMessage, "denied", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Deny.BugReport
                }));

                return resolve(true);
            }
    
            else if (application) {
                if (!Utils.hasPermission(member, config.Applications.Reviewers)) {
                    reply(Embed({ preset: "nopermission" }), { ephemeral: true });

                    return resolve();
                }
    
                const reason = (type == "message" ? args.slice(1).join(" ") : args[1]) || "N/A";
                const applyingUser = guild.members.cache.get(application.creator);
                if (!applyingUser) {
                    reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.UserLeft }), { ephemeral: true });

                    return resolve();
                }

                const applicationChannel = guild.channels.cache.get(application.channel_id);
                const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Denied.Title, description: lang.TicketModule.Commands.Application.Embeds.Denied.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Error });
                
                if (config.Applications.DMDecision) applyingUser.send(embed).catch(() => applicationChannel.send(lang.TicketModule.Commands.Application.Errors.CantNotify));
    
                await Utils.variables.db.update.applications.setStatus(applicationChannel.id, 'Denied');
    
                applicationChannel.send({ content: `<@${applyingUser.id}>`, embeds: embed.embeds });
    
                let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Denied");
                await applicationChannel.setTopic(newTopic);
    
                bot.emit("applicationDenied", application, member, reason);

                reply(Embed({
                    title: lang.AdminModule.Commands.Deny.Application
                }));

                return resolve(true);
            }
    
            else {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Deny.InvalidID
                }), { ephemeral: true });

                return resolve();
            }    
        });
    },
    description: "Change a suggestion, bug report, or application to denied",
    aliases: ["denied"],
    usage: "deny <channel/message ID> <reason>",
    arguments: [
        {
            name: "id",
            description: "The channel or message ID of the suggestion, bug report, or application",
            required: true,
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for denying the suggestion, bug report, or application",
            required: false,
            type: "STRING"
        }
    ]
};
