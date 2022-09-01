const unlock = require("../../modules/methods/unlockChannel");

module.exports = {
    name: "unlock",
    run: async (bot, messageOrInteraction, args, { type, member, channel, reply }) => {
        return new Promise(async resolve => {
            resolve(await unlock(channel, member, true, reply, type));
        });
    },
    description: "Unlock the channel you are typing in",
    usage: "unlock",
    aliases: [],
    arguments: []
};
