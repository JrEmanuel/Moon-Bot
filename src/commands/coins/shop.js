const Utils = require("../../modules/utils.js");
const { Embed, variables: { config, embeds, lang } } = Utils;

module.exports = {
    name: "shop",
    run: async (bot, messageOrInteraction, args, { type, reply }) => {
        return new Promise(async resolve => {
            if (!config.Coins.Shop.Enabled) {
                if (type == "interaction") reply(Embed({
                    title: lang.CoinModule.Commands.Buy.ShopDisabled
                }), { ephemeral: true });
                return resolve(true);
            }

            const items = config.Coins.Shop.Items;
            let page = +args[0] || 1;
            if (page < 1) page = 1;

            if (page > Math.ceil(items.length / 5)) page = 1;

            const fields = items
                .slice((page - 1) * 5, 5 * page)
                .map(item => {

                    let replace = text => {
                        return text
                            .replace("{item-display}", item.Display)
                            .replace("{item-name}", item.Name)
                            .replace("{item-role}", item.Role)
                            .replace("{item-price}", item.Price)
                            .replace("{item-description}", item.Description);
                    };

                    return { name: replace(embeds.Embeds.Shop.Format[0]), value: replace(embeds.Embeds.Shop.Format[1]) };
                });

            reply(Utils.setupMessage({
                configPath: embeds.Embeds.Shop,
                fields,
                variables: [
                    { searchFor: "{current-page}", replaceWith: page },
                    { searchFor: "{max-pages}", replaceWith: Math.ceil(items.length / 5) }
                ]
            }));

            return resolve(true);
        });
    },
    description: "View the Discord server's shop",
    usage: "shop [page number]",
    aliases: [
        "store"
    ],
    arguments: [
        {
            name: "page",
            description: "The page number to view",
            required: false,
            type: "INTEGER",
            minValue: 1
        }
    ]
};
