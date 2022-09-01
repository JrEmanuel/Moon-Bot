const Utils = require("../../utils");
const { variables: { config, lang, embeds }, Embed } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if (command || type !== "message") return resolve();
        if (message.content == `<@!${guild.me.id}>` || message.content == `<@${guild.me.id}>` ) {
            if (!config.Other.OnBotMention) return resolve();

            if (config.Other.OnBotMention.toLowerCase() == "send-help") {
                let CommandList = require("../generateHelpMenu");
            if (!CommandList.general) await CommandList.setup();
                let categories = config.Help.Categories.filter(category => { // Remove staff categories & categories with modules that are all disabled
                    let modules = category.Modules.filter(module => CommandList[module]);
                    return modules.length && !category.Staff;
                });
                if (config.Help.Type.toLowerCase() == "categorized") {
                    reply(Utils.setupMessage({
                        title: config.Help.NormalTitle,
                        configPath: Utils.variables.embeds.Embeds.CategorizedHelp,
                        variables: [
                            ...Utils.userVariables(guild.me, "bot"),
                            { searchFor: /{prefix}/g, replaceWith: await Utils.variables.db.get.getPrefixes(guild.id) }
                        ]
                    })).then(async m => {
                        categories.forEach(async category => {
                            await m.react(Utils.findEmoji(category.Emoji, guild.me.user, false) || category.Emoji);
                        });
                    });
                    return reject();
                } else {
                    let embed = Utils.Embed({
                        title: config.Help.NormalTitle,
                        fields: [],
                        footer: {
                            text: guild.me.displayName,
                            icon: guild.me.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date()
                    });
    
                    categories.forEach(category => {
                        embed.embeds[0].fields.push({
                            name: category.DisplayNames[0],
                            value: category.Modules.filter(module => CommandList[module]).map(module => CommandList[module]).join("\n")
                        });
                    });
    
                    config.Help.Type == "dm" ? member.send(embed)
                        .then(() => {
                            reply(Utils.Embed({ title: config.Help.SentToDMs }));
                            return reject();
                        })
                        .catch(() => {
                            reply(Utils.Embed({ title: config.Help.DMsLocked }));
                            return reject();
                        }) : reply(embed);
                    return reject();
                }
            } else if (config.Other.OnBotMention.toLowerCase() == "send-prefix") {
                reply(Embed({
                    title: lang.Other.OtherCommands.Prefix.Title,
                    description: lang.Other.OtherCommands.Prefix.Description.replace(/{prefixes}/g, [...new Set([`<@!${guild.me.id}>`, await Utils.variables.db.get.getPrefixes(guild.id), config.Prefix, "/"])].map(p => `> **${p}**`).join('\n'))
                }));
                return reject();
            } else if (/send-.*/.test(config.Other.OnBotMention.toLowerCase())) {
                let embed = embeds.Embeds[config.Other.OnBotMention.replace("send-", "")];
                if (embed) {
                    reply(Utils.setupMessage({
                        configPath: embed,
                        variables: [
                            ...Utils.userVariables(member, "user"),
                            ...Utils.userVariables(guild.me, "bot")
                        ]
                    }));
                    return reject();
                }

                return resolve();
            } else {
                return resolve();
            }
        }
    });
};
