const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;

module.exports = {
    name: 'sudo',
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, channel, reply }) => {
        return new Promise(async resolve => {
            let mentionedUser = Utils.ResolveUser(messageOrInteraction, 0, false);
            if (!mentionedUser) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            let msg = args.slice(1).join(" ");
            if (!msg.length) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            let webhook = (await channel.fetchWebhooks()).find(webhook => webhook.name == "sudo");
            if (!webhook) webhook = await channel.createWebhook("sudo");

            webhook.send({
                content: msg,
                username: mentionedUser.user.username,
                avatarURL: mentionedUser.user.displayAvatarURL({ dynamic: true })
            });

            if (type == "message") messageOrInteraction.delete().catch(() => { });
            else reply(Embed({
                color: Utils.variables.config.EmbedColors.Success,
                title: Utils.variables.lang.AdminModule.Commands.Sudo
            }), { ephemeral: true });

            return resolve(true);
        });
    },
    description: "Send a fake message from another user",
    usage: 'sudo <@user> <message>',
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to send the message as",
            required: true,
            type: "USER"
        },
        {
            name: "message",
            description: "The message to send",
            required: true,
            type: "STRING"
        }
    ]
};
