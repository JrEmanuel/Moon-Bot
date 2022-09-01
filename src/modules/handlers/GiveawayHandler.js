const EventHandler = require("./EventHandler");
const endGiveaway = require('../methods/endGiveaway');
const Utils = require('../utils');
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = async function (bot) {

    EventHandler.set('guildMemberRemove', async (bot, member) => {
        const reactions = await Utils.variables.db.get.getGiveawayReactions();
        const giveaways = reactions.filter(r => r.user == member.user.id);

        giveaways.forEach(async g => {
            const giveaway = await Utils.variables.db.get.getGiveaways(g.giveaway);
            const requirements = JSON.parse(giveaway.requirements);

            if (!giveaway.ended && requirements.server && requirements.server.id == member.guild.id) {
                Utils.variables.db.update.giveaways.reactions.removeReaction(g.giveaway, member.user.id);
                member.send(Embed({
                    title: lang.GiveawaySystem.LeftRequiredServer.Title,
                    color: Utils.variables.config.EmbedColors.Error,
                    description: lang.GiveawaySystem.LeftRequiredServer.Description
                        .replace(/{name}/g, giveaway.prize)
                        .replace(/{url}/g, `https://discordapp.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`)
                        .replace(/{server-name}/g, member.guild.name)
                        .replace(/{server-link}/g, requirements.server.link),
                    timestamp: new Date()
                })).catch(() => { });
            }
        });
    });

    async function handle() {
        const Giveaways = await Utils.variables.db.get.getGiveaways();
        Giveaways.filter(giveaway => !giveaway.ended).forEach(async giveaway => {

            if (giveaway.end <= Date.now()) return endGiveaway(bot, giveaway);

            const guild = bot.guilds.cache.get(giveaway.guild);
            const channel = guild ? guild.channels.cache.get(giveaway.channel) : undefined;
            const message = channel ? await channel.messages.fetch(giveaway.message) : undefined;

            if (!message) return await Utils.variables.db.update.giveaways.deleteGiveaway(giveaway.messageID);
        });
    }

    handle();
    setInterval(handle, 30000);
};
