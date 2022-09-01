const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "mutelist",
    run: async (bot, messageOrInteraction, args, { guild, reply }) => {
        return new Promise(async resolve => {
            let muteRole = Utils.findRole(config.Moderation.MuteRole, guild);

            if (!muteRole) {
                reply(Embed({
                    preset: "console"
                }), { ephemeral: true });
                return resolve();
            }
    
            await guild.members.fetch(); // Fetching members because <Role>.members only displays cached members
    
            let mutes = muteRole.members;
    
            if (mutes.size) {
                mutes = await Promise.all(mutes.map(async member => {
                    let punishments = await Utils.variables.db.get.getPunishmentsForUser(member.id);
                    punishments = punishments.filter(punishment => punishment.type == "tempmute" ? !punishment.complete : punishment.type == "mute").sort((a, b) => b.time - a.time);
    
                    return {
                        member,
                        punishmentData: punishments[0]
                    };
                }));
                let page = +args[0] || 1;
                
                let display = mutes.map(mute => {
                    if (mute.punishmentData) {
                        let executor = guild.members.cache.get(mute.punishmentData.executor);
                        return (mute.punishmentData.type == "mute" ? lang.ModerationModule.Commands.Mutelist.List.MuteInfo : lang.ModerationModule.Commands.Mutelist.List.TempmuteInfo)
                        .replace(/{user}/g, mute.member)
                        .replace(/{reason}/g, mute.punishmentData.reason)
                        .replace(/{date}/g, "<t:" + (Math.floor(mute.punishmentData.time / 1000)) + ":f>")
                        .replace(/{executor}/g, executor)
                        .replace(/{id}/g, mute.punishmentData.id)
                        .replace(/{end-date}/g, mute.punishmentData.type == "mute" ? lang.Global.Never : new Date(mute.punishmentData.time + mute.punishmentData.length).toLocaleString())
                        .replace(/{end-timestamp}/g, mute.punishmentData.type == "mute" ? lang.Global.Never : Math.floor((mute.punishmentData.time + mute.punishmentData.length) / 1000));
                    } else {
                        return lang.ModerationModule.Commands.Mutelist.List.NoExtraInfo
                        .replace(/{user}/g, mute.member);
                    }
                });
    
                if (page > Math.ceil(display.length / 10)) page = 1;
    
                reply(Embed({
                    title: lang.ModerationModule.Commands.Mutelist.List.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, Math.ceil(display.length / 10)),
                    description: display.slice((page - 1) * 10, page * 10).join("\n\n")
                }));

                return resolve(true);
            } else {
                reply(Embed({
                    title: lang.ModerationModule.Commands.Mutelist.NoMutes.Title,
                    description: lang.ModerationModule.Commands.Mutelist.NoMutes.Description
                }));

                return resolve(true);
            }
        });
    },
    description: "View a list of currently muted users",
    usage: "mutelist [page number]",
    aliases: ["mutes"],
    arguments: [
        {
            name: "page",
            description: "The page number to view",
            required: false,
            type: "INTEGER"
        }
    ]
};
