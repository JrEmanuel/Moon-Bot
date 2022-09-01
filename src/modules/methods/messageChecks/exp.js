const Utils = require("../../utils");
const CommandListener = require("../../handlers/CommandListener");
const { variables: { config, lang, db, embeds } } = Utils;
const cooldowns = {
    xp: {
        cooldownSeconds: config.Cooldowns.coins || 5,
        cooldown: new Set()
    }
};

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve) => {
        if (!config.Commands.GainXP && (command || CommandListener.runningCommand.includes(user.id))) return resolve();

        let ch = [channel.name, channel.id];
        let roles = [...member.roles.cache.map(r => r.name), ...member.roles.cache.map(r => r.id)];

        let expModule = await Utils.variables.db.get.getModules('exp');
        if (!expModule || !expModule.enabled) return resolve();

        let restrictions = config.Levels.Restrictions;
        let type = restrictions.Type.toLowerCase();
        let channelIncluded = ch.some(channel => restrictions.Channels?.includes(channel));
        let rolesIncluded = roles.some(r => restrictions.Roles?.includes(r));

        if (type == "blacklist" && (channelIncluded || rolesIncluded)) return resolve();
        if (type == "whitelist" && (!channelIncluded && !rolesIncluded)) return resolve();
        if (cooldowns.xp.cooldown.has(user.id)) return resolve();

        let { level, xp } = await db.get.getExperience(member);

        let amt = ~~(Math.random() * 10) + config.Levels.Amounts.PerMessage;
        let xpNeeded = ~~((level * (175 * level) * 0.5)) - amt - xp;

        if (xpNeeded <= 0) {
            level++;

            let reward;

            if (config.Levels.CoinRewards && config.Levels.CoinRewards.Enabled && config.Levels.CoinRewards.LevelsToCoins && typeof config.Levels.CoinRewards.LevelsToCoins == "object") {
                let levelFound = Object.keys(config.Levels.CoinRewards.LevelsToCoins).find(l => l == level);
                reward = levelFound ? config.Levels.CoinRewards.LevelsToCoins[levelFound] : undefined;

                if (reward) {
                    await db.update.coins.updateCoins(member, reward, 'add');
                }
            }

            if (config.Levels.LevelUp.Notification) {
                let c = config.Levels.LevelUp.Channel == "current" ? channel : Utils.findChannel(config.Levels.LevelUp.Channel, guild);

                if (c) c.send(Utils.setupMessage({
                    configPath: embeds.Embeds.LevelUp,
                    variables: [
                        { searchFor: /{level}/g, replaceWith: level },
                        { searchFor: /{reward}/g, replaceWith: reward ? lang.XPModule.CoinReward.replace(/{amount}/g, reward.toLocaleString()) : "" },
                        ...Utils.userVariables(member, "user")
                    ]
                })).then(msg => {
                    if (config.Levels.LevelUp.Delete) Utils.delete(msg, 4500);
                });
            }

            Utils.variables.bot.emit('levelUp', member, level, channel);
        }

        if (config.Levels.LevelRoles.Enabled) {
            const levelRoles = config.Levels.LevelRoles;
            const availableLevelRoles = levelRoles.LevelsToRoles && typeof levelRoles.LevelsToRoles == "object" ? Object.keys(levelRoles.LevelsToRoles).filter(l => l <= level) : [];
            let levelRole = availableLevelRoles.length > 0 ? availableLevelRoles.reduce((a, b) => Math.abs(b - level) < Math.abs(a - level) ? b : a) : null;

            if (levelRole) {
                levelRole = levelRoles.LevelsToRoles[levelRole];

                const role = Utils.findRole(levelRole, guild);
                if (role && !member.roles.cache.has(role.id)) member.roles.add(role);

                const roleCache = member.roles.cache;
                const previousRoles = Object.keys(levelRoles.LevelsToRoles)
                    .filter(l => l < level && levelRoles.LevelsToRoles[l] !== levelRole)
                    .map(l => levelRoles.LevelsToRoles[l])
                    .filter(r => roleCache.find(role => role.id == r || role.name == r));

                if (previousRoles.length && levelRoles.RemovePrevious) {
                    previousRoles.forEach(lRole => {
                        const previousRole = Utils.findRole(lRole, guild);
                        if (previousRole) member.roles.remove(previousRole);
                    });
                }
            }
        }

        await db.update.experience.updateExperience(member, level, amt, 'add');

        if (!Utils.hasPermission(member, config.Cooldowns.BypassRole)) cooldowns.xp.cooldown.add(user.id);
        setTimeout(function () {
            if (!Utils.hasPermission(member, config.Cooldowns.BypassRole)) cooldowns.xp.cooldown.delete(user.id);
        }, cooldowns.xp.cooldownSeconds * 1000);

        resolve();
    });
};
