/* eslint-disable no-underscore-dangle */
const Utils = require("../../utils");
const { variables: { config, lang }, Embed } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (!config.AntiAdvertisement.Chat.Enabled) return resolve();
        if (Utils.hasPermission(member, config.AntiAdvertisement.BypassRole)) return resolve();
        if (config.AntiAdvertisement.Whitelist.Channels.some(ch => channel.name == ch || channel.id == ch || channel.parentId == ch)) return resolve();

        const openTickets = (await Utils.getOpenTickets(guild)).map(c => c.id);
        const openApplications = (await Utils.getOpenApplications(guild)).map(c => c.id);

        if (openTickets.includes(channel.id) || openApplications.includes(channel.id)) return resolve();

        if (interaction && interaction.options) {
            let ads = [];

            if (command ? (command.command !== "server" && command.command !== "play") : true) {
                interaction.options._hoistedOptions.forEach(dat => {
                    if (Utils.hasAdvertisement(dat.value)) ads.push(dat);
                });
            }

            if (ads.length) {
                if (config.AntiAdvertisement.Chat.Logs.Enabled) {
                    const logs = Utils.findChannel(config.AntiAdvertisement.Chat.Logs.Channel, guild);

                    if (logs) logs.send(Embed({
                        author: lang.AntiAdSystem.Log.Author,
                        description: lang.AntiAdSystem.Log.Description
                            .replace(/{user}/g, member)
                            .replace(/{channel}/g, channel)
                            .replace(/{time}/g, ~~(Date.now() / 1000))
                            .replace(/{message}/g, `\n> Slash command (/${commandName}${interaction.options._subcommand ? " " + interaction.options._subcommand : ""}) contains ads: ` + ads.map(o => {
                                return "\n> - " + o.value
                                    .split(" ")
                                    .map(word => {
                                        if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                        else return word;
                                    })
                                    .join(" ") + `(${o.name} option)`;
                            }).join("\n"))
                    }));
                }

                if (Utils.variables.noAnnounceAntiAd.has(member.id)) return reject();
                else {
                    reply(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, user) })).then(Utils.delete);
                    return reject();
                }
            }
        } else if (message && message.content && Utils.hasAdvertisement(message.content) && (command ? (command.command !== "server" && command.command !== "play") : true)) {
            message.delete();

            if (config.AntiAdvertisement.Chat.Logs.Enabled) {
                const logs = Utils.findChannel(config.AntiAdvertisement.Chat.Logs.Channel, guild);

                if (logs) logs.send(Embed({
                    author: lang.AntiAdSystem.Log.Author,
                    description: lang.AntiAdSystem.Log.Description
                        .replace(/{user}/g, member)
                        .replace(/{channel}/g, channel)
                        .replace(/{time}/g, ~~(Date.now() / 1000))
                        .replace(/{message}/g, message.content
                            .split(" ")
                            .map(word => {
                                if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                else return word;
                            })
                            .join(" "))
                }));
            }

            if (Utils.variables.noAnnounceAntiAd.has(member.id)) return reject();
            else {
                reply(Embed({ title: lang.AntiAdSystem.MessageAdDetected.Title, description: lang.AntiAdSystem.MessageAdDetected.Description.replace(/{user}/g, user) })).then(Utils.delete);
                return reject();
            }
        }

        return resolve();
    });
};
