const Utils = require("../modules/utils");

module.exports = async (bot, invite) => {
    if (Utils.variables.config.Other.IgnoredGuilds.includes(invite.guild.id)) return;
    Utils.updateInviteCache(bot);
};
