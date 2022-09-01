const Utils = require('../../modules/utils');
const { lang, config } = Utils.variables;
const Embed = Utils.Embed;
module.exports = {
    name: "verify",
    run: async (bot, messageOrInteraction, args, { type, user, member, guild, reply }) => {
        return new Promise(async resolve => {
            if (config.Verification.Enabled == false || (config.Verification.Enabled == true && config.Verification.Type !== 'code')) {
                if (type == "message") messageOrInteraction.delete();
                return resolve(true);
            }

            function generateCode(length) {
                let chars = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
                let code = '';
                for (let i = 0; i < length; i++) {
                    code += chars[~~(Math.random() * chars.length)];
                }

                return code;
            }
            let channel = Utils.findChannel(config.Verification.Channel, guild);

            if (!channel) {
                reply(Embed({ preset: 'console' }));
                return resolve();
            }
            if (messageOrInteraction.channel.id !== channel.id) {
                reply(Embed({ preset: "error", description: lang.GeneralModule.Commands.Verify.Errors.WrongChannel }));
                return resolve();
            }

            let verificationCode = generateCode(config.Verification.Code.Length >= 5 ? config.Verification.Code.Length : 5);

            if (type == "message") messageOrInteraction.delete();
            await member.send({ content: verificationCode, embeds: Embed({
                title: lang.GeneralModule.Commands.Verify.Embeds.Code.Title,
                description: lang.GeneralModule.Commands.Verify.Embeds.Code.Description.replace(/{code}/g, verificationCode).replace(/{channel}/g, `<#${channel.id}>`)
            }).embeds }).then(async () => {

                reply(Object.assign({ content: `<@${user.id}>`}, Embed({
                    color: config.EmbedColors.Success,
                    title: lang.GeneralModule.Commands.Verify.Sent
                }))).then(Utils.delete);

                await Utils.waitForResponse(user.id, channel).then(async response => {
                    if (response.content.toLowerCase() == verificationCode.toLowerCase()) {
                        response.delete();
                        require("../../modules/methods/verifyUser")(bot, member);
                    } else {
                        response.delete();
                        reply(`<@${user.id}>`, Embed({
                            preset: 'error',
                            description: lang.GeneralModule.Commands.Verify.Errors.InvalidCode
                        })).then(Utils.delete);
                        return resolve(true);
                    }
                });
            }).catch(err => {
                if (err.name == 'DiscordAPIError' && err.code == '50007') {
                    reply(Embed({
                        preset: 'error',
                        description: lang.GeneralModule.Commands.Verify.Errors.DMsLocked
                    })).then(Utils.delete);
                    return resolve();
                } else {
                    console.log(err);
                    reply(Embed({
                        preset: 'error',
                        description: lang.GeneralModule.Commands.Verify.Errors.ErrorOccured
                    })).then(Utils.delete);
                    return resolve();
                }
            });


        });
    },
    description: "Verify that you aren't a bot account",
    usage: "verify",
    aliases: [],
    arguments: []
};
