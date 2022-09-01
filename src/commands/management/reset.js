const Utils = require('../../modules/utils');
const db = Utils.variables.db;
const Embed = Utils.Embed;
const {config, commands, lang} = Utils.variables;

module.exports = {
    name: "reset",
    run: async (bot, message, args) => {
        if (!commands.Permissions.reset.includes(message.member.id)) return message.channel.send(Embed({ preset: 'nopermission' }));
        if (args.length < 1) return message.channel.send(Embed({ preset: 'invalidargs', usage: module.exports.usage }));

        let type = args.join(' ').toLowerCase();
        let tables = [];
        let error = false;

        if (type == "coins") tables.push('coins');
        else if (["xp", "exp", "experience"].includes(type)) tables.push('experience');
        else if (type == "tickets") tables.push('tickets', 'ticketsaddedusers', 'ticketmessages', 'ticketmessages_embed_fields');
        else if (type == "giveaways") tables.push('giveaways', 'giveawayreactions');
        else if (type == 'punishments') tables.push('punishments');
        else if (type == 'warnings') tables.push('warnings');
        else if (type == 'applications') tables.push('applications', 'applicationmessages', 'applicationmessages_embed_fields');
        else if (type == 'jobs') tables.push('jobs', 'job_cooldowns', 'global_times_worked');
        else if (type == 'daily') tables.push('dailycoinscooldown');
        else if (type == 'games') tables.push('game_data');
        else if (type == 'saved roles') tables.push('saved_roles');
        else if (type == "filter") tables.push("filter");
        else if (type == "invites") tables.push("invites", "joins");
        else return message.channel.send(Embed({ preset: "invalidargs", usage: module.exports.usage }));

        message.channel.send(Embed({ title: lang.ManagementModule.Commands.Reset.Confirmation})).then(m => {
            m.react("✅");
            m.react("❌");

            Utils.waitForReaction(["✅", "❌"], message.member.id, m).then(async reaction => {
                m.delete();

                if (reaction.emoji.name == "❌") {
                    message.delete();
                } else {
                    if (config.Storage.Type == "sqlite") await Utils.backup([{ path: './data/database.sqlite', folder: "data" }]);
                    console.log(Utils.backupPrefix + 'Files backed up at ' + new Date().toLocaleString());

                    console.log(Utils.warningPrefix + "The following tables are being reset: " + tables.join(", "));
                    let msg = await message.channel.send(Embed({ title: lang.ManagementModule.Commands.Reset.Resetting }));

                    await tables.forEach(table => {
                        if (config.Storage.Type == "sqlite") {
                            db.sqlite.database.prepare("DELETE FROM " + table).run();
                        } else {
                            db.mysql.database.query("DELETE FROM " + table, (err) => {
                                if (err) {
                                    error = true;
                                    throw err;
                                }
                            });
                        }
                    });

                    if (error) return msg.edit(Embed({ preset: "console" }));

                    db.setup(config, bot)
                        .then(() => {
                            msg.edit(Embed({
                                title: lang.ManagementModule.Commands.Reset.Embed.Title,
                                description: lang.ManagementModule.Commands.Reset.Embed.Description.replace(/{tables}/g, tables.map(t => `\`${t}\``).join(", ")),
                                timestamp: new Date()
                            }));
                        })
                        .catch(err => {
                            msg.edit(Embed({ preset: "console" }));
                            throw err;
                        });
                }
            });
        });
},
    description: "Reset a system in Corebot",
    usage: "reset <coins/xp/tickets/giveaways/punishments/warnings/applications/jobs/daily/games/saved roles/filter/invites>",
    aliases: []
};
