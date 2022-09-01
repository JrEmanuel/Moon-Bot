const Utils = require("../../utils");
const CommandListener = require("../../handlers/CommandListener");
const { variables: { config, db } } = Utils;
const cooldowns = {
    coins: {
        cooldownSeconds: config.Cooldowns.coins || 5,
        cooldown: new Set()
    },
};

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve) => {
        if (!config.Commands.GainCoins && (command || CommandListener.runningCommand.includes(user.id))) return resolve();

        let coinsModule = await Utils.variables.db.get.getModules('coins');
        if (!coinsModule || !coinsModule.enabled) return resolve();

        let ch = [channel.name, channel.id];
        let roles = [...member.roles.cache.map(r => r.name), ...member.roles.cache.map(r => r.id)];

        let restrictions = config.Coins.Restrictions;
        let type = restrictions.Type.toLowerCase();
        let channelIncluded = ch.some(channel => restrictions.Channels?.includes(channel));
        let rolesIncluded = roles.some(r => restrictions.Roles?.includes(r));

        if (type == "blacklist" && (channelIncluded || rolesIncluded)) return resolve();
        if (type == "whitelist" && (!channelIncluded || !rolesIncluded)) return resolve();
        if (cooldowns.coins.cooldown.has(user.id)) return resolve();

        let addCoins = ~~(Math.random() * parseInt(config.Coins.Amounts.PerMessage)) + 1;
        if (config.Coins.Multipliers.Multiplies.PerMessage) addCoins *= Utils.getMultiplier(member);
        addCoins = Math.round(addCoins);

        await db.update.coins.updateCoins(member, addCoins, 'add');

        let bypass = Utils.hasPermission(member, config.Cooldowns.BypassRole);
        if (!bypass) cooldowns.coins.cooldown.add(user.id);

        setTimeout(function () {
            if (!bypass) cooldowns.coins.cooldown.delete(user.id);
        }, cooldowns.coins.cooldownSeconds * 1000);
        resolve();
    });
};
