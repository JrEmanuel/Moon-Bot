const Utils = require('../modules/utils');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = async (bot, oldChannel, newChannel) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (!newChannel.guild || !config.Logs.Enabled.includes("ChannelUpdated")) return;
        if (config.Other.IgnoredGuilds.includes(oldChannel.guild.id)) return;
        if (config.Logs.ChannelBlacklist.some(name => oldChannel.name.toLowerCase().startsWith(name.toLowerCase()) || newChannel.name.toLowerCase().startsWith(name.toLowerCase()) || oldChannel.id == name)) return;

        const logs = Utils.findChannel(config.Logs.Channels.ChannelUpdated, newChannel.guild);

        let Tickets = await Utils.getOpenTickets(newChannel.guild);
        let Applications = await Utils.getOpenApplications(newChannel.guild);
        let IDs = [...Tickets.map(channel => channel.id), ...Applications.map(channel => channel.id)];

        if (IDs.includes(newChannel.id) ||
            Utils.variables.channelLogBlacklist.has(oldChannel.id) ||
            Utils.variables.channelLogBlacklist.has(oldChannel.name) ||
            Utils.variables.channelLogBlacklist.has(newChannel.name) || !logs ||
            (Utils.variables.tempChannels && Array.from(Utils.variables.tempChannels.values()).find(tc => tc.channel.id == oldChannel.id))) return;

        if (oldChannel.name !== newChannel.name) {
            logs.send(Embed({
                author: lang.LogSystem.ChannelUpdated.NameUpdated.Author,
                description: lang.LogSystem.ChannelUpdated.NameUpdated.Description
                    .replace(/{channel}/g, `<#${newChannel.id}>`)
                    .replace(/{old}/g, oldChannel.name)
                    .replace(/{new}/g, newChannel.name)
                    .replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        }

        const stringify = require("safe-stable-stringify");
        const same = () => {
            return oldChannel.permissionOverwrites.cache.every(overwrite => {
                return !!newChannel.permissionOverwrites.cache.find(o => stringify(o) == stringify(overwrite));
            });
        };

        if (oldChannel.permissionOverwrites.cache.size !== newChannel.permissionOverwrites.cache.size || !same()) {
            let oldP = oldChannel.permissionOverwrites.cache;
            let newP = newChannel.permissionOverwrites.cache;
            let added = [];
            let removed = [];
            let changed = [];

            oldP.each((value, key) => {
                if (!newP.has(key)) removed.push(key);
            })

            newP.each((value, key) => {
                if (!oldP.has(key)) added.push(key);
            })

            oldP.each((value, key) => {
                if (newP.has(key)) {
                    if (value.allow.bitfield !== newP.get(key).allow.bitfield) {
                        let oldA = value.allow.toArray();
                        let newA = newP.get(key).allow.toArray();
                        let add = [];
                        let rem = [];

                        oldA.forEach(oldPerm => {
                            if (!newA.includes(oldPerm)) rem.push(oldPerm);
                        })
        
                        newA.forEach(newPerm => {
                            if (!oldA.includes(newPerm)) add.push(newPerm);
                        })

                        changed.push({
                            id: key,
                            allow: add,
                            removed_from_allow: rem
                        })
                    }

                    if (value.deny.bitfield !== newP.get(key).deny.bitfield) {
                        let oldA = value.deny.toArray();
                        let newA = newP.get(key).deny.toArray();
                        let add = [];
                        let rem = [];

                        oldA.forEach(oldPerm => {
                            if (!newA.includes(oldPerm)) rem.push(oldPerm);
                        })
        
                        newA.forEach(newPerm => {
                            if (!oldA.includes(newPerm)) add.push(newPerm);
                        })
                        let find = changed.find(c => c.id == key);
                        if (find) {
                            let index = changed.indexOf(find);
                            changed[index].deny = add;
                            changed[index].removed_from_deny = rem;
                        } else changed.push({
                            id: key,
                            deny: add,
                            removed_from_deny: rem
                        })
                    }

                    let find = changed.find(c => c.id == key);
                    if (find) {
                        let index = changed.indexOf(find);
                        let defaulted = [];

                        if (find.removed_from_allow && find.removed_from_allow.length) {
                            find.removed_from_allow.forEach(rem => {
                                if (!find.deny) defaulted.push(rem);
                                else if (!find.deny.includes(rem)) defaulted.push(rem);
                            })
                        }

                        if (find.removed_from_deny && find.removed_from_deny.length) {
                            find.removed_from_deny.forEach(rem => {
                                if (!find.allow) defaulted.push(rem);
                                else if (!find.allow.includes(rem)) defaulted.push(rem);
                            })
                        }
                        changed[index].defaulted = defaulted;
                    }
                }
            })

            let desc = lang.LogSystem.ChannelUpdated.PermsUpdated.Description[0].replace(/{channel}/g, `<#${newChannel.id}>`);

            if (added.length) desc += lang.LogSystem.ChannelUpdated.PermsUpdated.Description[1].replace(/{roles}/g, added.map(r => `<@&${r}>`).join(" "));
            if (removed.length) desc += lang.LogSystem.ChannelUpdated.PermsUpdated.Description[2].replace(/{roles}/g, removed.map(r => `<@&${r}>`).join(" "));
            if (changed.length) desc += lang.LogSystem.ChannelUpdated.PermsUpdated.Description[3].replace(/{roles}/g, changed.map(r => {
                let text = lang.LogSystem.ChannelUpdated.PermsUpdated.RolePermsUpdated[0];
                let changes = [];
                if (r.allow && r.allow.length) changes.push(lang.LogSystem.ChannelUpdated.PermsUpdated.RolePermsUpdated[1].replace(/{perms}/g, r.allow.map(perm => '`' + perm.toLowerCase() + '`').join(", ")));
                if (r.deny && r.deny.length) changes.push(lang.LogSystem.ChannelUpdated.PermsUpdated.RolePermsUpdated[2].replace(/{perms}/g, r.deny.map(perm => '`' + perm.toLowerCase() + '`').join(", ")));
                if (r.defaulted && r.defaulted.length) changes.push(lang.LogSystem.ChannelUpdated.PermsUpdated.RolePermsUpdated[3].replace(/{perms}/g, r.defaulted.map(perm => '`' + perm.toLowerCase() + '`').join(", ")));

                return text.replace(/{role}/g, `<@&${r.id}>`).replace(/{changes}/g, changes.join(", "));
            }).join("\n"));

            desc += lang.LogSystem.ChannelUpdated.PermsUpdated.Description[4].replace(/{time}/g, ~~(Date.now() / 1000))
            logs.send(Embed({
                author: lang.LogSystem.ChannelUpdated.PermsUpdated.Author,
                description: desc
            }));
        }

        if (oldChannel.parentId !== newChannel.parentId) {
            logs.send(Embed({
                author: lang.LogSystem.ChannelUpdated.ParentUpdated.Author,
                description: lang.LogSystem.ChannelUpdated.ParentUpdated.Description
                    .replace(/{channel}/g, `<#${newChannel.id}>`)
                    .replace(/{old}/g, oldChannel.parent ? oldChannel.parent.name : lang.Global.None)
                    .replace(/{new}/g, newChannel.parent ? newChannel.parent.name : lang.Global.None)
                    .replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        }

        if (oldChannel.topic !== newChannel.topic) {
            logs.send(Embed({
                author: lang.LogSystem.ChannelUpdated.TopicUpdated.Author,
                description: lang.LogSystem.ChannelUpdated.TopicUpdated.Description
                    .replace(/{channel}/g, `<#${newChannel.id}>`)
                    .replace(/{old}/g, oldChannel.topic ? oldChannel.topic : lang.Global.None)
                    .replace(/{new}/g, newChannel.topic ? newChannel.topic : lang.Global.None)
                    .replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        }
    }
};
