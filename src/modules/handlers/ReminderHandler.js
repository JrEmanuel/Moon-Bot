const Utils = require("../utils");

module.exports = {
    reminders: [],
    init: async (bot) => {
        let reminders = await Utils.variables.db.get.getReminders();
        let guild = bot.guilds.cache.first();

        if (!guild) return;

        reminders.forEach(async reminder => {
            let member = await guild.members.fetch(reminder.member);

            if (!member) return module.exports.remove(reminder);
            if (reminder.time > Date.now()) {
                module.exports.reminders.push(Object.assign(reminder, {
                    timeout: setTimeout(() => {
                        module.exports.send(reminder, member);
                    }, reminder.time - Date.now())
                }));
            } else {
                module.exports.send(reminder, member);
            }
        });
    },
    send: async (reminder, member) => {
        let bot = Utils.variables.bot;

        module.exports.remove(reminder);
        member.send(Utils.setupMessage({
            configPath: Utils.variables.embeds.Embeds.Reminder,
            variables: [
                ...Utils.userVariables(member, "user"),
                { searchFor: /{bot-id}/g, replaceWith: bot.id },
                { searchFor: /{bot-username}/g, replaceWith: bot.user.username },
                { searchFor: /{bot-tag}/g, replaceWith: bot.user.tag },
                { searchFor: /{bot-mention}/g, replaceWith: '<@' + bot.id + '>' },
                { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                { searchFor: /{reminder}/g, replaceWith: reminder.reminder }
            ]
        }))
            .catch(() => { });
    },
    add: async (reminder) => {
        let id = await Utils.variables.db.update.reminders.add(reminder.member, reminder.time, reminder.reminder);

        module.exports.reminders.push(Object.assign(reminder, {
            id,
            timeout: setTimeout(() => {
                module.exports.send(reminder, reminder.member);
            }, reminder.time - Date.now())
        }));
    },
    remove: async (reminder) => {
        let rem = module.exports.reminders.find(r => r.member == reminder.member && r.time == reminder.time);

        if (rem) {
            module.exports.reminders.splice(module.exports.reminders.indexOf(rem), 1);
            clearTimeout(rem.timeout);
        }

        await Utils.variables.db.update.reminders.remove(reminder.id);
    }
};
