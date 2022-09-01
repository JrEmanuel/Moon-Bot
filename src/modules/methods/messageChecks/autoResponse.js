const Utils = require("../../utils");
const { variables: { config, bot } } = Utils;

module.exports = async (messageOrInteraction, type, message) => {
    return new Promise(async (resolve, reject) => {
        if (type == "interaction") return resolve();
        const AutoResponse = config.AutoResponse;
        let autoResponded = false;

        if (AutoResponse.Enabled) {
            AutoResponse.Responses.forEach(response => {
                const matches = response.Regex ?
                    new RegExp(response.Text, 'gi').test(message.content) :
                    response.Text.toLowerCase() == message.content.toLowerCase();

                if (matches) {
                    if (response.Roles) {
                        let CantHave = response.Roles.CantHave ? response.Roles.CantHave.map(role => Utils.findRole(role, message.guild)).filter(role => role).map(role => role.id) : [];
                        let MustHave = response.Roles.MustHave ? response.Roles.MustHave.map(role => Utils.findRole(role, message.guild)).filter(role => role).map(role => role.id) : [];

                        //  If they have one of the roles that they can't have
                        if (CantHave.length && message.member.roles.cache.some(r => CantHave.includes(r.id))) return;
                        //  If they don't have one of the roles they must have
                        if (MustHave.length && !message.member.roles.cache.some(r => MustHave.includes(r.id))) return;
                    }

                    autoResponded = true;

                    if (response.Delete) message.delete();

                    const sentDM = (sent = true) => {
                        if (sent) {
                            response.AfterDM && response.AfterDM.Success ?
                                message.channel.send(Utils.Embed({
                                    title: response.AfterDM.Success,
                                    color: config.EmbedColors.Success
                                })).then(DeleteResponse)
                                : "";
                        } else {
                            response.AfterDM && response.AfterDM.Fail ?
                                message.channel.send(Utils.Embed({
                                    title: response.AfterDM.Fail,
                                    color: config.EmbedColors.Fail
                                })).then(DeleteResponse)
                                : "";
                        }
                    };

                    const DeleteResponse = (msg) => {
                        if (parseInt(response.DeleteResponse)) Utils.delete(msg, parseInt(response.DeleteResponse) * 1000);
                    };

                    const Replace = (text) => {
                        Utils.userVariables(message.member, "user").forEach(variable => {
                            text = text.replace(variable.searchFor, variable.replaceWith);
                        });

                        return text;
                    };

                    //  Text matches
                    if (response.DM) {
                        //  DM the message
                        if (!response.Type || response.Type == "text") {
                            //  The type of content is text
                            return message.member.send(Replace(response.Content))
                                .then(() => {
                                    sentDM();
                                })
                                .catch(() => {
                                    sentDM(false);
                                });
                        } else if (response.Type == "embed") {
                            return message.member.send(Utils.setupMessage({
                                configPath: response.Embed, variables: [
                                    ...Utils.userVariables(message.member, "user"),
                                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                                ]
                            }))
                                .then(() => {
                                    sentDM();
                                })
                                .catch(() => {
                                    sentDM(false);
                                });
                        }
                    } else {
                        if (!response.Type || response.Type == "text") {
                            //  The type of content is text
                            return message.channel.send(Replace(response.Content)).then(DeleteResponse);
                        } else if (response.Type == "embed") {
                            // The type is embed
                            return message.channel.send(Utils.setupMessage({
                                configPath: response.Embed, variables: [
                                    ...Utils.userVariables(message.member, "user"),
                                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }
                                ]
                            })).then(DeleteResponse);
                        }
                    }
                }
            });
        }

        if (autoResponded) reject();
        else resolve();
    });
};
