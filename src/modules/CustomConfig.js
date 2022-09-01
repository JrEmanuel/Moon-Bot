const fs = require('fs');
const YAML = require('yaml');

function fixFormat(text) {
    return text
        .replace(/("|')?~(\d+)?("|')?:\s("|')?.+("|')?/g, match => "# " + match.replace(/("|')?~(\d+)?("|')?:\s/g, '').replace(/("|')/g, '')) // Comments type 1
        .replace(/("|')?~(c(\d+|))?("|')?:\s("|')?.+(\n {2}.+|)("|')/g, match => {
            let comment = match.replace(/("|')?~(c(\d+|))?("|')?:\s/g, '');
            return (match.includes("#") ? "" : "#") + comment.substring(comment.startsWith("\"") || comment.startsWith("'") ? 1 : 0, comment.endsWith("\"") || comment.endsWith("'") ? comment.length - 1 : undefined).replace(/.+\n\s+/g, m => m.replace(/\n\s+/g, " ").replace(/\\"/g, "\""));
        }) // Comments type 2
        .replace(/("|')?~(l(\d+|))?("|')?:\s("|')?.+("|')?/g, ""); // New line
}
module.exports = class Config {
    constructor(path, defaultcontent, options = {}) {
        this.path = path;

        const createConfig = () => {
            fs.writeFileSync(path, fixFormat(YAML.stringify(defaultcontent)), (err) => {
                if (err) return err;
            });
        };

        // If the config doesn't exist, create it
        if (!fs.existsSync(path)) {
            // If there isn't an addons folder in the configs folder, create it
            if (!fs.existsSync('./configs/addons')) {
                fs.mkdirSync('./configs/addons', (err) => { if (err) console.log(err); });

                // Create the config
                createConfig();
                // Create the config
            } else createConfig();

            // Parse the config and return it
            return YAML.parse(fs.readFileSync(path, 'utf-8'), { prettyErrors: true });
        } else {
            // If development mode is set, reset the config
            if (options.development) {
                createConfig();

                return YAML.parse(fs.readFileSync(path, 'utf-8'), { prettyErrors: true });
            }
            // If development mode is not set, return the config
            else return YAML.parse(fs.readFileSync(path, 'utf-8'), { prettyErrors: true });
        }
    }
};
