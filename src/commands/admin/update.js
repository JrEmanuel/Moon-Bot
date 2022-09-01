const { Collection } = require("discord.js");
const Utils = require("../../modules/utils.js");
const { lang, config, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: 'update',
    run: async (bot, messageOrInteraction, args, { member, user, guild, channel, reply }) => {
        return new Promise(async resolve => {
            let questions = [
                lang.AdminModule.Commands.Update.Questions[0],
                lang.AdminModule.Commands.Update.Questions[1],
                lang.AdminModule.Commands.Update.Questions[2],
                lang.AdminModule.Commands.Update.Questions[3],
                lang.AdminModule.Commands.Update.Questions[4],
                lang.AdminModule.Commands.Update.Questions[5]
            ];
            let answers = [];
            let toTag = [];

            let msg;

            const askQuestion = async (i, ask = true) => {
                const question = questions[i];
                if (ask) {
                    const embed = Embed({
                        author: {
                            text: bot.user.username,
                            icon: bot.user.displayAvatarURL({ dynamic: true })
                        },
                        timestamp: new Date(),
                        title: lang.AdminModule.Commands.Update.UpdateSetup.replace(/{pos}/g, `${(i + 1)}/${questions.length}`),
                        description: question
                    });

                    if (msg) {
                        msg.edit(embed);
                    } else {
                        msg = await reply(embed);
                    }
                }

                await Utils.waitForResponse(user.id, channel)
                    .then(response => {
                        response.delete().catch(() => { });

                        if (response.content.toLowerCase() === "cancel") {
                            reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Update.SetupCanceled }));

                            return resolve();
                        }
                        else if (i == 2) {
                            if (response.mentions.channels.first()) {
                                answers.push(response.mentions.channels);
                            } else {
                                if (response.content == "here") answers.push(channel);
                                else if (response.content == "default") {
                                    let mentionedChannel = Utils.findChannel(config.Channels.DefaultUpdates, guild);

                                    if (!mentionedChannel) {
                                        reply(Embed({
                                            color: config.EmbedColors.Error,
                                            title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title,
                                            description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description
                                        }), { ephemeral: true, deleteAfter: 2500 });
                                        return askQuestion(i, false);
                                    } else answers.push(mentionedChannel);
                                } else {
                                    reply(Embed({
                                        color: config.EmbedColors.Error,
                                        title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title,
                                        description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description
                                    }), { ephemeral: true, deleteAfter: 2500 });
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
                        } else {
                            answers.push(response.content);
                        }

                        if (i >= questions.length - 1) finishUpdate();
                        else askQuestion(++i);
                    });
            };

            askQuestion(0);

            const finishUpdate = () => {
                const sendToChannel = content => {
                    if (answers[2] instanceof Collection && answers[2].size == 1) answers[2] = answers[2].first();

                    if (answers[2] instanceof Collection) {
                        answers[2].forEach(mentionedChannel => mentionedChannel.send(content));
                    } else answers[2].send(content);
                };

                if (toTag && typeof toTag == 'string') sendToChannel(toTag);
                if (toTag && typeof toTag == 'object' && toTag.length > 0) sendToChannel(toTag.map(id => '<@&' + id + '>').join(', '));

                let embed = Utils.setupMessage({
                    configPath: embeds.Embeds.Update,
                    thumbnail: answers[3].includes("http") ? answers[3] : undefined,
                    image: answers[4].includes("http") ? answers[4] : undefined,
                    variables: [
                        ...Utils.userVariables(member, "user"),
                        { searchFor: /{update}/g, replaceWith: answers[0] },
                        { searchFor: /{update-version}/g, replaceWith: answers[1].toLowerCase() !== "none" ? `(v${answers[1]})` : "" }
                    ]
                });

                sendToChannel(embed);

                msg?.edit(Embed({
                    title: lang.AdminModule.Commands.Update.Embeds.Posted.Title,
                    description: lang.AdminModule.Commands.Update.Embeds.Posted.Description,
                    color: config.EmbedColors.Success
                }));

                return resolve(true);
            };
        });
    },
    description: "Create an update",
    usage: 'update',
    aliases: [],
    arguments: []
};
