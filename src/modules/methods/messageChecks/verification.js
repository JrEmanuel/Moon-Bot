const Utils = require("../../utils");
const { variables: { config, lang }, Embed } = Utils;

module.exports = async (messageOrInteraction, type, message, interaction, user, channel, guild, reply, member, validPrefixes, prefixFound, commandName, command) => {
    return new Promise(async (resolve, reject) => {
        if ([channel.name, channel.id].includes(config.Verification.Channel)) {
            if (config.Verification.Enabled && config.Verification.Type == "code") {
                if (!command || (command && commandName !== "verify")) {
                    if (type == "interaction") reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Verify.Errors.WrongChannel }), { ephemeral: true });
                    else message.delete();
                    return reject();
                }
            }
        }
        return resolve();
    });
};
