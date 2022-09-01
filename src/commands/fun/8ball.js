const Utils = require('../../modules/utils');
const Embed = Utils.Embed;
const lang = Utils.variables.lang;
module.exports = {
    name: "8ball",
    run: async (bot, messageOrInteraction, args, { prefixUsed, reply }) => {
        return new Promise(async resolve => {
            if (args.length < 1) {
                reply(Embed({
                    preset: "invalidargs",
                    usage: module.exports.usage
                }, { prefixUsed }), { ephemeral: true });

                return resolve();
            }
    
            const responses = lang.FunModule.Commands["8Ball"].Answers;
            const x = ~~(Math.random() * responses.length);
    
            reply(Embed({
                title: lang.FunModule.Commands["8Ball"].Title,
                fields: [
                    {
                        name: lang.FunModule.Commands["8Ball"].Fields[0],
                        value: args.join(" ")
                    },
                    {
                        name: lang.FunModule.Commands["8Ball"].Fields[1],
                        value: responses[x]
                    }
                ]
            }));

            return resolve(true);
        });
    },
    description: "Ask the magical 8 ball a question and get an answer",
    usage: "8ball <question>",
    aliases: [],
    arguments: [
        {
            name: "question",
            description: "The question you want to ask the 8 ball",
            required: true,
            type: "STRING"
        }
    ]
};
