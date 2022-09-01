const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const rp = require("request-promise");
const lang = Utils.variables.lang;

module.exports = {
    name: "server",
    run: async (bot, messageOrInteraction, args, { prefixUsed, reply }) => {
        return new Promise(async resolve => {
            if (args.length < 1) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            await rp("https://api.minetools.eu/ping/" + args[0].replace(":", '/')).then((html) => {
                let json = JSON.parse(html);

                if (json.error) {
                    reply(Embed({
                        preset: "error",
                        description: lang.MinecraftModule.Commands.Server.Errors.ErrorOccured
                    }), { ephemeral: true });

                    return resolve();
                }

                reply(Embed({
                    title: lang.MinecraftModule.Commands.Server.Server.Title.replace(/{server-ip}/g, args[0]),
                    fields: [
                        { name: lang.MinecraftModule.Commands.Server.Server.Fields[0], value: json.description.replace(/§[a-z0-9]/g, "") },
                        { name: lang.MinecraftModule.Commands.Server.Server.Fields[1].Name, value: lang.MinecraftModule.Commands.Server.Server.Fields[1].Value.replace(/{online}/g, json.players.online).replace(/{max}/g, json.players.max) },
                        { name: lang.MinecraftModule.Commands.Server.Server.Fields[2], value: json.version.name }
                    ],
                    footer: { text: lang.MinecraftModule.Commands.Server.Server.Footer, icon: lang.MinecraftModule.Commands.Server.Server.FooterIcon },
                    thumbnail: "https://api.minetools.eu/favicon/" + args[0].replace(":", "/")
                }));

                return resolve(true);
            });
        });
    },
    description: "View minecraft server information",
    usage: "server <ip>",
    aliases: ["mcserver"],
    arguments: [
        {
            name: "ip",
            description: "The IP Address of the Minecraft server",
            required: true,
            type: "STRING"
        }
    ]
};
