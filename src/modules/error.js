/* eslint-disable no-undef */
const fs = require('fs');
const consoleIgnore = [
    "DiscordAPIError: Unknown Message",
    "DiscordAPIError: Unknown Channel",
    "Response: Internal Server Error",
    "DiscordAPIError: Interaction has already been acknowledged.",
    "DiscordAPIError: Unknown interaction",
    "AbortError: The user aborted a request."
];
const chalk = require("chalk");
const variables = require('./variables');

module.exports = (message, extraInfo = "", predefinedLine, logToConsole = true, rawError) => {
    const err = new Error();
    const location = err.stack.split("\n")[2].split(" ");
    const line = predefinedLine ? predefinedLine : location[location.length - 1].split(/\/|\\/).pop().replace(/\)|\(/g, '');

    if (!message) return;
    if (typeof message !== "string") message = message.toString();

    const longestLine = message.split("\n").map(m => m.length).sort((a, b) => b - a)[0];
    const dashes = "-".repeat(longestLine);
    const consoleMessage = `[CALLER: ${line} | DATE: ${new Date().toLocaleString()}]\n${dashes}\n${message}\n${dashes}`;

    if (!consoleIgnore.includes(message)) {
        if (process.argv.slice(2).includes("--show-errors")) {
            console.log('\x1b[91m%s\x1b[0m', consoleMessage);
        } else {
            let addonsLocation = __dirname.slice(0, -11) + "addons\\";

            if (extraInfo.includes(addonsLocation) || line.includes(addonsLocation)) {
                let addonName = extraInfo.split("\n").find(line => line.includes(addonsLocation)) || line.split("\n").find(line => line.includes(addonsLocation));
                addonName = addonName.substring(addonName.lastIndexOf("\\") + 1, addonName.lastIndexOf("."));

                if (logToConsole) console.log(chalk.hex("#ff5e5e").bold("[ERROR] ") + "An unexpected error has occurred from the " + chalk.bold(addonName) + " addon. " + chalk.bold("Please contact the addon developer"));

                if (variables.addon_errors)
                    variables.addon_errors.push({
                        addon: addonName,
                        error: message
                    });
            } else if (logToConsole) console.log(chalk.hex("#ff5e5e").bold("[ERROR] ") + "An unexpected error has occurred. Please contact the Corebot support team. " + chalk.bold("https://corebot.dev/support"));
        }
    }

    if (message.includes("DiscordAPIError") && rawError) {
        extraInfo = `${rawError.message}\n${rawError.method} ${rawError.path} (code: ${rawError.code})`;
    }

    const fileMessage = `[CALLER: ${line} | MS: ${Date.now()} | DATE: ${new Date().toLocaleString()}]\n${dashes}\n${message}${extraInfo ? "\nEXTRA INFO:\n" + extraInfo : ""}\n${dashes}`;
    fs.appendFile("./data/errors.txt", fileMessage + "\n", (err) => {
        if (err) console.log(err);
    });

    if (variables.errors) {
        variables.errors.push({
            occuredAt: Date.now(),
            error: typeof message == 'string' ? message : message.toString(),
            caller: line
        });
    }

    return;
};
