const Utils = require('../modules/utils');
const { config, lang } = Utils.variables;

module.exports = async (bot, oldRole, newRole) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (config.Logs.Enabled.includes("RoleUpdated")) {
            if (config.Other.IgnoredGuilds.includes(oldRole.guild.id)) return;

            let logs = Utils.findChannel(config.Logs.Channels.RoleUpdated, newRole.guild);

            if (!logs) return;

            let embed = Utils.Embed({
                author: lang.LogSystem.RoleUpdated.Author,
                description: lang.LogSystem.RoleUpdated.Description[0].replace(/{role}/g, newRole)
            });

            let changes = [];

            if (oldRole.name !== newRole.name) {
                changes.push(lang.LogSystem.RoleUpdated.Description[1].replace(/{old}/g, oldRole.name).replace(/{new}/g, newRole.name));
            }

            if (oldRole.color !== newRole.color) {
                changes.push(lang.LogSystem.RoleUpdated.Description[2].replace(/{old}/g, oldRole.hexColor).replace(/{new}/g, newRole.hexColor));
            }

            if (oldRole.hoist !== newRole.hoist) {
                let oldH = oldRole.hoist ? lang.LogSystem.RoleUpdated.Hoisted : lang.LogSystem.RoleUpdated.NotHoisted;
                let newH = newRole.hoist ? lang.LogSystem.RoleUpdated.Hoisted : lang.LogSystem.RoleUpdated.NotHoisted;
                changes.push(lang.LogSystem.RoleUpdated.Description[3].replace(/{old}/g, oldH).replace(/{new}/g, newH));
            }

            if (oldRole.mentionable !== newRole.mentionable) {
                let oldM = oldRole.mentionable ? lang.LogSystem.RoleUpdated.Mentionable : lang.LogSystem.RoleUpdated.NotMentionable;
                let newM = newRole.mentionable ? lang.LogSystem.RoleUpdated.Mentionable : lang.LogSystem.RoleUpdated.NotMentionable;
                changes.push(lang.LogSystem.RoleUpdated.Description[4].replace(/{old}/g, oldM).replace(/{new}/g, newM));
            }

            if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
                let oldP = oldRole.permissions.toArray();
                let newP = newRole.permissions.toArray();
                let added = [];
                let removed = [];

                oldP.forEach(oldPerm => {
                    if (!newP.includes(oldPerm)) removed.push(oldPerm);
                })

                newP.forEach(newPerm => {
                    if (!oldP.includes(newPerm)) added.push(newPerm);
                })

                if (!added.length) added = false;
                else added = added.map(perm => '`' + perm.toLowerCase() + '`').join(", ");

                if (!removed.length) removed = false;
                else removed = removed.map(perm => '`' + perm.toLowerCase() + '`').join(", ");

                if (added && removed) changes.push(lang.LogSystem.RoleUpdated.Description[7].replace(/{added}/g, added).replace(/{removed}/g, removed));
                else if (added) changes.push(lang.LogSystem.RoleUpdated.Description[5].replace(/{added}/g, added));
                else if (removed) changes.push(lang.LogSystem.RoleUpdated.Description[6].replace(/{removed}/g, removed));                
            }

            if (changes.length) {
                if (changes.length == 1) embed.embeds[0].description += changes.join("\n");
                else embed.embeds[0].description += "\n" + changes.join("\n");
            }

            if (embed.embeds[0].description == `${newRole}: `) return;
            else embed.embeds[0].description += lang.LogSystem.RoleUpdated.Description[8].replace(/{time}/g, ~~(Date.now() / 1000));

            logs.send(embed);
        }
    }
};
