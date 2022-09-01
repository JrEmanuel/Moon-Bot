const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const request = require("request");
const lang = Utils.variables.lang;

module.exports = {
    name: "minecraftuser",
    run: async (bot, messageOrInteraction, args, { prefixUsed, reply }) => {
        return new Promise(async resolve => {
            if (!args[0]) {
                reply(Embed({ 
                    preset: 'invalidargs', 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            request({
                url: `https://api.mojang.com/users/profiles/minecraft/${args[0]}`,
                json: true
            }, async function (error, response, body) {
                if (error) {
                    Utils.error(error.message, error.stack, "mcuser.js:17", true);
                    reply(Embed({ preset: "console" }), { ephemeral: true });
                    return resolve();
                } else {
                    if (!body) {
                        reply(Embed({ 
                            preset: "error", 
                            description: lang.MinecraftModule.Commands.Mcuser.Errors.InvalidUsername, 
                            usage: module.exports.usage
                        }), { ephemeral: true });

                        return resolve();
                    }

                    let msg = await reply(Embed({ title: lang.MinecraftModule.Commands.Mcuser.FetchingData }));

                    request({
                        url: `https://api.mojang.com/user/profiles/${body.id}/names`,
                        json: true
                    }, async function (error, response, b) {
                        if (error) {
                            msg.delete();

                            reply(Embed({ preset: 'error' }), { ephemeral: true });
                            return resolve();
                        }
                        if (!b || b.error) {
                            msg.delete();

                            reply(Embed({ 
                                preset: "error", 
                                description: lang.MinecraftModule.Commands.Mcuser.Errors.InvalidUsername,
                                usage: module.exports.usage
                            }), { ephemeral: true });
                            return resolve();
                        }

                        msg.edit(Embed({
                            title: lang.MinecraftModule.Commands.Mcuser.UserInfo.Title.replace(/{user-name}/g, body.name),
                            fields: [
                                { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[0], value: b.map(b => b.name).reverse().join(", ") || lang.Global.None },
                                { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[1], value: body.id },
                                { name: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[2].Name, value: lang.MinecraftModule.Commands.Mcuser.UserInfo.Fields[2].Value.replace(/{namemc-link}/g, "https://namemc.com/profile/" + body.name) }
                            ],
                            thumbnail: lang.MinecraftModule.Commands.Mcuser.UserInfo.Image.replace(/{user-image}/g, `https://visage.surgeplay.com/bust/${body.id}`),
                            timestamp: new Date()
                        }));
                    });
                }
            });
        });
    },
    description: "View minecraft account information",
    usage: "mcuser <minecraft username>",
    aliases: [
        "mcuser", 
        "mcaccount",
        "namehistory"
    ],
    arguments: [
        {
            name: "username",
            description: "The username of the Minecraft account",
            required: true,
            type: "STRING"
        }
    ]
};
