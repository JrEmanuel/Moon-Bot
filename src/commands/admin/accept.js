const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "accept",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, guild, reply }) => {
        return new Promise(async resolve => {
            let id = args[0];

            if (!id) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Accept.NoID,
                    usage: module.exports.usage
                }, { prefixUsed }), {
                    ephemeral: true
                });

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
                const reason = args.slice(1).join(" ");
    
                update(suggestionMessage, "accepted", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Accept.Suggestion
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
                const reason = args.slice(1).join(" ") || "N/A";
    
                update(bugreportMessage, "accepted", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Accept.BugReport
                }));

                return resolve(true);
            }
    
            else if (application) {
                if (!Utils.hasPermission(member, config.Applications.Reviewers)) {
                    reply(Embed({ preset: "nopermission" }), { ephemeral: true });
                    return resolve();
                }
    
                const reason = args.slice(1).join(" ") || "N/A";
                const applyingUser = guild.members.cache.get(application.creator);
                if (!applyingUser) {
                    reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Application.Errors.UserLeft }), { ephemeral: true });
                    return resolve();
                }
    
                const applicationChannel = guild.channels.cache.get(application.channel_id);
    
                if (application.status == 'Accepted') {
                    reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Application.Errors.AlreadyAccepted }), { ephemeral: true });
                    return resolve();
                }
    
                const positions = config.Applications.Positions;
                const position = positions[application.rank];
                if (!position) {
                    reply(Embed({ preset: 'error', description: lang.TicketModule.Commands.Apply.Errors.PositionNotFound.replace(/{pos}/g, application.rank) }), { ephemeral: true });
                    return resolve();
                }
    
                if (config.Applications.AddRoleWhenAccepted) {
                    const role = Utils.findRole(position.Role, guild);
                    if (!role) reply(Embed({ preset: "error", description: lang.TicketModule.Commands.Apply.Errors.RoleNotFound.replace(/{role}/g, position.Role) }), { ephemeral: true });
                    else applyingUser.roles.add(role);
                }
    
                const embed = Utils.Embed({ title: lang.TicketModule.Commands.Application.Embeds.Accepted.Title, description: lang.TicketModule.Commands.Application.Embeds.Accepted.Description.replace(/{reason}/g, reason), color: config.EmbedColors.Success });
                if (config.Applications.DMDecision) applyingUser.send(embed).catch(() => reply(lang.TicketModule.Commands.Application.Errors.CantNotify, { ephemeral: true }));
    
                await Utils.variables.db.update.applications.setStatus(applicationChannel.id, 'Accepted');
    
                applicationChannel.send({ content: `<@${applyingUser.id}>`, embeds: embed.embeds });
    
                let newTopic = config.Applications.Channel.Topic.replace(/{user-tag}/g, applyingUser.user.tag).replace(/{user-id}/g, applyingUser.id).replace(/{position}/g, application.rank).replace(/{status}/g, "Accepted");
                await applicationChannel.setTopic(newTopic);
    
                bot.emit("applicationAccepted", application, member, reason);

                return resolve(true);
            }
    
            else {
                reply(Embed({
                    preset: "error",
                    description: "That is not a valid suggestion, bug report, or application message ID"
                }), { ephmeral: true });

                return resolve();
            }    
        });
    },
    description: "Change a suggestion, bug report, or application to accepted",
    aliases: ["accepted"],
    usage: "accept <channel/message ID> <reason>",
    arguments: [
        {
            name: "id",
            description: "The channel or message ID of the suggestion, bug report, or application",
            required: true,
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for accepting the suggestion, bug report, or application",
            required: false,
            type: "STRING"
        }
    ]
};
