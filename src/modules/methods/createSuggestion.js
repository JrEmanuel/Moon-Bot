const Utils = require("../utils");
const { config, embeds, lang, db } = Utils.variables;

module.exports = (suggestion, creator, attachment = null) => {
    return new Promise(async (resolve, reject) => {
        let channel = Utils.findChannel(config.Suggestions.Channels.Suggestions, creator.guild);
        let bot = creator.guild.me.user;
        let suggestions = await db.get.getSuggestions();

        if (suggestion.length > 1024) {
            let paste = await Utils.paste(suggestion);
            let ending = paste.split("/")[paste.split("/").length - 1];
            paste = paste.replace(ending, "raw/" + ending);
            let extra = lang.Other.SuggestionTooLong.replace(/{paste}/g, paste);
            suggestion = suggestion.substring(0, 1024 - extra.length) + extra;
        }


        if (!channel) return reject("Missing suggestions channel");
        channel.send(Utils.setupMessage({
            configPath: embeds.Embeds.PendingSuggestion,
            color: config.Suggestions.Colors.Pending,
            image: attachment ? attachment.proxyURL : undefined,
            variables: [
                ...Utils.userVariables(creator, "user"),
                ...Utils.userVariables(bot, "bot"),
                { searchFor: /{suggestion}/g, replaceWith: suggestion || lang.Global.Image },
                { searchFor: /{upvotes-amount}/g, replaceWith: 0 },
                { searchFor: /{upvotes-percentage}/g, replaceWith: "0%" },
                { searchFor: /{downvotes-amount}/g, replaceWith: 0 },
                { searchFor: /{downvotes-percentage}/g, replaceWith: "0%" },
                { searchFor: /{opinions}/g, replaceWith: 0 },
                { searchFor: /{id}/g, replaceWith: suggestions.length + 1 }
            ]
        })).then(async msg => {
            let data = {
                guild: msg.guild.id,
                channel: msg.channel.id,
                message: msg.id,
                suggestion: suggestion || lang.Global.Image,
                creator: creator.id,
                status: "pending",
                votes: `{"upvotes":0,"downvotes":0}`,
                created_on: msg.createdTimestamp,
                image: attachment ? attachment.proxyURL : undefined,
            };

            db.update.suggestions.add(data);

            resolve({ data, msg });

            await msg.react(Utils.findEmoji(config.Suggestions.Emojis.Upvote, creator.guild, false) || config.Suggestions.Emojis.Upvote);
            await msg.react(Utils.findEmoji(config.Suggestions.Emojis.Downvote, creator.guild, false) || config.Suggestions.Emojis.Downvote);

            if (config.Suggestions.AddManagementReactions) {
                ["Accepted", "Denied", "Implemented", "Delete"].forEach(async type => {
                    await msg.react(Utils.findEmoji(config.Suggestions.Emojis[type], bot, false) || config.Suggestions.Emojis[type]);
                });
            }
        });
    });
};
