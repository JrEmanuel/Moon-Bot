const { capitalize } = require("lodash");
const Utils = require("../utils");
const { config, embeds, lang, db } = Utils.variables;
const { Embed } = Utils;

module.exports = (message, status, reason, changedBy) => {
    return new Promise(async (resolve, reject) => {
        if (!["pending", "accepted", "denied", "fixed"].includes(status.toLowerCase())) return reject("Bug report status must be one of the following: pending, accepted, denied, fixed");

        const report = await db.get.getBugreport(message.id);

        if (!report) return reject("Provided message is not a bug report");

        let bot = message.guild.me.user;
        let creator = await bot.client.users.fetch(report.creator);
        let proper = capitalize(status);
        let statusTranslation = config.BugReports.Statuses[proper];
        let channel = Utils.findChannel(config.BugReports.Channels[proper], message.guild);

        if (!channel) return reject(`${proper} bug reports channel does not exist`);

        let embed = Utils.setupMessage({
            configPath: status == "pending" ? embeds.Embeds.PendingBugreport : embeds.Embeds.Bugreport,
            color: config.BugReports.Colors[proper],
            image: report.image ? report.image : undefined,
            variables: [
                ...Utils.userVariables(creator, "user"),
                ...Utils.userVariables(bot, "bot"),
                ...Utils.userVariables(changedBy, "changed-by"),
                { searchFor: /{bug}/g, replaceWith: report.bug || lang.Global.Image },
                { searchFor: /{reason}/g, replaceWith: reason || "N/A" },
                { searchFor: /{status}/g, replaceWith: statusTranslation }
            ]
        });

        (channel.id == message.channel.id ? message.edit(embed) : channel.send(embed))
            .then(async msg => {
                if (channel.id !== message.channel.id) message.delete();

                await Utils.variables.db.update.bugreports.setStatus(msg.channel.id, msg.id, status.toLowerCase(), changedBy.id, message.id);
                resolve();

                if (config.BugReports.NotifyUserOnStatusChange) {
                    creator.send(Embed({
                        title: status == "pending" ? lang.Other.BugReportStatusChanged.Pending : lang.Other.BugReportStatusChanged.Other.replace(/{status}/g, statusTranslation.toLowerCase()),
                        fields: reason && reason !== "N/A" ? [
                            { name: lang.Other.BugReportStatusChanged.Reason, value: reason }
                        ] : undefined,
                        url: `https://discord.com/channels/${report.guild}/${msg.channel.id}/${msg.id}`
                    })).catch(() => { });
                }

                if (config.BugReports.AddManagementReactions) {
                    ["Accepted", "Denied", "Fixed", "Pending"].filter(type => proper !== type).forEach(async type => {
                        if (type == "Pending") type = "Reset";
                        await msg.react(Utils.findEmoji(config.BugReports.Emojis[type], bot, false) || config.BugReports.Emojis[type]);
                    });
                }
            });
    });
};
