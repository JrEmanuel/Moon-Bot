const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, role) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!config.Logs.Enabled.includes("RoleCreated")) return;
        if (config.Other.IgnoredGuilds.includes(role.guild.id)) return;

        const logs = Utils.findChannel(config.Logs.Channels.RoleCreated, role.guild);
        if (!logs) return;
        if (logs) logs.send(Utils.Embed({
            author: lang.LogSystem.RoleCreated.Author,
            description: lang.LogSystem.RoleCreated.Description
                .replace(/{role}/g, role)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    }
};
