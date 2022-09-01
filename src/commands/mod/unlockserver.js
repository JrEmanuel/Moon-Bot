const unlock = require("../../modules/methods/unlockChannel");
const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { config, lang } = Utils.variables;

module.exports = {
    name: "unlockserver",
    run: async (bot, messageOrInteraction, args, { member, guild, reply }) => {
        return new Promise(async resolve => {
            const logs = Utils.findChannel(config.Moderation.Logs.Channel, guild);
            if (config.Moderation.Logs.Enabled && !logs) {
                reply(Embed({ 
                    preset: "console" 
                }));
            }

            reply(Embed({
                title: lang.ModerationModule.Commands.UnlockServer.Unlocking
            })).then(async m => {
                const ticketsApplications = [...await Utils.getOpenTickets(guild), ...await Utils.getOpenApplications(guild)].map(c => c.id);

                await guild.channels.cache.filter(c => c.type == 'GUILD_TEXT' && !ticketsApplications.includes(c.id)).forEach(async c => {
                    let locked = await Utils.variables.db.get.getLockedChannel(c.id);
                    if (locked) unlock(c, member, false);
                });

                m.edit(Embed({
                    title: lang.ModerationModule.Commands.UnlockServer.Disabled,
                    color: config.EmbedColors.Error
                }));

                if (config.Moderation.Logs.Enabled) {
                    logs.send(Embed({
                        author: lang.ModerationModule.Commands.UnlockServer.Log.Author,
                        description: lang.ModerationModule.Commands.UnlockServer.Log.Description.replace(/{member}/g, member).replace(/{time}/g, Math.floor(Date.now() / 1000))
                    }));
                }

                return resolve(true);
            });
        });
    },
    description: "Unlock the server or all channels that are locked",
    usage: "unlockserver",
    aliases: ["unlockdown", "unlockall", "serverunlockdown", "unlockdownserver"],
    arguments: []
};
