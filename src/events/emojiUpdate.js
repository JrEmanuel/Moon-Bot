const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, oldEmoji, newEmoji) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!config.Logs.Enabled.includes("EmojiUpdated")) return;
        if (config.Other.IgnoredGuilds.includes(oldEmoji.guild.id)) return;

        const logs = Utils.findChannel(config.Logs.Channels.EmojiUpdated, newEmoji.guild);
        if (!logs) return;
        logs.send(Utils.Embed({
            author: lang.LogSystem.EmojiUpdated.Author,
            description: lang.LogSystem.EmojiUpdated.Description
                .replace(/{emoji}/g, newEmoji)
                .replace(/{old}/g, oldEmoji.name)
                .replace(/{new}/g, newEmoji.name)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    }
};
