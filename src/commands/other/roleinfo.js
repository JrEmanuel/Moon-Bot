const { capitalize } = require("lodash");
const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "roleinfo",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, guild, reply }) => {
        return new Promise(async resolve => {
            if (!args.length) {
                reply(Embed({ 
                    preset: 'invalidargs', 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            const role = (type == "message" ? messageOrInteraction.mentions.roles.first() : guild.roles.cache.get(args[0])) || Utils.findRole(args.join(" "), guild, false);

            if (!role) {
                reply(Embed({
                    preset: 'invalidargs',
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            const members = [...role.members.values()]
                .slice(0, 12)
                .map((member, i) => {
                    if (i == 11) return '...';
                    return ' <@' + member.user.id + '>';
                });

            reply(Embed({
                color: role.hexColor,
                title: lang.Other.OtherCommands.Roleinfo.Title,
                description: `<@&${role.id}>`,
                fields: [
                    { name: lang.Other.OtherCommands.Roleinfo.Fields[0], value: role.createdAt.toLocaleString(), inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: lang.Other.OtherCommands.Roleinfo.Fields[1], value: role.position, inline: true },
                    { name: lang.Other.OtherCommands.Roleinfo.Fields[2], value: role.permissions.toArray().map(perm => "`" + perm.toLowerCase().split("_").map(word => capitalize(word)).join(" ") + "`").join(" | ") || lang.Global.NoPerms, inline: true },
                    { name: '\u200B', value: '\u200B', inline: true },
                    { name: lang.Other.OtherCommands.Roleinfo.Fields[3].replace(/{amount}/g, role.members.size ? role.members.size : 0), value: members && members.length ? members.join("") : lang.Global.NoMembers, inline: true }
                ],
                footer: { text: lang.Other.OtherCommands.Roleinfo.Footer.replace(/{id}/g, role.id), icon: bot.user.displayAvatarURL({ dynamic: true }) }
            }));

            return resolve(true);
        });
    },
    description: "View information on a role",
    usage: "roleinfo <@role>",
    aliases: [],
    arguments: [
        {
            name: "role",
            description: "The role to view information of",
            required: true,
            type: "ROLE"
        }
    ]
};
