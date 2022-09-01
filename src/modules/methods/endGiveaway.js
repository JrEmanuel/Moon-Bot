const Utils = require("../utils");
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = async (bot, giveaway) => {
    const guild = bot.guilds.cache.get(giveaway.guild);
    const channel = guild ? guild.channels.cache.get(giveaway.channel) : undefined;
    const message = channel ? await channel.messages.fetch(giveaway.message).catch(() => { }) : undefined;

    if (!message) return await Utils.variables.db.update.giveaways.deleteGiveaway(giveaway.messageID);

    await Utils.variables.db.update.giveaways.setToEnded(giveaway.message);

    const winners = [];
    const link = `https://discordapp.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`;

    let getReactions = async () => {
        let r = await Utils.variables.db.get.getGiveawayReactions(giveaway.message);
        r = r.map(r => new Array(r.entries).fill().map(() => r.user)).flat();
        return r;
    };

    let reactions = await getReactions();

    for (let i = 0; i < giveaway.amount_of_winners; i++) {
        let index = ~~(Math.random() * reactions.length);
        let user = reactions[index];

        if (user) {
            winners.push(user);
            reactions.splice(index, 1);

            await Utils.variables.db.update.giveaways.reactions.removeReaction(giveaway.message, user);
            reactions = await getReactions();
        }
    }

    await Utils.variables.db.update.giveaways.setWinners(JSON.stringify(winners), giveaway.message);

    const members = winners.filter(winner => winner).map(winner => `<@${winner}>`);
    const giveawayMessage = Utils.variables.embeds.Embeds.GiveawayEnded;

    message.edit(Utils.setupMessage({
        configPath: giveawayMessage,
        variables: [
            { searchFor: /{prize}/g, replaceWith: giveaway.prize },
            { searchFor: /{description}/g, replaceWith: !giveaway.description ? "" : "\n" + giveaway.description + "\n" },
            { searchFor: /{winners}/g, replaceWith: members.length ? members.join("\n") : lang.Global.None },
            { searchFor: /{host}/g, replaceWith: `<@${giveaway.host}>` },
        ]
    }));

    if (winners.length) {
        channel.send(Embed({
            title: lang.GiveawaySystem.GiveawayEnded.Winners.Title,
            description: lang.GiveawaySystem.GiveawayEnded.Winners.Description
                .replace(/{name}/g, giveaway.prize)
                .replace(/{url}/g, link)
                .replace(/{winners}/g, members.join(", ")),
            timestamp: new Date()
        }));

        channel.send(members.join(", ")).then(m => Utils.delete(m, 3000));

        if (Utils.variables.config.Other.Giveaways.WinnerRole) {
            let role = Utils.findRole(Utils.variables.config.Other.Giveaways.WinnerRole, guild);
            if (role) {
                winners.forEach(async winner => {
                    let member = await guild.members.fetch(winner).catch(() => { });
                    if (member) member.roles.add(role);
                });
            }
        }
    } else channel.send(Embed({
        title: lang.GiveawaySystem.GiveawayEnded.NoWinners.Title,
        description: lang.GiveawaySystem.GiveawayEnded.NoWinners.Description
            .replace(/{name}/g, giveaway.prize)
            .replace(/{url}/g, link),
        timestamp: new Date()
    }));
};
