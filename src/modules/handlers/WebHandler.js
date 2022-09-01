const Utils = require("../utils");
const { config } = Utils.variables;
const express = require("express");
const chalk = require("chalk");

const DEBUG_MODE = Utils.getStartupParameters().includes("debug");
const prefix = chalk.white(chalk.bold("[WEB HANDLER]"));

const debug = message => {
    if (DEBUG_MODE) console.log(Utils.debugPrefix + prefix, message);
};

const subsites = [];
const server = express();

server.get("/", (req, res) => {
    res.status(404).send("Not Found");
});

let starting = false;

const start = () => {
    if(starting) return;
    starting = true;
    debug("Starting web server...");

    const port = config.Other.Website.Port == "{SERVER-PORT}" ? process.env.SERVER_PORT : config.Other.Website.Port;
    const ip = config.Other.Website.Port == "{SERVER-IP}" ? process.env.SERVER_IP : config.Other.Website.IP;
    
    if(!port) {
        if(config.Other.Website.Port == "{SERVER-PORT}") console.log(Utils.errorPrefix + prefix, "Unable to start webserver as your server port is set to {SERVER-PORT}, which is not supported on this machine");
        else console.log(Utils.errorPrefix + "Unable to start webserver as your server port is not set.");
    }
    else if(!ip) {
        if (config.Other.Website.IP == "{SERVER-IP}") console.log(Utils.errorPrefix + prefix, "Unable to start webserver as your server IP is set to {SERVER-IP}, which is not supported on this machine");
        else console.log(Utils.errorPrefix + "Unable to start webserver as your server IP is not set.");
    }
    else {
        if(isNaN(+port)) {
            console.log(Utils.warningPrefix + prefix, "Unable to start webserver as your server port is not a number.");
        }
        
        server.listen(+port, ip, (err) => {
            if (err) throw err;
            else console.log(Utils.infoPrefix + prefix, `Webserver started on http://${ip}:${+port}`);

            starting = false;
        });
    }
}

const checkForStart = () => {
    if (subsites.length > 0) start();
}

module.exports = (name, router) => {
    if (!(typeof name == "string")) throw new Error("WebHandler requires a name string as first argument.");
    if (!router) throw new Error("WebHandler requires a router object as second argument.");
    if(!server) throw new Error("Server has not been set up yet.");
    
    const path = name.startsWith("/") ? name : `/${name}`;
    server.use(path, router);

    subsites.push(name);
    checkForStart();

    debug(`The ${name} subsite has been added.`)

    return server;
}
