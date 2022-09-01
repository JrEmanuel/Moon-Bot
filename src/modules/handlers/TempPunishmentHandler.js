const Utils = require("../utils");
const { embeds } = Utils.variables;

module.exports = async (bot) => {
    let check = async () => {
        const punishments = await Utils.variables.db.get.getPunishments();

        punishments.filter(punishment => ["tempmute", "tempban"].includes(punishment.type) && !punishment.complete).forEach(async punishment => {
            if (punishment.time + punishment.length <= Date.now()) {
                const guilds = bot.guilds.cache;

                if (punishment.type == "tempmute") {
                    const guild = punishment.guild ? guilds.get(punishment.guild) : guilds.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).find(g => g.members.cache.has(punishment.user));

                    if (!guild) return Utils.variables.db.update.punishments.completePunishment(punishment.id);

                    const user = await guild.members.fetch(punishment.user);
                    let executor = await guild.members.fetch(punishment.executor).catch(() => { });
                    
                    if (!executor) executor = guild.me;

                    const muteRole = Utils.findRole(Utils.variables.config.Moderation.MuteRole, guild);

                    const savedRoles = await Utils.variables.db.get.getSavedMuteRoles(user) || [];
                    const rolesToAdd = savedRoles.map(role => Utils.findRole(role, guild, false)).filter(role => role);
                    if (rolesToAdd?.length) await user.roles.add(rolesToAdd);

                    if (muteRole && user && executor && user.roles.cache.has(muteRole.id)) {
                        await user.roles.remove(muteRole.id);

                        if (embeds.Embeds.Unmuted) user.send(Utils.setupMessage({
                            configPath: embeds.Embeds.Unmuted,
                            variables: [
                                ...Utils.userVariables(user, "user"),
                                ...Utils.userVariables(executor, "executor"),
                                { searchFor: /{server-name}/g, replaceWith: guild.name }
                            ]
                        })).catch(() => { });

                        bot.emit('userUnpunished', "tempmute", user, executor);
                    }
                } else {
                    if (punishment.guild) {
                        const guild = guilds.get(punishment.guild);
                        const ban = (await guilds.get(punishment.guild).bans.fetch()).find(ban => ban.user.id == punishment.user);

                        if (!ban) return Utils.variables.db.update.punishments.completePunishment(punishment.id);

                        guild.members.unban(ban.user.id);
                        bot.emit('userUnpunished', "tempban", ban.user, guild.me);
                    } else {
                        guilds.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).forEach(async guild => {
                            const ban = (await guild.bans.fetch()).find(ban => ban.user.id == punishment.user);

                            if (!ban) return Utils.variables.db.update.punishments.completePunishment(punishment.id);

                            guild.members.unban(ban.user.id);
                            bot.emit('userUnpunished', "tempban", ban.user, guild.me);
                        });
                    }
                }

                Utils.variables.db.update.punishments.completePunishment(punishment.id);
            }
        });
    };

    check();
    setInterval(check, 1000 * 30);
};
