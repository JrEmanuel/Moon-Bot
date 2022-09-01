const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const config = Utils.variables.config;
const fs = require("fs");
const request = require('request-promise');

module.exports = {
    name: "key",
    run: async (bot, message, args) => {
        if (!message.member.permissions.has("ADMINISTRATOR")) return message.channel.send(Embed({ preset: 'nopermission' }));
        message.delete();
        if (args.length == 0) {
            return message.channel.send(Embed({
                preset: 'invalidargs',
                usage: module.exports.usage
            }));
        }
        request.post({
            uri: 'https://verify.corebot.dev/addons/get',
            json: true,
            body: {
                key: args[0]
            }
        })
            .then(res => {
                if (!res.name) {
                    return message.channel.send(Embed({
                        color: config.EmbedColors.Error,
                        title: "Error",
                        description: "An error has occured while trying to install this addon. Error:\n``" + res.error + "``"
                    }));
                }
                if (!fs.existsSync("./addons")) fs.mkdir("./addons", function (err) { if (err) console.log(err); });
                setTimeout(function () {
                    fs.writeFile('./addons/' + res.name + ".js", res.content, function (err) { if (err) return console.log(err); });
                }, 3000);


                return message.channel.send(Embed({
                    color: config.EmbedColors.Success,
                    title: '🛠️ Addon Installed',
                    description: 'The ``' + res.name + '`` addon has successfully been installed. Please restart or reload the bot for the addon to be loaded.',
                    timestamp: new Date()
                }));
            });
    },
    description: "Install a corebot addon",
    usage: 'key <key>',
    aliases: []
};
