/* eslint-disable no-undef */
const yml = require('./yml.js');
const fs = require('fs');
const chalk = require("chalk");
const { Message, CommandInteraction } = require("discord.js");
let config = {};
let lang = {};
let commands = {};
let bot;
(async () => {
    config = await yml('./configs/config.yml');
    lang = await yml("./configs/lang.yml");
    commands = await yml('./configs/commands.yml');
})();

function prefix(code, functionName, caller = undefined) {
    let errorInfo = `${chalk.hex("#757575")("[")}${chalk.hex("#47d7ff")(code)}${chalk.hex("#a1a09f")(" | ")}${chalk.hex("#47d7ff")(functionName)}${caller ? `${chalk.hex("#a1a09f")(" | ")}${chalk.hex("#47d7ff")(caller)}` : ""}${chalk.hex("#757575")("]")}`;
    return `${module.exports.errorPrefix}${chalk.bold(errorInfo)}`;
}

module.exports = {
    getStartupParameters: () => {
        return process.argv.slice(2).filter(a => a.startsWith("--")).map(a => a.replace(/--/g, ''));
    },
    getLine: (presetLine) => {
        const stacks = (new Error()).stack.split("\n").filter(s => s).map(s => s.trim());
        let line = stacks[presetLine];

        if (!line) {
            line = stacks.find(stack => {
                // If the error is just a normal error
                if (stack.startsWith("at " + __dirname.slice(0, 2))) return true;
                // If the error is coming from a command file
                else if (stack.startsWith("at Object.run") && stack.includes("\\commands\\")) return true;
                // Return false if the stack isn't what we want
                else return false;
            }) || "";
        }

        line.trim();

        return line
            // Remove "at ..."
            .slice(line.indexOf(__dirname.slice(0, 2)), line.length)
            // Only get relative files instead of the whole directory
            .replace(process.cwd(), '')
            // Remove trailing backslash
            .replace(/\)/g, '');
    },
    Discord: require('discord.js'),
    hasRole: function (member, search, notifyIfNotExists = true) {
        if (!search || typeof search !== 'string') {
            console.log(prefix(1, "Utils.hasRole", module.exports.getLine() || "Unknown"), `Invalid input for search:`, search);
            return false;
        }
        if (!member) {
            console.log(prefix(2, "Utils.hasRole", module.exports.getLine() || "Unknown"), `Invalid input for member:`, member);
            return false;
        }
        if (search.name) search = search.name;
        const role = member.guild.roles.cache.find(r => r.name.toLowerCase() == search.toLowerCase() || r.id == search);
        if (!role) {
            if (notifyIfNotExists) console.log(prefix(3, "Utils.hasRole", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(search.name || search)} role was not found in the ${chalk.bold(member.guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `);
            return false;
        }
        if (member.roles.cache.has(role.id)) return true;
        else return false;
    },
    hasPermission: function (member, search) {
        if (!member) {
            console.log(prefix(4, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `Invalid input for member:`, member);
            return false;
        }

        function checkPerms(s) {
            if (member.id == s) return true;

            if (member.guild.members.cache.get(s)) return false;

            let role = member.guild.roles.cache.find(r => r.name.toLowerCase() == s.toLowerCase() || r.id == s);

            if (!role) {
                console.log(prefix(6, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(s)} role was not found in the ${chalk.bold(member.guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `);
                return false;
            }

            if (commands.Inheritance) {
                if (member.roles.highest.position < role.position) return false;
                else return true;
            }

            else {
                if (member.roles.cache.has(role.id)) return true;
                else return false;
            }
        }

        if (typeof search == 'string') {
            if (search == "@everyone") return true;
            return checkPerms(search);
        }

        else if (Array.isArray(search)) {
            if (search.includes("@everyone")) return true;

            let permission = search.filter(s => typeof s == "string").some(s => {
                return checkPerms(s);
            });

            return permission;

        }

        else {
            console.log(prefix(5, "Utils.hasPermission", module.exports.getLine() || "Unknown"), `Invalid input for role:`, search);
            return false;
        }

    },
    findRole: function (name, guild, notifyIfNotExists = true) {
        if (!name || typeof name !== 'string') {
            console.log(prefix(7, "Utils.findRole", module.exports.getLine() || "Unknown"), `Invalid input for role:`, name);
            return false;
        }
        if (!guild) {
            console.log(prefix(8, "Utils.findRole", module.exports.getLine() || "Unknown"), `Invalid input for guild:`, guild);
            return false;
        }
        const role = guild.roles.cache.find(r => r.name.toLowerCase() == name.toLowerCase() || r.id == name);
        if (!role) {
            if (notifyIfNotExists) console.log(prefix(9, "Utils.findRole", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(name)} role was not found in the ${chalk.bold(guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the role in your Discord server.\n${chalk.gray(">")}          `);
            return false;
        }
        return role;
    },
    findChannel: function (name, guild, type = 'GUILD_TEXT', notifyIfNotExists = true) {
        if (!name || typeof name !== "string") {
            console.log(prefix(10, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid input for channel:`, name);
            return false;
        }
        if (!guild) {
            console.log(prefix(11, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid input for guild:`, guild);
            return false;
        }
        if (!['GUILD_TEXT', 'GUILD_VOICE', 'GUILD_CATEGORY'].includes(type.toUpperCase())) {
            console.log(prefix(12, "Utils.findChannel", module.exports.getLine() || "Unknown"), `Invalid type of channel:`, type);
            return false;
        }
        const channel = guild.channels.cache.find(c => (c.name.toLowerCase() == name.toLowerCase() || c.id == name) && (type.toUpperCase() == 'GUILD_TEXT' ? ['GUILD_TEXT', "GUILD_NEWS"].includes(c.type.toUpperCase()) : c.type.toUpperCase() == type.toUpperCase()));
        if (!channel) {
            if (notifyIfNotExists) console.log(prefix(13, "Utils.findChannel", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(name)} ${["GUILD_TEXT", "GUILD_VOICE"].includes(type) ? `${type} channel` : "category"} was not found in the ${chalk.bold(guild.name)} guild!\n${chalk.gray(">")}          To resolve the issue, create the ${["GUILD_TEXT", "GUILD_VOICE"].includes(type) ? `${type} channel` : "category"} in your Discord server.\n${chalk.gray(">")}          `);
            return false;
        }
        return channel;
    },
    paste: function (text, paste_site = config.Other.PasteSite || "https://paste.corebot.dev") {
        return new Promise((resolve, reject) => {
            if (!text) reject(prefix(14, "Utils.paste") + ` Invalid text.`);
            require('request-promise')({ uri: paste_site + '/documents', method: 'POST', body: text })
                .then(res => {
                    const json = JSON.parse(res);
                    if (!json || !json.key) reject(prefix(15, "Utils.paste") + ` Invalid response from paste site: ` + res);
                    resolve(paste_site + '/' + json.key);
                })
                .catch(err => {
                    console.log(prefix(16, "Utils.paste"), `The specified paste site is down. Please try again later.`);
                    reject(err);
                });
        });
    },
    hasAdvertisement: function (text, ignoreIfInWhitelist = true) { // hasAdvertisment won't delete a message if there is a whitelisted website with non whitelisted websites 
        if (!text || typeof text !== 'string') {
            console.log(prefix(17, "Utils.hasAdvertisement"), `Invalid input for text:`, text);
            return false;
        }
        if (config.AntiAdvertisement.Whitelist.Websites?.some(site => text.toLowerCase().includes(site.toLowerCase())) && ignoreIfInWhitelist) return false;
        let TLDs = module.exports.variables.TLDs;

        let hasLink = TLDs.TLDs.some(TLD => {
            // eslint-disable-next-line no-useless-escape
            let regexp = new RegExp(`(https:\\/\\/.+|http:\/\/.+|.{2,}\\.${TLD.toLowerCase()})`);
            return regexp.test(text.toLowerCase());
        }) || TLDs.Domains.some(domain => text.toLowerCase().includes(domain.toLowerCase()));

        return hasLink;
        //return /(https?:\/\/)?((([A-Z]|[a-z])+)\.(([A-Z]|[a-z])+))+(\/[^\/\s]+)*/.test(text);
    },
    backup: (files) => {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(files)) reject(prefix(18, "Utils.backup") + ` Files is not an array: ` + files);
            if (!fs.existsSync('./data/backups/')) fs.mkdirSync('./data/backups/');
            const date = new Date();
            const folder = date.toLocaleString().replace(/\//g, '-').replace(/,/g, '').replace(/\s/g, '_').replace(/:/g, '-') + '/';
            fs.mkdirSync(`./data/backups/${folder}`);
            files.forEach(file => {
                fs.readFile(file.path, (err, data) => {
                    if (err) reject(err);

                    const fileFolder = file.folder || "";
                    if (!fs.existsSync(`./data/backups/${folder}/${fileFolder}`)) fs.mkdirSync(`./data/backups/${folder}/${fileFolder}`);

                    const filePath = fileFolder ? `${fileFolder}/${file.path.includes("/") ? file.path.split("/").pop() : file.path}` : file.path.split("/").pop();

                    fs.writeFile(`./data/backups/${folder}/${filePath}`, data, (err) => {
                        if (err) reject(err);
                    });
                });
            });
            resolve();
        });
    },
    error: require('./error.js'),
    variables: require('./variables.js'),
    yml: require('./yml.js'),
    Embed: require('./embed.js'),
    waitForResponse: function (userid, channel) {
        return new Promise((resolve, reject) => {
            channel.awaitMessages({ filter: m => m.author.id == userid, max: 1 })
                .then(msgs => {
                    resolve(msgs.first());
                })
                .catch(reject);
        });
    },
    waitForReaction: function (emojis, userids, message) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(emojis)) emojis = [emojis];
            if (!Array.isArray(userids)) userids = [userids];
            message.awaitReactions({ filter: (reaction, user) => emojis.includes(reaction.emoji.name) && userids.includes(user.id), max: 1 })
                .then(reactions => {
                    resolve(reactions.first());
                })
                .catch(reject);
        });
    },
    Database: require('./database.js'),
    setupMessage(embedSettings) {
        if (embedSettings.configPath && typeof embedSettings.configPath == "object") {
            let Title = embedSettings.title || embedSettings.configPath.Title;
            let Description = embedSettings.description || embedSettings.configPath.Description;
            let Footer = embedSettings.footer || embedSettings.configPath.Footer;
            let FooterAvatarImage = embedSettings.footericon || embedSettings.configPath.FooterIcon;
            let Timestamp = embedSettings.timestamp || embedSettings.configPath.Timestamp;
            let Thumbnail = embedSettings.thumbnail || embedSettings.configPath.Thumbnail;
            let Author = embedSettings.author || embedSettings.configPath.Author;
            let AuthorAvatarImage = embedSettings.authoricon || embedSettings.configPath.AuthorIcon;
            let Color = embedSettings.color || embedSettings.configPath.Color || this.variables.config.EmbedColors.Default;
            let Variables = embedSettings.variables;
            let Fields = embedSettings.fields || embedSettings.configPath.Fields;
            let Image = embedSettings.image || embedSettings.configPath.Image;
            let URL = embedSettings.url || embedSettings.configPath.URL;
            let AuthorURL = embedSettings.authorurl || embedSettings.configPath.AuthorURL;
            let content = embedSettings.content || embedSettings.configPath.Content;
            let componentSettings = embedSettings.components || embedSettings.configPath.Components;
            let fields = [];
            let components = [];

            if (Array.isArray(Color)) Color = Color[Math.floor(Math.random() * Color.length)];
            if (Array.isArray(Description)) Description = Description[Math.floor(Math.random() * Description.length)];

            if (Variables && typeof Variables === 'object') {
                Variables.forEach(v => {
                    if (typeof Title === 'string') Title = Title.replace(v.searchFor, v.replaceWith);
                    if (typeof Description === 'string') Description = Description.replace(v.searchFor, v.replaceWith);
                    if (typeof Footer === 'string') Footer = Footer.replace(v.searchFor, v.replaceWith);
                    if (typeof FooterAvatarImage === 'string') FooterAvatarImage = FooterAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Thumbnail === 'string') Thumbnail = Thumbnail.replace(v.searchFor, v.replaceWith);
                    if (typeof Author === 'string') Author = Author.replace(v.searchFor, v.replaceWith);
                    if (typeof AuthorAvatarImage === 'string') AuthorAvatarImage = AuthorAvatarImage.replace(v.searchFor, v.replaceWith);
                    if (typeof Image === 'string') Image = Image.replace(v.searchFor, v.replaceWith);
                    if (typeof URL === 'string') URL = URL.replace(v.searchFor, v.replaceWith);
                    if (typeof AuthorURL === 'string') AuthorURL = AuthorURL.replace(v.searchFor, v.replaceWith);
                    if (typeof content === 'string') content = content.replace(v.searchFor, v.replaceWith);
                });
            }

            if (Fields) {
                Fields.forEach(async (field) => {
                    let newField = {
                        name: field.name || field.Name,
                        value: field.value || field.Value,
                        inline: !!field.inline || !!field.Inline
                    };

                    if (Variables && typeof Variables === 'object') {
                        Variables.forEach(v => {
                            newField.name = newField.name.replace(v.searchFor, v.replaceWith);
                            newField.value = newField.value.replace(v.searchFor, v.replaceWith);
                        });
                    }
                    fields.push(newField);
                });
            }

            if (Array.isArray(componentSettings)) {
                componentSettings.filter(row => row.length).slice(0, 5).forEach(row => {
                    let comp = new module.exports.Discord.MessageActionRow();

                    row.slice(0, 5).map(buttonID => module.exports.variables.buttons.Buttons.find(b => "custombutton_" + b.ID == buttonID) || buttonID).filter(b => b && (b.ID || b.URL) && b.Label && b.Style).forEach(button => {
                        let { ID, Label, Style, URL } = button;

                        if (Variables && typeof Variables === 'object') {
                            Variables.forEach(v => {
                                if (ID) ID = ID.replace(v.searchFor, v.replaceWith);
                                if (Label) Label = Label.replace(v.searchFor, v.replaceWith);
                                if (Style && typeof Style == "string") Style = Style.replace(v.searchFor, v.replaceWith);
                                if (URL) URL = URL.replace(v.searchFor, v.replaceWith);
                            });
                        }

                        let b = new module.exports.Discord.MessageButton()
                            .setLabel(Label)
                            .setEmoji(button.Emoji && button.Emoji.Enabled ? button.Emoji.Emoji : undefined)
                            .setStyle(typeof Style == "string" ? Style.toUpperCase() : Style);

                        if (ID && ((typeof Style == "string" ? Style.toUpperCase() !== "LINK" : true) && Style !== 5)) b.setCustomId(ID);

                        if ((typeof Style == "string" ? Style.toUpperCase() == "LINK" : Style == 5) && typeof URL == "string") b.setURL(URL);

                        comp.addComponents(b);
                    });

                    if (comp.components.length) components.push(comp);
                });
            }

            let embed = new this.Discord.MessageEmbed();

            if (Title) embed.setTitle(Title);
            if (Author) embed.setAuthor({ name: Author, iconURL: AuthorAvatarImage, url: AuthorURL });
            if (Description) embed.setDescription(Description);
            if (Color) embed.setColor(Color);
            if (Footer) embed.setFooter({ text: Footer, iconURL: FooterAvatarImage });
            if (Timestamp == true) embed.setTimestamp();
            if (Timestamp && Timestamp !== true && new Date(Timestamp)) embed.setTimestamp(new Date(Timestamp));
            if (Thumbnail && typeof Thumbnail == "string" && Thumbnail.includes("http")) embed.setThumbnail(Thumbnail);
            if (Fields && Fields.length > 0) {
                fields.forEach(field => {
                    embed.addField(field.name, field.value, field.inline);
                });
            }
            if (Image) embed.setImage(Image);
            if (URL) embed.setURL(URL);

            if (!Title && !Author && !Description && !Footer && !Thumbnail && (!Fields || Fields.length == 0)) embed = undefined;

            return { content, embeds: [embed].filter(e => e), components };
        } else {
            return console.log(prefix(19, "Utils.setupMessage"), `Invalid input for configPath:`, embedSettings.configPath);
        }
    },
    transcriptMessage: function (messageOrInteraction, ticket = true, slashCommandArguments) {
        const type = this.variables.db.type;

        // Transcripts for Slash Commands
        if (messageOrInteraction.constructor == CommandInteraction) {
            const { id, user, channel } = messageOrInteraction;
            const content = `/${messageOrInteraction.commandName}${slashCommandArguments ? ` ${slashCommandArguments}` : "" || ""}`;
            if (ticket) {
                if (type === 'sqlite') {
                    this.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, user.id, user.displayAvatarURL({ dynamic: true }), user.tag, Date.now(), undefined, undefined, undefined, undefined, content, channel.id);
                } else if (type === 'mysql') {
                    this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, user.id, user.displayAvatarURL({ dynamic: true }), user.tag, Date.now(), undefined, undefined, undefined, undefined, content, channel.id], function (err) {
                        if (err) console.log(err);
                    });
                }
            } else {
                if (type === 'sqlite') {
                    this.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(id, user.id, user.displayAvatarURL({ dynamic: true }), user.tag, Date.now(), undefined, undefined, undefined, undefined, content, channel.id);
                } else if (type === 'mysql') {
                    this.variables.db.mysql.database.query('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, user.id, user.displayAvatarURL({ dynamic: true }), user.tag, Date.now(), undefined, undefined, undefined, undefined, content, channel.id], function (err) {
                        if (err) console.log(err);
                    });
                }
            }
            // Transcripts for regular messsages
        } else if (messageOrInteraction.constructor == Message) {
            const isEmbed = messageOrInteraction.embeds.length > 0;

            const embed = {
                fields: [],
                description: "",
                title: "",
                color: ""
            };

            if (isEmbed) {
                embed.fields = messageOrInteraction.embeds[0].fields || [];
                embed.description = messageOrInteraction.embeds[0].description || '';
                embed.title = messageOrInteraction.embeds[0].title || '';
                embed.color = messageOrInteraction.embeds[0].hexColor || "#0023b0";
            }

            if (ticket) {
                if (type === 'sqlite') {
                    if (isEmbed) {
                        this.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), embed.title, embed.description, embed.color, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id);

                        embed.fields.forEach(field => {
                            module.exports.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)').run(messageOrInteraction.id, field.name, field.value);
                        });
                    } else {
                        this.variables.db.sqlite.database.prepare('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), undefined, undefined, undefined, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id);
                    }
                } else if (type === 'mysql') {
                    if (isEmbed) {
                        this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), embed.title, embed.description, embed.color, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id], function (err) {
                            if (err) console.log(err);

                            embed.fields.forEach(field => {
                                module.exports.variables.db.mysql.database.query('INSERT INTO ticketmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [messageOrInteraction.id, field.name, field.value], function (err) {
                                    if (err) console.log(err);
                                });
                            });
                        });
                    } else {
                        this.variables.db.mysql.database.query('INSERT INTO ticketmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, ticket) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), undefined, undefined, undefined, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id], function (err) {
                            if (err) console.log(err);
                        });
                    }
                }
            } else {
                if (type === 'sqlite') {
                    if (isEmbed) {
                        this.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), embed.title, embed.description, embed.color, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id);

                        embed.fields.forEach(field => {
                            module.exports.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages_embed_fields(message, name, value) VALUES(?, ?, ?)').run(messageOrInteraction.id, field.name, field.value);
                        });
                    } else {
                        this.variables.db.sqlite.database.prepare('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), undefined, undefined, undefined, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id);
                    }
                } else if (type === 'mysql') {
                    if (isEmbed) {
                        this.variables.db.mysql.database.query('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), embed.title, embed.description, embed.color, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id], function (err) {
                            if (err) console.log(err);

                            embed.fields.forEach(field => {
                                module.exports.variables.db.mysql.database.query('INSERT INTO applicationmessages_embed_fields(message, name, value) VALUES(?, ?, ?)', [messageOrInteraction.id, field.name, field.value], function (err) {
                                    if (err) console.log(err);
                                });
                            });
                        });
                    } else {
                        this.variables.db.mysql.database.query('INSERT INTO applicationmessages(message, author, authorAvatar, authorTag, created_at, embed_title, embed_description, embed_color, attachment, content, application) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [messageOrInteraction.id, messageOrInteraction.author.id, messageOrInteraction.author.displayAvatarURL({ dynamic: true }), messageOrInteraction.author.tag, messageOrInteraction.createdAt.getTime(), undefined, undefined, undefined, messageOrInteraction.attachments.size > 0 ? messageOrInteraction.attachments.first().url : undefined, messageOrInteraction.content, messageOrInteraction.channel.id], function (err) {
                            if (err) console.log(err);
                        });
                    }
                }
            }
        }
    },
    checkBan: async function (guild, user) {
        if ([guild, user].some(a => !a)) return console.log(prefix(20, "Utils.checkBan"), `Invalid inputs:`, [guild, user].map(a => !!a).join(', '));
        return !!(await guild.bans.fetch()).find(b => b.user.id == user);
    },
    ResolveUser: function (messageOrInteraction, argument = 0, searchWholeCommand = false) {
        if (messageOrInteraction.constructor == this.Discord.Message) {
            const args = messageOrInteraction.content.split(" ");
            args.shift();

            const text = searchWholeCommand ? args.join(" ") : (args[argument] || '');
            return messageOrInteraction.guild.members.cache.find(m => m.user.tag.toLowerCase() == text.toLowerCase() || m.displayName.toLowerCase() == text.toLowerCase() || m.id == text.replace(/([<@!]|[>])/g, '')) || messageOrInteraction.mentions.members.first();
        } else if (messageOrInteraction.constructor == this.Discord.CommandInteraction) {
            let args = [];
            if (messageOrInteraction && messageOrInteraction.options && messageOrInteraction.options.data) {
                messageOrInteraction.options.data.forEach(option => {
                    if (option.value) args.push(option.value);
                    else {
                        option.options.forEach(subOption => {
                            args.push(subOption.value);
                        });
                    }
                });
            } else return;
            args = args.map(a => a.toString());

            const text = (searchWholeCommand ? args.join(" ") : args[argument]) || "";
            const user = messageOrInteraction.guild.members.cache.find(m => m.user.tag.toLowerCase() == text.toLowerCase() || m.displayName.toLowerCase() == text.toLowerCase() || m.id == text.replace(/([<@!]|[>])/g, ''));

            return user;
        }
    },
    ResolveChannel: function (messageOrInteraction, argument = 0, fullText = false, useMentions = true) {
        if (messageOrInteraction.constructor == this.Discord.Message) {
            const args = messageOrInteraction.content.split(" ");
            args.shift();
            const text = fullText ? args.join(" ") : (args[argument] || '');

            return messageOrInteraction.guild.channels.cache.find(c => c.name.toLowerCase() == text.toLowerCase() || c.id == text.replace(/([<#]|[>])/g, '')) || (useMentions ? messageOrInteraction.mentions.channels.first() : false);
        } else if (messageOrInteraction.constructor == this.Discord.CommandInteraction) {
            const args = [];
            if (messageOrInteraction && messageOrInteraction.options && messageOrInteraction.options.data) {
                messageOrInteraction.options.data.forEach(option => {
                    if (option.value) args.push(option.value);
                    else {
                        option.options.forEach(subOption => {
                            args.push(subOption.value);
                        });
                    }
                });
            } else return;

            const text = (fullText ? args.join(" ") : args[argument]) || "";
            return messageOrInteraction.guild.channels.cache.find(c => c.name.toLowerCase() == text.toLowerCase() || c.id == text.replace(/([<#]|[>])/g, ''));
        }
    },
    getMMDDYYYY(separator = '-', time = Date.now()) {
        const date = new Date(time);
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join(separator);
    },
    getEmoji: function (number) {
        if (number == 1) return "\u0031\u20E3";
        if (number == 2) return "\u0032\u20E3";
        if (number == 3) return "\u0033\u20E3";
        if (number == 4) return "\u0034\u20E3";
        if (number == 5) return "\u0035\u20E3";
        if (number == 6) return "\u0036\u20E3";
        if (number == 7) return "\u0037\u20E3";
        if (number == 8) return "\u0038\u20E3";
        if (number == 9) return "\u0039\u20E3";
        if (number == 10) return "\uD83D\uDD1F";
    },
    getValidInvites(guild) {
        return new Promise((resolve, reject) => {
            guild.invites.fetch()
                .then(invites => {
                    resolve(invites.map(i => {
                        return {
                            code: i.code,
                            channel: i.channel,
                            uses: i.uses ? i.uses : 0,
                            inviter: i.inviter ? i.inviter : guild.members.cache.get(bot.id)
                        };
                    }));
                })
                .catch(reject);
        });
    },
    // eslint-disable-next-line no-unused-vars
    CheckCommand(args, permission) {
        /*
            ARGS TEMPLATE:

            Example for tempban
            [
                {
                    name: "target",
                    type: "User"
                },
                {
                    name: "time",
                    type: "Time"
                }
            ]
        */

    },
    getTimeDifference(date1, date2, LessThanAbout = undefined) {
        let d1 = new Date(date1);
        let d2 = new Date(date2);
        var msec = d2 - d1;
        let secs = Math.floor(msec / 1000);
        var mins = Math.floor(secs / 60);
        var hrs = Math.floor(mins / 60);
        var days = Math.floor(hrs / 24);
        let result = [];

        secs = Math.abs(secs % 60);
        mins = Math.abs(mins % 60);
        hrs = Math.abs(hrs % 24);
        days = Math.abs(days % 365);

        if (days !== 0) days == 1 ? result.push("" + lang.Other.Time.Day.replace(/{days}/g, days)) : result.push("" + lang.Other.Time.Days.replace(/{days}/g, days));
        if (hrs !== 0) hrs == 1 ? result.push("" + lang.Other.Time.Hour.replace(/{hours}/g, hrs)) : result.push("" + lang.Other.Time.Hours.replace(/{hours}/g, hrs));
        if (mins !== 0) mins == 1 ? result.push("" + lang.Other.Time.Minute.replace(/{minutes}/g, mins)) : result.push("" + lang.Other.Time.Minutes.replace(/{minutes}/g, mins));
        if (secs !== 0) secs == 1 ? result.push("" + lang.Other.Time.Second.replace(/{seconds}/g, secs)) : result.push("" + lang.Other.Time.Seconds.replace(/{seconds}/g, secs));

        if (result.length == 1 && result[0].endsWith(lang.Other.Time.Seconds.replace(/{seconds}/g, ''))) {
            return (LessThanAbout ? lang.Other.Time.LessThan : "") + result[0];
        } else {
            if (result.length !== 1) result[result.length - 1] = lang.Other.Time.And + " " + result[result.length - 1];
            return (LessThanAbout ? lang.Other.Time.About : "") + result.join(" ");
        }

        /*let distance = new Date(date1) - new Date(date2).getTime();
        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return hours + "h " + minutes + "m and " + seconds + "s"*/
    },
    customStatusPlaceholders: [],
    addStatusPlaceholder(placeholder, data) {
        if (this.customStatusPlaceholders.find(p => p.searchFor.toString() == placeholder.toString())) {
            let position = this.customStatusPlaceholders.indexOf(this.customStatusPlaceholders.find(p => p.searchFor.toString() == placeholder.toString()));
            this.customStatusPlaceholders.splice(position, 1, { searchFor: placeholder, replaceWith: data });
        } else this.customStatusPlaceholders.push({ searchFor: placeholder, replaceWith: data });
    },
    async getStatusPlaceholders(status) {
        if (!status || typeof status !== "string") return "";

        const guild = this.variables.bot.guilds.cache.filter(g => !config.Other.IgnoredGuilds.includes(g.id)).first();
        if (!guild) return "";
        const defaultPlaceholders = [
            { searchFor: /{tickets}/g, replaceWith: (await module.exports.getOpenTickets(guild)).size },
            { searchFor: /{users}/g, replaceWith: guild.memberCount },
            { searchFor: /{total-online-users}/g, replaceWith: guild.members.cache.filter(member => member.presence && member.presence.status !== "offline").size },
            { searchFor: /{total-online-humans}/g, replaceWith: guild.members.cache.filter(member => member.presence && member.presence.status !== "offline" && !member.user.bot).size },
            { searchFor: /{total-online-bots}/g, replaceWith: guild.members.cache.filter(member => member.presence && member.presence.status !== "offline" && member.user.bot).size },
            { searchFor: /{humans}/g, replaceWith: guild.members.cache.filter(member => !member.user.bot).size },
            { searchFor: /{bots}/g, replaceWith: guild.members.cache.filter(member => member.user.bot).size }
        ];
        const placeholders = [...defaultPlaceholders, ...this.customStatusPlaceholders];

        placeholders
            .filter(placeholder => typeof placeholder == "object" && placeholder.searchFor && ![undefined, null].includes(placeholder.replaceWith))
            .forEach(placeholder => {
                status = status.replace(placeholder.searchFor, placeholder.replaceWith);
            });

        return status;
    },
    asyncForEach: async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    },
    DDHHMMSSfromMS(ms, abbreviated = true) {
        let secs = ms / 1000;
        const days = ~~(secs / 86400);
        secs -= days * 86400;
        const hours = ~~(secs / 3600);
        secs -= hours * 3600;
        const minutes = ~~(secs / 60);
        secs -= minutes * 60;
        let total = [];

        if (days > 0)
            total.push(~~days + " " + (days == 1 ? (abbreviated ? lang.Other.Time.day.abbreviated : lang.Other.Time.day.text) : (abbreviated ? lang.Other.Time.day.abbreviatedPlural : lang.Other.Time.day.plural)));
        if (hours > 0)
            total.push(~~hours + " " + (hours == 1 ? (abbreviated ? lang.Other.Time.hour.abbreviated : lang.Other.Time.hour.text) : (abbreviated ? lang.Other.Time.hour.abbreviatedPlural : lang.Other.Time.hour.plural)));
        if (minutes > 0)
            total.push(~~minutes + " " + (minutes == 1 ? (abbreviated ? lang.Other.Time.minute.abbreviated : lang.Other.Time.minute.text) : (abbreviated ? lang.Other.Time.minute.abbreviatedPlural : lang.Other.Time.minute.plural)));
        if (secs > 0)
            total.push(~~secs + " " + (secs == 1 ? (abbreviated ? lang.Other.Time.second.abbreviated : lang.Other.Time.second.text) : (abbreviated ? lang.Other.Time.second.abbreviatedPlural : lang.Other.Time.second.plural)));
        if ([~~days, ~~hours, ~~minutes, ~~secs].every(time => time == 0)) total.push("0 " + (abbreviated ? lang.Other.Time.second.abbreviatedPlural : lang.Other.Time.second.plural));
        if (!abbreviated && total.length > 1) total[total.length - 1] = lang.Other.Time.And + " " + total[total.length - 1];
        return total.join(" ");
    },
    color: {
        "Reset": "\x1b[0m",
        "Bright": "\x1b[1m",
        "Dim": "\x1b[2m",
        "Underscore": "\x1b[4m",
        "Blink": "\x1b[5m",
        "Reverse": "\x1b[7m",
        "Hidden": "\x1b[8m",
        "FgBlack": "\x1b[30m",
        "FgRed": "\x1b[31m",
        "FgGreen": "\x1b[32m",
        "FgYellow": "\x1b[33m",
        "FgBlue": "\x1b[34m",
        "FgMagenta": "\x1b[35m",
        "FgCyan": "\x1b[36m",
        "FgWhite": "\x1b[37m",
        "BgBlack": "\x1b[40m",
        "BgRed": "\x1b[41m",
        "BgGreen": "\x1b[42m",
        "BgYellow": "\x1b[43m",
        "BgBlue": "\x1b[44m",
        "BgMagenta": "\x1b[45m",
        "BgCyan": "\x1b[46m",
        "BgWhite": "\x1b[47m",
    },
    infoPrefix: chalk.hex("#57ff6b").bold("[INFO] "),
    warningPrefix: chalk.hex("#ffa040").bold("[WARNING] "),
    errorPrefix: chalk.hex("#ff5e5e").bold("[ERROR] "),
    debugPrefix: chalk.hex("#e6e61e").bold("[DEBUG] "),
    backupPrefix: chalk.hex("#61f9ff").bold("[BACKUP] "),
    delay: async function (seconds) {
        let start = Date.now();
        let end = start;
        while (end < start + (seconds * 1000)) {
            end = Date.now();
        }

        return true;
    },
    userVariables: function (member, prefix) {
        let isGuildMember = member instanceof module.exports.Discord.GuildMember;
        let isClient = member instanceof module.exports.Discord.Client;
        let user = isGuildMember ? member.user : isClient ? member.user : member;

        return [
            { searchFor: new RegExp(`{${prefix}-id}`, 'g'), replaceWith: user.id },
            { searchFor: new RegExp(`{${prefix}-displayname}`, 'g'), replaceWith: isGuildMember ? member.displayName : user.username },
            { searchFor: new RegExp(`{${prefix}-username}`, 'g'), replaceWith: user.username },
            { searchFor: new RegExp(`{${prefix}-tag}`, 'g'), replaceWith: user.tag },
            { searchFor: new RegExp(`{${prefix}-mention}`, 'g'), replaceWith: '<@' + user.id + '>' },
            { searchFor: new RegExp(`{${prefix}-pfp}`, 'g'), replaceWith: user.displayAvatarURL({ dynamic: true }) },
            { searchFor: new RegExp(`{${prefix}-creation-text}`), replaceWith: user.createdAt.toLocaleString() },
            { searchFor: new RegExp(`{${prefix}-creation}`), replaceWith: `<t:${~~(user.createdAt.getTime() / 1000)}:f>` },
            { searchFor: new RegExp(`{${prefix}-creation-relative}`), replaceWith: `<t:${~~(user.createdAt.getTime() / 1000)}:R>` }
        ];
    },
    getMultiplier(member) {
        if (config.Coins.Multipliers.Enabled && config.Coins.Multipliers.Roles && typeof config.Coins.Multipliers.Roles == "object") {
            let multipliers = [];

            Object.keys(config.Coins.Multipliers.Roles).forEach(role => {
                if (module.exports.hasRole(member, role)) multipliers.push(config.Coins.Multipliers.Roles[role]);
            });

            if (multipliers.length > 0) return Math.max(...multipliers);
            else return 1;
        } else return 1;
    },
    getOpenTickets: async guild => {
        if (!guild || !guild.id) return console.log(prefix(21, "Utils.getOpenTickets"), `Invalid input for guild:`, guild);

        let tickets = await module.exports.variables.db.get.getTickets();
        tickets = tickets.filter(ticket => ticket.guild == guild.id).map(ticket => ticket.channel_id);

        return guild.channels.cache.filter(channel => tickets.includes(channel.id));
    },
    getOpenApplications: async guild => {
        if (!guild || !guild.id) return console.log(prefix(22, "Utils.getOpenApplications"), `Invalid input for guild:` + guild);

        let applications = await module.exports.variables.db.get.getApplications();
        applications = applications.filter(application => application.guild == guild.id).map(application => application.channel_id);

        return guild.channels.cache.filter(channel => applications.includes(channel.id));
    },
    updateInviteCache: async bot => {
        return new Promise(async resolve => {
            let cache = {};
            bot.guilds.cache.filter(g => !config.Other.IgnoredGuilds.includes(g.id)).forEach((g, i) => {
                g.invites.fetch().then(guildInvites => {
                    cache[g.id] = guildInvites;
                    if (i >= bot.guilds.cache.filter(g => !config.Other.IgnoredGuilds.includes(g.id)).size - 1) set();
                });
            });

            function set() {
                module.exports.variables.set("invites", cache);
                resolve();
            }
        });
    },
    embedFromText: (text, messageOrInteraction) => {
        let { user } = messageOrInteraction;
        if (!user) user = messageOrInteraction.author;

        let embed = {
            author: {},
            footer: {},
            thumbnail: {},
            image: {},
            fields: []
        };

        let ptext;

        text.replace("_embed #channel", "").split("|").forEach(property => {
            property = property.trim();

            let key = property.substring(0, property.indexOf("=")).trim();
            let value = property.substring(property.indexOf("=") + 1).trim();

            if (key == "author") {
                let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
                let startOfIcon = value.indexOf("icon=") == -1 ? undefined : value.indexOf("icon=");
                let startOfURL = value.indexOf("url=") == -1 ? undefined : value.indexOf("url=");

                let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfIcon || startOfURL).trim() : undefined;
                let icon = typeof startOfIcon == "number" ? value.substring(startOfIcon + 5, startOfURL).trim() : undefined;
                let url = typeof startOfURL == "number" ? value.substring(startOfURL + 4).trim() : undefined;

                if (icon == "me") icon = user.displayAvatarURL({ dynamic: true });
                if (icon == "bot") icon = bot.user.displayAvatarURL({ dynamic: true });
                if (url == "me") url = user.displayAvatarURL({ dynamic: true });
                if (url == "bot") url = bot.user.displayAvatarURL({ dynamic: true });

                embed.author.name = name;
                embed.author.iconURL = icon;
                embed.author.url = url;

            } else if (key == "thumbnail") {
                if (value == "me") value = user.displayAvatarURL({ dynamic: true });
                if (value == "bot") value = bot.user.displayAvatarURL({ dynamic: true });

                embed.thumbnail.url = value;
            } else if (key == "image") {
                if (value == "me") value = user.displayAvatarURL({ dynamic: true });
                if (value == "bot") value = bot.user.displayAvatarURL({ dynamic: true });

                embed.image.url = value;
            } else if (key == "footer") {
                let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
                let startOfIcon = value.indexOf("icon=") == -1 ? undefined : value.indexOf("icon=");

                if (startOfName == undefined) return embed.footer.text = value;

                let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfIcon).trim() : undefined;
                let icon = typeof startOfIcon == "number" ? value.substring(startOfIcon + 5).trim() : undefined;

                if (icon == "me") icon = user.displayAvatarURL({ dynamic: true });
                if (icon == "bot") icon = bot.user.displayAvatarURL({ dynamic: true });

                embed.footer.text = name;
                embed.footer.iconURL = icon;
            } else if (key == "color") {
                embed[key] = parseInt(value.replace("#", ""), 16);
            } else if (key == "field") {
                let startOfName = value.indexOf("name=") == -1 ? undefined : value.indexOf("name=");
                let startOfValue = value.indexOf("value=") == -1 ? undefined : value.indexOf("value=");
                let startOfInline = value.indexOf("inline=");

                let name = typeof startOfName == "number" ? value.substring(startOfName + 5, startOfValue).trim() : undefined;
                let v = typeof startOfValue == "number" ? value.substring(startOfValue + 6, startOfInline == -1 ? undefined : startOfInline).trim() : undefined;
                let inline = startOfInline == -1 ? true : value.substring(startOfInline + 7).trim();

                if (typeof inline == "string") inline = inline == "false" || inline == "no" ? false : true;
                if (!name) name = "\u200b";
                if (!value) value = "\u200b";

                embed.fields.push({ name, value: v, inline });
            } else if (key == "ptext") {
                ptext = value;
            } else embed[key] = value;
        });

        if (!embed.color) embed.color = module.exports.variables.config.EmbedColors.Default;

        return { content: ptext, embeds: [embed] };
    },
    findEmoji: function (name, bot, notifyIfNotExists = true) {
        if (!name || typeof name !== 'string') {
            console.log(prefix(7, "Utils.findEmoji", module.exports.getLine() || "Unknown"), `Invalid input for emoji:`, name);
            return false;
        }
        if (!bot) {
            console.log(prefix(8, "Utils.findEmoji", module.exports.getLine() || "Unknown"), `Invalid input for bot:`, bot);
            return false;
        }
        const emojis = bot.emojis ? bot.emojis.cache : [];
        const emoji = emojis.find(e => e.name.toLowerCase() == name.toLowerCase() || e.id == name || e.toString() == name);
        if (!emoji) {
            if (notifyIfNotExists) console.log(prefix(9, "Utils.findEmoji", module.exports.getLine() || "Unknown"), `\n${chalk.gray(">")}          The ${chalk.bold(name)} emoji was not found in the ${chalk.bold(guild.name)} guild! This is probably due to misconfiguration`);
            return false;
        }
        return emoji;
    },
    getMSFromText(text) {

        if (!text) return 0;

        function getTimeElement(letter) {
            const find = text.toLowerCase().match(new RegExp(`\\d+${letter}`));
            return parseInt(find ? find[0] : 0);
        }

        const secs = getTimeElement("s");
        const mins = getTimeElement("m");
        const hours = getTimeElement("h");
        const days = getTimeElement("d");

        let total = 0;

        total += secs * 1000;
        total += mins * 60000;
        total += hours * 60 * 60000;
        total += days * 24 * 60 * 60000;

        return total;
    },
    delete(message, timeout = 5000) {
        return new Promise((resolve, reject) => {
            if (!message) {
                console.log(prefix(23, "Utils.delete", module.exports.getLine() || "Unknown"), `Invalid input for message:`, message);
                return reject("Invalid input for message");
            }

            else if (typeof timeout !== 'number') {
                console.log(prefix(24, "Utils.delete", module.exports.getLine() || "Unknown"), `Invalid input for timeout:`, timeout);
                return reject("Invalid input for timeout");
            }

            setTimeout(() => {
                message.delete().catch(() => { });
                return resolve();
            }, timeout);
        });
    },
    getRolePrefix(member) {
        let rolesWithPrefix = config.RolePrefixes && typeof config.RolePrefixes == "object" ? Object.keys(config.RolePrefixes) : [];
        let roles = member.roles.cache.filter(r => rolesWithPrefix.includes(r.name) || rolesWithPrefix.includes(r.id));
        let topRole = roles.size ? roles.sort((a, b) => b.rawPosition - a.rawPosition).first() : undefined;

        if (topRole) {
            let configSetting = rolesWithPrefix.find(r => r == topRole.name || r == topRole.id);

            if (member.displayName.includes(config.RolePrefixes[configSetting].replace("{user-id}", "").replace("{user-username}", "").replace("{user-tag}").trim())) return member.displayName;
            
            return config.RolePrefixes[configSetting]
                .replace("{user-id}", member.id)
                .replace("{user-username}", member.user.username)
                .replace("{user-tag}", member.user.tag);
        }

        return member.displayName;
    },
    createAutomaticComponents(buttons) {
        let ActionRow = module.exports.Discord.MessageActionRow;
        if (buttons.length >= 4) {
            if (buttons.length <= 10) {
                return [
                    (new ActionRow()).addComponents(buttons.slice(0, Math.ceil(buttons.length / 2))),
                    (new ActionRow()).addComponents(buttons.slice(Math.ceil(buttons.length / 2)))
                ];
            } else {
                console.log(prefix(25, "Utils.createAutomaticComponents", module.exports.getLine() || "Unknown"), "More than 10 buttons provided. Disperse buttons manually");
                return undefined;
            }
        } else {
            return [(new ActionRow()).addComponents(buttons)];
        }
    }
};
