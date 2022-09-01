const Utils = require("../../modules/utils.js");
const Embed = Utils.Embed;
const { lang, config } = Utils.variables;

module.exports = {
    name: "buy",
    run: async (bot, messageOrInteraction, args, { prefixUsed, type, member, guild, reply }) => {
        return new Promise(async resolve => {
            if (config.Coins.Shop.Enabled == true) {
                const items = config.Coins.Shop.Items;
    
                if (args.length == 0) {
                    reply(Embed({ 
                        preset: "invalidargs", 
                        usage: module.exports.usage
                    }, { prefixUsed }), { ephemeral: true });
                    return resolve();
                }
    
                let item = items.find(item => item.Name.toLowerCase() == args.join(" ").toLowerCase());
    
                if (!item) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Buy.Errors.InvalidItem.replace(/{validitems}/g, items.map(i => i.Name).join(', ')) 
                    }), { ephemeral: true });
                    return resolve();
                }
    
                const userCoins = await Utils.variables.db.get.getCoins(member);
                const price = item.Price;
    
                const item_requirements = item.Required || {};
                const required = {
                    level: item_requirements.Level,
                    role: item_requirements.Role
                };
    
                const role = Utils.findRole(item.Role, guild);
    
                if (!role) {
                    reply(Embed({ 
                        preset: "console" 
                    }), { ephemeral: true });
                    return resolve();
                }
    
                if (required.level) {
                    const { level } = await Utils.variables.db.get.getExperience(member);
    
                    if (level < required.level) {
                        reply(Embed({
                            preset: "error", 
                            description: lang.CoinModule.Commands.Buy.Errors.LevelRequired
                                .replace(/{required_level}/g, required.level)
                                .replace(/{level}/g, level)
                        }), { ephemeral: true });
                        return resolve();
                    }
                }
                if (required.role) {
                    const role = Utils.findRole(required.role, guild);
    
                    if (role && !member.roles.cache.has(role.id)) {
                        reply(Embed({
                            preset: "error", 
                            description: lang.CoinModule.Commands.Buy.Errors.RoleRequired
                                .replace(/{role}/g, role.name)
                        }), { ephemeral: true });
                        return resolve();
                    }
                }
    
                if (userCoins < price) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Errors.NotEnoughCoins
                    }), { ephemeral: true });
                    return resolve();
                }
    
                if (member.roles.cache.has(role.id)) {
                    reply(Embed({ 
                        preset: "error", 
                        description: lang.CoinModule.Commands.Buy.Errors.AlreadyPurchased
                    }), { ephemeral: true });
                    return resolve();
                }

                Utils.variables.db.update.coins.updateCoins(member, price, "remove");
                member.roles.add(role.id);
                reply(Embed({ 
                    title: lang.CoinModule.Commands.Buy.Embeds.ItemPurchased.Title, 
                    description: lang.CoinModule.Commands.Buy.Embeds.ItemPurchased.Description.replace(/{item}/g, item.Name).replace(/{price}/g, item.Price.toLocaleString()), 
                    color: config.Success_Color 
                }));

                return resolve(true);
            } else {
                if (type == "interaction") reply(Embed({
                    title: lang.CoinModule.Commands.Buy.ShopDisabled
                }), { ephemeral: true });

                return resolve(true);
            }
        });
    },
    description: "Purchase an item from the shop",
    usage: "buy <item>",
    aliases: [],
    arguments: [
        {
            name: "item",
            description: "The item you want to purchase",
            required: true,
            type: "STRING"
        }
    ]
};
