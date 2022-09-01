const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: 'rolemenu',
    run: async (bot, messageOrInteraction, args, { guild, channel, reply }) => {
        return new Promise(async resolve => {
            if (args.length == 0) {
                reply(Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.AdminModule.Commands.Rolemenu.Embeds.List.Title,
                    description: lang.AdminModule.Commands.Rolemenu.Embeds.List.Description.replace(/{menus}/g, config.ReactionRoles.map(r => `> ${r.Name}`).join("\n")),
                    timestamp: new Date()
                }));

                return resolve();
            }
    
            let menu = config.ReactionRoles.find(menu => menu.Name.toLowerCase() == args.join(" ").toLowerCase());
            if (!menu) {
                reply(Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    title: lang.AdminModule.Commands.Rolemenu.Embeds.InvalidMenu.Title,
                    description: lang.AdminModule.Commands.Rolemenu.Embeds.InvalidMenu.Description.replace(/{menus}/g, config.ReactionRoles.map(r => `> ${r.Name}`).join("\n")), color: config.EmbedColors.Error,
                    timestamp: new Date()
                }), { ephemeral: true });

                return resolve();
            }
    
            let emojiroles = menu.Options.map(option => {
                let customEmoji = Utils.findEmoji(option.Emoji, bot, false);
                let role = Utils.findRole(option.Name, guild, false);
                if (customEmoji) return `${customEmoji.toString()} **${role ? role.name : option.Name}**`;
                else return `${option.Emoji} **${role ? role.name : option.Name}**`;
            }).join('\n');
    
            let rows;
    
            if (menu.Type == "button") {
                let buttons = menu.Options.map((b, i) => {
                    let option = menu.Options[i];
                    return new Utils.Discord.MessageButton({
                        label: option.Button.Label,
                        style: option.Button.Style,
                        emoji: option.Button.UseEmoji ? Utils.findEmoji(option.Emoji, bot, false) || option.Emoji : undefined,
                        customId: `rolemenu_${menu.Name}_${option.Name}`.toLowerCase()
                    });
                });
    
                rows = new Array(Math.ceil(menu.Options.length / 5)).fill().map((r, i) => {
                    let x = i + 1;
                    return new Utils.Discord.MessageActionRow({ components: buttons.slice((x - 1) * 5, 5 * x) });
                });
            }
    
            if (menu.Type == "menu") {
                let m = new Utils.Discord.MessageSelectMenu({
                    customId: `rolemenu_${menu.Name.toLowerCase()}`,
                    placeholder: lang.AdminModule.Commands.Rolemenu.SelectMenuPlaceholder,
                    minValues: 0,
                    maxValues: menu.OnlyOne ? 1 : menu.Options.length,
                    options: menu.Options.map(o => {
                        return {
                            label: o.MenuOption.Label,
                            value: o.Name.toLowerCase(),
                            description: o.MenuOption.Description,
                            emoji: o.MenuOption.UseEmoji ? (Utils.findEmoji(o.Emoji, bot, false) || o.Emoji) : undefined,
                            default: false
                        };
                    })
                });
                rows = [new Utils.Discord.MessageActionRow({ components: [m] })];
            }
    
            let msg = Utils.setupMessage({
                configPath: menu.Message,
                variables: [
                    { searchFor: /{emojiroles}/g, replaceWith: emojiroles }
                ]
            });
    
            msg.components = rows;
            channel.send(msg)
                .then(async msg => {
                    Utils.variables.db.update.role_menus.add(msg, menu.Name);
                    if (menu.Type !== "menu" && menu.Type !== "button") {
                        menu.Options.forEach(async option => {
                            await msg.react(Utils.findEmoji(option.Emoji, bot, false) || option.Emoji);
                        });
                    }
                });

            reply(Embed({
                title: lang.AdminModule.Commands.Rolemenu.Embeds.Sent
            }), { ephemeral: true, deleteAfter: 3000 });
        });
    },
    description: "Send the reaction role menu",
    usage: 'rolemenu <menu>',
    aliases: ["rolemenus", "reactionrole", "reactionroles"],
    arguments: [
        {
            name: "menu",
            description: "The name of the menu to send",
            required: true,
            type: "STRING"
        }
    ]
};

