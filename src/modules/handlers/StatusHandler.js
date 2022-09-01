const Utils = require('../utils.js');
const variables = Utils.variables;
const lang = variables.lang;
const Embed = Utils.Embed;
const notified = [];
let notify = true;
module.exports = async (bot) => {
    if (variables.config.AntiAdvertisement.Status.Enabled) {
        const checkStatus = () => {
            // Get the whitelisted website list
            const whitelist = variables.config.AntiAdvertisement.Whitelist.Websites?.map(website => website.toLowerCase()) || [];

            // Check in each guild
            bot.guilds.cache.filter(g => !Utils.variables.config.Other.IgnoredGuilds.includes(g.id)).forEach(guild => {

                // The channel to send notifications to
                const channel = Utils.findChannel(variables.config.AntiAdvertisement.Status.Channel, guild, 'GUILD_TEXT', notify);

                // Return if the channel doesn't exist because Utils automatically reports it and turn off notifications to prevent console spam
                if (!channel) return notify = false;
                else notify = true; // In case the channel is created and then deleted, we'll enable notifications again 

                // Check every member
                guild.members.fetch().then(members => {

                    // Go through each member
                    members.filter(member => !member.user.bot).forEach(member => {
                        // The user's current status
                        const activities = member.user.presence?.activities;

                        // If they have a status
                        if (activities && activities.length >= 1) {
                            // If the user's highest role is > than the bypass role, return because they bypass
                            if (Utils.hasPermission(member, variables.config.AntiAdvertisement.BypassRole)) return;
                            activities.forEach(activity => {
                                // The different components to check for advertisements in
                                const check = [activity.name, activity.url, activity.details, activity.state, activity.assets ? activity.assets.largeText : '', activity.assets ? activity.assets.smallText : ''];

                                // For each component
                                check.filter(component => {
                                    if (!component) return;

                                    // If the user has recently had the same advertisement, don't send a notification
                                    if (notified.find(notification => notification.user == member.id && notification.ad.toLowerCase() == component.toLowerCase())) return;

                                    return true;
                                }).forEach(comp => {

                                    // Use Utils#hasAdvertisement to check for an advertisement
                                    if (Utils.hasAdvertisement(comp)) {

                                        // Make sure the website isn't in the whitelist
                                        if (!whitelist.find(website => comp.toLowerCase().includes(website.toLowerCase()))) {

                                            // Send the notification
                                            channel.send(Embed({
                                                title: lang.AntiAdSystem.StatusAdDetected.Author,
                                                description: lang.AntiAdSystem.StatusAdDetected.Description
                                                    .replace(/{user}/g, member)
                                                    .replace(/{time}/g, ~~(Date.now() / 1000))
                                                    .replace(/{ad}/g, comp
                                                        // Highlight detected advertisements
                                                        .split(" ")
                                                        .map(word => {
                                                            if (word && Utils.hasAdvertisement(word)) return `**${word}**`;
                                                            else return word;
                                                        })
                                                        .join(" "))
                                            }));

                                            notified.push({
                                                user: member.id,
                                                ad: comp
                                            });

                                            /*
                                            // Let a notification happen again after 15 minutes
                                            setInterval(() => {
                                                notified.splice(
                                                    notified.indexOf({
                                                        user: member.id,
                                                        ad: comp
                                                    }), 1);
                                            }, 15 * 60 * 1000);*/
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
        };
        checkStatus();
        setInterval(checkStatus, 60 * 1000);
    }

    // Updates variables in status
    if (!variables.config.ActivityCycling.Enabled) {
        setInterval(async () => {
            let botStatus = await Utils.variables.db.get.getStatus();
            bot.user.setActivity(await Utils.getStatusPlaceholders(botStatus.activity.replace("https://", "")), { type: botStatus.type, url: botStatus.type.toUpperCase() == "STREAMING" ? botStatus.activity : undefined });
        }, 60 * 1000);
    }
    return module.exports;
};
