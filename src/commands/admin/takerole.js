const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "takerole",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            let everyone = ["all", "everyone", "@everyone"].some(text => type == "interaction" ? args[1].toLowerCase() == text : args.includes(text)) ? true : false;
            let mentionedUser = Utils.ResolveUser(messageOrInteraction, 1);
            let role = type == "message" ? messageOrInteraction.mentions.roles.first() : guild.roles.cache.get(args[0]);

            if (args.length < 1 || !role || (!everyone && !mentionedUser)) {
                reply(Embed({ 
                    preset: 'invalidargs', 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            if (!everyone && mentionedUser.user.bot) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.AdminModule.Commands.Takerole.TakeFromBot 
                }), { ephemeral: true });

                return resolve();
            }

            if (role.position > member.roles.highest.position) {
                reply(Embed({
                    preset: 'error',
                    description: lang.AdminModule.Commands.Takerole.HigherRole[0]
                }), { ephemeral: true });

                return resolve();
            }

            if (role.position > guild.me.roles.highest.position) {
                reply(Embed({
                    preset: 'error',
                    description: lang.AdminModule.Commands.Takerole.HigherRole[1]
                }), { ephemeral: true });

                return resolve();
            }

            let msg = await reply(Embed({
                title: lang.AdminModule.Commands.Takerole.Removing
            }));

            if (everyone) {
                await Utils.asyncForEach([...guild.members.cache.values()].filter(m => !m.user.bot), async member => {
                    await member.roles.remove(role, `Removed by ${user.tag} from takerole command`);
                });
            } else {
                await mentionedUser.roles.remove(role, `Removed by ${user.tag} from takerole command`);
            }

            if (type == "message") msg.delete();
            
            const embed = Embed({
                title: lang.AdminModule.Commands.Takerole.RoleRemoved.Title,
                description: lang.AdminModule.Commands.Takerole.RoleRemoved.Description.replace(/{role}/g, role).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Takerole.RoleRemoved.Everyone),
                timestamp: new Date()
            });

            if (everyone) reply(embed);
            else msg.edit(embed);

            return resolve();
        });
    },
    description: "Take a role from all or a certain user",
    usage: "takerole <@role> <@user/all/everyone>",
    aliases: ['removerole'],
    arguments: [
        {
            name: "role",
            description: "The role to take",
            required: true,
            type: "ROLE"
        },
        {
            name: "target",
            description: "The user(s) to take the role from (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
