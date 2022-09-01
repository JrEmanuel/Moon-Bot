const lock = require("../../modules/methods/lockChannel");

module.exports = {
    name: "lock",
    run: async (bot, messageOrInteraction, args, { type, member, channel, reply }) => {
        return new Promise(async resolve => {
            resolve(await lock(channel, member, true, reply, type));
        });
    },
    description: "Lock the channel so users cannot send messages",
    usage: "lock",
    aliases: [],
    arguments: []
};
