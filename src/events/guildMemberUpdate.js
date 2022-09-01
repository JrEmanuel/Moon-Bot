const Utils = require('../modules/utils.js');
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

Array.prototype.diff = function (a) {
    return this.filter(function (i) { return a.indexOf(i) < 0; });
};

module.exports = async (bot, oldmember, newmember) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (config.Other.IgnoredGuilds.includes(oldmember.guild.id)) return;
        if (!oldmember.premiumSince && newmember.premiumSince) {
            bot.emit('memberBoosted', newmember);
        }

        if (!config.Logs.Enabled.includes("GuildMemberUpdated")) return;

        const logs = Utils.findChannel(config.Logs.Channels.GuildMemberUpdated, newmember.guild);
        if (!logs) return;

        const oldroles = Array.from(oldmember.roles.cache.keys());
        const newroles = Array.from(newmember.roles.cache.keys());

        if (oldroles !== newroles) {
            const removedRoles = oldroles.diff(newroles);
            const addedRoles = newroles.diff(oldroles);

            if (removedRoles.length > 0 && !!logs) {
                const role = Utils.findRole(removedRoles[0], oldmember.guild);
                logs.send(Embed({
                    author: lang.LogSystem.UserRolesUpdated.RoleRemoved.Author,
                    description: lang.LogSystem.UserRolesUpdated.RoleRemoved.Description
                        .replace(/{role}/g, `<@&${role.id}>`)
                        .replace(/{user}/g, newmember)
                        .replace(/{time}/g, ~~(Date.now() / 1000))
                }));

                if (role.name == config.Moderation.MuteRole || role.id == config.Moderation.MuteRole) {
                    let audit = await newmember.guild.fetchAuditLogs({
                        type: "MEMBER_ROLE_UPDATE",
                        limit: 1
                    });

                    if (audit && audit.entries.size) {
                        let log = audit.entries.first();
                        let mute = Utils.findRole(config.Moderation.MuteRole, newmember.guild);
                        if (mute && log.target && log.target.id == newmember.id && log.executor && log.executor.id !== bot.user.id && (log.changes && log.changes[0].key == "$remove" && log.changes[0].new.some(n => n.id == mute.id))) {
                            let executor = await newmember.guild.members.cache.get(log.executor.id);
                            bot.emit('userUnpunished', "mute", newmember, executor);
                        }
                    }
                }
            } else if (addedRoles.length > 0 && !!logs) {
                const role = Utils.findRole(addedRoles[0], oldmember.guild);
                logs.send(Embed({
                    author: lang.LogSystem.UserRolesUpdated.RoleAdded.Author,
                    description: lang.LogSystem.UserRolesUpdated.RoleAdded.Description
                        .replace(/{role}/g, `<@&${role.id}>`)
                        .replace(/{user}/g, newmember)
                        .replace(/{time}/g, ~~(Date.now() / 1000))
                }));

                if (role.name == config.Moderation.MuteRole) {
                    let audit = await newmember.guild.fetchAuditLogs({
                        type: "MEMBER_ROLE_UPDATE",
                        limit: 1
                    });
                    if (audit && audit.entries.size) {
                        let log = audit.entries.first();
                        let mute = Utils.findRole(config.Moderation.MuteRole, newmember.guild);
                        if (mute && log.target && log.target.id == newmember.id && log.executor && log.executor.id !== bot.user.id && (log.changes && log.changes[0].key == "$add" && log.changes[0].new.some(n => n.id == mute.id))) {
                            let executor = await newmember.guild.members.cache.get(log.executor.id);
                            let punishment = {
                                type: "mute",
                                user: newmember.id,
                                tag: newmember.user.tag,
                                reason: "None - Manually muted",
                                time: log.createdTimestamp,
                                executor: log.executor.id
                            };

                            await Utils.variables.db.update.punishments.addPunishment(punishment);
                            bot.emit('userPunished', punishment, newmember, executor);
                        }
                    }
                }
            }

            const newNickname = Utils.getRolePrefix(newmember);
            if (newNickname !== newmember.displayName) newmember.setNickname(newNickname).catch(() => { });
        }

        const oldnick = oldmember?.displayName?.normalize("NFC");
        const newnick = newmember?.displayName?.normalize("NFC");

        if (oldnick !== newnick) {
            logs.send(Embed({
                author: lang.LogSystem.DisplaynameUpdated.Author,
                description: lang.LogSystem.DisplaynameUpdated.Description
                    .replace(/{user}/g, newmember)
                    .replace(/{old}/g, oldnick)
                    .replace(/{new}/g, newnick)
                    .replace(/{time}/g, ~~(Date.now() / 1000))
            }));
        }
    }
};
