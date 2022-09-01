const Utils = require("../../modules/utils.js");
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "userinfo",
    run: async (bot, messageOrInteraction, args, {member, guild, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction) || member;

            if (!targetUser) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.Global.InvalidUser
                }), { ephemeral: true });

                return resolve();
            }

            let roles = targetUser.roles.cache.sort((a, b) => b.position - a.position).map(r => r.toString()).join(", ").replace(", @everyone", "");
            let embed = Embed({
                thumbnail: targetUser.user.displayAvatarURL({ dynamic: true }),
                timestamp: new Date(),
                title: lang.Other.OtherCommands.Userinfo.Title,
                fields: [
                    { name: lang.Other.OtherCommands.Userinfo.Fields[0], value: `<@${targetUser.id}>` },
                    { name: lang.Other.OtherCommands.Userinfo.Fields[1], value: targetUser.id },
                    { name: lang.Other.OtherCommands.Userinfo.Fields[2], value: targetUser.user.createdAt.toLocaleString() },
                    { name: lang.Other.OtherCommands.Userinfo.Fields[3], value: targetUser.joinedAt.toLocaleString() },
                    { name: lang.Other.OtherCommands.Userinfo.Fields[4], value: targetUser.roles.highest.toString() },
                    { name: lang.Other.OtherCommands.Userinfo.Fields[5], value: roles.length == 0 ? lang.Global.None : roles }
                ]
            });
            if (targetUser.id === guild.ownerId) embed.embeds[0].fields.push({ name: lang.Other.OtherCommands.Userinfo.Fields[6].Name, value: lang.Other.OtherCommands.Userinfo.Fields[6].Value });
            
            reply(embed);

            return resolve(true);
        });
    },
    description: "View your or a certain user's info",
    usage: "userinfo [@user]",
    aliases: [
        "whois"
    ],
    arguments: [
        {
            name: "user",
            description: "The user to view info for",
            required: false,
            type: "USER"
        }
    ]
};
