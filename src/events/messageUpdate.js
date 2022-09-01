const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = async (bot, oldMessage, newMessage) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (newMessage.channel.type == 'DM' || !config.Logs.Enabled.includes("MessageEdited")) return;
        if (config.Other.IgnoredGuilds.includes(oldMessage.guild.id)) return;

        let channel = Utils.findChannel(config.Logs.Channels.MessageEdited, oldMessage.guild);

        if (!channel || oldMessage.author.bot || oldMessage.content == newMessage.content) return;

        let embed = Embed({
            author: lang.LogSystem.MessageUpdated.Author,
            description: lang.LogSystem.MessageUpdated.Description
            .replace(/{message-url}/g, newMessage.url)
            .replace(/{user}/g, newMessage.member)
            .replace(/{old}/g, Utils.Discord.Util.escapeMarkdown(oldMessage.content))
            .replace(/{new}/g, Utils.Discord.Util.escapeMarkdown(newMessage.content))
            .replace(/{time}/g, ~~(Date.now() / 1000))
        });

        channel.send(embed);

        // ANTI ADVERTISEMENT SYSTEM
        if (newMessage.content && Utils.hasAdvertisement(newMessage.content)) {
            if (config.AntiAdvertisement.Chat.Enabled && !Utils.hasPermission(newMessage.member, config.AntiAdvertisement.BypassRole)) {
                if (["ticket-", "application-"].some(name => newMessage.channel.name.startsWith(name))) return;
                if (config.AntiAdvertisement.Whitelist.Channels.some(channel => newMessage.channel.name == channel || newMessage.channel.id == channel)) return;

                newMessage.delete();
                newMessage.channel.send(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, newMessage.author) })).then(Utils.delete);

                if (config.AntiAdvertisement.Chat.Logs.Enabled) {
                    const logs = Utils.findChannel(config.AntiAdvertisement.Chat.Logs.Channel, newMessage.guild);

                    if (logs) logs.send(Embed({
                        author: lang.AntiAdSystem.Log.Author,
                        description: lang.AntiAdSystem.Log.Description
                        .replace(/{user}/g, newMessage.member)
                        .replace(/{channel}/g, newMessage.channel)
                        .replace(/{time}/g, ~~(Date.now() / 1000))
                        .replace(/{message}/g, newMessage.content
                            .split(" ")
                            .map(word => {
                                if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                else return word;
                            })
                            .join(" "))
                    }));
                }
            }
        }
    }
};
