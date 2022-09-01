const Utils = require("../../modules/utils");
const { Embed } = Utils;
const { config, db, lang } = Utils.variables;

module.exports = {
    name: "rank",
    run: async (bot, messageOrInteraction, args, { member, guild, reply, prefixUsed }) => {
        return new Promise(async resolve => {
            const mem = Utils.ResolveUser(messageOrInteraction) || member;

            if (mem.user.bot) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.Global.InvalidUser, 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            const coins = (await db.get.getCoins())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== 'unknown' &&
                    c.coins &&
                    c.coins >= 0 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(c.user) : true))
                .sort((a, b) => b.coins - a.coins);
            const coinRank = coins.indexOf(coins.find(c => c.user == mem.user.id)) + 1;

            const xp = (await db.get.getExperience())
                .filter(x => x.guild == guild.id &&
                    x.user &&
                    x.user.toLowerCase() !== 'unknown' &&
                    x.xp >= 0 &&
                    x.level >= 1 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(x.user) : true))
                .sort((a, b) => b.xp - a.xp);
            const xpRank = xp.indexOf(xp.find(x => x.user == mem.user.id)) + 1;

            const messageCount = (await Utils.variables.db.get.getMessageCount())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== 'unknown' &&
                    c.count &&
                    c.count >= 0 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(c.user) : true)
                )
                .sort((a, b) => b.count - a.count);
            const messageCountRank = messageCount.indexOf(messageCount.find(c => c.user == mem.user.id)) + 1;

            const voiceTime = (await Utils.variables.db.get.getVoiceData())
                .filter(c => c.guild == guild.id &&
                    c.user &&
                    c.user.toLowerCase() !== 'unknown' &&
                    c.total_time &&
                    c.total_time > 0 &&
                    (config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(c.user) : true)
                )
                .sort((a, b) => b.total_time - a.total_time);
            const voiceTimeRank = voiceTime.indexOf(voiceTime.find(c => c.user == mem.user.id)) + 1;

            reply(Utils.Embed({
                author: {
                    text: mem.user.username,
                    icon: mem.user.displayAvatarURL({ dynamic: true })
                },
                title: mem.user.id == member.id ? lang.GeneralModule.Commands.Rank.You.Title : lang.GeneralModule.Commands.Rank.SomeoneElse.Title.replace(/{user}/g, mem.user.tag),
                fields: [
                    { name: lang.GeneralModule.Commands.Rank.You.Fields[0].Name, value: mem.user.id == member.id ? (coinRank ? lang.GeneralModule.Commands.Rank.You.Fields[0].Value[0].replace(/{rank}/g, coinRank) : lang.GeneralModule.Commands.Rank.You.Fields[0].Value[1]) : (coinRank ? lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[0].Value[0].replace(/{user}/g, mem).replace(/{rank}/g, coinRank) : lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[0].Value[1].replace(/{user}/g, mem)) },
                    { name: lang.GeneralModule.Commands.Rank.You.Fields[1].Name, value: mem.user.id == member.id ? (xpRank ? lang.GeneralModule.Commands.Rank.You.Fields[1].Value[0].replace(/{rank}/g, xpRank) : lang.GeneralModule.Commands.Rank.You.Fields[1].Value[1]) : (xpRank ? lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[1].Value[0].replace(/{user}/g, mem).replace(/{rank}/g, xpRank) : lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[1].Value[1].replace(/{user}/g, mem)) },
                    { name: lang.GeneralModule.Commands.Rank.You.Fields[2].Name, value: mem.user.id == member.id ? (messageCountRank ? lang.GeneralModule.Commands.Rank.You.Fields[2].Value[0].replace(/{rank}/g, messageCountRank) : lang.GeneralModule.Commands.Rank.You.Fields[2].Value[1]) : (messageCountRank ? lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[2].Value[0].replace(/{user}/g, mem).replace(/{rank}/g, messageCountRank) : lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[2].Value[1].replace(/{user}/g, mem)) },
                    { name: lang.GeneralModule.Commands.Rank.You.Fields[3].Name, value: mem.user.id == member.id ? (voiceTimeRank ? lang.GeneralModule.Commands.Rank.You.Fields[3].Value[0].replace(/{rank}/g, voiceTimeRank) : lang.GeneralModule.Commands.Rank.You.Fields[3].Value[1]) : (voiceTimeRank ? lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[3].Value[0].replace(/{user}/g, mem).replace(/{rank}/g, voiceTimeRank) : lang.GeneralModule.Commands.Rank.SomeoneElse.Fields[3].Value[1].replace(/{user}/g, mem)) }
                ],
                timestamp: new Date()
            }));
            return resolve(true);
        });
    },
    aliases: [],
    description: "View your rank in the coin and level leaderboard",
    usage: "rank [@user]",
    arguments: [
        {
            name: "target",
            description: "The user to check rankings for (@user)",
            required: false,
            type: "USER"
        }
    ]

};
