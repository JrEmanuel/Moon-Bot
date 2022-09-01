const Utils = require("../../modules/utils.js");
const { lang, config, embeds } = Utils.variables;
const Embed = Utils.Embed;

module.exports = {
    name: 'vote',
    run: async (bot, messageOrInteraction, args, { member, user, guild, channel, reply }) => {
        return new Promise(async resolve => {
            let questions = [
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[0],
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[1],
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[2],
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[3],
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[4],
                lang.AdminModule.Commands.Vote.Embeds.PollSetup.Questions[5]
            ];
            let answers = [];
            let pollEmojis;

            let msg;
    
            const askQuestion = async (i, ask = true) => {
                const question = questions[i];
                if (ask) {
                    const embed = Embed({ 
                        title: lang.AdminModule.Commands.Vote.Embeds.PollSetup.Title.replace(/{pos}/g, `${(i + 1)}/${questions.length}`), 
                        description: question 
                    });

                    if (msg) {
                        await msg.edit(embed);
                    } else {
                        msg = await reply(embed);
                    }
                }
    
                await Utils.waitForResponse(user.id, channel)
                    .then(response => {
                        response.delete().catch(() => {});

                        if (response.content.toLowerCase() === "cancel") {
                            reply(Embed({ preset: "error", description: lang.AdminModule.Commands.Vote.SetupCanceled }));

                            return resolve();
                        }
                        else if (i == 5) {
                            if (response.mentions.channels.first()) {
                                answers.push([...response.mentions.channels.values()]);
                            } else {
                                if (response.content == "here") answers.push(channel);
                                else if (response.content == "default") {
                                    let channel = Utils.findChannel(config.Channels.DefaultVote, guild);
    
                                    if (!channel) {
                                        reply(Embed({ 
                                            color: config.EmbedColors.Error, 
                                            title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, 
                                            description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description 
                                        }), { ephemeral: true, deleteAfter: 2500 });

                                        return askQuestion(i, false);
                                    } else answers.push(channel);
                                } else {
                                    reply(Embed({ 
                                        color: config.EmbedColors.Error, 
                                        title: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Title, 
                                        description: lang.AdminModule.Commands.Update.Embeds.InvalidChannel.Description
                                    }), { ephemeral: true, deleteAfter: 2500 });

                                    return askQuestion(i, false);
                                }
                            }
                        } else if (i == 2 && response.content.toLowerCase() !== 'no') {
                            pollEmojis = response.content.replace(/\s+/g, '').split(',');
                            return askQuestion(i + 2);
                        } else {
                            answers.push(response.content);
                        }
    
                        if (answers[3] && answers[3] > 10 && !pollEmojis) {
                            answers.pop();
                            
                            reply(Embed({ 
                                preset: 'error', 
                                description: lang.AdminModule.Commands.Vote.Errors.MaxChoices 
                            }), { ephemeral: true, deleteAfter: 2500 });

                            return askQuestion(i, false);
                        }
    
                        if (i >= questions.length - 1) finishUpdate();
                        else askQuestion(++i);
                    });
            };
    
            askQuestion(0);
    
            const finishUpdate = () => {
                if (pollEmojis) {
                    let embed = Utils.setupMessage({
                        configPath: embeds.Embeds.Poll,
                        thumbnail: answers[2].includes("http") ? answers[2] : undefined,
                        variables: [
                            ...Utils.userVariables(member, "user"),
                            { searchFor: /{question}/g, replaceWith: answers[0] },
                            { searchFor: /{description}/g, replaceWith: answers[1] }
                        ]
                    });
    
                    if (Array.isArray(answers[3])) {
                        answers[3].forEach(mentionedChannel => {
                            mentionedChannel.send(embed).then(async msg => {
                                pollEmojis.forEach(async emoji => {
                                    let start = emoji.lastIndexOf(":");
                                    if ((new RegExp(/:[0-9]{18}>/g)).test(emoji)) emoji = emoji.substring(start + 1, start + 19);
            
                                    await msg.react(emoji).catch(error => {
                                        if (error.code && error.code == 10014) reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Vote.Errors.CouldNotReact.replace(/{emoji}/g, emoji) }), { ephemeral: true });
                                        else {
                                            reply(Embed({ preset: 'console' }), { ephemeral: true });
                                            console.log(error);
                                        }
                                    });
                                });
                            });
                        });
                    } else answers[3].send(embed).then(async msg => {
                        pollEmojis.forEach(async emoji => {
                            let start = emoji.lastIndexOf(":");
                            if ((new RegExp(/:[0-9]{18}>/g)).test(emoji)) emoji = emoji.substring(start + 1, start + 19);
    
                            await msg.react(emoji).catch(error => {
                                if (error.code && error.code == 10014) reply(Embed({ preset: 'error', description: lang.AdminModule.Commands.Vote.Errors.CouldNotReact.replace(/{emoji}/g, emoji) }), { ephemeral: true });
                                else {
                                    reply(Embed({ preset: 'console' }), { ephemeral: true });
                                    console.log(error);
                                }
                            });
                        });
                    });
                } else {
                    if (Array.isArray(answers[5])) {
                        answers[5].forEach(channel => {
                            channel.send(Utils.setupMessage({
                                configPath: embeds.Embeds.Poll,
                                thumbnail: answers[4].includes("http") ? answers[4] : undefined,
                                variables: [
                                    ...Utils.userVariables(member, "user"),
                                    { searchFor: /{question}/g, replaceWith: answers[0] },
                                    { searchFor: /{description}/g, replaceWith: answers[1] }
                                ]
                            })).then(async msg => {
                                if (!pollEmojis) for (let i = 0; i < answers[3]; i++) {
                                    await msg.react(Utils.getEmoji(i + 1));
                                }
                            });
                        });
                    } else answers[5].send(Utils.setupMessage({
                        configPath: embeds.Embeds.Poll,
                        thumbnail: answers[4].includes("http") ? answers[4] : undefined,
                        variables: [
                            ...Utils.userVariables(member, "user"),
                            { searchFor: /{question}/g, replaceWith: answers[0] },
                            { searchFor: /{description}/g, replaceWith: answers[1] }
                        ]
                    })).then(async msg => {
                        if (!pollEmojis) for (let i = 0; i < answers[3]; i++) {
                            await msg.react(Utils.getEmoji(i + 1));
                        }
                    });
                }
    
                msg?.edit(Embed({ 
                    title: lang.AdminModule.Commands.Vote.Embeds.Posted.Title, 
                    description: lang.AdminModule.Commands.Vote.Embeds.Posted.Description, 
                    color: config.EmbedColors.Success 
                }));

                return resolve(true);
            };
        });
    },
    description: "Create a poll",
    usage: 'vote',
    aliases: ['poll'],
    arguments: []
};
