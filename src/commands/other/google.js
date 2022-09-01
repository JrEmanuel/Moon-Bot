const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const lang = Utils.variables.lang;

module.exports = {
    name: 'google',
    run: async (bot, messageOrInteraction, args, { prefixUsed, reply }) => {
        return new Promise(async resolve => {
            if (args.length == 0) {
                reply(Embed({ 
                    preset: 'invalidargs', 
                    usage: module.exports.usage 
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }

            /*
                The following google function is a modified version of the NPM package "google-search-results"
            */

            function google(search, fn) {
                let request = require('request');
                let cheerio = require('cheerio');
                let Entities = require('html-entities');

                function dec(text) {
                    return Entities.decode(text);
                }

                let options = {
                    url: 'https://google.com/search?q=' + encodeURIComponent(search),
                    headers: { "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36" },
                    method: 'GET'
                };

                request(options, function (response, error, responseBody) {
                    try {
                        let c = 'yuRUbf';
                        let a = 'IsZvec';
                        //let j = 'aCOpRe';
                        let $ = cheerio.load(responseBody);
                        let test = $(`.${c} h3`);
                        let testing = $(`.${c}`);
                        let tost = $(`.${a}`);

                        let test2 = new Array(test.length).fill(0).map((v, i) => ({ title: dec(test.eq(i).html().split('<span>')[0].split('</span>')[0]), url: dec(testing.eq(i).html().split('<a href="')[1].split('"')[0]), description: dec(tost.eq(i).html().split('<span>')[1].split('</span>')[0].replace(/<em>|<\/em>/gi, "")) }));
                        fn(undefined, test2);
                    } catch (e) {
                        fn(e, []);
                    }
                });
            }
            
            google(args.join(" "), function (error, res) {
                if (error || !res.length) reply(Embed({
                    title: lang.Other.OtherCommands.Google.Title,
                    fields: [
                        {
                            name: lang.Other.OtherCommands.Google.Field.Name.replace(/{search}/g, args.join(" ")),
                            value: lang.Other.OtherCommands.Google.Field.Value.replace(/{link}/g, `https://google.com/search?q=${encodeURIComponent(args.join(' '))}`)
                        }
                    ]
                }));
                else reply(Embed({
                    title: lang.Other.OtherCommands.Google.Title,
                    description: lang.Other.OtherCommands.Google.Description.replace(/{search}/g, args.join(" ")).replace(/{results}/g, res.slice(0, 11).map((link, index) => {
                        return `**${index + 1}.** [${link.title}](${link.url})`;
                    }).join("\n")),
                    timestamp: new Date()
                }));

                return resolve(true);
            });
        });
    },
    description: "Search for something on google",
    usage: "google <query>",
    aliases: [
        "googlesearch",
        "searchgoogle"
    ],
    arguments: [
        {
            name: "query",
            description: "The term to search for",
            required: true,
            type: "STRING"
        }
    ]
};
