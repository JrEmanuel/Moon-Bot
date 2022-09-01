const Utils = require("../utils");
const { config, embeds } = Utils.variables;

let Canvas;

try {
    require.resolve("canvas");

    Canvas = require("canvas");

    // Load the custom font
    Canvas.registerFont("./assets/font.otf", { family: "FONT" });
} catch (err) {
    //
}

const ordinal = require("ordinal");

module.exports = async (bot, member, inviter) => {
    if (config.Join.Messages.Enabled) {
        let channel = Utils.findChannel(config.Join.Messages.Channel, member.guild);

        if (!channel) return;

        if (config.Cards.Welcome.Enabled && Canvas) {
            const base = await Canvas.loadImage("./assets/CorebotWelcomeCard.png");
            const memberNumber = ordinal(member.guild.memberCount);
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
                    .replace(/{server-uppercase}/g, member.guild.name.toUpperCase())
                    .replace(/{n}/g, member.guild.memberCount)
                    .replace(/{nth}/g, memberNumber)
                    .replace(/{nth-uppercase}/g, memberNumber.toUpperCase())
                    .replace(/{inviter}/g, inviter ? inviter.user.tag : "Unknown")
                    .replace(/{inviter-uppercase}/g, inviter ? inviter.user.tag.toUpperCase() : "UNKNOWN")
                    .replace(/{inviter-lowercase}/g, inviter ? inviter.user.tag.toLowerCase() : "unknown");
            };

            config.Cards.Welcome.Lines.forEach((line, i) => {
                let text = placeholders(line.Text);

                if (line.Size == "best-fit") ctx.font = `${getSize(text, line.StartingSize)}px "FONT", sans-serif`;
                else if (parseInt(line.Size)) ctx.font = `${parseInt(line.Size)}px "FONT", sans-serif`;
                else {
                    let size = Math.min(...config.Cards.Welcome.Lines.map(l => getSize(placeholders(l.Text), l.StartingSize)));
                    ctx.font = `${size}px "FONT", sans-serif`;
                }

                ctx.fillText(text, 603 + (line.XOffset ? line.XOffset : 0), 177 + (i * 10) + (i * 35) + (line.YOffset ? line.YOffset : 0));
            });

            channel.send({ files: [new Utils.Discord.MessageAttachment(await canvas.toBuffer(), "welcome.png")] });
        } else {

            let embed = Utils.setupMessage({
                configPath: embeds.Embeds.Welcome,
                variables: [
                    ...Utils.userVariables(member, "user"),
                    ...(inviter ? Utils.userVariables(inviter, "inviter") : [
                        { searchFor: /{inviter-id}/g, replaceWith: "Unknown" },
                        { searchFor: /{inviter-displayname}/g, replaceWith: "Unknown" },
                        { searchFor: /{inviter-username}/g, replaceWith: "Unknown" },
                        { searchFor: /{inviter-tag}/g, replaceWith: "Unknown" },
                        { searchFor: /{inviter-mention}/g, replaceWith: "Unknown" },
                        { searchFor: /{inviter-pfp}/g, replaceWith: "Unknown" }
                    ]),
                    { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                    { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
                ]
            });

            channel.send(embed);
        }

        if (config.Join.Messages.DM.Enabled) member.send(Utils.setupMessage({
            configPath: embeds.Embeds.DMWelcome,
            variables: [
                ...Utils.userVariables(member, "user"),
                ...(inviter ? Utils.userVariables(inviter, "inviter") : [
                    { searchFor: /{inviter-id}/g, replaceWith: "Unknown" },
                    { searchFor: /{inviter-displayname}/g, replaceWith: "Unknown" },
                    { searchFor: /{inviter-username}/g, replaceWith: "Unknown" },
                    { searchFor: /{inviter-tag}/g, replaceWith: "Unknown" },
                    { searchFor: /{inviter-mention}/g, replaceWith: "Unknown" },
                    { searchFor: /{inviter-pfp}/g, replaceWith: "Unknown" }
                ]),
                { searchFor: /{total}/g, replaceWith: member.guild.memberCount },
                { searchFor: /{bot-pfp}/g, replaceWith: bot.user.displayAvatarURL({ dynamic: true }) },
            ]
        })).catch(() => { });
    }
};
