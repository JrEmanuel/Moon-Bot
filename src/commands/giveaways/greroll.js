const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { lang } = Utils.variables;

module.exports = {
    name: "greroll",
    run: async (bot, messageOrInteraction, args, { slashCommand, type, reply }) => {
        return new Promise(async resolve => {
            const giveaway = (type == "message" ? args.length > 0 : slashCommand?.arguments?.giveaway) ? await Utils.variables.db.get.getGiveawayFromID(type == "message" ? args[0] : slashCommand?.arguments?.giveaway) || await Utils.variables.db.get.getGiveawayFromName(args.join(" ")) : await Utils.variables.db.get.getLatestGiveaway();

            if ((type == "message" ? args.length > 0 : slashCommand?.arguments?.giveaway) && !giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.UnknownGiveaway
                }), { ephemeral: true });
                return resolve();
            }

            if (!giveaway) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NoGiveaways
                }), { ephemeral: true });
                return resolve();
            }

            if (!giveaway.ended) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NotEnded
                }), { ephemeral: true });
                return resolve();
            }

            const guild = bot.guilds.cache.get(giveaway.guild);
            const channel = guild ? guild.channels.cache.get(giveaway.channel) : undefined;
            const msg = channel ? await channel.messages.fetch(giveaway.message) : undefined;
            const link = `https://discordapp.com/channels/${giveaway.guild}/${giveaway.channel}/${giveaway.message}`;

            if (!msg) {
                if (type == "interaction") reply(Embed({
                    title: "Giveaway not found"
                }), { ephemeral: true });
                return resolve();
            }

            let getReactions = async () => {
                let r = await Utils.variables.db.get.getGiveawayReactions(giveaway.message);
                r = r.map(r => new Array(r.entries).fill().map(() => r.user)).flat();
                return r;
            };

            const winners = await Utils.variables.db.get.getGiveawayWinners(giveaway.message);
            let reactions = await getReactions();

            const newWinners = [];

            if (reactions.length == 0) {
                reply(Embed({
                    preset: "error",
                    description: lang.GiveawaySystem.Errors.NoOneEntered
                }), { ephemeral: true });
                return resolve();
            }

            const mentionedUsers = type == "message" ? [...messageOrInteraction.mentions.members.values()] : (slashCommand?.arguments?.user?.split(" ") || []).map(user => guild.members.cache.get(user.replace(/[<@!>]/g, ""))).filter(user => user);

            if (mentionedUsers.length) {
                mentionedUsers.forEach(async member => {
                    if (winners.includes(member.id)) {
                        let newWinner = reactions[~~(Math.random() * reactions.length)];

                        winners.splice(winners.indexOf(member.id), 1, newWinner);
                        newWinners.push(newWinner);
                        await Utils.variables.db.update.giveaways.reactions.removeReaction(giveaway.message, newWinner);

                        reactions = await getReactions();
                    }
                });
            } else {
                winners.forEach(async (winner, i) => {
                    let newWinner = reactions[~~(Math.random() * reactions.length)];

                    winners.splice(i, 1, newWinner);
                    newWinners.push(newWinner);
                    await Utils.variables.db.update.giveaways.reactions.removeReaction(giveaway.message, newWinner);

                    reactions = await getReactions();
                });
            }

            channel.send(Embed({
                title: lang.GiveawaySystem.Commands.Greroll.Title,
                description: lang.GiveawaySystem.Commands.Greroll.Description.replace(/{name}/g, giveaway.prize).replace(/{link}/g, link).replace(/{winners}/g, winners.map(winner => `<@${winner}>`).join(", ")),
                timestamp: new Date()
            }));

            channel.send(newWinners.map(winner => `<@${winner}>`).join(", ")).then(m => Utils.delete(m, 3000));

            const giveawayMessage = Utils.variables.embeds.Embeds.GiveawayEnded;

            msg.edit(Utils.setupMessage({
                configPath: giveawayMessage,
                variables: [
                    { searchFor: /{prize}/g, replaceWith: giveaway.prize },
                    { searchFor: /{description}/g, replaceWith: !giveaway.description ? "" : "\n" + giveaway.description + "\n" },
                    { searchFor: /{winners}/g, replaceWith: winners.map(winner => `<@${winner}>`).join("\n") },
                    { searchFor: /{host}/g, replaceWith: `<@${giveaway.host}>` },
                ]
            }));

            if (Utils.variables.config.Other.Giveaways.WinnerRole) {
                let role = Utils.findRole(Utils.variables.config.Other.Giveaways.WinnerRole, guild);
                if (role) {
                    newWinners.forEach(async winner => {
                        let member = await guild.members.fetch(winner).catch(() => { });
                        if (member) member.roles.add(role);
                    });
                }
            }

            await Utils.variables.db.update.giveaways.setWinners(JSON.stringify(winners), giveaway.message);
            reply(Embed({ title: "Giveaway rerolled!" }), { ephemeral: true });

            return resolve(true);
        });
    },
    description: "Create a new set of winners for the giveaway",
    usage: "greroll [giveaway name] [@user]",
    aliases: [],
    arguments: [
        {
            name: "giveaway",
            description: "The name or ID of the giveaway to reroll",
            required: false,
            type: "STRING"
        },
        {
            name: "user",
            description: "The user(s) to reroll",
            required: false,
            type: "STRING"
        }
    ]
};
