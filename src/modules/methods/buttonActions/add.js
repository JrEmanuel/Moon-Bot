const Utils = require("../../utils");

module.exports = (type, value, interaction) => {
    return new Promise(async (resolve, reject) => {
        let { member, guild } = interaction;

        if (type == "role") {
            if (!value || typeof value !== "string") return reject("Invalid button action settings");

            let role = Utils.findRole(value, guild);

            if (!role) return reject("Role does not exist");

            await member.roles.add(role);

            return resolve(true);
        }

        else if (type == "coins" || type == "coin") {
            if (!value || typeof value !== "number") return reject("Invalid button action settings");

            await Utils.variables.db.update.coins.updateCoins(member, value, 'add');

            return resolve(true);
        }

        else if (type == "xp" || type == "exp" || type == "experience") {
            if (!value || typeof value !== "number") return reject("Invalid button action settings");

            let startingData = await Utils.variables.db.get.getExperience(member);

            await Utils.variables.db.update.experience.updateExperience(member, startingData.level, value, 'add');

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

            let { level, xp } = await Utils.variables.db.get.getExperience(member);

            level += value;
            let xpNeeded = ~~(((level - 1) * (175 * (level - 1)) * 0.5)) - xp;

            await Utils.variables.db.update.experience.updateExperience(member, level, xpNeeded, 'add');

            return resolve(true);
        }

        else reject("Invalid button action settings");
    });
};
