const Utils = require("../../utils");

module.exports = (type, value, interaction) => {
    return new Promise(async (resolve, reject) => {
        let { member, guild } = interaction;

        if (type == "role") {
            if (!value || typeof value !== "string") return reject("Invalid button action settings");

            let role = Utils.findRole(value, guild);

            if (!role) return reject("Role does not exist");

            await member.roles.remove(role);

            return resolve(true);
        }

        else if (type == "coins" || type == "coin") {
            if (!value || typeof value !== "number") return reject("Invalid button action settings");

            await Utils.variables.db.update.coins.updateCoins(member, value, 'remove');

            return resolve(true);
        }

        else if (type == "xp" || type == "exp" || type == "experience") {
            if (!value || typeof value !== "number") return reject("Invalid button action settings");

            await Utils.variables.db.update.experience.updateExperience(member, 1, value, 'remove');

            let { level, xp } = await Utils.variables.db.get.getExperience(member);
            if (!level) level = 1;
            if (!xp) xp = 0;
            let xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;

            while (xpNeeded <= 0) {
                ++level;
                xpNeeded = ~~((level * (175 * level) * 0.5)) - xp;
            }

            await Utils.variables.db.update.experience.updateExperience(member, level, xp, 'set');

            return resolve(true);
        }

        else if (type == "level" || type == "levels") {
            if (!value || typeof value !== "string") return reject("Invalid button action settings");

            let { level } = await Utils.variables.db.get.getExperience(member);
            if (!level) level = 1;

            level -= value;
            let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5));
            if (level < 1) {
                xpNeeded = 0;
                level = 1;
            }

            await Utils.variables.db.update.experience.updateExperience(member, level, xpNeeded, 'set');

            return resolve(true);
        }

        else reject("Invalid button action settings");
    });
};
