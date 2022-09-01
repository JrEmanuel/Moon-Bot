const Utils = require("../utils");
const { config, db } = Utils.variables;

module.exports = {
    init: async (bot) => {
        if (config.AutoAnnouncements.Announcements.length) {
            let announcements = await db.get.getAnnouncements();

            await config.AutoAnnouncements.Announcements.forEach(async a => {
                let announcement = announcements.find(announcement => {
                    return JSON.stringify(a) == announcement.announcement_data;
                });

                if (!announcement) {
                    await db.update.announcements.add(a);
                } else {
                    if (a.RestartOnBotRestart) await module.exports.send(bot, announcement);
                }
            });

            await announcements.forEach(async a => {
                let announcement = config.AutoAnnouncements.Announcements.find(announcement => {
                    return a.announcement_data == JSON.stringify(announcement);
                });

                if (!announcement) await db.update.announcements.remove(a.id);
            });

            async function check() {
                let announcements = await db.get.getAnnouncements();

                announcements.forEach(a => {
                    if (a.next_broadcast) {
                        if (a.next_broadcast <= Date.now()) module.exports.send(bot, a);
                    } else {
                        module.exports.send(bot, a);
                    }
                });
            }

            check();
            setInterval(check, 1000 * 60);
        }
    },
    send: async (bot, announcement) => {
        let data = JSON.parse(announcement.announcement_data);
        let guild = bot.guilds.cache.first();
        let channel = guild ? Utils.findChannel(data.Channel, guild) : undefined;

        await db.update.announcements.setNextBroadcast(announcement.id, Date.now() + (data.Interval * 1000));

        if (!channel) return;

        let lastMessage = channel.lastMessage;

        if (!lastMessage) {
            await channel.messages.fetch();
            lastMessage = channel.lastMessage;
        }
        
        if (data.Type == "embed" && data.Embed) {
            let embed = Utils.setupMessage({
                configPath: data.Embed
            });

            if (lastMessage && lastMessage.embeds.length && lastMessage.author.id == bot.user.id) {
                if (lastMessage.embeds[0].title && embed.embeds[0].title && embed.embeds[0].title == lastMessage.embeds[0].title) return;
                if (lastMessage.embeds[0].description && embed.embeds[0].description && embed.embeds[0].description == lastMessage.embeds[0].description) return;
            }

            channel.send(embed);
        } else if (data.Content) {
            if (lastMessage && lastMessage.content == data.Content && lastMessage.author.id == bot.user.id) return;
            channel.send(data.Content);
        }
    }
};
