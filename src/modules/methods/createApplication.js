const Utils = require("../utils");
const Embed = Utils.Embed;
const { lang, embeds } = Utils.variables;

module.exports = async (bot, member, channel, autoDeleteMessages = false, delay = 10000, reply, predefinedPosition = undefined) => {
    return new Promise(async resolve => {
        const settings = Utils.variables.config.Applications;

        const deleteMessage = (msg) => {
            if (autoDeleteMessages) Utils.delete(msg, delay);
        };

        const sendToChannel = (embed, ephemeral = false, autoDelete = false) => {
            if (reply) reply(embed, { ephemeral });
            else channel.send(embed).then((msg) => {
                if (autoDelete) deleteMessage(msg);
            });
        };

        const applications = await Utils.variables.db.get.getApplications();
        const userApplications = applications.filter(a => a.guild == channel.guild.id && a.creator == member.user.id && channel.guild.channels.cache.get(a.channel_id));

        if (userApplications.length >= settings.LimitPerUser) {
            sendToChannel(Embed({ preset: "error", description: lang.TicketModule.Commands.Apply.Errors.MaxApplications.replace(/{application-limit}/g, settings.LimitPerUser) }), true, true);

            return resolve();
        }

        const reviewerRoles = settings.Reviewers.map(role => Utils.findRole(role, channel.guild)).filter(role => role);
        const parent = Utils.findChannel(settings.Channel.Category, channel.guild, 'GUILD_CATEGORY');

        if (!reviewerRoles.length || !parent) {
            sendToChannel(Embed({ preset: 'console' }), true, true);

            return resolve();
        }

        channel.guild.channels.create(settings.Channel.Format.replace(/{username}/g, member.user.username).replace(/{id}/g, member.user.id).replace(/{tag}/g, member.user.tag), {
            type: 'GUILD_TEXT',
            parent: parent,
            permissionOverwrites: [
                {
                    id: member.user.id,
                    allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                },
                ...reviewerRoles.map(r => {
                    return {
                        id: r.id,
                        allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                    };
                }),
                {
                    id: channel.guild.id,
                    deny: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY']
                }
            ]
        }).then(async applicationChannel => {
            await Utils.variables.db.update.applications.createApplication({
                guild: channel.guild.id,
                channel_id: applicationChannel.id,
                channel_name: applicationChannel.name,
                creator: member.user.id
            });

            sendToChannel(Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Created.Title, description: lang.TicketModule.Commands.Apply.Embeds.Created.Description.replace(/{channel}/g, applicationChannel) }), false, true);

            applicationChannel.send(Utils.setupMessage({
                configPath: embeds.Embeds.ApplicationCreated,
                variables: [
                    ...Utils.userVariables(member, "user")
                ]
            }));

            if (settings.MentionReviewerRole) applicationChannel.send(reviewerRoles.map(r => '<@&' + r.id + '>').join(", "));

            const Positions = settings.Positions;
            const Position_Keys = Object.keys(Positions);

            if (!predefinedPosition) {
                applicationChannel.send(Utils.setupMessage({
                    configPath: embeds.Embeds.ApplicationPosition,
                    variables: [
                        { searchFor: "{positions}", replaceWith: Position_Keys.join(', ') }
                    ]
                }));
            } else {
                if (!Positions[predefinedPosition]) {
                    predefinedPosition = undefined;
                    applicationChannel.send(Utils.Embed({
                        title: lang.TicketModule.Commands.Apply.Embeds.PositionNoLongerExists.Title,
                        description: lang.TicketModule.Commands.Apply.Embeds.PositionNoLongerExists.Description
                            .replace(/{positions}/g, Position_Keys.join(', '))
                            .replace(/{position}/g, predefinedPosition)
                    }));
                }
            }

            async function done(positionChosen) {
                if (!positionChosen) return applicationChannel.send(Embed());

                const position = Positions[positionChosen];

                applicationChannel.setTopic(settings.Channel.Topic.replace(/{user-tag}/g, member.user.tag).replace(/{user-id}/g, member.user.id).replace(/{position}/g, positionChosen).replace(/{status}/g, "Pending"));

                if (position.Reviewers && position.Reviewers.length) {
                    reviewerRoles.forEach(r => {
                        applicationChannel.permissionOverwrites.create(r, { VIEW_CHANNEL: false, SEND_MESSAGES: false });
                    });

                    position.Reviewers.map(r => Utils.findRole(r, channel.guild)).filter(r => r).forEach(r => {
                        applicationChannel.permissionOverwrites.create(r, { VIEW_CHANNEL: true, SEND_MESSAGES: true, READ_MESSAGE_HISTORY: true });
                    });
                }

                const answers = [];

                for (let i = 0; i < position.Questions.length; i++) {
                    const question = position.Questions[i];
                    const text = typeof question == 'object' ? question.Question : question;
                    const m = await applicationChannel.send(Embed({ description: (typeof question == 'object' && question.Options) ? text + question.Options.map((o, i) => ((i == 0) ? "\n" : "") + "\n" + Utils.getEmoji(i + 1) + " **" + o + "**").join("") : text }));

                    async function waitForResponse() {
                        if (typeof question == 'object' && question.Options) {
                            let OptionsToEmojis = {};

                            question.Options.forEach(async (option, i) => {
                                OptionsToEmojis[`${option}`] = Utils.getEmoji(i + 1);
                                await m.react(Utils.getEmoji(i + 1))
                                    .catch(() => { });
                            });


                            await Utils.waitForReaction(Object.values(OptionsToEmojis), member.user.id, m)
                                .then(async reaction => {
                                    answers.push(Object.keys(OptionsToEmojis)[Object.values(OptionsToEmojis).indexOf(reaction.emoji.name)]);
                                });
                        } else {
                            await Utils.waitForResponse(member.user.id, applicationChannel)
                                .then(async response => {
                                    let attachments = "";

                                    if (response.attachments) {
                                        attachments = response.attachments.map((attachment) => {
                                            return `**${attachment.name}** - [${lang.Global.ClickHere}](${attachment.proxyURL})`;
                                        }).join("\n");
                                    }

                                    if (typeof question == 'object' && question.RegExp) {
                                        if (!new RegExp(question.RegExp).test(response.content)) {
                                            applicationChannel.send(Embed({ title: question.FailedRegExp || lang.TicketModule.Commands.Apply.Errors.FailedRegExp, color: Utils.variables.config.EmbedColors.Error }));
                                            await waitForResponse();
                                        } else answers.push(response.content + (attachments.length ? "\n\n" + attachments : ""));
                                    } else answers.push(response.content + (attachments.length ? "\n\n" + attachments : ""));
                                });
                        }

                    }
                    await waitForResponse();
                }

                if (settings.DeleteEmbedsAndSendAnswers) applicationChannel.bulkDelete(100);

                applicationChannel.send(Utils.setupMessage({
                    configPath: embeds.Embeds.ApplicationComplete,
                    variables: [
                        { searchFor: /{position}/g, replaceWith: positionChosen }
                    ]
                }));

                const Haste = await Utils.paste(`Applicant: ${member.user.tag} (${member.user.id})\nApplied For: ${positionChosen}\nFinished At: ${new Date().toLocaleString()}\n\nAnswers:\n\n${answers.map((ans, i) => `Question:\n${position.Questions.map(q => q.Question || q)[i]}\n\nAnswer:\n${ans}`).join('\n\n')}`, Utils.variables.config.Applications.Logs.PasteSite);

                if (settings.DeleteEmbedsAndSendAnswers) {
                    const embed = Utils.Embed({ title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title, fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Fields[0], value: `${member} (${member.user.id})` }] });

                    answers.forEach((answer, i) => {
                        if (answer.length >= 1024) {
                            embed.embeds[0].fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer.substring(0, 1000) + '-' });
                            embed.embeds[0].fields.push({ name: '\u200B', value: '-' + answer.substring(1000) });
                        } else embed.embeds[0].fields.push({ name: position.Questions.map(q => q.Question || q)[i], value: answer });
                    });

                    applicationChannel.send(embed).catch(() => {
                        applicationChannel.send(Embed({
                            title: lang.TicketModule.Commands.Apply.Embeds.Answers.Title,
                            fields: [{ name: lang.TicketModule.Commands.Apply.Embeds.Answers.Fields[0], value: `${member} (${member.user.id})` }, { name: lang.TicketModule.Commands.Apply.Embeds.Answers.Fields[1].Name, value: lang.TicketModule.Commands.Apply.Embeds.Answers.Fields[1].Value.replace(/{url}/g, Haste) }]
                        }));
                    });
                }

                if (Utils.variables.config.Applications.Logs.Enabled) {
                    const logs = Utils.findChannel(Utils.variables.config.Applications.Logs.Channel, channel.guild);
                    if (logs) logs.send(Embed({
                        author: lang.TicketModule.Logs.Applications.Created.Title,
                        description: lang.TicketModule.Logs.Applications.Created.Description
                            .replace(/{applicant}/g, member)
                            .replace(/{position}/g, positionChosen)
                            .replace(/{link}/g, Haste)
                            .replace(/{channel}/g, channel)
                            .replace(/{time}/g, ~~(Date.now() / 1000))
                    }));
                }

                await Utils.variables.db.update.applications.completeApplication(applicationChannel.id, positionChosen, JSON.stringify(answers.map((answer, i) => {
                    return {
                        question: position.Questions.map(q => q.Question || q)[i],
                        answer: answer
                    };
                })));

                resolve(applicationChannel);
            }

            async function getPosition() {
                Utils.waitForResponse(member.user.id, applicationChannel)
                    .then((response) => {
                        if (!response) return;
                        if (!Position_Keys.map(p => p.toLowerCase()).includes(response.content.toLowerCase())) {
                            applicationChannel.send(Embed({ color: Utils.variables.config.EmbedColors.Error, title: lang.TicketModule.Commands.Apply.Errors.InvalidPosition }));
                            return getPosition();
                        }
                        done(Position_Keys.find(p => p.toLowerCase() == response.content.toLowerCase()));
                    });
            }

            if (predefinedPosition) done(predefinedPosition);
            else getPosition();
        });
    });
};
