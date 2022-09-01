const Utils = require("../modules/utils");
const { config, lang } = Utils.variables;

module.exports = async (bot, member) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!config.Logs.Enabled.includes("MemberBoosted")) return;
        if (config.Other.IgnoredGuilds.includes(member.guild.id)) return;

        const logs = Utils.findChannel(config.Logs.Channels.MemberBoosted, member.guild);
        if (!logs) return;

        logs.send(Utils.Embed({
            author: {
                text: lang.LogSystem.MemberBoosted.Author,
                icon: `https://cdn.discordapp.com/emojis/800234541779910676.gif?`
            },
            description: lang.LogSystem.MemberBoosted.Description
                .replace(/{member}/g, member)
                .replace(/{time}/g, ~~(member.premiumSinceTimestamp / 1000))
        }));
    }
};
