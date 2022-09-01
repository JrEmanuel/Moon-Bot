const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "simplement",
    run: async (bot, messageOrInteraction, args, { prefixUsed, member, guild, reply }) => {
        return new Promise(async resolve => {
            if (!Utils.hasPermission(member, config.Suggestions.ManageSuggestionsRole)) {
                reply(Embed({ preset: "nopermission" }), { ephemeral: true });

                return resolve();
            }

            let id = args[0];
    
            if (!id) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Simplement.NoID,
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            let suggestion = await Utils.variables.db.get.getSuggestionByMessage(id) || await Utils.variables.db.get.getSuggestionByID(id);
    
            if (suggestion) {
                const update = require("../../modules/methods/updateSuggestion");
                const suggestionMessage = await guild.channels.cache.get(suggestion.channel)?.messages.fetch(suggestion.message);
                const reason = args.slice(1).join(" ") || "N/A";
    
                update(suggestionMessage, "implemented", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Simplement.Implemented
                }));

                return resolve(true);
            }
    
            else {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Simplement.InvalidID
                }), { ephemeral: true });

                return resolve();
            }    
        });
    },
    description: "Change a suggestion to implemented",
    aliases: ["simplemented", "implement", "implemented"],
    usage: "simplement <message ID/suggestion ID> [reason]",
    arguments: [
        {
            name: "id",
            description: "The ID of the suggestion or message to implement",
            required: true,
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for implementing the suggestion",
            required: false,
            type: "STRING"
        }
    ]
};
