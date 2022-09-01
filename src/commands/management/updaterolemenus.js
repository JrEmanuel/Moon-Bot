const Utils = require("../../modules/utils");
const { Embed, variables: { lang } } = Utils;

module.exports = {
    name: "updaterolemenus",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            const menus = await Utils.variables.db.get.getRoleMenus();

            if (!menus.length) {
                reply(Embed({ preset: "error", description: Utils.variables.lang.ManagementModule.Commands.Updaterolemenus.NoMenus }));
                return resolve();
            }

            await menus.filter(menu => menu.guild == guild.id).forEach(async data => {
                let channel = Utils.findChannel(data.channel, guild);
                let msg = channel ? await channel.messages.fetch(data.message).catch(() => { }) : undefined;

                if (!msg) {
                    Utils.variables.db.update.role_menus.remove(data.message);
                } else {
                    let menu = Utils.variables.config.ReactionRoles.find(r => r.Name.toLowerCase() == data.name);
                    if (menu) {
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

                        let newMenu = Utils.setupMessage({
                            configPath: menu.Message,
                            variables: [
                                { searchFor: /{emojiroles}/g, replaceWith: emojiroles }
                            ]
                        });

                        newMenu.components = rows;
                        msg.edit(newMenu)
                            .then(async m => {
                                Utils.variables.db.update.role_menus.add(m, menu.Name);
                                if (menu.Type !== "menu" && menu.Type !== "button") {
                                    menu.Options.forEach(async option => {
                                        await m.react(Utils.findEmoji(option.Emoji, bot, false) || option.Emoji);
                                    });
                                }
                            });
                    }
                }
            });

            reply(Embed({
                title: "Updated all role menus",
                color: Utils.variables.config.EmbedColors.Success
            }));
            return resolve(true);
        });
    },
    aliases: ["updaterm"],
    description: "Update all role menus",
    usage: "updaterolemenus",
    arguments: []
};
