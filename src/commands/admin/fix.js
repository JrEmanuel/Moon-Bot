const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "fix",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, guild, reply }) => {
        return new Promise(async resolve => {
            if (!Utils.hasPermission(member, config.Suggestions.ManageSuggestionsRole)) {
                reply(Embed({ preset: "nopermission" }), { ephemeral: true });

                return resolve();
            }

            let id = args[0];
    
            if (!id) {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Fix.NoID,
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            let bugreport = await Utils.variables.db.get.getBugreport(id);
    
            if (bugreport) {
                const update = require("../../modules/methods/updateBugreport");
                const bugreportMessage = await guild.channels.cache.get(bugreport.channel)?.messages.fetch(bugreport.message);
                const reason = (type == "message" ? args.slice(1).join(" ") : args[1]) || "N/A";
    
                update(bugreportMessage, "fixed", reason, member);
    
                reply(Embed({
                    title: lang.AdminModule.Commands.Fix.BugReport
                }));

                return resolve(true);
            }
    
            else {
                reply(Embed({
                    preset: "error",
                    description: lang.AdminModule.Commands.Fix.InvalidID
                }), { ephemeral: true });

                return resolve();
            }    
        });
    },
    description: "Change a bug report to fixed",
    aliases: ["fixed"],
    usage: "fix <message ID> <reason>",
    arguments: [
        {
            name: "id",
            description: "The message ID of the bug report",
            required: true,
            type: "STRING"
        },
        {
            name: "reason",
            description: "The reason for fixing the bug report",
            required: false,
            type: "STRING"
        }
    ]
};
