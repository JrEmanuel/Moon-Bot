const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = async (channel, executor, announceLockdown = true, reply, type) => {
    return new Promise(async resolve => {
        const replyToUser = (content, ephemeral = false) => {
            if (reply) reply(content, { ephemeral });
            else channel.send(content);
        };

        if (config.Moderation.Logs.Enabled && !Utils.findChannel(config.Moderation.Logs.Channel, channel.guild)) {
            replyToUser(Embed({ preset: "console" }), true);
            return resolve();
        }

        let lockedChannel = await Utils.variables.db.get.getLockedChannel(channel.id);
        if (lockedChannel) {
            replyToUser(Embed({
                preset: "error",
                description: lang.ModerationModule.Commands.Lock.AlreadyLocked
            }), true);
            return resolve();
        }

        const addedRoles = channel.permissionOverwrites.cache.filter(overwrite => overwrite.type == "role").filter(overwrite => {
            return overwrite.allow.has(Utils.Discord.Permissions.FLAGS.VIEW_CHANNEL);
        }).map(overwrite => channel.guild.roles.cache.get(overwrite.id));

        let overwrites = [];
        await Utils.asyncForEach(addedRoles, async (r) => {
            if (Object.values(config.LockUnlock.Ignore).find(i => i.toLowerCase() == r.name.toLowerCase() || r.id == i.id)) return;
            if (Object.values(config.LockUnlock.Whitelisted).find(w => w.toLowerCase() == r.name.toLowerCase() || r.id == w.id)) overwrites.push({ id: r.id, parameters: { 'SEND_MESSAGES': true } });
            else overwrites.push({ id: r.id, parameters: { 'SEND_MESSAGES': false } });
        });

        overwrites.forEach(async overwrite => await channel.permissionOverwrites.edit(overwrite.id, overwrite.parameters));
        Utils.variables.db.update.locked_channels.add(channel.guild.id, channel.id, channel.permissionOverwrites.cache);
        if (type == "message" ? announceLockdown : true) replyToUser(Embed({
            color: config.EmbedColors.Success,
            title: lang.ModerationModule.Commands.Lock.Locked
        }), !announceLockdown);

        if (announceLockdown && config.Moderation.Logs.Enabled) {
            Utils.findChannel(config.Moderation.Logs.Channel, channel.guild).send(Embed({
                author: lang.ModerationModule.Commands.Lock.Log.Author,
                description: lang.ModerationModule.Commands.Lock.Log.Description
                    .replace(/{executor}/g, executor)
                    .replace(/{channel}/g, channel)
                    .replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        }

        return resolve(true);
    });
};
