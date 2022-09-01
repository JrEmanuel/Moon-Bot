const Utils = require("../../modules/utils");
const { Embed, variables: { lang } } = Utils;

module.exports = {
    name: "channelinfo",
    run: async (bot, messageOrInteraction, args, { member, guild, channel: commandChannel, reply }) => {
        return new Promise(async resolve => {
            let channel = Utils.ResolveChannel(messageOrInteraction) || (args.length ? guild.channels.cache.find(c => c.name.toLowerCase() == args.join(" ").toLowerCase() || c.id == args[0]) : undefined) || commandChannel;
            let type = channel.type;
            let overwrites = channel.permissionOverwrites.cache;
            let fields = [
                {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[0],
                    value: type == "GUILD_CATEGORY" ? channel.name : channel.toString()
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[1],
                    value: channel.id
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[2],
                    value: `<t:${~~(channel.createdAt.getTime() / 1000)}:f> (<t:${~~(channel.createdAt.getTime() / 1000)}:R>)`
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[3],
                    value: overwrites.filter(o => o.type == "role" && o.id !== channel.guild.id).map(o => `<@&${o.id}>`).join(" ") || lang.Global.None
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[4],
                    value: overwrites.filter(o => o.type == "member").map(o => `<@${o.id}>`).join(" ") || lang.Global.None
                }];
            let title;

            if (type == "GUILD_VOICE") {
                let tempchannels = Array.from(Utils.variables.tempChannels.entries());
                let tempchannel = tempchannels.find(t => t[1].channel.id == channel.id);

                if (tempchannel) fields.push({ name: lang.Other.OtherCommands.ChannelInfo.Fields[5], value: '<@' + guild.members.cache.get(tempchannel[0]).id + '>' });

                fields.push({
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[6],
                    value: (channel.bitrate / 1000) + "kbps"
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[7],
                    value: `${channel.members.size} / ${channel.userLimit || lang.Global.Unlimited}`
                });

                title = lang.Other.OtherCommands.ChannelInfo.Title[0];
            } else if (type == "GUILD_CATEGORY") {
                fields.push({
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[8],
                    value: channel.children.filter(c => c.permissionsFor(member).has("VIEW_CHANNEL")).map(c => c.toString()).join(" ") || lang.Global.None
                });

                title = lang.Other.OtherCommands.ChannelInfo.Title[1];
            } else if (type == "GUILD_TEXT") {
                fields.push({
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[9],
                    value: channel.nsfw ? lang.Global.Yes : lang.Global.No
                }, {
                    name: lang.Other.OtherCommands.ChannelInfo.Fields[10],
                    value: channel.topic || lang.Global.None
                });

                title = lang.Other.OtherCommands.ChannelInfo.Title[2];
            } else if (type == "GUILD_NEWS") {
                title = lang.Other.OtherCommands.ChannelInfo.Title[3];
            } else if (type == "GUILD_STAGE_VOICE") {
                title = lang.Other.OtherCommands.ChannelInfo.Title[4];
            }

            reply(Embed({ 
                title, 
                fields, 
                timestamp: new Date() 
            }));

            return resolve(true);
        });
    },
    usage: "channelinfo [#channel]",
    description: "View info on a channel",
    aliases: [],
    arguments: [
        {
            name: "channel",
            description: "The channel to view info of",
            required: false,
            type: "CHANNEL"
        }
    ]
};
