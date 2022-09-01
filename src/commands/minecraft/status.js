const Discord = require("discord.js");
const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;
const rp = require("request-promise");

module.exports = {
    name: "status",
    run: async (bot, messageOrInteraction, args, { reply }) => {
        return new Promise(async resolve => {
            const servers = Object.keys(config.Servers).map(serverName => {
                const server = config.Servers[serverName];
                return { name: serverName, queryURL: server.QueryURL, pingURL: server.PingURL };
            });
            let msg = await reply(Embed({ title: lang.MinecraftModule.Commands.Status.LoadingStatus }));
            if (args.length >= 1) {

                let players;
                let total;
                let requiredVersion;
                let max;

                const server = servers.find(s => s.name.toLowerCase() == args.join(" ").toLowerCase());
                if (!server) {
                    msg.delete();

                    reply(Embed({ 
                        preset: 'error', 
                        description: lang.MinecraftModule.Commands.Status.Errors.InvalidServer 
                    }), { ephemeral: true });
                    return resolve();
                }
                
                await rp(server.pingURL).then((html) => {
                    let json = JSON.parse(html);

                    if (json.error) {
                        max = lang.MinecraftModule.Commands.Status.Error;
                        total = lang.MinecraftModule.Commands.Status.Error;
                    } else {
                        max = json.players.max;
                        total = json.players.online;
                        requiredVersion = json.version.name;
                    }
                });
                await rp(server.queryURL).then((html) => {
                    let json = JSON.parse(html);
                    if (json.error) {
                        players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList;
                        if (!requiredVersion) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion;
                    }
                    else {
                        if (!json.Playerlist) players = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchList;
                        else {
                            if (json.Playerlist.length == 0) return players = lang.Global.None;
                            else {
                                players = json.Playerlist.join(", ");
                            }
                        }
                        if (!json.Version) requiredVersion = lang.MinecraftModule.Commands.Status.Errors.CouldntFetchVersion;
                        else requiredVersion = json.Version;
                    }
                });

                let embed = new Discord.MessageEmbed()
                    .setColor(config.EmbedColors.Default)
                    .setTitle(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Title.replace(/{server}/g, server.name))
                    .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[0], total + '/' + max)
                    .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[1], players)
                    .addField(lang.MinecraftModule.Commands.Status.Embeds.SpecificStatus.Fields[2], requiredVersion);

                msg.edit({ embeds: [embed] });

                return resolve(true);
            } else {
                let fields = [];

                for (let i = 0; i < servers.length; i++) {
                    await rp(servers[i].pingURL).then(content => {
                        const json = JSON.parse(content);
                        if (json.error) fields.push({
                            name: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Offline[0].replace(/{server}/g, servers[i].name),
                            value: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Offline[1].replace(/{server}/g, servers[i].name)
                        });
                        else {
                            const playerCount = json.players.online;
                            fields.push({
                                name: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Online[0].replace(/{server}/g, servers[i].name).replace(/{playercount}/g, playerCount),
                                value: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Online[1].replace(/{server}/g, servers[i].name).replace(/{playercount}/g, playerCount)
                            });
                        }
                    });
                }

                let embed = Embed({
                    title: lang.MinecraftModule.Commands.Status.Embeds.GlobalStatus.Title,
                    fields: fields
                });

                msg.edit(embed);

                return resolve(true);
            }
        });
    },
    description: "View a Minecraft server's status",
    usage: "status [server]",
    aliases: [
        "serverstatus"
    ],
    arguments: [
        {
            name: "server",
            description: "The name of the server",
            required: false,
            type: "STRING"
        }
    ]
};
