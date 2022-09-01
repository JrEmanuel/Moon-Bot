const fs = require('fs');
const YAML = require('yaml');
const chalk = require('chalk');
const _ = require("lodash");
const errors = new Map();
module.exports = async function (fileName) {
    return new Promise((resolve, reject) => {
        try {
            let yml = YAML.parse(fs.readFileSync(fileName, 'utf-8'), { prettyErrors: true });
            if (fileName == './config.yml') {
                let objects = [
                    { path: "Join.Roles", type: "array" },
                    { path: "Join.InviteRewards.Roles", type: "object" },
                    { path: "Coins.Work.Jobs", type: "array" },
                    { path: "Coins.Shop.Items", type: "array" },
                    { path: "Coins.Multipliers.Roles", type: "object" },
                    { path: "Levels.LevelRoles.LevelsToRoles", type: "object" },
                    { path: "ReactionRoles", type: "object" },
                    { path: "Moderation.AutoWarnPunishments", type: "object" },
                    { path: "AntiAdvertisement.Whitelist.Websites", type: "array" },
                    { path: "AntiAdvertisement.Whitelist.Channels", type: "array" },
                    { path: "Levels.BlacklistedChannels", type: "array" },
                    { path: "LockUnlock.Whitelisted", type: "array" },
                    { path: "LockUnlock.Ignore", type: "array" },
                    { path: "Commands.AllowedChannels", type: "array" },
                    { path: "ActivityCycling.Activities", type: "array" },
                    { path: "Verification.VerifiedRoles", type: "array" },
                    { path: "Logs.Enabled", type: "array" },
                    { path: "Links", type: "object" },
                    { path: "Cooldowns.Commands", type: "object" },
                    { path: "AutoAnnouncements.Announcements", type: "array" },
                    { path: "AutoResponse.Responses", type: "array" }
                ];

                objects.forEach(obj => {
                    if (obj.type == "object") {
                        let o = _.get(yml, obj.path, undefined);
                        if (!o || typeof o !== "object") _.set(yml, obj.path, {});
                    } else {
                        let arr = _.get(yml, obj.path, undefined);
                        if (!arr || !Array.isArray(arr)) _.set(yml, obj.path, []);
                    }
                });
                resolve(yml);
            } else {
                resolve(yml);
            }
        } catch (err) {
            if (!err.linePos) {
                console.log(err);
                errors.set(fileName, true);
                return reject(err);
            }
            const style = text => chalk.hex("#fce956").bold(text);
            if (!errors.has(fileName)) {
                console.log(`${style(`[YML SYNTAX ISSUE | FILE: ${fileName}:${err.linePos.start.line}:${err.linePos.start.col} (Line: ${err.linePos.start.line})]`)} The ${fileName} file could not be loaded:`);
                console.log(`${err.name}: ${err.message.split("\n")[0]}`);
                err.message.split("\n").slice(1).forEach(text => {
                    console.log(text);
                });
            }
            errors.set(fileName, true);
            return reject(err);
        }
    });
};
