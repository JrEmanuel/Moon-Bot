const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, message) => {
    let CommandHandler = require('../modules/handlers/CommandHandler.js');
    if (CommandHandler.commands.length > 0) {
        if (message.channel.type == 'DM' || !config.Logs.Enabled.includes("MessageDeleted")) return;
        if (config.Other.IgnoredGuilds.includes(message.guild.id)) return;

        const validPrefixes = [`<@!${bot.user.id}>`, await Utils.variables.db.get.getPrefixes(message.guild.id), config.Prefix];

        const prefixFound = validPrefixes.find(p => message.content ? message.content.startsWith(p) : false);

        const args = [];
        message.content ? message.content.replace(/\s+/g, ' ').trim().split(" ").forEach((arg, i) => {
            // If the prefix is mentioning the bot and the argument is the second (the command)
            if (prefixFound == validPrefixes[0] && i == 1) args[0] += arg;
            else args.push(arg);
        }) : "";

        let cmd;
        let command;

        if (prefixFound) {
            cmd = args.shift().slice(prefixFound.length);
            command = CommandHandler.find(cmd, true);
        }

        if (command) return;

        let logs = Utils.findChannel(config.Logs.Channels.MessageDeleted, message.guild);

        if (!logs || message.author.bot) return;

        let embed = Embed({
            author: lang.LogSystem.MessageDeleted.Author,
            description: lang.LogSystem.MessageDeleted.Description
                .replace(/{user}/g, message.member)
                .replace(/{channel}/g, message.channel)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        });

        if (message.content.length > 1024) {
            let paste = await Utils.paste(message.content);
            if (paste) embed.embeds[0].description += lang.LogSystem.MessageDeleted.Message.Long.replace(/{paste}/g, paste);
        } else {
            embed.embeds[0].description += message.content.length ? lang.LogSystem.MessageDeleted.Message.Content.replace(/{content}/g, Utils.Discord.Util.escapeMarkdown(message.content)) : lang.LogSystem.MessageDeleted.Message.NoContent;
        }

        if (message.attachments.size) {
            embed.embeds[0].description += lang.LogSystem.MessageDeleted.Attachments.replace(/{attachments}/g, message.attachments.map(a => `[${a.name}](${a.proxyURL})`).join(" | "));
        }

        return logs.send(embed);
    }
};
