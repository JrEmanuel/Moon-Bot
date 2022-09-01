const Utils = require("../utils");
const sendWelcomeMessage = require("./sendWelcomeMessage");
const { config } = Utils.variables;

module.exports = async (bot, member) => {
    if (config.Verification.WelcomeMessage == "after-verified" && config.Join.Messages.Enabled) {
        let joins = await Utils.variables.db.get.getJoins(member);
        let inviter;

        if (joins && joins.length) {
            let mostRecent = Math.max(...joins.map(i => i.time));
            inviter = joins.find(i => i.time == mostRecent);
        }

        inviter = inviter && inviter.inviter ? await member.guild.members.fetch(inviter.inviter) : undefined;
        sendWelcomeMessage(bot, member, inviter);
    }

    if (config.Join.Roles && Array.isArray(config.Join.Roles)) {
        config.Join.Roles.filter(r => typeof r == "string").forEach(roleName => {
            let role = Utils.findRole(roleName, member.guild);
            if (role) member.roles.remove(role);
        });
    }

    if (config.Verification.VerifiedRoles && Array.isArray(config.Verification.VerifiedRoles)) config.Verification.VerifiedRoles.filter(r => r).forEach(roleName => {
        let role = Utils.findRole(roleName, member.guild);
        if (role) member.roles.add(role);
    });

    bot.emit("userVerified", member);
};
