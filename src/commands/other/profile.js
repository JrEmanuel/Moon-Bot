const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: "profile",
    run: async (bot, messageOrInteraction, args, { member, reply }) => {
        return new Promise(async resolve => {
            const targetUser = Utils.ResolveUser(messageOrInteraction) || member;

            const { xp, level } = await Utils.variables.db.get.getExperience(targetUser) || { xp: 0, level: 1 };
            const coins = await Utils.variables.db.get.getCoins(targetUser) || 0;
            const messageCount = await Utils.variables.db.get.getMessageCount(targetUser) || 0;
            const voiceData = await Utils.variables.db.get.getVoiceData(targetUser) || { total_time: 0 };

            let xpBar = "[";

            const levelXp = ~~(level * (175 * level) * 0.5);
            const percent = (xp / levelXp) * 100;

            const filledBars = ~~(percent / 5);

            if (filledBars > 0) {
                xpBar += "**";

                let i = 0;
                while (i < filledBars) {
                    xpBar += "=";
                    i++;
                }

                xpBar += "**" + "=".repeat((20 - filledBars) || 0) + "]";
            } else {
                xpBar += "=".repeat(20) + "]";
            }

            let coinStatus = await Utils.variables.db.get.getModules("coins");
            let xpStatus = await Utils.variables.db.get.getModules("exp");

            reply(Embed({
                author: {
                    icon: targetUser.user.displayAvatarURL({ dynamic: true }),
                    text: targetUser.displayName
                },
                title: lang.Other.OtherCommands.Profile.Title,
                description: xpStatus && xpStatus.enabled ? lang.Other.OtherCommands.Profile.Description
                    .replace(/{bars}/g, xpBar)
                    .replace(/{percent}/g, ~~percent)
                    .replace(/{next_level}/g, level + 1) : undefined,
                fields: [
                    coinStatus && coinStatus.enabled ? {
                        name: lang.Other.OtherCommands.Profile.Fields[0] + "",
                        value: coins.toLocaleString(),
                        inline: true
                    } : undefined,
                    coinStatus && coinStatus.enabled ? {
                        name: "⠀",
                        value: "⠀",
                        inline: true
                    } : undefined,
                    {
                        name: lang.Other.OtherCommands.Profile.Fields[3],
                        value: messageCount.toLocaleString(),
                        inline: true
                    },
                    xpStatus && xpStatus.enabled ? {
                        name: lang.Other.OtherCommands.Profile.Fields[1],
                        value: level.toLocaleString(),
                        inline: true
                    } : undefined,
                    xpStatus && xpStatus.enabled ? {
                        name: "⠀",
                        value: "⠀",
                        inline: true
                    } : undefined,
                    xpStatus && xpStatus.enabled ? {
                        name: lang.Other.OtherCommands.Profile.Fields[2],
                        value: xp.toLocaleString(),
                        inline: true
                    } : undefined,
                    {
                        name: lang.Other.OtherCommands.Profile.Fields[4],
                        value: voiceData.total_time == 0 ? lang.Global.None : Utils.DDHHMMSSfromMS(voiceData.total_time, false),
                        inline: xpStatus && xpStatus.enabled ? false : true
                    }
                ].filter(f => f),
                timestamp: new Date()
            }));

            return resolve(true);
        });
    },
    description: "View a user's profile",
    usage: "profile [@user]",
    aliases: [
       "stats"
    ],
    arguments: [
        {
            name: "user",
            description: "The user to view the profile of",
            required: false,
            type: "USER"
        }
    ]
};
