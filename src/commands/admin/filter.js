const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'filter',
    run: async (bot, messageOrInteraction, args, { slashCommand, prefixUsed, commandUsed, type, reply }) => {
        return new Promise(async resolve => {
            let filter = await Utils.variables.db.get.getFilter();

            const subcommand = slashCommand?.subcommand;

            const action = type == "interaction" ? subcommand : args[0]?.toLowerCase();

            if (!action || action == 'help' || !["add", "remove", "list"].includes(action)) {
                reply(Embed({
                    author: {
                        text: lang.FilterSystem.FilterSystem
                    },
                    title: lang.FilterSystem.Commands.Filter.Help.Title,
                    description: lang.FilterSystem.Commands.Filter.Help.Description,
                    fields: [
                        { name: lang.FilterSystem.Commands.Filter.Help.Fields[0].Name, value: lang.FilterSystem.Commands.Filter.Help.Fields[0].Value, inline: true },
                        { name: lang.FilterSystem.Commands.Filter.Help.Fields[1].Name, value: lang.FilterSystem.Commands.Filter.Help.Fields[1].Value, inline: true },
                        { name: lang.FilterSystem.Commands.Filter.Help.Fields[2].Name, value: lang.FilterSystem.Commands.Filter.Help.Fields[2].Value, inline: true }
                    ]
                }));

                return resolve();
            }
    
            else if (action == 'list') {
                filter = filter.map(word => `\`${word}\``);
    
                let maxPages = Math.ceil(filter.length / 100);

                const pageNumber = type == "interaction" ? slashCommand.arguments.list.page : args[1];

                let page = +pageNumber || 1;
    
                if (page > maxPages || page < 1) page = 1;
    
                reply(Embed({
                    author: {
                        text: lang.FilterSystem.FilterSystem
                    },
                    title: lang.FilterSystem.Commands.Filter.List.Title.replace(/{current-page}/g, page).replace(/{max-pages}/g, maxPages),
                    timestamp: new Date(),
                    description: lang.FilterSystem.Commands.Filter.List.Description.replace(/{words}/g, (filter.length == 0 ? lang.Global.None : filter.slice((page - 1) * 100, 100 * page).join(" | ")))
                }));

                return resolve(true);
            }
    
            else if (action == 'add') {
                const content = type == "interaction" ? slashCommand.arguments.add.word : messageOrInteraction.content.replace(prefixUsed + commandUsed + " add", "");
                if (!content) {
                    reply(Embed({ preset: 'invalidargs', usage: 'filter add <word|words separated by comma>' }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }

                let words = content.split(",").map(w => w.trim());
                words = words.filter(word => !filter.includes(word));
    
                if (!words.length) {
                    if (content.split(",").length == 1) reply(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Add.WordAlreadyInFilter[0] }), { ephemeral: true });
                    else reply(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Add.WordAlreadyInFilter[1] }), { ephemeral: true });
                    
                    return resolve();
                }
    
                await Utils.variables.db.update.filter.addWord(words);
    
                if (words.length == 1) {
                    reply(Embed({
                        author: {
                            text: lang.FilterSystem.FilterSystem
                        },
                        title: lang.FilterSystem.Commands.Filter.Add.Title,
                        description: lang.FilterSystem.Commands.Filter.Add.Description[0].replace(/{word}/g, words[0]),
                        timestamp: new Date()
                    }));

                    return resolve(true);
                }
                else {
                    reply(Embed({
                        author: {
                            text: lang.FilterSystem.FilterSystem
                        },
                        title: lang.FilterSystem.Commands.Filter.Add.Title,
                        description: lang.FilterSystem.Commands.Filter.Add.Description[1].replace(/{words}/g, (() => {
                            let w = words.map(w => `\`${w}\``).join(", ");
                            if (w.length > 1630) {
                                w = w.substring(0, 1630);
                                w = w.substring(0, w.lastIndexOf(",")) + ", and more";
                            }
        
                            return w.trim();
                        })()),
                        timestamp: new Date()
                    }));

                    return resolve(true);
                }
            }
    
            else if (action == "remove") {
                const content = type == "interaction" ? slashCommand.arguments.remove.word : messageOrInteraction.content.replace(prefixUsed + commandUsed + " remove", "");
                if (!content) {
                    reply(Embed({ preset: 'invalidargs', usage: 'filter remove <word|words separated by comma>' }, { prefixUsed }), { ephemeral: true });

                    return resolve();
                }
    
                let words = content.split(",").map(w => w.trim());
                
                words = words.filter(word => filter.includes(word));
    
                if (!words.length) {
                    if (content.split(",").length == 1) reply(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Remove.InvalidWord[0] }), { ephemeral: true });
                    else reply(Embed({ preset: 'error', description: lang.FilterSystem.Commands.Filter.Remove.InvalidWord[1] }), { ephemeral: true });

                    return resolve();
                }
    
                await Utils.variables.db.update.filter.removeWord(words);
    
                if (words.length == 1) reply(Embed({
                    author: {
                        text: lang.FilterSystem.FilterSystem
                    },
                    title: lang.FilterSystem.Commands.Filter.Remove.Title,
                    description: lang.FilterSystem.Commands.Filter.Remove.Description[0].replace(/{word}/g, words[0]),
                    timestamp: new Date()
                }));
                else reply(Embed({
                    author: {
                        text: lang.FilterSystem.FilterSystem
                    },
                    title: lang.FilterSystem.Commands.Filter.Remove.Title,
                    description: lang.FilterSystem.Commands.Filter.Remove.Description[1].replace(/{words}/g, (() => {
                        let w = words.map(w => `\`${w}\``).join(", ");
                        if (w.length > 1630) {
                            w = w.substring(0, 1630);
                            w = w.substring(0, w.lastIndexOf(",")) + ", and more";
                        }
    
                        return w.trim();
                    })()),
                    timestamp: new Date()
                }));

                return resolve(true);
            }
        });
    },
    description: "Add, delete, or view the list of filtered words",
    usage: 'filter <add/remove/list> <word|words separated by comma|page number>',
    aliases: [],
    arguments: [
        {
            name: "add",
            description: "Add a word to the filter",
            options: [
                {
                    name: "word",
                    description: "The word(s) to add (separate words with a comma)",
                    required: true,
                    type: "STRING"
                }
            ],
            type: "SUB_COMMAND"
        },
        {
            name: "remove",
            description: "Remove a word from the filter",
            options: [
                {
                    name: "word",
                    description: "The word(s) to remove (separate words with a comma)",
                    required: true,
                    type: "STRING"
                }
            ],
            type: "SUB_COMMAND"
        },
        {
            name: "list",
            description: "List words in the filter",
            options: [
                {
                    name: "page",
                    description: "The page number to view",
                    required: false,
                    type: "NUMBER",
                    minValue: 1
                }
            ],
            type: "SUB_COMMAND"
        },
        {
            name: "help",
            description: "View the help menu",
            type: "SUB_COMMAND"
        }
    ]
};
