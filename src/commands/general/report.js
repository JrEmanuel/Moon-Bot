const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'report',
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, guild, reply }) => {
        return new Promise(resolve => {
            const user = Utils.ResolveUser(messageOrInteraction);
            const channel = Utils.findChannel(config.Channels.Reports, guild);
            const reason = args.slice(1).join(" ");

            if (!channel) {
                reply(Embed({ preset: 'console' }), { ephemeral: true });
                return resolve();
            }
            if (args.length == 0) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
            if (!user) {
                reply(Embed({ preset: 'error', description: lang.Global.InvalidUser, usage: module.exports.usage }), { ephemeral: true });
                return resolve();
            }
            if (user.user.bot) {
                reply(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.ReportBot }), { ephemeral: true });
                return resolve();
            }
            if (user.id === member.user.id) {
                reply(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.ReportSelf }), { ephemeral: true });
                return resolve();
            }
            if (args.length < 2) {
                reply(Embed({ preset: 'error', description: lang.ModerationModule.Commands.Report.Errors.InvalidReason, usage: module.exports.usage }), { ephemeral: true });
                return resolve();
            }

            channel.send(Embed({
                title: lang.ModerationModule.Commands.Report.Embeds.Report.Title,
                fields: [
                    { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[0], value: '<@' + user.id + '>' },
                    { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[1], value: '<@' + member.user.id + '>' },
                    { name: lang.ModerationModule.Commands.Report.Embeds.Report.Fields[2], value: reason },
                ],
                timestamp: new Date()
            }));

            if (type == "message") messageOrInteraction.delete();
            reply(Embed({ title: lang.ModerationModule.Commands.Report.Embeds.Reported.Title, description: lang.ModerationModule.Commands.Report.Embeds.Reported.Description, timestamp: new Date() }), { ephemeral: true })
                .then(m => {
                    if (type == "message") Utils.delete(m, 5000);
                });
            resolve(true);
        });
    },
    description: "Report a user in the Discord server",
    usage: 'report <@user> <reason>',
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to report",
            required: true,
            type: "USER",
        },
        {
            name: "reason",
            description: "The reason for the report",
            required: true,
            type: "STRING"
        }
    ]
};
