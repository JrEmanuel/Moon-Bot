const Utils = require('../modules/utils.js');
const { config, lang } = Utils.variables;

const sendWelcomeMessage = require('../modules/methods/sendWelcomeMessage.js');

module.exports = async (bot, member) => {
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (config.Other.IgnoredGuilds.includes(member.guild.id)) return;

        let idBans = await Utils.variables.db.get.getIDBans(member.guild);
        let ban = idBans.find(ban => ban.id == member.id);

        if (ban) {
            let executor = member.guild.members.cache.get(ban.executor) || member.guild.me;
            let punishment = {
                type: "ban",
                user: member.id,
                tag: member.user.tag,
                reason: "ID Ban" + (ban.reason ? ` - ${ban.reason}` : ""),
                time: member.joinedTimestamp,
                executor: executor.id
            };

            await Utils.variables.db.update.punishments.addPunishment(punishment);
            await member.ban({ reason: ban.reason });
            Utils.variables.db.update.id_bans.remove(member.guild, member.id);

            return bot.emit('userPunished', punishment, member, executor);
        }

        member.guild.invites.fetch({ cache: false }).then(async invites => {
            let cached = Utils.variables.invites[member.guild.id];
            let invite = invites.find(i => {
                if (cached.get(i.code)) {
                    return cached.get(i.code).uses < i.uses;
                } else return false;
            });


            if (!invite) invite = cached.find(cachedInvite => !invites.get(cachedInvite.code));

            Utils.updateInviteCache(bot);

            if (invite) {
                if (!invite.inviter) invite.inviter = member.guild.members.cache.get(member.guild.ownerId);
                else invite.inviter = member.guild.members.cache.get(invite.inviter.id);

                let joins = await Utils.variables.db.get.getJoins(member);

                if (joins) await Utils.asyncForEach([...new Set(joins.map(j => j.inviter))], async inviterID => {
                    let inviter = member.guild.members.cache.get(inviterID);
                    let invData = await Utils.variables.db.get.getInviteData(inviter);
                    invData.leaves--;
                    await Utils.variables.db.update.invites.updateData(inviter, invData);
                });

                let inviterData = await Utils.variables.db.get.getInviteData(invite.inviter);

                if (joins && joins.find(i => i.inviter == invite.inviter.id)) {
                    inviterData.fake++;
                } else {
                    inviterData.regular++;

                    // INVITE REWARDS
                    if (config.Join.InviteRewards.Enabled && config.Join.InviteRewards.Roles && typeof config.Join.InviteRewards.Roles == "object") {
                        let i = inviterData.regular + inviterData.bonus;
                        Object.keys(config.Join.InviteRewards.Roles).forEach(async invites => {
                            if (i == invites) {
                                let role = Utils.findRole(config.Join.InviteRewards.Roles[invites], member.guild);
                                if (role && !invite.inviter.bot) {
                                    member.guild.members.cache.get(invite.inviter.id).roles.add(role);
                                    invite.inviter.send(lang.Other.InviteRewardsMessage.replace(/{invites}/g, invites).replace(/{role}/g, role.name)).catch(() => { });
                                }
                            }
                        });
                    }

                }

                await Utils.variables.db.update.invites.addJoin(member, invite.inviter);
                await Utils.variables.db.update.invites.updateData(invite.inviter, inviterData);
            }

            // JOIN ROLES & SAVED ROLES
            let roles = [];

            if (config.Join.Roles && Array.isArray(config.Join.Roles)) roles.push(...config.Join.Roles.filter(r => typeof r == "string").map(roleName => Utils.findRole(roleName, member.guild)));
            if (config.Leave.Data.Roles) {
                let savedRoles = await Utils.variables.db.get.getSavedRoles(member) || [];
                roles.push(...savedRoles.map(role => Utils.findRole(role, member.guild)));
            }

            if (roles.length) member.roles.add(roles.filter(role => role));

            console.log(Utils.infoPrefix + `${member.user.tag} joined the server.`);
            
            if (config.Verification.Enabled && config.Verification.WelcomeMessage == "after-verified") return;
            sendWelcomeMessage(bot, member, invite ? invite.inviter : undefined);
        });
    }
};
