const Utils = require("../modules/utils.js");
const { config, lang } = Utils.variables;

module.exports = async (bot, type, user, executor, warning = undefined) => {
    if (!config.Moderation.Logs.Enabled) return;

    let logs = Utils.findChannel(config.Moderation.Logs.Channel, executor.guild);

    if (!logs) return;

    if (type == "warn") {
        let warnedBy = executor.guild.members.cache.get(warning.executor);

        logs.send(Utils.Embed({
            author: lang.ModerationModule.Logs.UserUnwarned.Author,
            description: lang.ModerationModule.Logs.UserUnwarned.Description
                .replace(/{executor}/g, executor)
                .replace(/{user}/g, user)
                .replace(/{warning}/g, lang.ModerationModule.Logs.UserUnwarned.Warning.replace(/{id}/g, warning.id).replace(/{user}/g, warnedBy || lang.Global.Unknown).replace(/{date}/g, (new Date(warning.time).toLocaleString())).replace(/{reason}/g, warning.reason))
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    } else {
        logs.send(Utils.Embed({
            author: lang.ModerationModule.Logs.UserUnpunished.Author,
            description: lang.ModerationModule.Logs.UserUnpunished.Description
                .replace(/{executor}/g, executor)
                .replace(/{punishment-type}/g, type.replace("temp", "temporary "))
                .replace(/{user}/g, user)
                .replace(/{time}/g, ~~(Date.now() / 1000))
        }));
    }

};
