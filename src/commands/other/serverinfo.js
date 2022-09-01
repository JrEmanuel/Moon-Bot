const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'serverinfo',
    run: async (bot, messageOrInteraction, args, { member, guild, reply }) => {
        return new Promise(async resolve => {
            let more = lang.Other.OtherCommands.Serverinfo.More;
            let channelText = "";
            let channels = guild.channels.cache.filter(channel => channel.type == 'GUILD_TEXT' && !(channel.name.startsWith("ticket-") || channel.name.startsWith("application-")) && channel.members.has(member.id));
            let chs = [];

            for (let i = 0; i < channels.size && channelText.length < 1024; i++) {
                let channel = channels.at(i);
                chs.push(channel);
                let channelText = chs.map(c => c.toString()).join(", ");
                if (channelText.length > 1024) chs.splice(chs.length - 1, 1);
            }

            channelText = chs.map(c => c.toString()).join(", ");

            if (chs.length != channels.size) {
                while ((channelText + ", " + more).length > 1024) {
                    chs.splice(chs.length - 1, 1);
                    channelText = chs.map(c => c.toString()).join(", ");
                }
                channelText = channelText + ", " + more;
            }

            let roleText = "";
            let roles = guild.roles.cache;
            let rs = [];

            for (let i = 0; i < roles.size && roleText.length < 1024; i++) {
                let role = roles.at(i);
                rs.push(role);
                let roleText = rs.map(c => c.toString()).join(", ");
                if (roleText.length > 1024) rs.splice(rs.length - 1, 1);
            }

            roleText = rs.map(c => c.toString()).join(", ");

            if (rs.length != roles.size) {
                while ((roleText + ", " + more).length > 1024) {
                    rs.splice(rs.length - 1, 1);
                    roleText = rs.map(c => c.toString()).join(", ");
                }
                roleText = roleText + ", " + more;
            }

            let emojis = guild.emojis.cache;
            let emojiText = "";
            let ems = [];

            for (let i = 0; i < emojis.size && emojiText.length < 1024; i++) {
                let emoji = emojis.at(i);
                ems.push(emoji);
                let emojiText = ems.map(c => c.toString()).join(", ");
                if (emojiText.length > 1024) ems.splice(ems.length - 1, 1);
            }

            emojiText = ems.length ? ems.map(c => c.toString()).join(", ") : lang.Global.None;

            if (ems.length != emojis.size) {
                while ((emojiText + ", " + more).length > 1024) {
                    ems.splice(ems.length - 1, 1);
                    emojiText = ems.map(c => c.toString()).join(", ");
                }
                emojiText = emojiText + ", " + more;
            }

            const members = await guild.members.fetch();
            const owner = await guild.fetchOwner();
            reply(Embed({
                title: guild.name,
                thumbnail: guild.iconURL(),
                fields: [
                    { name: lang.Other.OtherCommands.Serverinfo.Fields[0], value: '<@' + owner.id + '>' },
                    { name: lang.Other.OtherCommands.Serverinfo.Fields[1], value: guild.createdAt.toLocaleString() },
                    {
                        name: lang.Other.OtherCommands.Serverinfo.Fields[2].Name,
                        value: lang.Other.OtherCommands.Serverinfo.Fields[2].Value
                            .replace(/{humans}/g, members.filter(m => !m.user.bot).size)
                            .replace(/{bots}/g, members.filter(m => m.user.bot).size)
                            .replace(/{total}/g, messageOrInteraction.guild.memberCount)
                    },
                    { name: lang.Other.OtherCommands.Serverinfo.Fields[4].replace(/{amount}/g, channels.size), value: channelText },
                    { name: lang.Other.OtherCommands.Serverinfo.Fields[5].replace(/{amount}/g, guild.roles.cache.size), value: roleText },
                    { name: lang.Other.OtherCommands.Serverinfo.Fields[6].replace(/{amount}/g, guild.emojis.cache.size), value: emojiText }
                ]
            }));

            return resolve(true);
        });
    },
    description: "View server information",
    usage: "serverinfo",
    aliases: [],
    arguments: []
};
