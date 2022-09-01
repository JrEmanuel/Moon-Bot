const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const Discord = Utils.Discord;
const config = Utils.variables.config;
const lang = Utils.variables.lang;

module.exports = {
    name: "history",
    run: async (bot, messageOrInteraction, args, { prefixUsed, guild, reply }) => {
        return new Promise(async resolve => {
            let targetUser = Utils.ResolveUser(messageOrInteraction);
            let page = +args[1] || 1;
            if (page < 1) page = 1;
    
            if (targetUser) targetUser = targetUser.user;
            else if (/^[0-9]{18}$/.test(args[0])) targetUser = await bot.users.fetch(args[0]);
            else if (/.*#[0-9]{4}/.test(args[0])) targetUser = args[0];
    
            if (!targetUser) {
                reply(Embed({ 
                    preset: "invalidargs", 
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }
    
            const history = typeof targetUser == "string" ? await Utils.variables.db.get.getPunishmentsForUserByTag(targetUser) : await Utils.variables.db.get.getPunishmentsForUser(targetUser.id);
    
            const embed = new Discord.MessageEmbed()
                .setColor(config.EmbedColors.Default)
                .setAuthor({
                    name: typeof targetUser == "string" ? targetUser : targetUser.username, 
                    iconURL: typeof targetUser == "string" ? undefined : targetUser.displayAvatarURL({ dynamic: true })
                })
                .setTitle(lang.ModerationModule.Commands.History.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(history.length / 5)));
    
            if (!history || history.length == 0) {
                reply(Embed({ 
                    preset: 'error', 
                    description: lang.ModerationModule.Commands.History.NoHistory
                }), { ephemeral: true });
                return resolve();
            }
    
            await Promise.all(history.slice((page - 1) * 5, 5 * page).map(async function (punishment) {
                return new Promise(async resolve => {
                    let ineffect = lang.ModerationModule.Commands.History.InEffect[0];
                    const displayType = punishment.type ? (punishment.type.charAt(0).toUpperCase() + punishment.type.substr(1, punishment.type.length)) : '';
    
                    if (punishment.type == 'kick') {
                        return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[2]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[4]}<t:${Math.floor(punishment.time / 1000)}:f>`));
                    } else if (punishment.type == 'tempban' || punishment.type == 'tempmute') {
                        return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[2]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[3]}${Utils.DDHHMMSSfromMS(punishment.length)}\n${lang.ModerationModule.Commands.History.Fields[4]}<t:${Math.floor(punishment.time / 1000)}:f>`));
                    } else if (punishment.type == 'ban') {
                        await Utils.checkBan(guild, punishment.user)
                            .then(res => {
                                if (!res) ineffect = lang.ModerationModule.Commands.History.InEffect[1];
                                else ineffect = lang.ModerationModule.Commands.History.InEffect[0];
                            });
                    } else if (punishment.type == 'mute') {
                        if (!guild.members.cache.get(punishment.user).roles.cache.find(r => r.name == config.Moderation.MuteRole)) ineffect = lang.ModerationModule.Commands.History.InEffect[1];
                    }
    
                    return resolve(embed.addField(lang.ModerationModule.Commands.History.FieldTitle.replace(/{id}/g, punishment.id), `${lang.ModerationModule.Commands.History.Fields[0]}${displayType}\n${lang.ModerationModule.Commands.History.Fields[1]}<@${punishment.executor}>\n${lang.ModerationModule.Commands.History.Fields[2]}${punishment.reason}\n${lang.ModerationModule.Commands.History.Fields[4]}<t:${Math.floor(punishment.time / 1000)}:f>\n${lang.ModerationModule.Commands.History.Fields[5]}${ineffect}`));
                });
            }));
    
            reply({ embeds: [embed] });

            return resolve(true);
        });
    },
    description: "View the punishment history of a user",
    usage: "history <@user> [page #]",
    aliases: [],
    arguments: [
        {
            name: "user",
            description: "The user to view the punishment history of",
            required: true,
            type: "USER"
        },
        {
            name: "page",
            description: "The page to view",
            required: false,
            type: "INTEGER",
            minValue: 1
        }
    ]
};
