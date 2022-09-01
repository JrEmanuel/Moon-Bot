const Utils = require("../modules/utils");
const CommandListener = require("../modules/handlers/CommandListener");
const { Embed, variables: { config, lang, buttons } } = Utils;
const add = require("../modules/methods/buttonActions/add");
const remove = require("../modules/methods/buttonActions/remove");
const send = require("../modules/methods/buttonActions/send");
const cooldowns = [];

module.exports = async (bot, interaction) => {
    let id = interaction.customId;
    if (interaction.isCommand()) {
        CommandListener.exec(interaction);
    } else if (interaction.isButton()) {
        if (id == "verification_button") {
            if (config.Verification.Enabled && config.Verification.Type.toLowerCase() == "button") {
                const verificationRoles = config.Verification.VerifiedRoles;
                if (!verificationRoles || !Array.isArray(verificationRoles)) return;
                if (verificationRoles.every(role => interaction.member.roles.cache.find(r => r.id == role || r.name.toLowerCase() == role.toLowerCase()))) {
                    interaction.reply({ content: lang.Other.AlreadyVerified, ephemeral: true, fetchReply: false });
                } else {
                    interaction.deferUpdate();
                    require("../modules/methods/verifyUser")(bot, interaction.member);
                }
            }
        } else if (id.startsWith("rolemenu_")) {
            interaction.deferUpdate();

            const menuData = id.split("_");
            const menuName = menuData[1];
            const optionName = menuData[2];
            const menu = config.ReactionRoles.find(m => m.Name.toLowerCase() == menuName);

            if (menu) {
                const option = menu.Options.find(o => o.Name.toLowerCase() == optionName);
                const handle = async (option) => {
                    if (option) {
                        const member = interaction.member;
                        const role = Utils.findRole(option.Name, member.guild);

                        if (!role)
                            return member.send(Embed({ preset: "error", description: lang.Other.RoleMenuRoleNotCreated.replace(/{role}/g, option.Name) }));

                        if (member.roles.cache.has(role.id)) {
                            await member.roles.remove(role);
                            if ([true, undefined].includes(menu.DMOnRemove)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleRemoved.replace(/{role}/g, role.name) })).catch(() => { });
                            bot.emit("roleMenuRoleRemoved", member, menu, role);
                        } else {
                            if (menu.OnlyOne) {
                                let optionToRemove = menu.Options.find(o => Utils.hasRole(member, o.Name, false));
                                if (optionToRemove) await handle(optionToRemove);
                            }

                            await member.roles.add(role);
                            if ([true, undefined].includes(menu.DMOnAdd)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleAdded.replace(/{role}/g, role.name) })).catch(() => { });
                            bot.emit("roleMenuRoleAdded", member, menu, role);
                        }
                    }
                };

                handle(option);
            }
        } else if (id.startsWith("reactfor_")) {
            interaction.deferUpdate();

            if (id == "reactfor_ticket") {
                require("../modules/methods/createTicket")(bot, [], interaction.member, interaction.channel, true, 5000, false);
            } else if (id == "reactfor_application") {
                require("../modules/methods/createApplication")(bot, interaction.member, interaction.channel, true, 5000);
            } else if (id.startsWith("reactfor_application_")) {
                require("../modules/methods/createApplication")(bot, interaction.member, interaction.channel, true, 5000, undefined, id.replace("reactfor_application_", ""));
            }
        } else {
            let customButton = buttons.Buttons.find(b => b.ID == id);

            if (customButton) {
                if (customButton.Permissions && customButton.Permissions.Roles.length) {
                    if (!Utils.hasPermission(interaction.member, customButton.Permissions.Roles)) return interaction.reply(Object.assign({ ephemeral: customButton.Permissions.Message.Ephemeral, fetchReply: true }, Utils.setupMessage({
                        configPath: customButton.Permissions.Message.Content,
                        variables: [
                            ...Utils.userVariables(interaction.member, "user"),
                            ...Utils.userVariables(Utils.variables.bot, "bot")
                        ]
                    }))).then(m => {
                        if (customButton.Permissions.Message.DeleteAfter && m) Utils.delete(m, customButton.Permissions.Message.DeleteAfter * 1000);
                    });
                }

                let cooldownBypass = Utils.hasPermission(interaction.member, buttons.CooldownBypass);

                if (customButton.Cooldown && !cooldownBypass && customButton.Cooldown.Amount > 0) {
                    let cooldown = cooldowns.find(c => c.user == interaction.member.id && c.button == customButton.ID);
                    if (cooldown) return interaction.reply(Object.assign({ ephemeral: customButton.Cooldown.Message.Ephemeral, fetchReply: true }, Utils.setupMessage({
                        configPath: customButton.Cooldown.Message.Content,
                        variables: [
                            ...Utils.userVariables(interaction.member, "user"),
                            ...Utils.userVariables(Utils.variables.bot, "bot"),
                            { searchFor: /{time}/g, replaceWith: Utils.DDHHMMSSfromMS(cooldown.expires - Date.now(), false) }
                        ]
                    }))).then(m => {
                        if (customButton.Cooldown.Message.DeleteAfter && m) Utils.delete(m, customButton.Cooldown.Message.DeleteAfter * 1000);
                    });
                }

                interaction.deferUpdate();

                if (customButton.Cooldown && !cooldownBypass) {
                    let amount = customButton.Cooldown.Amount * 1000;
                    let data = { user: interaction.member.id, button: customButton.ID, expires: Date.now() + amount };

                    cooldowns.push(data);

                    setTimeout(() => {
                        cooldowns.splice(cooldowns.indexOf(data), 1);
                    }, amount);
                }

                let actions = customButton.Actions;
                let results = [];

                if (actions && actions.length) await Utils.asyncForEach(actions, async a => {
                    if (a.Action == "add")
                        await add(a.Type, a.Value, interaction).then(res => results.push(res)).catch(res => results.push(res));
                    if (a.Action == "remove")
                        await remove(a.Type, a.Value, interaction).then(res => results.push(res)).catch(res => results.push(res));
                    if (a.Action == "send")
                        await send(a.Type, a.Value, a.Channel, a.DeleteAfter, interaction).then(res => results.push(res)).catch(res => results.push(res));
                });

                const logs = Utils.findChannel(buttons.LogsChannel, interaction.guild);
                if (logs) logs.send(Embed({
                    author: lang.LogSystem.CustomButtonUsed.Author,
                    description: lang.LogSystem.CustomButtonUsed.Description
                        .replace(/{id}/g, id)
                        .replace(/{user}/g, `<@${interaction.member.id}>`)
                        .replace(/{message-url}/g, interaction.message.url)
                        .replace(/{label}/g, interaction.component.label)
                        .replace(/{user-id}/g, interaction.member.id)
                        .replace(/{time}/g, ~~(interaction.createdTimestamp / 1000))
                        .replace(/{actions}/g, actions && actions.length ? lang.LogSystem.CustomButtonUsed.Actions.replace(/{actions}/g, results.filter(r => r).map((r, i) => {
                            let a = actions[i];
                            return a.Action == "send" ? `${a.Action} ${a.Type}` : `${a.Action} ${a.Value} ${a.Type}`;
                        }).join("\n")) : "")
                }));
            }
        }
    } else if (interaction.isSelectMenu()) {
        if (id.startsWith("rolemenu_")) {
            interaction.deferUpdate();

            const menuData = id.split("_");
            const menuName = menuData[1];
            const menu = config.ReactionRoles.find(m => m.Name.toLowerCase() == menuName);

            if (menu) {
                const add = menu.Options.filter(o => interaction.values.includes(o.Name.toLowerCase()));
                const remove = menu.Options.filter(o => !interaction.values.includes(o.Name.toLowerCase()));
                const member = interaction.member;

                add.forEach(async option => {
                    const role = Utils.findRole(option.Name, member.guild);

                    if (!role)
                        return member.send(Embed({ preset: "error", description: lang.Other.RoleMenuRoleNotCreated.replace(/{role}/g, option.Name) }));

                    const alreadyHave = member.roles.cache.has(role.id);

                    if (!alreadyHave) {
                        await member.roles.add(role);
                        if ([true, undefined].includes(menu.DMOnAdd)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleAdded.replace(/{role}/g, role.name) })).catch(() => { });
                        bot.emit("roleMenuRoleAdded", member, menu, role);
                    }
                });

                remove.forEach(async option => {
                    const role = Utils.findRole(option.Name, member.guild);

                    if (role && member.roles.cache.has(role.id)) {
                        await member.roles.remove(role);
                        if ([true, undefined].includes(menu.DMOnRemove)) member.send(Embed({ title: lang.AdminModule.Commands.Rolemenu.RoleRemoved.replace(/{role}/g, role.name) })).catch(() => { });
                        bot.emit("roleMenuRoleRemoved", member, menu, role);
                    }
                });
            }
        }
    }
};
