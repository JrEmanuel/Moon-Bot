const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, m) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (m.first().channel.type == 'DM' || !config.Logs.Enabled.includes("MessagesDeleted")) return;
        if (config.Other.IgnoredGuilds.includes(m.first().guild.id)) return;

        let msgs = Array.from(m.values());
        let channel = Utils.findChannel(config.Logs.Channels.MessageDeleteBulk, msgs[0].guild);

        if (!channel || msgs[0].channel.type == "DM") return;

        let embed = Embed({
            author: lang.LogSystem.MessagesBulkDeleted.Author,
            description: lang.LogSystem.MessagesBulkDeleted.Description
                .replace(/{channel}/g, `<#${msgs[0].channel.id}>`)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        });

        let messages = msgs.map(m => {
            let msgInfo = `**${m.author.tag}** | <t:${Math.floor(m.createdTimestamp / 1000)}:d> | `;

            let content = "";
            let embeds = "";
            let attachments = "";
            if (m.content) {
                content = Utils.Discord.Util.escapeMarkdown(m.content);
            }

            if (m.embeds.length) {
                let title = m.embeds[0].title;
                let description = m.embeds[0].description;
                let newLine = embeds.length || content.length ? "\n" : "";
                embeds = `${newLine}**Embed:** ${title || description}`;
            }
            if (m.attachments.size) {
                let newLine = embeds.length || content.length ? "\n" : "";
                attachments = newLine + lang.LogSystem.MessagesBulkDeleted.Attachment.replace(/{url}/g, m.attachments.first().proxyURL);
            }

            return msgInfo + content + embeds + attachments;
        }).join("\n");

        if (messages.length > 1024) {
            let paste = await Utils.paste(messages);
            messages = lang.LogSystem.MessagesBulkDeleted.TooLong.replace(/{paste}/g, paste);
        }

        embed.embeds[0].description = embed.embeds[0].description.replace(/{messages}/g, messages);

        channel.send(embed);
    }
};
