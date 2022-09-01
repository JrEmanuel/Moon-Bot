const { capitalize } = require("lodash");
const Utils = require("../utils");
const { config, embeds, lang, db } = Utils.variables;
const { Embed } = Utils;

module.exports = (message, status, reason, changedBy) => {
    return new Promise(async (resolve, reject) => {
        if (!["pending", "accepted", "denied", "implemented"].includes(status.toLowerCase())) return reject("Suggestion status must be one of the following: pending, accepted, denied, implemented");

        const suggestion = await db.get.getSuggestionByMessage(message.id);

        if (!suggestion) return reject("Provided message is not a suggestion");

        let bot = message.guild.me.user;
        let creator = await bot.client.users.fetch(suggestion.creator);
        let proper = capitalize(status);
        let statusTranslation = config.Suggestions.Statuses[proper];
        let channel = Utils.findChannel(config.Suggestions.Channels[status == "pending" ? "Suggestions" : proper], message.guild);

        if (!channel) return reject(`${proper} suggestions channel does not exist`);

        suggestion.votes = JSON.parse(suggestion.votes);

        let upvoteCount = status == "pending" ? 0 : suggestion.status != "pending" ? suggestion.votes.upvotes : message.reactions.cache.find(reaction => [reaction.emoji.name, reaction.emoji.id, reaction.emoji.toString()].includes(config.Suggestions.Emojis.Upvote)).count - 1;
        let downvoteCount = status == "pending" ? 0 : suggestion.status != "pending" ? suggestion.votes.downvotes : message.reactions.cache.find(reaction => [reaction.emoji.name, reaction.emoji.id, reaction.emoji.toString()].includes(config.Suggestions.Emojis.Downvote)).count - 1;
        let total = upvoteCount + downvoteCount;
        let upPercentage = (upvoteCount / total * 100);
        let downPercentage = (downvoteCount / total * 100);
        let embed = Utils.setupMessage({
            configPath: status == "pending" ? embeds.Embeds.PendingSuggestion : embeds.Embeds.Suggestion,
            color: config.Suggestions.Colors[proper],
            image: suggestion.image ? suggestion.image : undefined,
            variables: [
                ...Utils.userVariables(creator, "user"),
                ...Utils.userVariables(bot, "bot"),
                ...Utils.userVariables(changedBy, "changed-by"),
                { searchFor: /{suggestion}/g, replaceWith: suggestion.suggestion || lang.Global.Image },
                { searchFor: /{upvotes-amount}/g, replaceWith: upvoteCount },
                { searchFor: /{upvotes-percentage}/g, replaceWith: upPercentage ? upPercentage.toFixed(2) + "%" : "0%" },
                { searchFor: /{downvotes-amount}/g, replaceWith: downvoteCount },
                { searchFor: /{downvotes-percentage}/g, replaceWith: downPercentage ? downPercentage.toFixed(2) + "%" : "0%" },
                { searchFor: /{opinions}/g, replaceWith: total },
                { searchFor: /{reason}/g, replaceWith: reason || "N/A" },
                { searchFor: /{status}/g, replaceWith: statusTranslation },
                { searchFor: /{id}/g, replaceWith: suggestion.id }
            ]
        });

        (channel.id == message.channel.id ? message.edit(embed) : channel.send(embed))
            .then(async msg => {
                await Utils.variables.db.update.suggestions.setStatus(msg.channel.id, msg.id, status.toLowerCase(), { upvotes: upvoteCount, downvotes: downvoteCount }, changedBy.id, message.id);
                resolve();

                if (config.Suggestions.NotifyUserOnStatusChange) {
                    creator.send(Embed({
                        title: status == "pending" ? lang.Other.SuggestionStatusChanged.Pending : lang.Other.SuggestionStatusChanged.Other.replace(/{status}/g, statusTranslation.toLowerCase()),
                        fields: reason && reason !== "N/A" ? [
                            { name: lang.Other.SuggestionStatusChanged.Reason, value: reason }
                        ] : undefined,
                        url: `https://discord.com/channels/${suggestion.guild}/${msg.channel.id}/${msg.id}`
                    })).catch(() => { });
                }

                if (channel.id !== message.channel.id) message.delete();

                if (status == "pending") {
                    await msg.react(Utils.findEmoji(config.Suggestions.Emojis.Upvote, bot, false) || config.Suggestions.Emojis.Upvote);
                    await msg.react(Utils.findEmoji(config.Suggestions.Emojis.Downvote, bot, false) || config.Suggestions.Emojis.Downvote);
                }

                if (config.Suggestions.AddManagementReactions) {
                    ["Accepted", "Denied", "Implemented", "Pending", "Delete"].filter(type => proper !== type).forEach(async type => {
                        if (type == "Pending") type = "Reset";
                        await msg.react(Utils.findEmoji(config.Suggestions.Emojis[type], bot, false) || config.Suggestions.Emojis[type]);
                    });
                }
            });
    });
};
