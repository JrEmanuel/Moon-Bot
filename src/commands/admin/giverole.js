const Utils = require('../../modules/utils');
const lang = Utils.variables.lang;
const Embed = Utils.Embed;

module.exports = {
    name: "giverole",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, user, guild, reply }) => {
        return new Promise(async resolve => {
            let everyone = ["all", "everyone", "@everyone"].some(text => type == "interaction" ? args[1].toLowerCase() == text : args.includes(text)) ? true : false;
            let mentionedUser = Utils.ResolveUser(messageOrInteraction, 1);
            let role = type == "message" ? messageOrInteraction.mentions.roles.first() : guild.roles.cache.get(args[0]);
    
            if (args.length < 2 || !role || (!everyone && !mentionedUser)) {
                reply(Embed({ preset: 'invalidargs', usage: module.exports.usage }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
            if (!everyone && mentionedUser.user.bot) {
                reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Giverole.GiveToBot }), { ephemeral: true });

                return resolve();
            }
            
            if (role.position > member.roles.highest.position) {
                reply(Embed({
                    preset: 'error',
                    description: lang.AdminModule.Commands.Giverole.HigherRole[0]
                }), { ephemeral: true });

                return resolve();
            }
            if (role.position > guild.me.roles.highest.position) {
                reply(Embed({
                    preset: 'error',
                    description: lang.AdminModule.Commands.Giverole.HigherRole[1]
                }), { ephemeral: true });

                return resolve();
            }
    
            let msg = await reply(Embed({
                title: lang.AdminModule.Commands.Giverole.Adding
            }));
    
            if (everyone) {
                await Utils.asyncForEach([...guild.members.cache.values()].filter(m => !m.user.bot), async member => {
                    await member.roles.add(role, `Added by ${user.tag} from giverole command`);
                });
            } else {
                await mentionedUser.roles.add(role, `Added by ${user.tag} from giverole command`);
            }
    
            const completedEmbed = Embed({
                title: lang.AdminModule.Commands.Giverole.RoleAdded.Title,
                description: lang.AdminModule.Commands.Giverole.RoleAdded.Description.replace(/{role}/g, role).replace(/{user}/g, mentionedUser || lang.AdminModule.Commands.Giverole.RoleAdded.Everyone),
                timestamp: new Date()
            });

            if (!everyone) {
                msg.edit(completedEmbed);
            } else {
                if (type == "message") msg.delete();

                reply(completedEmbed);
            }

            return resolve(true);
        });
    },
    description: "Give all or a certain user a role",
    usage: "giverole <@role> <@user/all/everyone>",
    aliases: ['addrole'],
    arguments: [
        {
            name: "role",
            description: "The role to give",
            required: true,
            type: "ROLE"
        },
        {
            name: "target",
            description: "The user(s) to give the role to (@user/everyone)",
            required: true,
            type: "STRING"
        }
    ]
};
