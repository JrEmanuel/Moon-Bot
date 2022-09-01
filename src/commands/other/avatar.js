const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "avatar",
    run: async (bot, messageOrInteraction, args, { member, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction) || member;
            let avatar = targetUser.user.displayAvatarURL({ dynamic: true, format: "png" });

            if (!avatar.endsWith('?size=2048')) avatar += "?size=2048";

            reply(Embed({
                title: lang.Other.OtherCommands.Avatar.Title.replace(/{user}/g, targetUser.user.username).replace(/{tag}/g, targetUser.user.tag),
                image: avatar,
                timestamp: new Date(),
                footer: {
                    text: bot.user.username,
                    icon: bot.user.displayAvatarURL({ dynamic: true })
                }
            }));

            return resolve(true);
        });
    },
    description: "View a user's avatar",
    usage: "avatar [@user]",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to view the avatar of",
            required: false,
            type: "USER"
        }
    ]
};
