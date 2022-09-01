const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const lang = Utils.variables.lang;

module.exports = {
    name: 'createrole',
    run: async (bot, messageOrInteraction, args, { type, member, guild, channel, reply }) => {
        return new Promise(async (resolve) => {
            let data = [];
            let msg = await reply(Embed({
                title: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Title.replace(/{pos}/g, '1/3'),
                description: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Questions[0],
                timestamp: new Date()
            }));

            let ask = async (question, askQuestion = false) => {
                if (askQuestion) await msg.edit(Embed({
                    title: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Title.replace(/{pos}/g, (question + 1) + '/3'),
                    description: lang.AdminModule.Commands.Createrole.Embeds.RoleSetup.Questions[question],
                    timestamp: new Date()
                }));

                let response = await Utils.waitForResponse(member.user.id, channel);
                response.delete();

                if (response.content.toLowerCase() == "cancel") {
                    if (type == "message") messageOrInteraction.delete();
                    msg.delete();

                    return resolve();
                }

                if (question == 0) {
                    data.push(response.content);
                }

                else if (question == 1) {
                    if (response.content.toLowerCase() !== "none" && !/#([a-f]|[0-9]){6}/.test(response.content)) {
                        reply(Embed({
                            preset: 'error',
                            description: lang.AdminModule.Commands.Createrole.Errors.InvalidHex
                        }), { deleteAfter: 2500 });

                        return ask(question);
                    }

                    data.push(response.content.toLowerCase() == "none" ? undefined : response.content);
                }

                else if (question == 2) {
                    if (isNaN(response.content)) {
                        reply(Embed({
                            preset: 'error',
                            description: lang.AdminModule.Commands.Createrole.Errors.InvalidNumber
                        }), { deleteAfter: 2500 });

                        return ask(question);
                    }

                    data.push(parseInt(response.content));
                    return true;
                }

                return ask(++question, true);
            };

            await ask(0);

            await guild.roles.create({
                name: data[0],
                color: data[1],
                permissions: BigInt(data[2]) || [],
                reason: `Role created by: ${member.user.tag}`
            }).then(r => {
                let permissions = new Discord.Permissions(BigInt(r.permissions)).toArray();

                msg.edit(Embed({
                    title: lang.AdminModule.Commands.Createrole.Embeds.RoleCreated.Title,
                    color: data[1],
                    timestamp: new Date(),
                    description: lang.AdminModule.Commands.Createrole.Embeds.RoleCreated.Description[permissions.length ? 0 : 1]
                        .replace(/{role}/g, r)
                        .replace(/{id}/g, r.id)
                        .replace(/{permissions}/g, permissions.join(", ").toLowerCase() || "None")
                }));

                resolve(true);
            });
        });
    },
    description: "Create a role on the Discord server",
    usage: 'createrole',
    aliases: [],
    arguments: []
};
