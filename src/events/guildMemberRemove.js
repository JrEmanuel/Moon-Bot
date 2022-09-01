const Utils = require('../modules/utils.js');

let Canvas;

try {
    require.resolve("canvas");

    Canvas = require("canvas");

    // Load the custom font
    Canvas.registerFont("./assets/font.otf", { family: "FONT" });
} catch (err) {
    //
}

module.exports = async (bot, member) => {
    const { config, embeds } = Utils.variables;
    if (require('../modules/handlers/CommandHandler.js').commands.length > 0) {
        if (config.Other.IgnoredGuilds.includes(member.guild.id)) return;

        if (!config.Leave.Data.Coins) {
            Utils.variables.db.update.coins.updateCoins(member, 0, 'set');
        }

        if (!config.Leave.Data.Levels) {
            Utils.variables.db.update.experience.updateExperience(member, 1, 0, 'set');
        }

        if (!config.Leave.Data.Punishments) {
            let punishments = await Utils.variables.db.get.getPunishmentsForUser(member.id);
            punishments.forEach(async punishment => {
                await Utils.variables.db.update.punishments.removePunishment(punishment.id);
            });

            let warnings = await Utils.variables.db.get.getWarnings(member);
            warnings.forEach(async warning => {
                await Utils.variables.db.update.punishments.removeWarning(warning.id);
            });
        }

        if (config.Leave.Data.Roles.Enabled && member.roles.cache.size) {
            let conf = config.Leave.Data.Roles.BlacklistedRoles;
            let blacklist = conf && Array.isArray(conf) ? conf.filter(b => typeof b == "string") : [];

            await Utils.variables.db.update.roles.setSavedRoles(member, JSON.stringify(member.roles.cache.filter(r => r.name !== "@everyone" && !blacklist.includes(r.name) && !blacklist.includes(r.id)).map(r => r.id)));
        }

        let joins = await Utils.variables.db.get.getJoins(member);

        if (joins && joins.length) {
            [...new Set(joins.map(j => j.inviter))].forEach(async inviterID => {
                let inviter = member.guild.members.cache.get(inviterID);
                let inviterData = await Utils.variables.db.get.getInviteData(inviter);
                inviterData.leaves++;

                await Utils.variables.db.update.invites.updateData(inviter, inviterData);
            });
        }

        if (config.Leave.Messages.Enabled) {
            console.log(Utils.infoPrefix + `${member.user.tag} left the server.`);
            const channel = Utils.findChannel(config.Leave.Messages.Channel, member.guild);

            if (!channel) return;

            if (config.Cards.Leave.Enabled && Canvas) {
                Canvas.registerFont("./assets/font.otf", { family: "FONT" });

                const base = await Canvas.loadImage("./assets/CorebotWelcomeCard.png");
                const avatarLink = member.user.displayAvatarURL({ format: "png", size: 256 });
                const avatarImage = await Canvas.loadImage(avatarLink);
                const canvas = Canvas.createCanvas(base.width, base.height);
                const ctx = canvas.getContext('2d');

                function getSize(text, startingSize) {
                    ctx.font = `${startingSize}px "FONT", sans-serif`;

                    let TextBorder = [358, 850];
                    let Text = ctx.measureText(text);

                    if (Text.width > (TextBorder[1] - TextBorder[0])) {
                        while (Text.width > (TextBorder[1] - TextBorder[0])) {
                            ctx.font = `${--startingSize}px "FONT", sans-serif`;
                            Text = ctx.measureText(text);
                        }

                        return startingSize;
                    }

                    return startingSize;
                }

                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "center";
                ctx.lineWidth = 2;
                ctx.drawImage(avatarImage, 100, 69, 256, 256);
                ctx.drawImage(base, 0, 0);

                let placeholders = text => {
                    return text
                        .replace(/{user}/g, member.user.tag)
                        .replace(/{user-lowercase}/g, member.user.tag.toLowerCase())
                        .replace(/{user-uppercase}/g, member.user.tag.toUpperCase())
                        .replace(/{server}/g, member.guild.name)
                        .replace(/{server-lowercase}/g, member.guild.name.toLowerCase())
                        .replace(/{server-uppercase}/g, member.guild.name.toUpperCase());
                };

                config.Cards.Leave.Lines.forEach((line, i) => {
                    let text = placeholders(line.Text);

                    if (line.Size == "best-fit") ctx.font = `${getSize(text, line.StartingSize)}px "FONT", sans-serif`;
                    else if (parseInt(line.Size)) ctx.font = `${parseInt(line.Size)}px "FONT", sans-serif`;
                    else {
                        let size = Math.min(...config.Cards.Leave.Lines.map(l => getSize(placeholders(l.Text), l.StartingSize)));
                        ctx.font = `${size}px "FONT", sans-serif`;
                    }

                    ctx.fillText(text, 603 + (line.XOffset ? line.XOffset : 0), 177 + (i * 10) + (i * 35) + (line.YOffset ? line.YOffset : 0));
                });

                return channel.send({ files: [new Utils.Discord.MessageAttachment(await canvas.toBuffer(), "leave.png")] });
            }

            channel.send(Utils.setupMessage({
                configPath: embeds.Embeds.Leave,
                variables: [
                    ...Utils.userVariables(member, "user"),
                    { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) }]
            }));
        }
    }
};
