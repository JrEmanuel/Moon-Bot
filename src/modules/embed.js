const Discord = require("discord.js");
const yml = require('./yml.js');
let themeColor = parseInt("#fffff", 16);
let errorColor = parseInt("#f52c2c", 16);
let config = {};
let lang = {};

(async () => {
    const cfg = await yml('./configs/config.yml');
    config = cfg;
    themeColor = parseInt(cfg.EmbedColors.Default.replace(/#/g, ''), 16);
    errorColor = parseInt(cfg.EmbedColors.Error.replace(/#/g, ''), 16);
    lang = await yml("./configs/lang.yml");
})();

module.exports = function (embedOptions, otherOptions = {}) {
    if (embedOptions.preset) {
        switch (embedOptions.preset) {
            case 'nopermission':
                if (embedOptions.roles && embedOptions.roles.length) {
                    return {
                        embeds: [{
                            color: errorColor,
                            title: lang.EmbedPresets.NoPerms.Title,
                            description: format(embedOptions.roles.length == 1 ? lang.EmbedPresets.NoPerms.Description[1].replace(/{role}/g, `<@&${embedOptions.roles[0].id}>`) : lang.EmbedPresets.NoPerms.Description[2].replace(/{roles}/g, embedOptions.roles.map(r => `<@&${r.id}>`)), 2048),
                            timestamp: new Date()
                        }]
                    };
                }

                return {
                    embeds: [{
                        color: errorColor,
                        title: lang.EmbedPresets.NoPerms.Title,
                        description: format(lang.EmbedPresets.NoPerms.Description[0], 2048),
                        timestamp: new Date()
                    }]
                };
            case 'invalidargs':
                return {
                    embeds: [{
                        color: errorColor,
                        title: lang.EmbedPresets.InvalidArgs.Title,
                        description: format(lang.EmbedPresets.InvalidArgs.Description.replace(/{usage}/g, (otherOptions?.prefixUsed || config.Prefix) + embedOptions.usage), 2048),
                        timestamp: new Date()
                    }]
                };
            case 'error':
                if (embedOptions.description && !embedOptions.usage) return {
                    embeds: [{
                        color: errorColor,
                        title: embedOptions.description,
                    }]
                };
                if (embedOptions.description && embedOptions.usage) return {
                    embeds: [{
                        color: errorColor,
                        title: embedOptions.description,
                        description: format(lang.EmbedPresets.Error.Descriptions[1].replace(/{usage}/g, (otherOptions?.prefixUsed || config.Prefix) + embedOptions.usage), 2048),
                        timestamp: new Date()
                    }]
                };
                return {
                    embeds: [{
                        color: errorColor,
                        title: lang.EmbedPresets.Error.Title,
                        description: format(lang.EmbedPresets.Error.Descriptions[0], 2048)
                    }]
                };
            case 'console':
                return {
                    embeds: [{
                        color: errorColor,
                        title: lang.EmbedPresets.Console.Title
                    }]
                };
            default:
                return {
                    embeds: [{
                        color: themeColor,
                        title: lang.EmbedPresets.Error.Title,
                        description: format(lang.EmbedPresets.Error.Descriptions[0], 2048)
                    }]
                };
        }
    } else {
        const embed = embedOptions;
        let components = [];
        if (embed.color) embed.color = parseInt(embed.color.replace(/#/g, ''), 16);
        else embed.color = themeColor;
        if (embed.footer) {
            const footer = embed.footer;
            if (typeof footer == "string")
                embed.footer = { text: footer };
            else if (embed.footer.icon)
                embed.footer = { text: footer.text, icon_url: footer.icon };
        }
        if (embed.author) {
            const author = embed.author;
            if (typeof author == "string") {
                embed.author = { name: author };
            } else {
                embed.author.name = embed.author.text;
                embed.author.icon_url = embed.author.icon;
                delete embed.author.text;
                delete embed.author.icon;
            }
        }
        if (embed.thumbnail)
            embed.thumbnail = { url: embed.thumbnail };
        if (embed.image)
            embed.image = { url: embed.image };
        if (embed.description)
            embed.description = format(embed.description, 2048);
        if (embed.fields)
            embed.fields = embed.fields.map(field => {
                let f = { name: format(field.name, 1024), value: format(field.value, 1024), inline: (field.inline) ? true : false };
                return f;
            });
        if (embed.components)
            if (!Array.isArray(embed.components))
                components.push(embed.components);
            else {
                if (embed.components[0] instanceof Discord.MessageActionRow)
                    components = embed.components;
                else
                    components = [new Discord.MessageActionRow().addComponents(embed.components.slice(0, 5))];
            }
        return { embeds: [embed], components };
    }

};

const format = (text, max) => {
    return text
        .toString()
        .slice(0, max);
};
