const Utils = require("../../modules/utils");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;

module.exports = {
    name: "gcreate",
    run: async (bot, messageOrInteraction, args, { member, guild, channel, reply }) => {
        return new Promise(async resolve => {
            const gcreateLang = lang.GiveawaySystem.Commands.Gcreate;
            const questions = [
                gcreateLang.Questions[0], // Prize
                gcreateLang.Questions[1], // Description
                gcreateLang.Questions[2], // Time
                gcreateLang.Questions[3], // Winners
                gcreateLang.Questions[4], // Channel
                gcreateLang.Questions[5], // Host
                gcreateLang.Questions[6], // Requirements
            ];
            const answers = [];
            let questionMessage;

            const getAnswer = async (index, askQuestion = true) => {

                if (askQuestion) questionMessage = await reply(Embed({
                    title: gcreateLang.Create.Title,
                    description: questions[index],
                    footer: gcreateLang.Create.Footer.replace(/{current-step}/g, index + 1).replace(/{max-steps}/g, questions.length)
                }));

                if (index <= 5) {
                    Utils.waitForResponse(member.id, channel)
                        .then(async response => {
                            response.delete().catch(() => { });

                            if (response.content.toLowerCase() == "cancel") {
                                questionMessage.delete().catch(() => { });

                                reply(Embed({
                                    preset: "error",
                                    description: gcreateLang.Canceled
                                }));

                                return resolve(false);
                            }

                            if (index == 0) answers.push(response.content);
                            if (index == 1) answers.push(response.content.toLowerCase() == "no" ? "" : response.content);

                            else if (index == 2) {
                                const time_pattern = /^(\d+((h|H)|(d|D)|(m|M)))+$/;

                                if (!time_pattern.test(response.content.toLowerCase())) {
                                    reply(Embed({
                                        preset: "error",
                                        description: gcreateLang.Invalid.Time
                                    }), { ephemeral: true, deleteAfter: 3000 });

                                    return getAnswer(index, false);
                                }

                                answers.push(Utils.getMSFromText(response.content));
                            }

                            else if (index == 3) {
                                if (isNaN(+response.content) || +response.content < 1) {
                                    reply(Embed({
                                        preset: "error",
                                        description: gcreateLang.Invalid.Number
                                    }), { ephemeral: true, deleteAfter: 3000 });

                                    return getAnswer(index, false);
                                }

                                answers.push(+response.content);
                            }

                            else if (index == 4) {
                                let mentionedChannel = response.mentions.channels.first();

                                if (!mentionedChannel) {
                                    if (response.content.toLowerCase() == "here") {
                                        mentionedChannel = channel;
                                    } else {
                                        reply(Embed({
                                            preset: "error",
                                            description: gcreateLang.Invalid.Channel[0]
                                        }), { ephemeral: true, deleteAfter: 3000 });

                                        return getAnswer(index, false);
                                    }
                                }

                                answers.push(mentionedChannel);
                            }

                            else if (index == 5) {
                                let host = response.mentions.members.first();

                                if (!host) {
                                    if (response.content.toLowerCase() == "me") {
                                        host = member;
                                    } else {
                                        reply(Embed({
                                            preset: "error",
                                            description: gcreateLang.Invalid.Member
                                        }), { ephemeral: true, deleteAfter: 3000 });

                                        return getAnswer(index, false);
                                    }
                                }

                                answers.push(host);
                            }

                            if (questionMessage) questionMessage.delete().catch(() => { });
                            getAnswer(++index);
                        });
                } else {
                    const emojis = ["✅", "❌"];
                    emojis.forEach(e => questionMessage.react(e).catch(() => { }));

                    Utils.waitForReaction(emojis, member.id, questionMessage)
                        .then(async reaction => {
                            if (reaction.emoji.name == "❌") {
                                questionMessage.delete().catch(() => { });
                                finishGiveaway();
                            } else {
                                const requirements = { roles: {} };
                                const emojis = new Array(6).fill().map((x, i) => Utils.getEmoji(i + 1));

                                emojis.push("✅", "❌");

                                questionMessage.delete().catch(() => { });
                                questionMessage = await reply(Embed({
                                    title: gcreateLang.Requirements.Title,
                                    description: Object.values(gcreateLang.Requirements.Description).map(d => d[0]).join(""),
                                }));

                                emojis.forEach(emoji => questionMessage.react(emoji).catch(() => { }));

                                let collecting = true;
                                let collector = questionMessage.createReactionCollector({ filter: (reaction, user) => emojis.includes(reaction.emoji.name) && user.id == member.id && collecting });

                                collector.on("collect", async (reaction) => {
                                    collecting = false;
                                    reaction.users.remove(member);

                                    if (reaction.emoji.name == "✅") return collector.stop("finish");
                                    if (reaction.emoji.name == "❌") return collector.stop("canceled");

                                    let type = Utils.getEmoji(1) == reaction.emoji.name ? "coins" : Utils.getEmoji(2) == reaction.emoji.name ? "xp" : Utils.getEmoji(6) == reaction.emoji.name ? "messages" : "level";
                                    let question;

                                    if (reaction.emoji.name == Utils.getEmoji(4)) question = gcreateLang.Requirements.Questions[0];
                                    if (reaction.emoji.name == Utils.getEmoji(5)) question = gcreateLang.Requirements.Questions[2];
                                    if ([Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3), Utils.getEmoji(6)].includes(reaction.emoji.name)) question = gcreateLang.Requirements.Questions[4].replace(/{type}/g, type == "coins" ? gcreateLang.Requirements.Coins : type == "xp" ? gcreateLang.Requirements.XP : type == "messages" ? gcreateLang.Requirements.Messages : gcreateLang.Requirements.Level);

                                    let q = await reply(Embed({ title: question, footer: gcreateLang.Requirements.Footer }));
                                    let invalid = true;

                                    while (invalid) {
                                        await Utils.waitForResponse(member.id, channel)
                                            .then(async response => {
                                                response.delete().catch(() => { });

                                                if (response.content.toLowerCase() == "cancel") return invalid = false;

                                                else if ([Utils.getEmoji(1), Utils.getEmoji(2), Utils.getEmoji(3), Utils.getEmoji(6)].includes(reaction.emoji.name)) {
                                                    let amount = +response.content;

                                                    if (isNaN(amount) || amount < 1) return reply(Embed({
                                                        preset: "error",
                                                        description: gcreateLang.Invalid.Number
                                                    }), { ephemeral: true, deleteAfter: 3000 });

                                                    requirements[type] = amount;
                                                    invalid = false;
                                                }

                                                else if (reaction.emoji.name == Utils.getEmoji(4)) {
                                                    let giveawayGuild = bot.guilds.cache.get(response.content);

                                                    if (!giveawayGuild) return reply(Embed({
                                                        preset: "error",
                                                        description: gcreateLang.Invalid.Guilds
                                                    }), { ephemeral: true, deleteAfter: 3000 });

                                                    let invalid2 = true;

                                                    requirements.server = {
                                                        id: giveawayGuild.id
                                                    };

                                                    q.delete();
                                                    while (invalid2) {
                                                        let q2 = await reply(Embed({ title: gcreateLang.Requirements.Questions[1], footer: gcreateLang.Requirements.Footer }));
                                                        await Utils.waitForResponse(member.id, channel)
                                                            .then(async response => {
                                                                response.delete().catch(() => { });

                                                                let c = Utils.findChannel(response.content, giveawayGuild, 'GUILD_TEXT', false);

                                                                if (!c) return reply(Embed({
                                                                    preset: "error",
                                                                    description: gcreateLang.Invalid.Channel[1]
                                                                }), { ephemeral: true, deleteAfter: 3000 });

                                                                q2.delete();
                                                                await c.createInvite({ temporary: false, maxAge: 0 })
                                                                    .then(invite => {
                                                                        requirements.server.link = invite.url;
                                                                    })
                                                                    .catch(() => {
                                                                        reply(Embed({
                                                                            preset: "error",
                                                                            description: gcreateLang.InviteError
                                                                        }), { ephemeral: true, deleteAfter: 3000 });

                                                                        requirements.server = undefined;
                                                                    });
                                                                invalid2 = false;
                                                            });
                                                    }
                                                    invalid = false;
                                                }

                                                else if (reaction.emoji.name == Utils.getEmoji(5)) {
                                                    let promise = new Promise(async resolve => {
                                                        q.delete().catch(() => { });
                                                        requirements.roles.cantHave = response.mentions.roles.map(role => role.id);

                                                        const q2 = await reply(Embed({ title: gcreateLang.Requirements.Questions[3], footer: gcreateLang.Requirements.Footer }));

                                                        await Utils.waitForResponse(member.id, channel)
                                                            .then(response2 => {
                                                                response2.delete().catch(() => { });
                                                                requirements.roles.mustHave = response2.mentions.roles.map(role => role.id);

                                                                if (response2.content.toLowerCase() == "cancel") {
                                                                    q2.delete().catch(() => { });
                                                                    return resolve();
                                                                }

                                                                q2.delete().catch(() => { });
                                                                resolve();
                                                            });
                                                    });

                                                    await promise;
                                                    invalid = false;
                                                }
                                            });
                                    }

                                    q.delete().catch(() => { });

                                    const desc = gcreateLang.Requirements.Description;

                                    questionMessage.edit(Embed({
                                        title: gcreateLang.Requirements.Title,
                                        description: [
                                            requirements.coins ? desc.Coin[1] : desc.Coin[0],
                                            requirements.xp ? desc.XP[1] : desc.XP[0],
                                            requirements.level ? desc.Level[1] : desc.Level[0],
                                            requirements.server ? desc.Server[1] : desc.Server[0],
                                            requirements.roles.cantHave !== undefined ? desc.Roles[1] : desc.Roles[0],
                                            requirements.messages ? desc.Messages[1] : desc.Messages[0]
                                        ]
                                            .join("")
                                            .replace(/{coins}/g, requirements.coins ? requirements.coins.toLocaleString() : "")
                                            .replace(/{xp}/g, requirements.xp ? requirements.xp.toLocaleString() : "")
                                            .replace(/{level}/g, requirements.level ? requirements.level.toLocaleString() : "")
                                            .replace(/{server-name}/g, requirements.server ? bot.guilds.cache.get(requirements.server.id).name : "")
                                            .replace(/{server-id}/g, requirements.server ? requirements.server.id : "")
                                            .replace(/{roles-cant}/g, requirements.roles && requirements.roles.cantHave && requirements.roles.cantHave.length ? requirements.roles.cantHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                            .replace(/{roles-must}/g, requirements.roles && requirements.roles.mustHave && requirements.roles.mustHave.length ? requirements.roles.mustHave.map(r => `<@&${r}>`).join(", ") : lang.Global.None)
                                            .replace(/{message-count}/g, requirements.messages ? requirements.messages.toLocaleString() : "")
                                    }));

                                    collecting = true;
                                });

                                collector.on("end", (collected, reason) => {
                                    questionMessage.delete().catch(() => { });

                                    if (reason == "finish") {
                                        if (collected.size > 1) answers.push(requirements);

                                        return finishGiveaway();
                                    }

                                    reply(Embed({
                                        preset: "error",
                                        description: gcreateLang.Canceled
                                    }), { ephemeral: true });

                                    return resolve(false);
                                });
                            }
                        });
                }
            };

            const finishGiveaway = async () => {
                const giveaway = {
                    guild: guild.id,
                    prize: answers[0],
                    description: answers[1],
                    start: Date.now(),
                    end: Date.now() + answers[2],
                    amount_of_winners: answers[3],
                    channel: answers[4],
                    host: answers[5],
                    requirements: answers[6]
                };
                if (!giveaway.requirements) giveaway.requirements = {
                    roles: {
                        mustHave: [],
                        cantHave: []
                    }
                };
                if (!giveaway.requirements.roles.mustHave) giveaway.requirements.roles.mustHave = [];
                if (!giveaway.requirements.roles.cantHave) giveaway.requirements.roles.cantHave = [];

                const server = giveaway.requirements && giveaway.requirements.server ? bot.guilds.cache.get(giveaway.requirements.server.id) : undefined;
                const giveawayMessage = giveaway.requirements ? Utils.variables.embeds.Embeds.GiveawayWithRequirements : Utils.variables.embeds.Embeds.Giveaway;

                giveaway.channel.send(Utils.setupMessage({
                    configPath: giveawayMessage,
                    description: giveawayMessage.description == "{description}" ? giveaway.description : giveawayMessage.description,
                    variables: [
                        { searchFor: /{prize}/g, replaceWith: giveaway.prize },
                        { searchFor: /{description}/g, replaceWith: giveaway.description == "" ? "" : "\n" + giveaway.description + "\n" },
                        { searchFor: /{winners}/g, replaceWith: giveaway.amount_of_winners },
                        { searchFor: /{host}/g, replaceWith: giveaway.host.toString() },
                        { searchFor: /{time-left}/g, replaceWith: `<t:${Math.floor(giveaway.end / 1000)}:R>` },
                        { searchFor: /{requirements-coins}/g, replaceWith: giveaway.requirements && giveaway.requirements.coins ? lang.GiveawaySystem.Requirements.Coins.replace(/{amount}/g, giveaway.requirements.coins.toLocaleString()) : "" },
                        { searchFor: /{requirements-xp}/g, replaceWith: giveaway.requirements && giveaway.requirements.xp ? lang.GiveawaySystem.Requirements.XP.replace(/{amount}/g, giveaway.requirements.xp.toLocaleString()) : "" },
                        { searchFor: /{requirements-level}/g, replaceWith: giveaway.requirements && giveaway.requirements.level ? lang.GiveawaySystem.Requirements.Level.replace(/{level}/g, giveaway.requirements.level.toLocaleString()) : "" },
                        { searchFor: /{requirements-server}/g, replaceWith: giveaway.requirements && giveaway.requirements.server ? lang.GiveawaySystem.Requirements.Server.replace(/{server-name}/g, server.name).replace(/{server-invite}/g, giveaway.requirements.server.link) : "" },
                        { searchFor: /{requirements-roles-cant-have}/g, replaceWith: giveaway.requirements && giveaway.requirements.roles && giveaway.requirements.roles.cantHave && giveaway.requirements.roles.cantHave.length ? giveaway.requirements.roles.cantHave.length == 1 ? lang.GiveawaySystem.Requirements.Roles.CantHave.One.replace(/{role}/g, `<@&${giveaway.requirements.roles.cantHave[0]}>`) : lang.GiveawaySystem.Requirements.Roles.CantHave.Multiple.replace(/{roles}/g, giveaway.requirements.roles.cantHave.map(r => `<@&${r}>`)) : "" },
                        { searchFor: /{requirements-roles-must-have}/g, replaceWith: giveaway.requirements && giveaway.requirements.roles && giveaway.requirements.roles.mustHave && giveaway.requirements.roles.mustHave.length ? giveaway.requirements.roles.mustHave.length == 1 ? lang.GiveawaySystem.Requirements.Roles.MustHave.One.replace(/{role}/g, `<@&${giveaway.requirements.roles.mustHave[0]}>`) : lang.GiveawaySystem.Requirements.Roles.MustHave.Multiple.replace(/{roles}/g, giveaway.requirements.roles.mustHave.map(r => `<@&${r}>`)) : "" },
                        { searchFor: /{requirements-messages}/g, replaceWith: giveaway.requirements && giveaway.requirements.messages ? lang.GiveawaySystem.Requirements.Messages.replace(/{amount}/g, giveaway.requirements.messages.toLocaleString()) : "" },
                        {
                            searchFor: /{extra-entries}/g, replaceWith: Object.keys(config.Other.Giveaways.ExtraEntries).map(r => {
                                let role = Utils.findRole(r, guild);
                                let entries = config.Other.Giveaways.ExtraEntries[r];
                                if (role) return lang.GiveawaySystem.ExtraEntries.replace(/{role}/g, `<@&${role.id}>`).replace(/{amount}/g, entries);
                                else return undefined;
                            }).filter(r => r).join("\n")
                        }
                    ],
                    timestamp: giveawayMessage.Timestamp ? new Date(giveaway.end) : undefined
                })).then(async m => {
                    giveaway.message = m.id;

                    await Utils.variables.db.update.giveaways.addGiveaway(giveaway);
                    await m.react(Utils.findEmoji(Utils.variables.config.Other.Giveaways.UnicodeEmoji, bot, false) || Utils.variables.config.Other.Giveaways.UnicodeEmoji);

                    if (giveaway.channel.id !== channel.id) reply(Embed({
                        title: gcreateLang.Created.Title,
                        description: gcreateLang.Created.Description.replace(/{url}/g, m.url).replace(/{date}/g, new Date(giveaway.end).toLocaleString()),
                        timestamp: new Date()
                    }));

                    return resolve(true);
                });
            };

            getAnswer(0);
        });
    },
    description: "Create a giveaway",
    usage: "gcreate",
    aliases: [
        "giveawaycreate",
        "creategiveaway"
    ],
    arguments: []
};
