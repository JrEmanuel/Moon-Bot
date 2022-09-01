const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'deleterole',
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, user, guild, reply }) => {
        return new Promise(async resolve => {
            let toDelete;

            if (type == "message") toDelete = messageOrInteraction.mentions.roles.first() || guild.roles.cache.find(r => r.name == args.join(" ").toLowerCase() || r.id == args[0]);
            else toDelete = guild.roles.cache.find(r => r.id == args[0]);

            if (!toDelete) {
                reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Deleterole.Errors.InvalidRole, usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            let msg = await reply(Embed({ title: lang.AdminModule.Commands.Deleterole.Confirmation }));
            await msg.react('✅');
            await msg.react('❌');
            Utils.waitForReaction(['✅', '❌'], user.id, msg).then(reaction => {
                msg.reactions.removeAll();

                if (reaction.emoji.name == '✅') {
                    msg.edit(Embed({ title: lang.AdminModule.Commands.Deleterole.Deleted, color: config.EmbedColors.Default })).then(async () => await toDelete.delete());

                    return resolve(true);
                } else {
                    msg.edit(Embed({ title: lang.AdminModule.Commands.Deleterole.Canceled, color: config.EmbedColors.Error }));

                    return resolve();
                }
            });    
        });
    },
    description: "Delete a role on the Discord server",
    usage: 'deleterole <@role>',
    aliases: [],
    arguments: [
        {
            name: "role",
            description: "The role to delete",
            required: true,
            type: "ROLE"
        }
    ]
};
