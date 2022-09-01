const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { config, lang } = Utils.variables;
let Canvas;

try {
    require.resolve("canvas");
    
    Canvas = require("canvas");

    // Load the custom font
    Canvas.registerFont("./assets/font.otf", { family: "FONT" });
} catch (err) {
    //
}

const { Discord } = require("../../modules/utils.js");

module.exports = {
    name: "level",
    run: async (bot, messageOrInteraction, args, { member, user, guild, reply, prefixUsed }) => {
        return new Promise(async resolve => {
            const mentionedUser = Utils.ResolveUser(messageOrInteraction) || member;
            const xp = await Utils.variables.db.get.getExperience(mentionedUser);
            const xpNeededTotal = ~~((xp.level * (175 * xp.level) * 0.5));
            const lastLevel = xp.level > 0 ? xp.level - 1 : 0;
            const lastLevelXP = ~~(lastLevel * (175 * lastLevel) * 0.5);
            const currentXPRelative = xp.xp - lastLevelXP;
            const xpNeededRelative = xpNeededTotal - lastLevelXP;
    
            if (mentionedUser.user.bot) {
                reply(Embed({ 
                    preset: "error", 
                    description: lang.Global.InvalidUser, 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });
                return resolve();
            }

            if (config.Cards.Level.Enabled && Canvas) {
                // Get all XP sorted
                let allXP = await Utils.variables.db.get.getExperience();
    
                allXP = allXP
                    .filter(x => x.guild == guild.id &&
                        x.user &&
                        x.user.toLowerCase() !== 'unknown' &&
                        x.xp >= 0 &&
                        x.level >= 1 &&
                        (Utils.variables.config.Leaderboards.FilterUnknown ? !!guild.members.cache.get(x.user) : true)
                    )
                    .sort((a, b) => b.xp - a.xp)
                    .map(x => JSON.stringify(x));
    
                allXP = [...new Set(allXP)].map(x => JSON.parse(x));
    
                // Find the user's rank in XP
                const rank = allXP.indexOf(allXP.find(x => x.user == mentionedUser.id)) + 1;
    
                // Load the base background images
                const xpBar = await Canvas.loadImage("./assets/CorebotLevelCard-XPBar.png");
                const base = await Canvas.loadImage("./assets/CorebotLevelCard-Base.png");
    
                // The user's avatar URL
                const avatarLink = mentionedUser.user.displayAvatarURL({ format: "png", size: 256 });
    
                // The user's avatar as a canvas image
                const avatarImage = await Canvas.loadImage(avatarLink);
    
                // Create the canvas and get the context
                const canvas = Canvas.createCanvas(base.width, base.height);
                const ctx = canvas.getContext('2d');
    
                // Draw the xp bar
                ctx.drawImage(xpBar, 0, 0);
    
                // Draw the avatar
                ctx.drawImage(avatarImage, 72, 72, 256, 256);
    
                // Function to create a rectangle with a rounded border
                ctx.roundRect = (x, y, w, h, r) => {
                    if (w < 2 * r) r = w / 2;
                    if (h < 2 * r) r = h / 2;
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x + w, y, r);
                    ctx.closePath();
                    return ctx;
                };
    
                const percentFilled = currentXPRelative / xpNeededRelative,
                    barWidth = 535,
                    barStartX = 374,
                    barStartY = 240,
                    barHeight = 44,
                    barBorderRadius = 15;
    
                ctx.fillStyle = config.Cards.Level.XPBarColor;
                ctx.roundRect(barStartX, barStartY, barWidth * percentFilled, barHeight, barBorderRadius).fill();
    
                // Draw the background image
                ctx.drawImage(base, 0, 0);
    
                // Set the font style
                ctx.font = `40px "FONT", sans-serif`;
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                ctx.lineWidth = 2;
    
                function getSize(text, border_left = 364, border_right = 920) {
                    let startingSize = 40;
                    ctx.font = `${startingSize}px "FONT", sans-serif`;
    
                    let TextBorder = [border_left, border_right];
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
    
                // Write the user's tag
                ctx.font = `${getSize(mentionedUser.user.tag.toUpperCase())}px "FONT", sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(mentionedUser.user.tag.toUpperCase(), 650, 80);
    
                let size = Math.min(getSize(config.Cards.Level.Text.Rank.replace(/{rank}/g, rank), 364, 642), getSize(config.Cards.Level.Text.Level.replace(/{level}/g, (xp.level || 1)), 642, 920));
    
                // Write the user's rank
                ctx.font = `${size}px "FONT", sans-serif`;
                ctx.textAlign = "left";
                ctx.fillText(config.Cards.Level.Text.Rank.replace(/{rank}/g, rank), 396, 146);
    
                // Write the user's level
                ctx.font = `${size}px "FONT", sans-serif`;
                ctx.textAlign = "right";
                ctx.fillText(config.Cards.Level.Text.Level.replace(/{level}/g, (xp.level || 1)), 892, 146);
    
                // Write relative XP
                ctx.font = `${getSize(`${currentXPRelative.toLocaleString()} / ${xpNeededRelative.toLocaleString()}`)}px "FONT", sans-serif`;
                ctx.textAlign = "center";
                ctx.fillText(`${currentXPRelative.toLocaleString()} / ${xpNeededRelative.toLocaleString()}`, 634, 226);
    
                // Write user's total XP
                ctx.font = `${getSize(config.Cards.Level.Text.XP.replace(/{total-xp}/g, (xp.xp || 0).toLocaleString()))}px "FONT", sans-serif`;
                ctx.fillStyle = "#ffffff";
                ctx.fillText(config.Cards.Level.Text.XP.replace(/{total-xp}/g, (xp.xp || 0).toLocaleString()), 642, 331);
    
                reply({ files: [new Discord.MessageAttachment(await canvas.toBuffer(), "level.png")] });

                return resolve(true);
            } else {
                if (member.id == mentionedUser.id) {
                    reply(Embed({
                        author: {
                            icon: user.displayAvatarURL({ dynamic: true }),
                            text: user.username
                        },
                        title: lang.XPModule.Commands.Level.Title.Self,
                        fields: [{ name: lang.XPModule.Commands.Level.Fields[0], value: xp.level.toLocaleString(), inline: true }, { name: lang.XPModule.Commands.Level.Fields[1], value: xp.xp.toLocaleString(), inline: true }],
                        footer: { text: lang.XPModule.Commands.Level.Footer.replace(/{xpneeded}/g, (xpNeededRelative - currentXPRelative).toLocaleString()) },
                        timestamp: new Date()
                    }));

                    return resolve(true);
                } else {
                    reply(Embed({
                        author: {
                            icon: mentionedUser.user.displayAvatarURL({ dynamic: true }),
                            text: mentionedUser.username
                        },
                        title: lang.XPModule.Commands.Level.Title.User.replace(/{username}/g, mentionedUser.user.username),
                        fields: [{ name: lang.XPModule.Commands.Level.Fields[0], value: xp.level, inline: true }, { name: lang.XPModule.Commands.Level.Fields[1], value: xp.xp, inline: true }],
                        footer: { text: lang.XPModule.Commands.Level.Footer.replace(/{xpneeded}/g, (xpNeededRelative - currentXPRelative).toLocaleString()) },
                        timestamp: new Date()
                    }));

                    return resolve(true);
                }
            }
        });
    },
    description: "Check your current level",
    usage: "level [@user]",
    aliases: [
        "explevel",
        "xplevel",
        "xp",
        "exp",
        "experience"
    ],
    arguments: [
        {
            name: "user",
            description: "The user to check the coins of",
            required: false,
            type: "USER"
        }
    ]
};
