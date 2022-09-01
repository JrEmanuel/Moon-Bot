const createApplication = require("../../modules/methods/createApplication.js");

module.exports = {
    name: "apply",
    run: async (bot, messageOrInteraction, args, { member, channel, reply }) => {
        return new Promise(async resolve => {
            const response = await createApplication(bot, member, channel, false, 10000, reply);

            if (!response) return resolve();
            else return resolve(true);
        });
    },
    description: "Create an application",
    usage: "apply",
    aliases: [
        "application"
    ],
    arguments: []
};
