const lock = require("../../modules/methods/lockChannel");
const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { config, lang } = Utils.variables;

module.exports = {
    name: "lockserver",
    run: async (bot, messageOrInteraction, args, { member, guild, reply }) => {
        return new Promise(async resolve => {
            let logs = Utils.findChannel(config.Moderation.Logs.Channel, guild);
            if (config.Moderation.Logs.Enabled && !logs) {
                reply(Embed({ preset: 'console' }), { ephemeral: true });
                return resolve();
            }
    
            reply(Embed({
                title: lang.ModerationModule.Commands.LockServer.Locking
            })).then(async m => {
                let ticketsApplications = [...await Utils.getOpenTickets(guild), ...await Utils.getOpenApplications(guild)].map(c => c.id);
    
                await guild.channels.cache.filter(c => c.type == 'GUILD_TEXT' && !ticketsApplications.includes(c.id)).forEach(async c => {
                    let locked = await Utils.variables.db.get.getLockedChannel(c.id);
                    if (!locked) lock(c, member, false);
                });
    
                m.edit(Embed({
                    title: lang.ModerationModule.Commands.LockServer.Enabled,
                    color: config.EmbedColors.Success
                }));
    
                if (config.Moderation.Logs.Enabled) {
                    logs.send(Embed({
                        author: lang.ModerationModule.Commands.LockServer.Log.Author,
                        description: lang.ModerationModule.Commands.LockServer.Log.Description.replace(/{member}/g, member).replace(/{time}/g, Math.floor(Date.now() / 1000))
                    }));
                }

                return resolve(true);
            });
        });
    },
    description: "Lock the channel so users cannot send messages",
    usage: "lockserver",
    aliases: ["lockdown", "lockall", "serverlockdown", "lockdownserver"],
    arguments: []
};
