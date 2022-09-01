const { Collection } = require("discord.js");
const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang, embeds } = Utils.variables;

module.exports = {
    name: 'announce',
    run: async (bot, messageOrInteraction, args, { member, user, guild, channel, reply }) => {
        return new Promise(async resolve => {
            let questions = [
                lang.AdminModule.Commands.Announce.Questions[0],
                lang.AdminModule.Commands.Announce.Questions[1],
                lang.AdminModule.Commands.Announce.Questions[2],
                lang.AdminModule.Commands.Announce.Questions[3],
                lang.AdminModule.Commands.Announce.Questions[4],
                lang.AdminModule.Commands.Announce.Questions[5]
            ];
            let answers = [];
            let toTag = [];
            let msgIDs = [];
    
            const askQuestion = async (i, ask = true) => {
                const question = questions[i];
                if (ask) await reply(Embed({
                    author: {
                        text: bot.user.username,
                        icon: bot.user.displayAvatarURL({ dynamic: true })
                    },
                    timestamp: new Date(),
                    title: lang.AdminModule.Commands.Announce.AnnouncementSetup.replace(/{pos}/g, `${(i + 1)}/${questions.length}`),
                    description: question
                })).then(msg => msgIDs.push(msg.id));
    
                await Utils.waitForResponse(user.id, channel)
                    .then(response => {
                        msgIDs.push(response.id);
                        if (response.content.toLowerCase() === "cancel") {
                            reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Announce.SetupCanceled }), { ephemeral: true });
                            return resolve(false);
                        }
                        else if (i == 2) {
                            if (response.mentions.channels.first()) {
                                answers.push(response.mentions.channels);
                            } else {
                                if (response.content == "here") answers.push(channel);
                                else if (response.content == "default") {
                                    let mentionedChannel = Utils.findChannel(config.Channels.DefaultAnnouncements, guild);
    
                                    if (!mentionedChannel) {
                                        reply(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Announce.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Announce.Embeds.InvalidChannel.Description }), { ephemeral: true, deleteAfter: 2500 });
                                        return askQuestion(i, false);
                                    } else answers.push(mentionedChannel);
                                } else {
                                    reply(Embed({ color: config.EmbedColors.Error, title: lang.AdminModule.Commands.Announce.Embeds.InvalidChannel.Title, description: lang.AdminModule.Commands.Announce.Embeds.InvalidChannel.Description }), { ephemeral: true, deleteAfter: 2500 });
                                    return askQuestion(i, false);
                                }
                            }
                        } else if (i == 3) {
                            if (response.content.toLowerCase() == 'everyone') toTag = '@everyone';
                            if (response.mentions.roles.first()) toTag = response.mentions.roles.map(r => r.id);
                            if (response.content.toLowerCase().replace(/\s+/g, '').split(',').some(rolename => !!response.guild.roles.cache.find(r => r.name.toLowerCase() == rolename))) response.content.toLowerCase().replace(/\s+/g, '').split(',').forEach(c => {
                                if (response.guild.roles.cache.find(r => r.name.toLowerCase() == c)) {
                                    toTag.push((response.guild.roles.cache.find(r => r.name.toLowerCase() == c)).id);
                                }
                            });
                            if (typeof toTag == 'object' && toTag.length < 1) toTag == undefined;
                        } else answers.push(response.content);
    
                        if (i >= questions.length - 1) finishAnnouncement();
                        else askQuestion(++i);
                    });
            };
    
            askQuestion(0);
    
            const finishAnnouncement = async () => {
                let send = (content, deleteAfter = false) => {
                    if (answers[2] instanceof Collection && answers[2].size == 1) answers[2] = answers[2].first();

                    if (answers[2] instanceof Collection) {
                        answers[2].forEach(mentionedChannel => mentionedChannel.send(content).then(m => {
                            if (deleteAfter) Utils.delete(m, deleteAfter);
                        }));
                    } else answers[2].send(content).then(m => {
                        if (deleteAfter) Utils.delete(m, deleteAfter);
                    });
                };

                if (toTag && typeof toTag == 'string') send({ content: toTag }, 1500);
                if (toTag && typeof toTag == 'object' && toTag.length > 0) send({ content: toTag.map(id => '<@&' + id + '>').join(', ') }, 1500);
    
                let embed = Utils.setupMessage({
                    configPath: embeds.Embeds.Announcement,
                    thumbnail: answers[3].includes("http") ? answers[3] : undefined,
                    image: answers[4].includes("http") ? answers[4] : undefined,
                    variables: [
                        ...Utils.userVariables(member, "user"),
                        { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                        { searchFor: /{title}/g, replaceWith: answers[0] },
                        { searchFor: /{description}/g, replaceWith: answers[1] }
                    ]
                });
    
                send(embed);
    
                msgIDs.forEach(async id => (await channel.messages.fetch(id)).delete());
                reply(Embed({ title: lang.AdminModule.Commands.Announce.Embeds.Posted.Title, description: lang.AdminModule.Commands.Announce.Embeds.Posted.Description, color: config.EmbedColors.Success }));

                resolve(true);
            };
        });
    },
    description: "Create an announcement",
    usage: 'announce',
    aliases: [
        'announcement'
    ],
    arguments: []
};
