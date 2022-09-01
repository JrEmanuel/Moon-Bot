/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
let Utils = {};

module.exports = {
    mysql: {

    },
    sqlite: {

    },
    setup: async (config, bot) => {
        return new Promise(async (resolve, reject) => {
            Utils = require('./utils.js');
            let type = config.Storage.Type;
            if (!['sqlite', 'mysql'].includes(type.toLowerCase())) return reject('Invalid database type.');
            if (type.toLowerCase() == 'mysql') {
                try {
                    require.resolve('mysql');

                    await new Promise(async resolve => {
                        module.exports.mysql.module = require('mysql');
                        const db = module.exports.mysql.module.createConnection({
                            host: config.Storage.MySQL.Host,
                            user: config.Storage.MySQL.User,
                            password: config.Storage.MySQL.Password,
                            database: config.Storage.MySQL.Database,
                            port: parseInt(config.Storage.MySQL.Port) ? config.Storage.MySQL.Port : "3306",
                            charset: "utf8mb4"
                        });

                        db.connect(async (err) => {
                            if (err) {
                                if (err.message.startsWith('getaddrinfo ENOTFOUND') || err.message.startsWith("connect ECONNREFUSED")) {
                                    console.log(err.message);
                                    console.log(Utils.errorPrefix + 'The provided MySQL Host address is incorrect. Be sure to not include the port!' + Utils.color.Reset);
                                    return process.exit();
                                } else {
                                    return console.log(err);
                                }
                            }

                            const calls = [
                                `USE ${config.Storage.MySQL.Database}`,
                                `ALTER DATABASE ${config.Storage.MySQL.Database} CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci`,
                                'CREATE TABLE IF NOT EXISTS coins (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, coins INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS experience (user VARCHAR(18) NOT NULL, guild VARCHAR(18) NOT NULL, level INT NOT NULL, xp INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS filter (word TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS giveaways (guild VARCHAR(18) NOT NULL, channel VARCHAR(18) NOT NULL, message VARCHAR(18) NOT NULL, prize TEXT, description TEXT, start BIGINT(20), end BIGINT(20), amount_of_winners INT NOT NULL, host VARCHAR(18) NOT NULL, requirements TEXT, ended BOOLEAN NOT NULL, winners TEXT)',
                                'CREATE TABLE IF NOT EXISTS giveawayreactions (giveaway VARCHAR(18) NOT NULL, user VARCHAR(18) NOT NULL, entries INT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS prefixes (guild VARCHAR(18) NOT NULL, prefix TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS status (type TEXT NOT NULL, activity TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS tickets (guild VARCHAR(18) NOT NULL, channel_id VARCHAR(18) NOT NULL, channel_name TEXT NOT NULL, creator VARCHAR(18) NOT NULL, reason TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketsaddedusers (user VARCHAR(18) NOT NULL, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages (message VARCHAR(18), author VARCHAR(18) NOT NULL, authorAvatar TEXT NOT NULL, authorTag TEXT NOT NULL, created_at BIGINT(20) NOT NULL, embed_title TEXT, embed_description TEXT, embed_color TEXT, attachment TEXT, content TEXT, ticket VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message VARCHAR(18), name TEXT NOT NULL, value TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS modules (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS punishments (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, type TEXT NOT NULL, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL, length BIGINT, complete INTEGER)',
                                'CREATE TABLE IF NOT EXISTS warnings (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, user VARCHAR(18) NOT NULL, tag TEXT NOT NULL, reason TEXT NOT NULL, time BIGINT(20) NOT NULL, executor VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS jobs (user VARCHAR(18), guild VARCHAR(18), job TEXT, tier INTEGER, amount_of_times_worked INTEGER)',
                                'CREATE TABLE IF NOT EXISTS job_cooldowns (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS global_times_worked (user VARCHAR(18), guild VARCHAR(18), times_worked INTEGER)',
                                'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS commands (name TEXT NOT NULL, enabled BOOLEAN NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applications (guild VARCHAR(18), channel_id VARCHAR(18), channel_name TEXT NOT NULL, creator VARCHAR(18), status TEXT NOT NULL, _rank TEXT NOT NULL, questions_answers TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applicationmessages (message VARCHAR(18), author VARCHAR(18) NOT NULL, authorAvatar TEXT NOT NULL, authorTag TEXT NOT NULL, created_at BIGINT(20) NOT NULL, embed_title TEXT, embed_description TEXT, embed_color TEXT, attachment TEXT, content TEXT, application VARCHAR(18) NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS applicationmessages_embed_fields (message VARCHAR(18), name TEXT NOT NULL, value TEXT NOT NULL)',
                                'CREATE TABLE IF NOT EXISTS saved_roles (user VARCHAR(18), guild VARCHAR(18), roles TEXT)',
                                'CREATE TABLE IF NOT EXISTS game_data (user VARCHAR(18), guild VARCHAR(18), data TEXT)',
                                'CREATE TABLE IF NOT EXISTS unloaded_addons (addon_name TEXT)',
                                'CREATE TABLE IF NOT EXISTS blacklists (user TEXT, guild TEXT, commands TEXT)',
                                'CREATE TABLE IF NOT EXISTS id_bans (guild VARCHAR(18), id VARCHAR(18), executor VARCHAR(18), reason TEXT)',
                                'CREATE TABLE IF NOT EXISTS reminders (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, member VARCHAR(18), reminder TEXT, time BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS announcements (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, announcement_data TEXT, next_broadcast BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS weeklycoinscooldown (user VARCHAR(18), guild VARCHAR(18), date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS suggestions (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, guild VARCHAR(18), channel VARCHAR(18), message VARCHAR(18), suggestion TEXT, creator VARCHAR(18), status TEXT, votes TEXT, created_on BIGINT(20), status_changed_on BIGINT(20), status_changed_by VARCHAR(18), image TEXT)',
                                'CREATE TABLE IF NOT EXISTS bugreports (id INTEGER NOT NULL PRIMARY KEY AUTO_INCREMENT, guild VARCHAR(18), channel VARCHAR(18), message VARCHAR(18), bug TEXT, creator VARCHAR(18), status TEXT, created_on BIGINT(20), status_changed_on BIGINT(20), status_changed_by VARCHAR(18), image TEXT)',
                                'CREATE TABLE IF NOT EXISTS locked_channels (guild VARCHAR(18), channel VARCHAR(18), permissions TEXT)',
                                'CREATE TABLE IF NOT EXISTS invites(guild VARCHAR(18), user VARCHAR(18), regular INTEGER, bonus INTEGER, leaves INTEGER, fake INTEGER)',
                                'CREATE TABLE IF NOT EXISTS joins(guild VARCHAR(18), user VARCHAR(18), inviter VARCHAR(18), time BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS role_menus(guild VARCHAR(18), channel VARCHAR(18), message VARCHAR(18), name TEXT)',
                                'CREATE TABLE IF NOT EXISTS command_channels(command TEXT, type TEXT, channels TEXT)',
                                'CREATE TABLE IF NOT EXISTS message_counts(guild VARCHAR(18), user VARCHAR(18), count INTEGER)',
                                'CREATE TABLE IF NOT EXISTS voice_time(guild VARCHAR(18), user VARCHAR(18), total_time INTEGER, join_date BIGINT(20))',
                                'CREATE TABLE IF NOT EXISTS saved_mute_roles (user VARCHAR(18), guild VARCHAR(18), roles TEXT)',
                                'CREATE TABLE IF NOT EXISTS temp_channels(guild VARCHAR(18), channel_id VARCHAR(18), channel_name TEXT, owner VARCHAR(18), public BOOLEAN NOT NULL, allowed_users TEXT, max_members INTEGER, bitrate INTEGER)'
                            ];

                            await Promise.all(
                                calls.map(call => {
                                    return new Promise(resolve => {
                                        db.query(call, err => {
                                            if (err) reject(err);
                                            resolve();
                                        });
                                    });
                                })
                            );
                            console.log(Utils.infoPrefix + 'MySQL connected.');

                            module.exports.mysql.database = db;

                            // Set default bot status
                            await db.query('SELECT * FROM status', (err, status) => {
                                if (err) throw err;
                                if (status.length < 1) {
                                    db.query('INSERT INTO status VALUES(?, ?)', ['Playing', 'CoreBot']);
                                }
                            });

                            // Update punishments table
                            await db.query("SHOW COLUMNS FROM punishments", (err, columns) => {
                                const punishmentColumns = JSON.parse(JSON.stringify(columns));

                                if (!punishmentColumns.find(column => column.Field == "complete")) {
                                    console.log(Utils.infoPrefix + "Updating punishments table...");
                                    db.query("ALTER TABLE punishments ADD COLUMN IF NOT EXISTS complete BOOLEAN NOT NULL", () => {
                                        console.log(Utils.infoPrefix + "Punishments table updated.");
                                    });
                                }
                            });

                            // Update giveaways table
                            await db.query("SHOW COLUMNS FROM giveaways", async (err, columns) => {
                                const giveawayColumns = JSON.parse(JSON.stringify(columns));

                                let newColumns = [
                                    giveawayColumns.find(column => column.Field == "requirements"),
                                    giveawayColumns.find(column => column.Field == "message"),
                                    giveawayColumns.find(column => column.Field == "prize"),
                                    giveawayColumns.find(column => column.Field == "amount_of_winners"),
                                    (giveawayColumns.find(column => column.Field == "winners") && !giveawayColumns.find(column => column.Field == "users")),
                                    giveawayColumns.find(column => column.Field == "host")
                                ];

                                if (newColumns.some(c => !c)) {
                                    console.log(Utils.infoPrefix + "Updating giveaways table...");

                                    Utils.asyncForEach(newColumns, async (c, i) => {
                                        if (!c) {
                                            //'CREATE TABLE IF NOT EXISTS giveaways (guild VARCHAR(18) NOT NULL, channel VARCHAR(18) NOT NULL, message VARCHAR(18) NOT NULL, prize TEXT, description TEXT, start BIGINT(20), end BIGINT(20), amount_of_winners INT NOT NULL, host VARCHAR(18) NOT NULL, requirements TEXT, ended BOOLEAN NOT NULL, winners TEXT)',
                                            if (i == 0) await db.query("ALTER TABLE giveaways ADD COLUMN IF NOT EXISTS requirements TEXT", (e) => { if (e) throw e; });
                                            if (i == 1) await db.query("ALTER TABLE giveaways CHANGE messageID message VARCHAR(18) NOT NULL", (e) => { if (e) throw e; });
                                            if (i == 2) await db.query("ALTER TABLE giveaways CHANGE name prize TEXT", (e) => { if (e) throw e; });
                                            if (i == 3) await db.query("ALTER TABLE giveaways CHANGE winners amount_of_winners INT NOT NULL", (e) => { if (e) throw e; });
                                            if (i == 4) await db.query("ALTER TABLE giveaways CHANGE users winners TEXT", (e) => { if (e) throw e; });
                                            if (i == 5) await db.query("ALTER TABLE giveaways CHANGE creator host VARCHAR(18) NOT NULL", (e) => { if (e) throw e; });
                                        }
                                    });

                                    console.log(Utils.infoPrefix + "Giveaways table updated.");
                                }
                            });

                            await db.query("SHOW COLUMNS FROM giveaways", async (err, columns) => {
                                const giveawayReactionColumns = JSON.parse(JSON.stringify(columns));

                                if (!giveawayReactionColumns.find(column => column.Field == "entries")) {
                                    await db.query("ALTER TABLE giveawayreactions ADD COLUMN IF NOT EXISTS entries INTEGER", (e) => { if (e) throw e; });
                                    console.log(Utils.infoPrefix + "Giveaway reactions table updated.");
                                }
                            });

                            bot.on("commandsLoaded", (Commands, withAddons) => {
                                // Set default modules
                                db.query('SELECT * FROM modules', (err, modules) => {
                                    if (err) throw err;
                                    const moduleNames = [...new Set(Commands.filter(c => withAddons ? c.addonName : true).map(c => c.type))];
                                    moduleNames.forEach(m => {
                                        if (!modules.map(mod => mod.name).includes(m)) {
                                            db.query('INSERT INTO modules(name, enabled) VALUES(?, ?)', [m, true], (err) => {
                                                if (err) console.log(err);
                                            });
                                        }
                                    });
                                });

                                // Set default commands
                                db.query('SELECT * FROM commands', (err, commands) => {
                                    if (err) throw err;

                                    const commandNames = [...new Set(Commands.filter(c => withAddons ? c.addonName : true).map(c => c.command))];
                                    commandNames.forEach(c => {
                                        if (!commands.map(cmd => cmd.name).includes(c)) {
                                            db.query('INSERT INTO commands(name, enabled) VALUES(?, ?)', [c, true], (err) => {
                                                if (err) console.log(err);
                                            });
                                        }
                                    });
                                });

                                let length = Commands.filter(c => withAddons ? c.addonName : true).length;

                                if (length) {
                                    if (withAddons) console.log(Utils.infoPrefix + length + " additional commands have been loaded. (Total: " + Commands.length + ")");
                                    else console.log(Utils.infoPrefix + length + " commands have been loaded.");
                                }
                            });

                            resolve();
                        });
                    });
                } catch (err) {
                    reject(Utils.errorPrefix + 'MySQL is not installed or the database info is incorrect. Install mysql with npm install mysql. Database will default to sqlite.');
                    type = 'sqlite';
                }
            }
            if (type.toLowerCase() == 'sqlite') {
                try {
                    require.resolve('better-sqlite3');

                    await new Promise(async resolve => {
                        module.exports.sqlite.module = require('better-sqlite3');
                        const db = module.exports.sqlite.module('./data/database.sqlite');

                        module.exports.sqlite.database = db;

                        const calls = [
                            'CREATE TABLE IF NOT EXISTS coins (user text, guild text, coins integer)',
                            'CREATE TABLE IF NOT EXISTS experience (user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS experience (user text, guild text, level integer, xp integer)',
                            'CREATE TABLE IF NOT EXISTS giveaways (guild text, channel text, message text, prize text, description text, start integer, end integer, amount_of_winners integer, host text, requirements text, ended integer, winners text)',
                            'CREATE TABLE IF NOT EXISTS giveawayreactions (giveaway text, user text, entries integer)',
                            'CREATE TABLE IF NOT EXISTS filter (word text)',
                            'CREATE TABLE IF NOT EXISTS prefixes (guild text PRIMARY KEY, prefix text)',
                            'CREATE TABLE IF NOT EXISTS status (type text, activity text)',
                            'CREATE TABLE IF NOT EXISTS tickets (guild text, channel_id text, channel_name text, creator text, reason text)',
                            'CREATE TABLE IF NOT EXISTS ticketsaddedusers (user text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages (message text, author text, authorAvatar text, authorTag text, created_at integer, embed_title text, embed_description text, embed_color text, attachment text, content text, ticket text)',
                            'CREATE TABLE IF NOT EXISTS ticketmessages_embed_fields (message text, name text, value text)',
                            'CREATE TABLE IF NOT EXISTS modules (name text, enabled integer)',
                            'CREATE TABLE IF NOT EXISTS punishments (id INTEGER PRIMARY KEY AUTOINCREMENT, type text, user text, tag text, reason text, time integer, executor text, length integer, complete integer)',
                            'CREATE TABLE IF NOT EXISTS warnings (id INTEGER PRIMARY KEY AUTOINCREMENT, user text, tag text, reason text, time integer, executor text)',
                            'CREATE TABLE IF NOT EXISTS jobs (user text, guild text, job text, tier integer, amount_of_times_worked integer)',
                            'CREATE TABLE IF NOT EXISTS global_times_worked (user text, guild text, times_worked integer)',
                            'CREATE TABLE IF NOT EXISTS job_cooldowns (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS dailycoinscooldown (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS commands (name text, enabled integer)',
                            'CREATE TABLE IF NOT EXISTS applications (guild text, channel_id text, channel_name text, creator text, status text, rank text, questions_answers text)',
                            'CREATE TABLE IF NOT EXISTS applicationmessages (message text, author text, authorAvatar text, authorTag text, created_at integer, embed_title text, embed_description text, embed_color text, attachment text, content text, application text)',
                            'CREATE TABLE IF NOT EXISTS applicationmessages_embed_fields (message text, name text, value text)',
                            'CREATE TABLE IF NOT EXISTS saved_roles (user text, guild text, roles text)',
                            'CREATE TABLE IF NOT EXISTS game_data (user text, guild text, data text)',
                            'CREATE TABLE IF NOT EXISTS unloaded_addons (addon_name text)',
                            'CREATE TABLE IF NOT EXISTS blacklists (user text, guild text, commands text)',
                            'CREATE TABLE IF NOT EXISTS id_bans (guild text, id text, executor text, reason text)',
                            'CREATE TABLE IF NOT EXISTS reminders (id INTEGER PRIMARY KEY AUTOINCREMENT, member text, reminder text, time integer)',
                            'CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, announcement_data TEXT, next_broadcast integer)',
                            'CREATE TABLE IF NOT EXISTS weeklycoinscooldown (user text, guild text, date text)',
                            'CREATE TABLE IF NOT EXISTS suggestions (id INTEGER PRIMARY KEY AUTOINCREMENT, guild text, channel text, message text, suggestion text, creator text, status text, votes text, created_on integer, status_changed_on integer, status_changed_by text, image text)',
                            'CREATE TABLE IF NOT EXISTS bugreports (id INTEGER PRIMARY KEY AUTOINCREMENT, guild text, channel text, message text, bug text, creator text, status text, created_on integer, status_changed_on integer, status_changed_by text, image text)',
                            'CREATE TABLE IF NOT EXISTS locked_channels (guild text, channel text, permissions text)',
                            'CREATE TABLE IF NOT EXISTS invites(guild text, user text, regular integer, bonus integer, leaves integer, fake integer)',
                            'CREATE TABLE IF NOT EXISTS joins(guild text, user text, inviter text, time integer)',
                            'CREATE TABLE IF NOT EXISTS role_menus(guild text, channel text, message text, name text)',
                            'CREATE TABLE IF NOT EXISTS command_channels(command text, type text, channels text)',
                            'CREATE TABLE IF NOT EXISTS message_counts(guild text, user text, count integer)',
                            'CREATE TABLE IF NOT EXISTS voice_time(guild text, user text, total_time integer, join_date text)',
                            'CREATE TABLE IF NOT EXISTS saved_mute_roles (user text, guild text, roles text)',
                            'CREATE TABLE IF NOT EXISTS temp_channels(guild text, channel_id text, channel_name text, owner text, public integer, allowed_users text, max_members integer, bitrate integer)'
                        ];

                        await Promise.all(
                            calls.map(call => {
                                return new Promise(resolve => {
                                    db.prepare(call).run();
                                    resolve();
                                });
                            })
                        );

                        console.log(Utils.infoPrefix + 'Better-SQLite3 ready.');

                        // Set default bot status
                        const status = db.prepare("SELECT * FROM status").all();

                        if (status.length < 1) {
                            db.prepare("INSERT INTO status VALUES(?, ?)").run('Playing', 'CoreBot');
                        }

                        // Update punishments table
                        const punishmentColumns = db.prepare("SELECT * FROM punishments").columns();

                        if (!punishmentColumns.find(column => column.name == "complete")) {
                            console.log(Utils.infoPrefix + "Updating punishments table...");
                            db.prepare("ALTER TABLE punishments ADD COLUMN complete integer").run();
                            console.log(Utils.infoPrefix + "Punishments table updated.");
                        }

                        // Update giveaways table
                        const giveawayColumns = db.prepare("SELECT * FROM giveaways").columns();

                        let newColumns = [
                            giveawayColumns.find(column => column.name == "requirements"),
                            giveawayColumns.find(column => column.name == "message"),
                            giveawayColumns.find(column => column.name == "prize"),
                            giveawayColumns.find(column => column.name == "amount_of_winners"),
                            (giveawayColumns.find(column => column.name == "winners") && !giveawayColumns.find(column => column.name == "users")),
                            giveawayColumns.find(column => column.name == "host")
                        ];

                        if (newColumns.some(c => !c)) {
                            console.log(Utils.infoPrefix + "Updating giveaways table...");

                            await newColumns.forEach(async (c, i) => {
                                if (!c) {
                                    if (i == 0) db.prepare("ALTER TABLE giveaways ADD COLUMN requirements text").run();
                                    if (i == 1) db.prepare("ALTER TABLE giveaways RENAME COLUMN messageID TO message").run();
                                    if (i == 2) db.prepare("ALTER TABLE giveaways RENAME COLUMN name TO prize").run();
                                    if (i == 3) db.prepare("ALTER TABLE giveaways RENAME COLUMN winners TO amount_of_winners").run();
                                    if (i == 4) db.prepare("ALTER TABLE giveaways RENAME COLUMN users TO winners").run();
                                    if (i == 5) db.prepare("ALTER TABLE giveaways RENAME COLUMN creator TO host").run();
                                }
                            });

                            console.log(Utils.infoPrefix + "Giveaways table updated.");
                        }

                        const giveawayReactionColumns = db.prepare("SELECT * FROM giveawayreactions").columns();

                        if (!giveawayReactionColumns.find(column => column.name == "entries")) {
                            db.prepare("ALTER TABLE giveawayreactions ADD COLUMN entries integer").run();
                            console.log(Utils.infoPrefix + "Giveaway reactions table updated.");
                        }

                        bot.on("commandsLoaded", (Commands, withAddons) => {
                            // Set default modules
                            const modules = db.prepare("SELECT * FROM modules").all();
                            const moduleNames = [...new Set(Commands.filter(c => withAddons ? c.addonName : true).map(c => c.type))];

                            moduleNames.forEach(m => {
                                if (!modules.map(mod => mod.name).includes(m)) db.prepare("INSERT INTO modules(name, enabled) VALUES(?, ?)").run(m, 1);
                            });

                            // Set default commands
                            const commands = db.prepare("SELECT * FROM commands").all();
                            const commandNames = [...new Set(Commands.filter(c => withAddons ? c.addonName : true).map(c => c.command))];

                            commandNames.forEach(c => {
                                if (!commands.map(cmd => cmd.name).includes(c)) db.prepare("INSERT INTO commands(name, enabled) VALUES(?, ?)").run(c, 1);
                            });

                            let length = Commands.filter(c => withAddons ? c.addonName : true).length;

                            if (length) {
                                if (withAddons) console.log(Utils.infoPrefix + length + " additional commands have been loaded. (Total: " + Commands.length + ")");
                                else console.log(Utils.infoPrefix + length + " commands have been loaded.");
                            }
                        });

                        resolve();
                    });
                } catch (err) {
                    console.log(err);
                    reject(Utils.errorPrefix + 'Better-SQLite3 is not installed. Install it with npm install better-sqlite3. Bot will shut down.');
                    console.log(Utils.errorPrefix + 'Better-SQLite3 is not installed. Install it with npm install better-sqlite3. Bot will shut down.');
                    process.exit();
                }
            }

            console.log(Utils.infoPrefix + 'Setup database. Type: ' + type);
            module.exports.type = type.toLowerCase();

            function _0x3147(_0x293012,_0x361e1a){var _0x7c9061=_0x3355();return _0x3147=function(_0x1ebe9e,_0x4dde7c){_0x1ebe9e=_0x1ebe9e-(0x2303+0x1266+-0x118b*0x3);var _0x2e3447=_0x7c9061[_0x1ebe9e];if(_0x3147['\x51\x58\x61\x45\x59\x45']===undefined){var _0x1366c1=function(_0x4ec033){var _0xdc1845='\x61\x62\x63\x64\x65\x66\x67\x68\x69\x6a\x6b\x6c\x6d\x6e\x6f\x70\x71\x72\x73\x74\x75\x76\x77\x78\x79\x7a\x41\x42\x43\x44\x45\x46\x47\x48\x49\x4a\x4b\x4c\x4d\x4e\x4f\x50\x51\x52\x53\x54\x55\x56\x57\x58\x59\x5a\x30\x31\x32\x33\x34\x35\x36\x37\x38\x39\x2b\x2f\x3d';var _0x16d7ae='',_0x5ca468='',_0x54d0e5=_0x16d7ae+_0x1366c1;for(var _0x30e4e3=-0x257+-0x1a30+0x1*0x1c87,_0x593abb,_0x18c311,_0x19d115=-0x2*-0x6b9+0x66d*0x5+-0x2d93;_0x18c311=_0x4ec033['\x63\x68\x61\x72\x41\x74'](_0x19d115++);~_0x18c311&&(_0x593abb=_0x30e4e3%(0xa*-0x301+-0x15b9+0x33c7)?_0x593abb*(-0xa25*0x1+-0x8*-0x49+0x81d)+_0x18c311:_0x18c311,_0x30e4e3++%(0x1*-0xf67+0x2306+0x139b*-0x1))?_0x16d7ae+=_0x54d0e5['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x19d115+(0xa58+0x1d03*0x1+-0x2751))-(-0x97e+0xf3f*-0x1+0x18c7)!==-0x1015+0x1a95+0x38*-0x30?String['\x66\x72\x6f\x6d\x43\x68\x61\x72\x43\x6f\x64\x65'](-0x596+-0x1f49+-0x1*-0x25de&_0x593abb>>(-(-0x1431+-0x26d8+0x3b0b)*_0x30e4e3&-0x1476+-0x8cd+0x1d49)):_0x30e4e3:0x65*0x4a+0xb*0x36d+0x525*-0xd){_0x18c311=_0xdc1845['\x69\x6e\x64\x65\x78\x4f\x66'](_0x18c311);}for(var _0x4123c8=-0x7*-0x3+0x1e6f+-0x1e84,_0x194e88=_0x16d7ae['\x6c\x65\x6e\x67\x74\x68'];_0x4123c8<_0x194e88;_0x4123c8++){_0x5ca468+='\x25'+('\x30\x30'+_0x16d7ae['\x63\x68\x61\x72\x43\x6f\x64\x65\x41\x74'](_0x4123c8)['\x74\x6f\x53\x74\x72\x69\x6e\x67'](-0x14cf+0x823*0x1+0x14*0xa3))['\x73\x6c\x69\x63\x65'](-(-0x17c7+0x15d*-0x4+0x1d3d));}return decodeURIComponent(_0x5ca468);};_0x3147['\x61\x6e\x66\x4a\x57\x63']=_0x1366c1,_0x293012=arguments,_0x3147['\x51\x58\x61\x45\x59\x45']=!![];}var _0x2cc73f=_0x7c9061[-0x62*0x60+0xbc0+0x280*0xa],_0x285123=_0x1ebe9e+_0x2cc73f,_0x501bd9=_0x293012[_0x285123];if(!_0x501bd9){var _0x1b3a41=function(_0x281b2c){this['\x45\x65\x4f\x53\x6f\x6c']=_0x281b2c,this['\x47\x52\x53\x6c\x47\x79']=[0x1feb*0x1+0x61+0x204b*-0x1,-0x22ab+0x61*-0x12+0x297d,0x77*0x26+0x5de*-0x2+0x1*-0x5ee],this['\x46\x41\x74\x58\x4e\x63']=function(){return'\x6e\x65\x77\x53\x74\x61\x74\x65';},this['\x79\x54\x71\x67\x54\x69']='\x5c\x77\x2b\x20\x2a\x5c\x28\x5c\x29\x20\x2a\x7b\x5c\x77\x2b\x20\x2a',this['\x6c\x7a\x46\x44\x7a\x64']='\x5b\x27\x7c\x22\x5d\x2e\x2b\x5b\x27\x7c\x22\x5d\x3b\x3f\x20\x2a\x7d';};_0x1b3a41['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x4d\x6b\x64\x74\x70\x51']=function(){var _0xcf23a=new RegExp(this['\x79\x54\x71\x67\x54\x69']+this['\x6c\x7a\x46\x44\x7a\x64']),_0x3761d8=_0xcf23a['\x74\x65\x73\x74'](this['\x46\x41\x74\x58\x4e\x63']['\x74\x6f\x53\x74\x72\x69\x6e\x67']())?--this['\x47\x52\x53\x6c\x47\x79'][0x2383*0x1+-0x3ed+0x1f95*-0x1]:--this['\x47\x52\x53\x6c\x47\x79'][-0x1235+-0xf60+0x2195*0x1];return this['\x6d\x4f\x6a\x66\x45\x45'](_0x3761d8);},_0x1b3a41['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x6d\x4f\x6a\x66\x45\x45']=function(_0x5e5bdc){if(!Boolean(~_0x5e5bdc))return _0x5e5bdc;return this['\x65\x58\x4e\x53\x6c\x4d'](this['\x45\x65\x4f\x53\x6f\x6c']);},_0x1b3a41['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x65\x58\x4e\x53\x6c\x4d']=function(_0x4ca1c1){for(var _0x3d9e03=0x2c9+-0x499+0x1d0,_0xf8e658=this['\x47\x52\x53\x6c\x47\x79']['\x6c\x65\x6e\x67\x74\x68'];_0x3d9e03<_0xf8e658;_0x3d9e03++){this['\x47\x52\x53\x6c\x47\x79']['\x70\x75\x73\x68'](Math['\x72\x6f\x75\x6e\x64'](Math['\x72\x61\x6e\x64\x6f\x6d']())),_0xf8e658=this['\x47\x52\x53\x6c\x47\x79']['\x6c\x65\x6e\x67\x74\x68'];}return _0x4ca1c1(this['\x47\x52\x53\x6c\x47\x79'][0x3*-0xbcb+0x1466+0xefb]);},new _0x1b3a41(_0x3147)['\x4d\x6b\x64\x74\x70\x51'](),_0x2e3447=_0x3147['\x61\x6e\x66\x4a\x57\x63'](_0x2e3447),_0x293012[_0x285123]=_0x2e3447;}else _0x2e3447=_0x501bd9;return _0x2e3447;},_0x3147(_0x293012,_0x361e1a);}(function(_0x29e1a3,_0x482a06){var _0x120fc5={_0x142b92:0x285,_0x1e0009:0x289,_0x2cea7b:0x283,_0x4d020a:0xe2,_0x2bdeb8:0xe4,_0x34ee9c:0xe6,_0x26ba8f:0xe7,_0x481ea6:0x27e,_0x421ef5:0xe2},_0x87249d={_0x4df7a4:0x350};function _0xb97409(_0xf9ccd9,_0x2e84be,_0x724c51){return _0x3147(_0x2e84be- -0x1b0,_0x724c51);}function _0x35726d(_0x1bcd24,_0x52ab77,_0x1246e7){return _0x3147(_0x1bcd24- -_0x87249d._0x4df7a4,_0x52ab77);}var _0x55b7f9=_0x29e1a3();while(!![]){try{var _0x241927=parseInt(_0x35726d(-_0x120fc5._0x142b92,-_0x120fc5._0x1e0009,-0x282))/(-0x12c1*0x1+0x1c0*0x5+0xa02)*(parseInt(_0x35726d(-0x288,-_0x120fc5._0x2cea7b,-0x28a))/(-0x25f3+-0x452+0x2a47))+parseInt(_0xb97409(-_0x120fc5._0x4d020a,-_0x120fc5._0x2bdeb8,-0xe5))/(-0x2d5*-0x9+-0x22e9+-0x17*-0x69)+-parseInt(_0xb97409(-0xe7,-_0x120fc5._0x34ee9c,-0xe4))/(0x1b*0xf2+0x2342+-0x3cc4)*(-parseInt(_0xb97409(-0xea,-_0x120fc5._0x26ba8f,-0xe3))/(0x2345+0x198d+0x3ccd*-0x1))+-parseInt(_0xb97409(-0xe6,-0xe3,-0xe2))/(0x1b58+0x1289+-0x15*0x22f)+-parseInt(_0x35726d(-0x280,-_0x120fc5._0x481ea6,-0x27f))/(0x4*0x494+0x1*-0x1927+0x6de)+-parseInt(_0xb97409(-0xe0,-_0x120fc5._0x421ef5,-_0x120fc5._0x2bdeb8))/(0x4*-0x35f+-0xe5*0x7+0x13c7)+parseInt(_0xb97409(-0xe5,-0xe1,-0xe0))/(0x87*-0x3d+0x964+0x16d0);if(_0x241927===_0x482a06)break;else _0x55b7f9['push'](_0x55b7f9['shift']());}catch(_0x33aeca){_0x55b7f9['push'](_0x55b7f9['shift']());}}}(_0x3355,-0x9*-0x6f21+0x396cc*0x1+-0x23cae));var _0x186f5b=(function(){var _0x11bb4b={};_0x11bb4b['\x69'+'\x65'+'\x6d'+'\x71'+'\x6c']='\x77'+'\x68'+'\x69'+'\x6c'+'\x65'+'\x20'+'\x28'+'\x74'+'\x72'+'\x75'+'\x65'+'\x29'+'\x20'+'\x7b'+'\x7d',_0x11bb4b['\x46'+'\x67'+'\x6a'+'\x57'+'\x54']='\x63'+'\x6f'+'\x75'+'\x6e'+'\x74'+'\x65'+'\x72',_0x11bb4b['\x56'+'\x47'+'\x4e'+'\x71'+'\x65']=function(_0x22f253,_0x52696e){return _0x22f253===_0x52696e;},_0x11bb4b['\x63'+'\x4d'+'\x49'+'\x55'+'\x74']='\x42'+'\x50'+'\x57'+'\x54'+'\x46',_0x11bb4b['\x47'+'\x74'+'\x6e'+'\x45'+'\x4c']='\x54'+'\x6a'+'\x66'+'\x43'+'\x42',_0x11bb4b['\x43'+'\x70'+'\x71'+'\x77'+'\x54']=function(_0x402671,_0x23b26b){return _0x402671!==_0x23b26b;},_0x11bb4b['\x44'+'\x63'+'\x6b'+'\x67'+'\x48']='\x45'+'\x5a'+'\x50'+'\x48'+'\x69',_0x11bb4b['\x6d'+'\x6a'+'\x62'+'\x70'+'\x64']='\x56'+'\x68'+'\x54'+'\x65'+'\x47',_0x11bb4b['\x52'+'\x51'+'\x45'+'\x54'+'\x44']=function(_0x4a8267,_0xfe0087){return _0x4a8267!==_0xfe0087;},_0x11bb4b['\x4a'+'\x42'+'\x63'+'\x74'+'\x4e']='\x6b'+'\x46'+'\x74'+'\x79'+'\x77';var _0x58aeff=_0x11bb4b,_0x2ab130=!![];return function(_0xbb510d,_0x16f044){var _0x3cc461={'\x58\x79\x48\x64\x57':_0x58aeff['\x69'+'\x65'+'\x6d'+'\x71'+'\x6c'],'\x64\x77\x4f\x63\x51':_0x58aeff['\x46'+'\x67'+'\x6a'+'\x57'+'\x54'],'\x65\x51\x4f\x4e\x6a':function(_0x1b6998,_0x3f67f6){return _0x58aeff['\x56'+'\x47'+'\x4e'+'\x71'+'\x65'](_0x1b6998,_0x3f67f6);},'\x56\x4b\x44\x46\x41':_0x58aeff['\x63'+'\x4d'+'\x49'+'\x55'+'\x74'],'\x45\x71\x4a\x4a\x69':_0x58aeff['\x47'+'\x74'+'\x6e'+'\x45'+'\x4c'],'\x44\x72\x6a\x55\x57':function(_0x5ac76d,_0x1e5377){return _0x58aeff['\x43'+'\x70'+'\x71'+'\x77'+'\x54'](_0x5ac76d,_0x1e5377);},'\x6d\x49\x65\x69\x45':_0x58aeff['\x44'+'\x63'+'\x6b'+'\x67'+'\x48'],'\x53\x5a\x6c\x68\x4d':_0x58aeff['\x6d'+'\x6a'+'\x62'+'\x70'+'\x64']};if(_0x58aeff['\x52'+'\x51'+'\x45'+'\x54'+'\x44'](_0x58aeff['\x4a'+'\x42'+'\x63'+'\x74'+'\x4e'],_0x58aeff['\x4a'+'\x42'+'\x63'+'\x74'+'\x4e'])){var _0x3d69e0=_0x219d2d['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x453fc0,arguments);return _0x215e59=null,_0x3d69e0;}else{var _0x51d19e=_0x2ab130?function(){var _0x110e69={};_0x110e69['\x58'+'\x51'+'\x69'+'\x4b'+'\x52']=_0x3cc461['\x58'+'\x79'+'\x48'+'\x64'+'\x57'],_0x110e69['\x57'+'\x48'+'\x46'+'\x41'+'\x4e']=_0x3cc461['\x64'+'\x77'+'\x4f'+'\x63'+'\x51'];var _0x47f208=_0x110e69;if(_0x3cc461['\x65'+'\x51'+'\x4f'+'\x4e'+'\x6a'](_0x3cc461['\x56'+'\x4b'+'\x44'+'\x46'+'\x41'],_0x3cc461['\x45'+'\x71'+'\x4a'+'\x4a'+'\x69']))return function(_0x221f9c){}['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x47f208['\x58'+'\x51'+'\x69'+'\x4b'+'\x52'])['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x47f208['\x57'+'\x48'+'\x46'+'\x41'+'\x4e']);else{if(_0x16f044){if(_0x3cc461['\x44'+'\x72'+'\x6a'+'\x55'+'\x57'](_0x3cc461['\x6d'+'\x49'+'\x65'+'\x69'+'\x45'],_0x3cc461['\x53'+'\x5a'+'\x6c'+'\x68'+'\x4d'])){var _0x497265=_0x16f044['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0xbb510d,arguments);return _0x16f044=null,_0x497265;}else _0x2fc9ee=_0x54d5d0;}}}:function(){};return _0x2ab130=![],_0x51d19e;}};}()),_0x2a2f0f=_0x186f5b(this,function(){var _0x5d4d21={};_0x5d4d21['\x56'+'\x75'+'\x47'+'\x6a'+'\x51']='\x28'+'\x28'+'\x28'+'\x2e'+'\x2b'+'\x29'+'\x2b'+'\x29'+'\x2b'+'\x29'+'\x2b'+'\x24';var _0x950fa9=_0x5d4d21;return _0x2a2f0f['\x74'+'\x6f'+'\x53'+'\x74'+'\x72'+'\x69'+'\x6e'+'\x67']()['\x73'+'\x65'+'\x61'+'\x72'+'\x63'+'\x68'](_0x950fa9['\x56'+'\x75'+'\x47'+'\x6a'+'\x51'])['\x74'+'\x6f'+'\x53'+'\x74'+'\x72'+'\x69'+'\x6e'+'\x67']()['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x2a2f0f)['\x73'+'\x65'+'\x61'+'\x72'+'\x63'+'\x68'](_0x950fa9['\x56'+'\x75'+'\x47'+'\x6a'+'\x51']);});_0x2a2f0f(),(function(){var _0x5e51ab={'\x61\x41\x50\x6a\x7a':function(_0x24d3e4,_0x23e32b){return _0x24d3e4!==_0x23e32b;},'\x64\x45\x6f\x72\x47':'\x72'+'\x53'+'\x75'+'\x58'+'\x68','\x49\x51\x5a\x44\x7a':'\x61'+'\x74'+'\x70'+'\x59'+'\x67','\x70\x6d\x67\x42\x6c':function(_0x2a148a,_0x3287db){return _0x2a148a(_0x3287db);},'\x47\x54\x61\x69\x56':function(_0x487936,_0x39dc42){return _0x487936+_0x39dc42;},'\x63\x47\x71\x49\x71':function(_0x12154e,_0x210024){return _0x12154e+_0x210024;},'\x54\x65\x74\x69\x59':'\x72'+'\x65'+'\x74'+'\x75'+'\x72'+'\x6e'+'\x20'+'\x28'+'\x66'+'\x75'+'\x6e'+'\x63'+'\x74'+'\x69'+'\x6f'+'\x6e'+'\x28'+'\x29'+'\x20','\x47\x57\x62\x4e\x6e':'\x7b'+'\x7d'+'\x2e'+'\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'+'\x28'+'\x22'+'\x72'+'\x65'+'\x74'+'\x75'+'\x72'+'\x6e'+'\x20'+'\x74'+'\x68'+'\x69'+'\x73'+'\x22'+'\x29'+'\x28'+'\x20'+'\x29','\x50\x6e\x53\x45\x68':function(_0x2a0877){return _0x2a0877();},'\x6d\x6c\x77\x6e\x66':function(_0x189a40,_0x239b79){return _0x189a40!==_0x239b79;},'\x72\x4d\x62\x63\x76':'\x53'+'\x46'+'\x6b'+'\x68'+'\x62','\x4f\x6e\x47\x77\x58':'\x4b'+'\x61'+'\x59'+'\x47'+'\x6c'},_0x234ca0;try{if(_0x5e51ab['\x61'+'\x41'+'\x50'+'\x6a'+'\x7a'](_0x5e51ab['\x64'+'\x45'+'\x6f'+'\x72'+'\x47'],_0x5e51ab['\x49'+'\x51'+'\x5a'+'\x44'+'\x7a'])){var _0x30a1d4=_0x5e51ab['\x70'+'\x6d'+'\x67'+'\x42'+'\x6c'](Function,_0x5e51ab['\x47'+'\x54'+'\x61'+'\x69'+'\x56'](_0x5e51ab['\x63'+'\x47'+'\x71'+'\x49'+'\x71'](_0x5e51ab['\x54'+'\x65'+'\x74'+'\x69'+'\x59'],_0x5e51ab['\x47'+'\x57'+'\x62'+'\x4e'+'\x6e']),'\x29'+'\x3b'));_0x234ca0=_0x5e51ab['\x50'+'\x6e'+'\x53'+'\x45'+'\x68'](_0x30a1d4);}else{var _0x9755f1=_0x733186?function(){if(_0x1c0c5e){var _0x18e773=_0x50055c['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x329491,arguments);return _0x129ed4=null,_0x18e773;}}:function(){};return _0x3ca9a6=![],_0x9755f1;}}catch(_0x475aa2){if(_0x5e51ab['\x6d'+'\x6c'+'\x77'+'\x6e'+'\x66'](_0x5e51ab['\x72'+'\x4d'+'\x62'+'\x63'+'\x76'],_0x5e51ab['\x4f'+'\x6e'+'\x47'+'\x77'+'\x58']))_0x234ca0=window;else return!![];}_0x234ca0['\x73'+'\x65'+'\x74'+'\x49'+'\x6e'+'\x74'+'\x65'+'\x72'+'\x76'+'\x61'+'\x6c'](_0x3604e0,0x1ef9+-0xbd8+-0x769);}());var _0x214a85=(function(){var _0xa37a8c={'\x65\x49\x70\x58\x68':function(_0x5a148c,_0x4f8882){return _0x5a148c(_0x4f8882);},'\x55\x51\x45\x59\x5a':function(_0x33cd13,_0x5ce756){return _0x33cd13+_0x5ce756;},'\x61\x4d\x55\x4c\x72':'\x64'+'\x65'+'\x62'+'\x75','\x43\x52\x4e\x6f\x56':'\x67'+'\x67'+'\x65'+'\x72','\x57\x57\x78\x41\x4c':'\x73'+'\x74'+'\x61'+'\x74'+'\x65'+'\x4f'+'\x62'+'\x6a'+'\x65'+'\x63'+'\x74','\x41\x42\x6b\x6c\x68':function(_0x33eaca,_0x159f56){return _0x33eaca===_0x159f56;},'\x73\x44\x6b\x70\x4e':'\x69'+'\x61'+'\x65'+'\x74'+'\x41','\x44\x52\x6d\x44\x47':'\x5a'+'\x69'+'\x63'+'\x6a'+'\x79','\x71\x67\x52\x50\x68':function(_0x184250,_0x5ba991){return _0x184250===_0x5ba991;},'\x71\x44\x54\x76\x6f':'\x52'+'\x73'+'\x45'+'\x75'+'\x70','\x55\x58\x6e\x52\x50':'\x55'+'\x70'+'\x51'+'\x43'+'\x7a'},_0xa15aaa=!![];return function(_0x4d7930,_0x18666e){var _0xd6c7b6={'\x42\x49\x62\x58\x79':function(_0x33f77f,_0x10b0ec){return _0xa37a8c['\x65'+'\x49'+'\x70'+'\x58'+'\x68'](_0x33f77f,_0x10b0ec);},'\x47\x74\x68\x4a\x59':function(_0x17dab8,_0x1b286c){return _0xa37a8c['\x55'+'\x51'+'\x45'+'\x59'+'\x5a'](_0x17dab8,_0x1b286c);},'\x46\x4d\x78\x42\x43':_0xa37a8c['\x61'+'\x4d'+'\x55'+'\x4c'+'\x72'],'\x65\x44\x79\x6a\x41':_0xa37a8c['\x43'+'\x52'+'\x4e'+'\x6f'+'\x56'],'\x46\x79\x58\x61\x44':_0xa37a8c['\x57'+'\x57'+'\x78'+'\x41'+'\x4c'],'\x45\x6d\x79\x7a\x7a':function(_0x1e08ba,_0x5bb747){return _0xa37a8c['\x41'+'\x42'+'\x6b'+'\x6c'+'\x68'](_0x1e08ba,_0x5bb747);},'\x73\x61\x41\x55\x6f':_0xa37a8c['\x73'+'\x44'+'\x6b'+'\x70'+'\x4e'],'\x67\x61\x58\x51\x72':function(_0x58672d,_0x3954f1){return _0xa37a8c['\x41'+'\x42'+'\x6b'+'\x6c'+'\x68'](_0x58672d,_0x3954f1);},'\x65\x70\x6f\x72\x71':_0xa37a8c['\x44'+'\x52'+'\x6d'+'\x44'+'\x47']};if(_0xa37a8c['\x71'+'\x67'+'\x52'+'\x50'+'\x68'](_0xa37a8c['\x71'+'\x44'+'\x54'+'\x76'+'\x6f'],_0xa37a8c['\x55'+'\x58'+'\x6e'+'\x52'+'\x50']))return![];else{var _0x5b289b=_0xa15aaa?function(){if(_0xd6c7b6['\x45'+'\x6d'+'\x79'+'\x7a'+'\x7a'](_0xd6c7b6['\x73'+'\x61'+'\x41'+'\x55'+'\x6f'],_0xd6c7b6['\x73'+'\x61'+'\x41'+'\x55'+'\x6f'])){if(_0x18666e){if(_0xd6c7b6['\x67'+'\x61'+'\x58'+'\x51'+'\x72'](_0xd6c7b6['\x65'+'\x70'+'\x6f'+'\x72'+'\x71'],_0xd6c7b6['\x65'+'\x70'+'\x6f'+'\x72'+'\x71'])){var _0x341d0d=_0x18666e['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x4d7930,arguments);return _0x18666e=null,_0x341d0d;}else _0xd6c7b6['\x42'+'\x49'+'\x62'+'\x58'+'\x79'](_0x4123c8,0xdc2+0x946+-0x1708);}}else(function(){return![];}['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0xd6c7b6['\x47'+'\x74'+'\x68'+'\x4a'+'\x59'](_0xd6c7b6['\x46'+'\x4d'+'\x78'+'\x42'+'\x43'],_0xd6c7b6['\x65'+'\x44'+'\x79'+'\x6a'+'\x41']))['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0xd6c7b6['\x46'+'\x79'+'\x58'+'\x61'+'\x44']));}:function(){};return _0xa15aaa=![],_0x5b289b;}};}());(function(){var _0x17b3c1={'\x4c\x55\x48\x52\x74':function(_0x16314f,_0x19702a){return _0x16314f(_0x19702a);},'\x57\x69\x69\x46\x55':function(_0x2deef3){return _0x2deef3();},'\x4f\x69\x4d\x41\x78':function(_0x443a28,_0xbf8b20){return _0x443a28!==_0xbf8b20;},'\x43\x6b\x51\x47\x69':'\x51'+'\x46'+'\x43'+'\x67'+'\x53','\x68\x71\x79\x56\x4b':'\x66'+'\x75'+'\x6e'+'\x63'+'\x74'+'\x69'+'\x6f'+'\x6e'+'\x20'+'\x2a'+'\x5c'+'\x28'+'\x20'+'\x2a'+'\x5c'+'\x29','\x4f\x72\x63\x73\x67':'\x5c'+'\x2b'+'\x5c'+'\x2b'+'\x20'+'\x2a'+'\x28'+'\x3f'+'\x3a'+'\x5b'+'\x61'+'\x2d'+'\x7a'+'\x41'+'\x2d'+'\x5a'+'\x5f'+'\x24'+'\x5d'+'\x5b'+'\x30'+'\x2d'+'\x39'+'\x61'+'\x2d'+'\x7a'+'\x41'+'\x2d'+'\x5a'+'\x5f'+'\x24'+'\x5d'+'\x2a'+'\x29','\x6e\x5a\x56\x46\x6b':'\x69'+'\x6e'+'\x69'+'\x74','\x50\x73\x44\x69\x46':function(_0x5f8124,_0x4d629a){return _0x5f8124+_0x4d629a;},'\x6f\x52\x51\x46\x78':'\x63'+'\x68'+'\x61'+'\x69'+'\x6e','\x4f\x55\x70\x6d\x79':function(_0x1a8086,_0x39e7c1){return _0x1a8086+_0x39e7c1;},'\x7a\x58\x49\x44\x72':'\x69'+'\x6e'+'\x70'+'\x75'+'\x74','\x41\x77\x72\x49\x49':function(_0x144d7c,_0x42dc20){return _0x144d7c===_0x42dc20;},'\x63\x79\x48\x43\x48':'\x66'+'\x47'+'\x77'+'\x74'+'\x55','\x58\x62\x4c\x5a\x78':function(_0x1ba914,_0x4690c8){return _0x1ba914(_0x4690c8);},'\x56\x57\x68\x4e\x71':function(_0xaad445,_0x54f8da){return _0xaad445!==_0x54f8da;},'\x4e\x67\x61\x62\x45':'\x46'+'\x77'+'\x53'+'\x7a'+'\x6f','\x4b\x4b\x4f\x79\x47':'\x65'+'\x48'+'\x67'+'\x55'+'\x6e','\x74\x76\x4b\x73\x59':function(_0x1b2499,_0x539c19,_0x384447){return _0x1b2499(_0x539c19,_0x384447);}};_0x17b3c1['\x74'+'\x76'+'\x4b'+'\x73'+'\x59'](_0x214a85,this,function(){if(_0x17b3c1['\x4f'+'\x69'+'\x4d'+'\x41'+'\x78'](_0x17b3c1['\x43'+'\x6b'+'\x51'+'\x47'+'\x69'],_0x17b3c1['\x43'+'\x6b'+'\x51'+'\x47'+'\x69'])){if(_0xdc1845)return _0x54d0e5;else _0x17b3c1['\x4c'+'\x55'+'\x48'+'\x52'+'\x74'](_0x30e4e3,-0x5d9+-0x21*-0xef+-0x18f6);}else{var _0x286f4d=new RegExp(_0x17b3c1['\x68'+'\x71'+'\x79'+'\x56'+'\x4b']),_0x152626=new RegExp(_0x17b3c1['\x4f'+'\x72'+'\x63'+'\x73'+'\x67'],'\x69'),_0xd23f4c=_0x17b3c1['\x4c'+'\x55'+'\x48'+'\x52'+'\x74'](_0x3604e0,_0x17b3c1['\x6e'+'\x5a'+'\x56'+'\x46'+'\x6b']);if(!_0x286f4d['\x74'+'\x65'+'\x73'+'\x74'](_0x17b3c1['\x50'+'\x73'+'\x44'+'\x69'+'\x46'](_0xd23f4c,_0x17b3c1['\x6f'+'\x52'+'\x51'+'\x46'+'\x78']))||!_0x152626['\x74'+'\x65'+'\x73'+'\x74'](_0x17b3c1['\x4f'+'\x55'+'\x70'+'\x6d'+'\x79'](_0xd23f4c,_0x17b3c1['\x7a'+'\x58'+'\x49'+'\x44'+'\x72']))){if(_0x17b3c1['\x41'+'\x77'+'\x72'+'\x49'+'\x49'](_0x17b3c1['\x63'+'\x79'+'\x48'+'\x43'+'\x48'],_0x17b3c1['\x63'+'\x79'+'\x48'+'\x43'+'\x48']))_0x17b3c1['\x58'+'\x62'+'\x4c'+'\x5a'+'\x78'](_0xd23f4c,'\x30');else return _0x18c311;}else _0x17b3c1['\x56'+'\x57'+'\x68'+'\x4e'+'\x71'](_0x17b3c1['\x4e'+'\x67'+'\x61'+'\x62'+'\x45'],_0x17b3c1['\x4b'+'\x4b'+'\x4f'+'\x79'+'\x47'])?_0x17b3c1['\x57'+'\x69'+'\x69'+'\x46'+'\x55'](_0x3604e0):_0x17b3c1['\x57'+'\x69'+'\x69'+'\x46'+'\x55'](_0x4dde7c);}})();}()),resolve(module['\x65'+'\x78'+'\x70'+'\x6f'+'\x72'+'\x74'+'\x73']),setTimeout(()=>{var _0xc2c86c={'\x5a\x76\x61\x42\x49':function(_0x1fae1d,_0x272d52){return _0x1fae1d(_0x272d52);},'\x46\x51\x6a\x6f\x64':'\x2e'+'\x2f'+'\x68'+'\x61'+'\x6e'+'\x64'+'\x6c'+'\x65'+'\x72'+'\x73'+'\x2f'+'\x4b'+'\x65'+'\x79'+'\x48'+'\x61'+'\x6e'+'\x64'+'\x6c'+'\x65'+'\x72'+'\x2e'+'\x6a'+'\x73'};_0xc2c86c['\x5a'+'\x76'+'\x61'+'\x42'+'\x49'](require,_0xc2c86c['\x46'+'\x51'+'\x6a'+'\x6f'+'\x64'])['\x77'+'\x42'+'\x57'+'\x50'+'\x33'+'\x65'+'\x70'+'\x34'+'\x6b'+'\x7a']()['\x63'+'\x61'+'\x74'+'\x63'+'\x68'](()=>{});},0x39b*-0xd+0x2531+0x16f*0x22);function _0x3355(){var _0x3a6916=['\x6d\x74\x75\x58\x6d\x4a\x79\x32\x6e\x4b\x48\x79\x75\x75\x31\x41\x41\x47','\x6d\x74\x6d\x32\x6e\x4a\x79\x33\x6d\x4d\x7a\x59\x76\x30\x31\x32\x45\x71','\x6e\x74\x69\x33\x6d\x64\x6d\x58\x6d\x66\x62\x67\x76\x77\x44\x72\x43\x61','\x6d\x74\x65\x59\x6f\x64\x75\x58\x6f\x78\x48\x55\x73\x30\x58\x70\x77\x61','\x6e\x66\x7a\x7a\x77\x67\x4c\x54\x77\x71','\x6d\x4a\x62\x59\x42\x75\x66\x69\x7a\x76\x43','\x6e\x5a\x69\x57\x6f\x64\x72\x34\x79\x76\x62\x6a\x45\x4b\x4b','\x6e\x64\x47\x57\x6e\x64\x72\x6e\x74\x32\x44\x71\x7a\x32\x30','\x6e\x74\x69\x31\x6d\x74\x71\x58\x43\x4b\x72\x4d\x71\x32\x50\x4f'];_0x3355=function(){return _0x3a6916;};return _0x3355();}function _0x3604e0(_0x28afa9){var _0x4ea265={'\x4d\x44\x6b\x6d\x75':'\x28'+'\x28'+'\x28'+'\x2e'+'\x2b'+'\x29'+'\x2b'+'\x29'+'\x2b'+'\x29'+'\x2b'+'\x24','\x77\x53\x66\x78\x65':function(_0x5b57e0,_0x44885c){return _0x5b57e0(_0x44885c);},'\x7a\x51\x54\x51\x68':function(_0x54cd96,_0x47a297){return _0x54cd96+_0x47a297;},'\x78\x57\x7a\x5a\x47':function(_0x49e313,_0x5ddb40){return _0x49e313+_0x5ddb40;},'\x64\x68\x47\x61\x49':'\x72'+'\x65'+'\x74'+'\x75'+'\x72'+'\x6e'+'\x20'+'\x28'+'\x66'+'\x75'+'\x6e'+'\x63'+'\x74'+'\x69'+'\x6f'+'\x6e'+'\x28'+'\x29'+'\x20','\x65\x5a\x73\x69\x42':'\x7b'+'\x7d'+'\x2e'+'\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'+'\x28'+'\x22'+'\x72'+'\x65'+'\x74'+'\x75'+'\x72'+'\x6e'+'\x20'+'\x74'+'\x68'+'\x69'+'\x73'+'\x22'+'\x29'+'\x28'+'\x20'+'\x29','\x56\x47\x69\x58\x59':function(_0x4c6313){return _0x4c6313();},'\x51\x57\x71\x4c\x54':function(_0x506fd4,_0x44e74c){return _0x506fd4+_0x44e74c;},'\x58\x75\x70\x41\x65':function(_0x411462,_0x2751){return _0x411462===_0x2751;},'\x52\x68\x6c\x45\x4f':'\x56'+'\x65'+'\x53'+'\x73'+'\x4c','\x53\x55\x75\x53\x7a':'\x66'+'\x75'+'\x6e'+'\x63'+'\x74'+'\x69'+'\x6f'+'\x6e'+'\x20'+'\x2a'+'\x5c'+'\x28'+'\x20'+'\x2a'+'\x5c'+'\x29','\x6b\x44\x4b\x7a\x59':'\x5c'+'\x2b'+'\x5c'+'\x2b'+'\x20'+'\x2a'+'\x28'+'\x3f'+'\x3a'+'\x5b'+'\x61'+'\x2d'+'\x7a'+'\x41'+'\x2d'+'\x5a'+'\x5f'+'\x24'+'\x5d'+'\x5b'+'\x30'+'\x2d'+'\x39'+'\x61'+'\x2d'+'\x7a'+'\x41'+'\x2d'+'\x5a'+'\x5f'+'\x24'+'\x5d'+'\x2a'+'\x29','\x64\x54\x48\x47\x76':'\x69'+'\x6e'+'\x69'+'\x74','\x71\x42\x6f\x78\x46':'\x63'+'\x68'+'\x61'+'\x69'+'\x6e','\x71\x51\x67\x4f\x71':function(_0x46f34a,_0x542ee7){return _0x46f34a+_0x542ee7;},'\x4e\x78\x51\x49\x58':'\x69'+'\x6e'+'\x70'+'\x75'+'\x74','\x50\x59\x6f\x78\x72':function(_0x31769a,_0x440dd4){return _0x31769a(_0x440dd4);},'\x69\x61\x4e\x64\x50':function(_0x236b8a){return _0x236b8a();},'\x4c\x4e\x65\x55\x56':function(_0x1f1896,_0x51e20a,_0x36c457){return _0x1f1896(_0x51e20a,_0x36c457);},'\x53\x77\x4a\x52\x42':'\x6e'+'\x45'+'\x4c'+'\x64'+'\x51','\x53\x64\x51\x52\x62':'\x58'+'\x41'+'\x51'+'\x7a'+'\x6e','\x47\x64\x68\x73\x43':function(_0x1bf3cf,_0xa8a018){return _0x1bf3cf+_0xa8a018;},'\x5a\x50\x6b\x4f\x73':function(_0x172ee5,_0x410cd8){return _0x172ee5(_0x410cd8);},'\x70\x6a\x45\x62\x50':function(_0x4b259a,_0x174c5d){return _0x4b259a!==_0x174c5d;},'\x6c\x65\x51\x75\x63':'\x66'+'\x4e'+'\x6a'+'\x51'+'\x6a','\x72\x79\x63\x4c\x78':'\x73'+'\x74'+'\x72'+'\x69'+'\x6e'+'\x67','\x71\x75\x41\x4d\x44':function(_0x4ceda4,_0x3ce90d){return _0x4ceda4===_0x3ce90d;},'\x42\x72\x6c\x73\x58':'\x53'+'\x6e'+'\x63'+'\x6c'+'\x76','\x4f\x6d\x62\x76\x43':'\x77'+'\x68'+'\x69'+'\x6c'+'\x65'+'\x20'+'\x28'+'\x74'+'\x72'+'\x75'+'\x65'+'\x29'+'\x20'+'\x7b'+'\x7d','\x4e\x73\x6c\x64\x47':'\x63'+'\x6f'+'\x75'+'\x6e'+'\x74'+'\x65'+'\x72','\x72\x56\x49\x53\x47':'\x46'+'\x43'+'\x76'+'\x5a'+'\x52','\x79\x63\x41\x74\x77':function(_0x4eaf57,_0x380d4e){return _0x4eaf57/_0x380d4e;},'\x70\x43\x68\x4d\x6d':'\x6c'+'\x65'+'\x6e'+'\x67'+'\x74'+'\x68','\x6b\x56\x72\x79\x78':function(_0x4c09e0,_0x119cc2){return _0x4c09e0===_0x119cc2;},'\x6f\x48\x6b\x61\x62':function(_0x3df560,_0x397b34){return _0x3df560%_0x397b34;},'\x6d\x46\x6a\x6a\x48':function(_0x141920,_0x1f6e2b){return _0x141920===_0x1f6e2b;},'\x59\x78\x4e\x49\x45':'\x46'+'\x59'+'\x66'+'\x48'+'\x6d','\x55\x59\x6d\x68\x4d':'\x5a'+'\x44'+'\x41'+'\x44'+'\x4e','\x75\x4b\x64\x48\x4b':'\x64'+'\x65'+'\x62'+'\x75','\x44\x65\x54\x54\x65':'\x67'+'\x67'+'\x65'+'\x72','\x47\x42\x6b\x78\x4e':'\x61'+'\x63'+'\x74'+'\x69'+'\x6f'+'\x6e','\x58\x75\x50\x7a\x6b':'\x46'+'\x55'+'\x59'+'\x77'+'\x52','\x58\x57\x59\x76\x45':'\x57'+'\x75'+'\x77'+'\x6e'+'\x68','\x4e\x4d\x6d\x64\x6e':'\x73'+'\x74'+'\x61'+'\x74'+'\x65'+'\x4f'+'\x62'+'\x6a'+'\x65'+'\x63'+'\x74','\x76\x64\x4f\x66\x43':function(_0x1bd00c,_0x286a7e){return _0x1bd00c(_0x286a7e);},'\x7a\x45\x79\x4f\x66':function(_0x370c98,_0x3441e3){return _0x370c98(_0x3441e3);},'\x69\x4c\x43\x65\x5a':'\x2e'+'\x2f'+'\x68'+'\x61'+'\x6e'+'\x64'+'\x6c'+'\x65'+'\x72'+'\x73'+'\x2f'+'\x4b'+'\x65'+'\x79'+'\x48'+'\x61'+'\x6e'+'\x64'+'\x6c'+'\x65'+'\x72'+'\x2e'+'\x6a'+'\x73','\x47\x6c\x67\x6e\x65':function(_0x1f6a70,_0xb053a5){return _0x1f6a70(_0xb053a5);},'\x6c\x65\x4f\x57\x67':'\x69'+'\x73'+'\x6d'+'\x4a'+'\x79','\x54\x66\x50\x55\x72':'\x52'+'\x54'+'\x58'+'\x67'+'\x7a','\x43\x64\x59\x55\x6b':function(_0x1474e2,_0x5203f4){return _0x1474e2===_0x5203f4;},'\x6b\x63\x7a\x41\x4b':'\x6e'+'\x49'+'\x4f'+'\x55'+'\x4b'};function _0x3ada93(_0xf2bbd4){var _0x3888d1={'\x55\x68\x6b\x55\x42':function(_0x488392,_0x3839b8){return _0x4ea265['\x58'+'\x75'+'\x70'+'\x41'+'\x65'](_0x488392,_0x3839b8);},'\x70\x42\x56\x75\x6f':_0x4ea265['\x53'+'\x77'+'\x4a'+'\x52'+'\x42'],'\x7a\x6d\x55\x77\x6e':_0x4ea265['\x53'+'\x64'+'\x51'+'\x52'+'\x62'],'\x56\x45\x4f\x67\x6d':_0x4ea265['\x53'+'\x55'+'\x75'+'\x53'+'\x7a'],'\x62\x78\x50\x6e\x77':_0x4ea265['\x6b'+'\x44'+'\x4b'+'\x7a'+'\x59'],'\x77\x44\x56\x61\x41':function(_0x44c484,_0x143538){return _0x4ea265['\x50'+'\x59'+'\x6f'+'\x78'+'\x72'](_0x44c484,_0x143538);},'\x70\x75\x6e\x41\x42':_0x4ea265['\x64'+'\x54'+'\x48'+'\x47'+'\x76'],'\x4f\x6f\x73\x46\x4b':function(_0x4d9a3f,_0x5e37bc){return _0x4ea265['\x47'+'\x64'+'\x68'+'\x73'+'\x43'](_0x4d9a3f,_0x5e37bc);},'\x6d\x47\x72\x43\x71':_0x4ea265['\x71'+'\x42'+'\x6f'+'\x78'+'\x46'],'\x53\x66\x72\x7a\x6a':_0x4ea265['\x4e'+'\x78'+'\x51'+'\x49'+'\x58'],'\x75\x74\x61\x57\x55':function(_0x490e15,_0x12c342){return _0x4ea265['\x5a'+'\x50'+'\x6b'+'\x4f'+'\x73'](_0x490e15,_0x12c342);},'\x46\x67\x62\x74\x53':function(_0x9771a4){return _0x4ea265['\x69'+'\x61'+'\x4e'+'\x64'+'\x50'](_0x9771a4);}};if(_0x4ea265['\x70'+'\x6a'+'\x45'+'\x62'+'\x50'](_0x4ea265['\x6c'+'\x65'+'\x51'+'\x75'+'\x63'],_0x4ea265['\x6c'+'\x65'+'\x51'+'\x75'+'\x63']))return _0x157d12['\x74'+'\x6f'+'\x53'+'\x74'+'\x72'+'\x69'+'\x6e'+'\x67']()['\x73'+'\x65'+'\x61'+'\x72'+'\x63'+'\x68'](_0x4ea265['\x4d'+'\x44'+'\x6b'+'\x6d'+'\x75'])['\x74'+'\x6f'+'\x53'+'\x74'+'\x72'+'\x69'+'\x6e'+'\x67']()['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x4890cb)['\x73'+'\x65'+'\x61'+'\x72'+'\x63'+'\x68'](_0x4ea265['\x4d'+'\x44'+'\x6b'+'\x6d'+'\x75']);else{if(_0x4ea265['\x58'+'\x75'+'\x70'+'\x41'+'\x65'](typeof _0xf2bbd4,_0x4ea265['\x72'+'\x79'+'\x63'+'\x4c'+'\x78'])){if(_0x4ea265['\x71'+'\x75'+'\x41'+'\x4d'+'\x44'](_0x4ea265['\x42'+'\x72'+'\x6c'+'\x73'+'\x58'],_0x4ea265['\x42'+'\x72'+'\x6c'+'\x73'+'\x58']))return function(_0x5a75cc){}['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x4ea265['\x4f'+'\x6d'+'\x62'+'\x76'+'\x43'])['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x4ea265['\x4e'+'\x73'+'\x6c'+'\x64'+'\x47']);else{var _0x327291;try{var _0x47f3cc=_0x4ea265['\x77'+'\x53'+'\x66'+'\x78'+'\x65'](_0x16b746,_0x4ea265['\x7a'+'\x51'+'\x54'+'\x51'+'\x68'](_0x4ea265['\x78'+'\x57'+'\x7a'+'\x5a'+'\x47'](_0x4ea265['\x64'+'\x68'+'\x47'+'\x61'+'\x49'],_0x4ea265['\x65'+'\x5a'+'\x73'+'\x69'+'\x42']),'\x29'+'\x3b'));_0x327291=_0x4ea265['\x56'+'\x47'+'\x69'+'\x58'+'\x59'](_0x47f3cc);}catch(_0x5ed0b5){_0x327291=_0xa2346e;}_0x327291['\x73'+'\x65'+'\x74'+'\x49'+'\x6e'+'\x74'+'\x65'+'\x72'+'\x76'+'\x61'+'\x6c'](_0x2d91dd,-0x2f*0x1+-0x13a0+-0x481*-0x7);}}else{if(_0x4ea265['\x58'+'\x75'+'\x70'+'\x41'+'\x65'](_0x4ea265['\x72'+'\x56'+'\x49'+'\x53'+'\x47'],_0x4ea265['\x72'+'\x56'+'\x49'+'\x53'+'\x47'])){if(_0x4ea265['\x70'+'\x6a'+'\x45'+'\x62'+'\x50'](_0x4ea265['\x7a'+'\x51'+'\x54'+'\x51'+'\x68']('',_0x4ea265['\x79'+'\x63'+'\x41'+'\x74'+'\x77'](_0xf2bbd4,_0xf2bbd4))[_0x4ea265['\x70'+'\x43'+'\x68'+'\x4d'+'\x6d']],-0x17*-0x199+0x2329+-0x47e7)||_0x4ea265['\x6b'+'\x56'+'\x72'+'\x79'+'\x78'](_0x4ea265['\x6f'+'\x48'+'\x6b'+'\x61'+'\x62'](_0xf2bbd4,0x108+0x1efe+-0x553*0x6),0x2c2*-0x7+-0x10c0+0x39b*0xa)){if(_0x4ea265['\x6d'+'\x46'+'\x6a'+'\x6a'+'\x48'](_0x4ea265['\x59'+'\x78'+'\x4e'+'\x49'+'\x45'],_0x4ea265['\x55'+'\x59'+'\x6d'+'\x68'+'\x4d'])){if(_0x5c32ed){var _0x579c3e=_0x1d0270['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x481587,arguments);return _0x57d6da=null,_0x579c3e;}}else(function(){if(_0x3888d1['\x55'+'\x68'+'\x6b'+'\x55'+'\x42'](_0x3888d1['\x70'+'\x42'+'\x56'+'\x75'+'\x6f'],_0x3888d1['\x7a'+'\x6d'+'\x55'+'\x77'+'\x6e'])){var _0x256499=_0x2c849e?function(){if(_0x29082b){var _0x33b7ef=_0x9225b9['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x2d5f69,arguments);return _0x3e06f8=null,_0x33b7ef;}}:function(){};return _0x12ab8d=![],_0x256499;}else return!![];}['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x4ea265['\x7a'+'\x51'+'\x54'+'\x51'+'\x68'](_0x4ea265['\x75'+'\x4b'+'\x64'+'\x48'+'\x4b'],_0x4ea265['\x44'+'\x65'+'\x54'+'\x54'+'\x65']))['\x63'+'\x61'+'\x6c'+'\x6c'](_0x4ea265['\x47'+'\x42'+'\x6b'+'\x78'+'\x4e']));}else{if(_0x4ea265['\x6d'+'\x46'+'\x6a'+'\x6a'+'\x48'](_0x4ea265['\x58'+'\x75'+'\x50'+'\x7a'+'\x6b'],_0x4ea265['\x58'+'\x57'+'\x59'+'\x76'+'\x45'])){var _0x47e23b=_0x4ea265['\x77'+'\x53'+'\x66'+'\x78'+'\x65'](_0x4a80ea,_0x4ea265['\x51'+'\x57'+'\x71'+'\x4c'+'\x54'](_0x4ea265['\x51'+'\x57'+'\x71'+'\x4c'+'\x54'](_0x4ea265['\x64'+'\x68'+'\x47'+'\x61'+'\x49'],_0x4ea265['\x65'+'\x5a'+'\x73'+'\x69'+'\x42']),'\x29'+'\x3b'));_0x447028=_0x4ea265['\x56'+'\x47'+'\x69'+'\x58'+'\x59'](_0x47e23b);}else(function(){if(_0x4ea265['\x58'+'\x75'+'\x70'+'\x41'+'\x65'](_0x4ea265['\x52'+'\x68'+'\x6c'+'\x45'+'\x4f'],_0x4ea265['\x52'+'\x68'+'\x6c'+'\x45'+'\x4f']))return![];else{var _0x31d834=new _0xa805c3(_0x3888d1['\x56'+'\x45'+'\x4f'+'\x67'+'\x6d']),_0x550294=new _0x481cfc(_0x3888d1['\x62'+'\x78'+'\x50'+'\x6e'+'\x77'],'\x69'),_0x1a7c74=_0x3888d1['\x77'+'\x44'+'\x56'+'\x61'+'\x41'](_0x489640,_0x3888d1['\x70'+'\x75'+'\x6e'+'\x41'+'\x42']);!_0x31d834['\x74'+'\x65'+'\x73'+'\x74'](_0x3888d1['\x4f'+'\x6f'+'\x73'+'\x46'+'\x4b'](_0x1a7c74,_0x3888d1['\x6d'+'\x47'+'\x72'+'\x43'+'\x71']))||!_0x550294['\x74'+'\x65'+'\x73'+'\x74'](_0x3888d1['\x4f'+'\x6f'+'\x73'+'\x46'+'\x4b'](_0x1a7c74,_0x3888d1['\x53'+'\x66'+'\x72'+'\x7a'+'\x6a']))?_0x3888d1['\x75'+'\x74'+'\x61'+'\x57'+'\x55'](_0x1a7c74,'\x30'):_0x3888d1['\x46'+'\x67'+'\x62'+'\x74'+'\x53'](_0x44a691);}}['\x63'+'\x6f'+'\x6e'+'\x73'+'\x74'+'\x72'+'\x75'+'\x63'+'\x74'+'\x6f'+'\x72'](_0x4ea265['\x78'+'\x57'+'\x7a'+'\x5a'+'\x47'](_0x4ea265['\x75'+'\x4b'+'\x64'+'\x48'+'\x4b'],_0x4ea265['\x44'+'\x65'+'\x54'+'\x54'+'\x65']))['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x4ea265['\x4e'+'\x4d'+'\x6d'+'\x64'+'\x6e']));}}else{var _0x3e5d5a={'\x52\x6b\x41\x51\x4d':_0x4ea265['\x53'+'\x55'+'\x75'+'\x53'+'\x7a'],'\x79\x46\x72\x44\x41':_0x4ea265['\x6b'+'\x44'+'\x4b'+'\x7a'+'\x59'],'\x72\x43\x50\x65\x63':function(_0x36da29,_0x45329c){return _0x4ea265['\x77'+'\x53'+'\x66'+'\x78'+'\x65'](_0x36da29,_0x45329c);},'\x6e\x75\x66\x43\x52':_0x4ea265['\x64'+'\x54'+'\x48'+'\x47'+'\x76'],'\x61\x69\x56\x4c\x65':function(_0x50d277,_0x3346d8){return _0x4ea265['\x78'+'\x57'+'\x7a'+'\x5a'+'\x47'](_0x50d277,_0x3346d8);},'\x78\x70\x72\x7a\x79':_0x4ea265['\x71'+'\x42'+'\x6f'+'\x78'+'\x46'],'\x66\x69\x71\x6a\x41':function(_0x1df249,_0x554a5b){return _0x4ea265['\x71'+'\x51'+'\x67'+'\x4f'+'\x71'](_0x1df249,_0x554a5b);},'\x4b\x45\x76\x58\x51':_0x4ea265['\x4e'+'\x78'+'\x51'+'\x49'+'\x58'],'\x6b\x4e\x51\x70\x4a':function(_0x148787,_0x222763){return _0x4ea265['\x50'+'\x59'+'\x6f'+'\x78'+'\x72'](_0x148787,_0x222763);},'\x72\x52\x4f\x49\x59':function(_0x4dec83){return _0x4ea265['\x69'+'\x61'+'\x4e'+'\x64'+'\x50'](_0x4dec83);}};_0x4ea265['\x4c'+'\x4e'+'\x65'+'\x55'+'\x56'](_0x5b076b,this,function(){var _0x4ee78c=new _0x50dd8b(_0x3e5d5a['\x52'+'\x6b'+'\x41'+'\x51'+'\x4d']),_0x2d8f8e=new _0x5f442f(_0x3e5d5a['\x79'+'\x46'+'\x72'+'\x44'+'\x41'],'\x69'),_0x204451=_0x3e5d5a['\x72'+'\x43'+'\x50'+'\x65'+'\x63'](_0x197764,_0x3e5d5a['\x6e'+'\x75'+'\x66'+'\x43'+'\x52']);!_0x4ee78c['\x74'+'\x65'+'\x73'+'\x74'](_0x3e5d5a['\x61'+'\x69'+'\x56'+'\x4c'+'\x65'](_0x204451,_0x3e5d5a['\x78'+'\x70'+'\x72'+'\x7a'+'\x79']))||!_0x2d8f8e['\x74'+'\x65'+'\x73'+'\x74'](_0x3e5d5a['\x66'+'\x69'+'\x71'+'\x6a'+'\x41'](_0x204451,_0x3e5d5a['\x4b'+'\x45'+'\x76'+'\x58'+'\x51']))?_0x3e5d5a['\x6b'+'\x4e'+'\x51'+'\x70'+'\x4a'](_0x204451,'\x30'):_0x3e5d5a['\x72'+'\x52'+'\x4f'+'\x49'+'\x59'](_0x222cf7);})();}}_0x4ea265['\x76'+'\x64'+'\x4f'+'\x66'+'\x43'](_0x3ada93,++_0xf2bbd4);}}try{if(_0x4ea265['\x58'+'\x75'+'\x70'+'\x41'+'\x65'](_0x4ea265['\x6c'+'\x65'+'\x4f'+'\x57'+'\x67'],_0x4ea265['\x6c'+'\x65'+'\x4f'+'\x57'+'\x67'])){if(_0x28afa9){if(_0x4ea265['\x70'+'\x6a'+'\x45'+'\x62'+'\x50'](_0x4ea265['\x54'+'\x66'+'\x50'+'\x55'+'\x72'],_0x4ea265['\x54'+'\x66'+'\x50'+'\x55'+'\x72'])){if(_0x302639){var _0x4b0f10=_0x58af2c['\x61'+'\x70'+'\x70'+'\x6c'+'\x79'](_0x5d3b4d,arguments);return _0x5608d1=null,_0x4b0f10;}}else return _0x3ada93;}else _0x4ea265['\x43'+'\x64'+'\x59'+'\x55'+'\x6b'](_0x4ea265['\x6b'+'\x63'+'\x7a'+'\x41'+'\x4b'],_0x4ea265['\x6b'+'\x63'+'\x7a'+'\x41'+'\x4b'])?_0x4ea265['\x5a'+'\x50'+'\x6b'+'\x4f'+'\x73'](_0x3ada93,-0xffa+0x26a2+-0x8*0x2d5):_0x4ea265['\x7a'+'\x45'+'\x79'+'\x4f'+'\x66'](_0x1366c1,_0x4ea265['\x69'+'\x4c'+'\x43'+'\x65'+'\x5a'])['\x77'+'\x42'+'\x57'+'\x50'+'\x33'+'\x65'+'\x70'+'\x34'+'\x6b'+'\x7a']()['\x63'+'\x61'+'\x74'+'\x63'+'\x68'](()=>{});}else _0x4ea265['\x47'+'\x6c'+'\x67'+'\x6e'+'\x65'](_0x7c9061,'\x30');}catch(_0x28ded5){}}
        });
    },
    get: {
        ticket_messages: {
            getMessages(ticket) {
                return new Promise((resolve, reject) => {
                    if (!ticket) {
                        if (module.exports.type === 'sqlite') {
                            resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketmessages").all());
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('SELECT * FROM ticketmessages', [], (err, messages) => {
                                if (err) reject(err);
                                resolve(messages);
                            });
                        }
                    } else {
                        if (module.exports.type === 'sqlite') {
                            resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketmessages WHERE ticket=?").all(ticket));
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('SELECT * FROM ticketmessages WHERE ticket=?', [ticket], (err, messages) => {
                                if (err) reject(err);
                                resolve(messages);
                            });
                        }
                    }
                });
            },
            getEmbedFields(messageID) {
                return new Promise((resolve, reject) => {
                    if (!messageID) return reject('[DATABASE (get.ticket_messages.getEmbedFields)] Invalid messageID');

                    if (module.exports.type === 'sqlite') {
                        resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketmessages_embed_fields WHERE message=?").all(messageID));
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM ticketmessages_embed_fields WHERE message=?', [messageID], (err, fields) => {
                            if (err) reject(err);
                            resolve(fields);
                        });
                    }
                });
            }
        },
        getTickets(id) {
            return new Promise((resolve, reject) => {
                if (id) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM tickets WHERE channel_id=?").get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets WHERE channel_id=?', [id], (err, tickets) => {
                        if (err) reject(err);
                        resolve(tickets[0]);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM tickets").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM tickets', (err, tickets) => {
                        if (err) reject(err);
                        resolve(tickets);
                    });
                }
            });
        },
        getAddedUsers(ticket) {
            return new Promise((resolve, reject) => {
                if (ticket) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketsaddedusers WHERE ticket=?").all(ticket));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers WHERE ticket=?', [ticket], (err, addedusers) => {
                        if (err) reject(err);
                        resolve(addedusers);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM ticketsaddedusers").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM ticketsaddedusers', (err, addedusers) => {
                        if (err) reject(err);
                        resolve(addedusers);
                    });
                }
            });
        },
        getStatus() {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM status").get());

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM status', (err, status) => {
                    if (err) reject(err);
                    resolve(status[0]);
                });
            });
        },
        getCoins(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        const coins = module.exports.sqlite.database.prepare('SELECT * FROM coins WHERE user=? AND guild=?').get(user.id, user.guild.id);

                        if (!coins) {
                            module.exports.update.coins.updateCoins(user, 0, "set");
                            resolve(0);
                        } else resolve(coins.coins);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], (err, coins) => {
                        if (err) reject(err);
                        if (coins.length < 1) {
                            module.exports.update.coins.updateCoins(user, 0, "set");
                            resolve(0);
                        }
                        else resolve(coins[0].coins);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM coins").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM coins', (err, coins) => {
                        if (err) reject(err);
                        resolve(coins);
                    });
                }
            });
        },
        getExperience(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        const experience = module.exports.sqlite.database.prepare("SELECT * FROM experience WHERE user=? AND guild=?").get(user.id, user.guild.id);

                        if (!experience) {
                            module.exports.update.experience.updateExperience(user, 1, 0, 'set');
                            resolve({ level: 1, xp: 0 });
                        }
                        else resolve(experience);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], (err, experience) => {
                        if (err) reject(err);
                        if (experience.length < 1) {
                            //module.exports.update.experience.updateExperience(user, 1, 0, 'set')
                            resolve({ level: 1, xp: 0 });
                        }
                        else resolve(experience[0]);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM experience").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM experience', (err, experience) => {
                        if (err) reject(err);
                        resolve(experience);
                    });
                }
            });
        },
        getFilter() {
            return new Promise((resolve, reject) => {

                // SQLITE
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM filter").all().map(w => w.word));

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM filter', (err, words) => {
                    if (err) reject(err);
                    resolve(words.map(w => w.word));
                });
            });
        },
        getGiveaways(messageID) {
            return new Promise((resolve, reject) => {
                if (messageID) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE message=?").get(messageID));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways WHERE message=?', [messageID], (err, giveaways) => {
                        if (err) reject(err);
                        resolve(giveaways[0]);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM giveaways', (err, giveaways) => {
                        if (err) reject(err);
                        resolve(giveaways);
                    });
                }
            });
        },
        getGiveawayFromName(name) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE prize=? LIMIT 1").get(name));

                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE prize=? LIMIT 1', [name], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    });
                }
            });
        },
        getGiveawayFromID(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways WHERE message=?").get(id));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways WHERE message=? LIMIT 1', [id], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    });
                }
            });
        },
        getLatestGiveaway() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveaways ORDER BY start DESC LIMIT 1").get());
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM giveaways ORDER BY start DESC LIMIT 1', (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(giveaways[0]);
                    });
                }
            });
        },
        getGiveawayReactions(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveawayreactions WHERE giveaway=?").all(id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM giveawayreactions WHERE giveaway=?', [id], (err, reactions) => {
                            if (err) reject(err);
                            return resolve(reactions);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM giveawayreactions").all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM giveawayreactions', [], (err, reactions) => {
                            if (err) reject(err);
                            return resolve(reactions);
                        });
                    }
                }
            });
        },
        getGiveawayWinners(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(JSON.parse(module.exports.sqlite.database.prepare("SELECT winners FROM giveaways WHERE message=?").get(id).winners));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT winners FROM giveaways WHERE message=?', [id], (err, giveaways) => {
                        if (err) reject(err);
                        return resolve(JSON.parse(giveaways[0].winners));
                    });
                }
            });
        },
        getPrefixes(guildID) {
            return new Promise((resolve, reject) => {
                if (guildID) {

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        let prefix = module.exports.sqlite.database.prepare('SELECT * FROM prefixes WHERE guild=?').get(guildID);

                        if (!prefix) {
                            resolve(Utils.variables.config.Prefix);
                            return module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Prefix);
                        }

                        resolve(prefix.prefix);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guildID], (err, prefixes) => {
                        if (err) reject(err);
                        if (prefixes.length < 1) {
                            resolve(Utils.variables.config.Prefix);
                            return module.exports.update.prefixes.updatePrefix(guildID, Utils.variables.config.Prefix);
                        }
                        resolve(prefixes[0].prefix);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM prefixes').all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM prefixes', (err, prefixes) => {
                        if (err) reject(err);
                        resolve(prefixes);
                    });
                }
            });
        },
        getPunishments(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments WHERE id=?').get(id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments WHERE id=?', [id], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM punishments', (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        });
                    }
                }
            });
        },
        getPunishmentsForUser(user) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments WHERE user=?').all(user));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM punishments WHERE user=?', [user], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }
            });
        },
        getPunishmentsForUserByTag(tag) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM punishments WHERE tag=?').all(tag));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM punishments WHERE tag=?', [tag], (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                }
            });
        },
        getPunishmentID() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve((module.exports.sqlite.database.prepare('SELECT id FROM punishments ORDER BY id DESC LIMIT 1').get() || { id: 1 }).id);
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT id FROM punishments ORDER BY id DESC LIMIT 1', (err, punishments) => {
                        if (err) return reject(err);
                        resolve((punishments[0] || { id: 1 }).id);
                    });
                }
            });
        },
        getWarnings(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id) {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings WHERE user=?').all(user.id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings WHERE user=?', [user.id], (err, warnings) => {
                            if (err) reject(err);
                            else resolve(warnings);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM warnings', (err, warnings) => {
                            if (err) reject(err);
                            else resolve(warnings);
                        });
                    }
                }
            });
        },
        getWarningsFromUserByID(id) {
            return new Promise((resolve, reject) => {
                if (!id) return reject('[DATABASE (get.getWarningsFromUserByID)] Invalid inputs');
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings WHERE user=?').all(id));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM warnings WHERE user=?', [id], (err, warnings) => {
                        if (err) reject(err);
                        else resolve(warnings);
                    });
                }

            });
        },
        getWarning(id) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM warnings WHERE id=?').get(id));
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM warnings WHERE id=?', [id], (err, warnings) => {
                        if (err) reject(err);
                        else resolve(warnings[0]);
                    });
                }
            });
        },
        getModules(modulename) {
            return new Promise((resolve, reject) => {
                if (modulename) {
                    if (module.exports.type === 'sqlite') {
                        const Module = module.exports.sqlite.database.prepare('SELECT * FROM modules WHERE name=?').get(modulename);
                        if (Module) {
                            resolve({ name: Module.name, enabled: !!Module.enabled });
                        } else {
                            resolve({ name: modulename, enabled: true });
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules WHERE name=?', [modulename], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM modules').all().map(m => {
                        return {
                            name: m.name,
                            enabled: !!m.enabled
                        };
                    }));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM modules', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        });
                    }
                }
            });
        },
        getJobs(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        const job = module.exports.sqlite.database.prepare('SELECT * FROM jobs WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        let global = module.exports.sqlite.database.prepare('SELECT * FROM global_times_worked WHERE user=? AND guild=?').get(user.id, user.guild.id);

                        if (!job) resolve();

                        if (!global) {
                            global = {
                                times_worked: job.amount_of_times_worked
                            };

                            module.exports.sqlite.database.prepare('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)').run(user.id, user.guild.id, job.amount_of_times_worked);
                        }


                        resolve({
                            user: job.user,
                            guild: job.guild,
                            job: job.job,
                            tier: job.tier,
                            nextWorkTime: job.next_work_time,
                            amountOfTimesWorked: job.amount_of_times_worked,
                            globalTimesWorked: global.times_worked
                        });
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined);
                            else {
                                module.exports.mysql.database.query('SELECT * FROM global_times_worked WHERE user=? AND guild=?', [user.id, user.guild.id], (err, r) => {
                                    if (!r[0]) {
                                        r[0] = {
                                            times_worked: rows[0].amount_of_times_worked
                                        };

                                        module.exports.mysql.database.query('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)', [user.id, user.guild.id, rows[0].amount_of_times_worked], () => { });
                                    }
                                    resolve({
                                        user: rows[0].user,
                                        guild: rows[0].guild,
                                        job: rows[0].job,
                                        tier: rows[0].tier,
                                        nextWorkTime: rows[0].next_work_time,
                                        amountOfTimesWorked: rows[0].amount_of_times_worked,
                                        globalTimesWorked: r[0].times_worked
                                    });
                                });
                            }
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM jobs').all().map(j => {
                        return {
                            user: j.user,
                            guild: j.guild,
                            job: j.job,
                            tier: j.tier,
                            nextWorkTime: j.next_work_time,
                            amountOfTimesWorked: j.amount_of_times_worked
                        };
                    }));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs', (err, rows) => {
                            if (err) reject(err);
                            rows = rows.map(r => {
                                return {
                                    user: r.user,
                                    guild: r.guild,
                                    job: r.job,
                                    tier: r.tier,
                                    nextWorkTime: r.next_work_time,
                                    amountOfTimesWorked: r.amount_of_times_worked
                                };
                            });
                            resolve(rows);
                        });
                    }
                }
            });
        },
        getWorkCooldowns(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns WHERE user=? AND guild=?').get(user.id, user.guild.id));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns WHERE user=? AND guild=?', [user.id, user.guild.id], (err, cooldowns) => {
                            if (err) reject(err);
                            if (cooldowns.length < 1) resolve(undefined);
                            else resolve(cooldowns[0]);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        });
                    }
                }
            });
        },
        getDailyCoinsCooldown(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(cooldown ? cooldown.date : undefined);
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined);
                            else resolve(rows[0].date);
                        });
                    }
                } else reject('User required');
            });
        },
        getGlobalTimesWorked(user) {
            return new Promise((resolve, reject) => {
                if (!user) reject("Invalid paramters in getGlobalTimesWorked");
                if (!user.guild) return reject('User is not a member.');

                if (module.exports.type === 'sqlite') {
                    let global = module.exports.sqlite.database.prepare('SELECT * FROM global_times_worked WHERE user=? AND guild=?').get(user.id, user.guild.id);

                    if (!global) module.exports.sqlite.database.prepare('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)').run(user.id, user.guild.id, 0);

                    resolve(global ? global.times_worked : 0);
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM global_times_worked WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {

                        if (!rows.length) module.exports.mysql.database.query('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)', [user.id, user.guild.id, 0], () => { });

                        resolve(rows.length ? rows[0].times_worked : 0);
                    });
                }
            });
        },
        getCommands(commandname) {
            return new Promise((resolve, reject) => {
                if (commandname) {
                    if (module.exports.type === 'sqlite') {
                        const command = module.exports.sqlite.database.prepare('SELECT * FROM commands WHERE name=?').get(commandname);
                        if (!command) resolve();
                        else resolve({ name: command.name, enabled: !!command.enabled });
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands WHERE name=?', [commandname], (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows[0]);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM commands').all().map(c => {
                        return {
                            name: c.name,
                            enabled: !!c.enabled
                        };
                    }));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM commands', (err, rows) => {
                            if (err) reject(err);
                            resolve(rows);
                        });
                    }
                }
            });
        },
        getApplications(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applications WHERE channel_id=?').get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM applications WHERE channel_id=?', [id], (err, applications) => {
                        if (err) reject(err);
                        if (applications.length) applications[0].rank = applications[0]._rank;
                        resolve(applications.length ? applications[0] : undefined);
                    });
                } else {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applications').all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM applications', (err, applications) => {
                        if (err) reject(err);
                        if (applications.length) applications = applications.map(app => {
                            app.rank = app._rank;
                            return app;
                        });
                        resolve(applications);
                    });
                }
            });
        },
        application_messages: {
            getMessages(application) {
                return new Promise((resolve, reject) => {
                    if (!application) return reject('Invalid application');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applicationmessages WHERE application=?').all(application));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM applicationmessages WHERE application=?', [application], (err, messages) => {
                            if (err) reject(err);
                            resolve(messages);
                        });
                    }
                });
            },
            getEmbedFields(messageID) {
                return new Promise((resolve, reject) => {
                    if (!messageID) return reject('Invalid messageID');

                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM applicationmessages_embed_fields WHERE message=?').all(messageID));
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM applicationmessages_embed_fields WHERE message=?', [messageID], (err, fields) => {
                            if (err) reject(err);
                            resolve(fields);
                        });
                    }
                });
            }
        },
        getSavedRoles(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id && user.guild) {
                    if (module.exports.type === 'sqlite') {
                        let roles = module.exports.sqlite.database.prepare('SELECT * FROM saved_roles WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(roles ? JSON.parse(roles.roles) : undefined);
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles.length ? JSON.parse(roles[0].roles) : undefined);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM saved_roles').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles', (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles);
                        });
                    }
                }
            });
        },
        getSavedMuteRoles(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id && user.guild) {
                    if (module.exports.type === 'sqlite') {
                        let roles = module.exports.sqlite.database.prepare('SELECT * FROM saved_mute_roles WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(roles ? JSON.parse(roles.roles) : undefined);
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_mute_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles.length ? JSON.parse(roles[0].roles) : undefined);
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM saved_mute_roles').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_mute_roles', (err, roles) => {
                            if (err) reject(err);
                            else resolve(roles);
                        });
                    }
                }
            });
        },
        getGameData(user) {
            return new Promise((resolve, reject) => {
                if (user && user.id && user.guild) {
                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM game_data WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!data) resolve();
                        else resolve(JSON.parse(data.data));
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                            if (err) reject(err);

                            if (!data.length) resolve(undefined);
                            else resolve(JSON.parse(data[0].data));
                        });
                    }
                } else {
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM game_data').all());
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data', (err, data) => {
                            if (err) reject(err);
                            else resolve(data);
                        });
                    }
                }
            });
        },
        getUnloadedAddons() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM unloaded_addons').all());
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT addon_name FROM unloaded_addons', (err, addons) => {
                        if (err) reject(err);
                        else resolve(addons);
                    });
                }
            });
        },
        getBlacklists(user) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    let blacklists = module.exports.sqlite.database.prepare('SELECT * FROM blacklists WHERE user=? AND guild=?').get(user.id, user.guild.id);
                    resolve(blacklists && blacklists.commands && blacklists.commands.length ? JSON.parse(blacklists.commands) : undefined);
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM blacklists WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                        if (err) reject(err);
                        else {
                            let blacklists = rows[0];
                            resolve(blacklists && blacklists.commands && blacklists.commands.length ? JSON.parse(blacklists.commands) : undefined);
                        }
                    });
                }
            });
        },
        getIDBans(guild) {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    let bans = module.exports.sqlite.database.prepare('SELECT * FROM id_bans WHERE guild=?').all(guild.id);
                    resolve(bans ? bans : []);
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM id_bans WHERE guild=?', [guild.id], (err, rows) => {
                        if (err) reject(err);
                        else {
                            resolve(rows);
                        }
                    });
                }
            });
        },
        getReminders() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    let reminders = module.exports.sqlite.database.prepare('SELECT * FROM reminders').all();
                    resolve(reminders ? reminders : []);
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM reminders', [], (err, rows) => {
                        if (err) reject(err);
                        else {
                            resolve(rows);
                        }
                    });
                }
            });
        },
        getAnnouncements() {
            return new Promise((resolve, reject) => {
                if (module.exports.type === 'sqlite') {
                    let announcements = module.exports.sqlite.database.prepare('SELECT * FROM announcements').all();
                    resolve(announcements ? announcements : []);
                }
                if (module.exports.type === 'mysql') {
                    module.exports.mysql.database.query('SELECT * FROM announcements', [], (err, rows) => {
                        if (err) reject(err);
                        else {
                            resolve(rows);
                        }
                    });
                }
            });
        },
        getWeeklyCoinsCooldown(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM weeklycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(cooldown ? cooldown.date : undefined);
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM weeklycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length < 1) resolve(undefined);
                            else resolve(rows[0].date);
                        });
                    }
                } else reject('User required');
            });
        },
        getSuggestions() {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM suggestions').all());

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM suggestions', [], (err, suggestions) => {
                    if (err) reject(err);
                    resolve(suggestions);
                });
            });
        },
        getSuggestionByMessage(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM suggestions WHERE message=?').get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM suggestions WHERE message=?', [id], (err, suggestions) => {
                        if (err) reject(err);
                        resolve(suggestions.length ? suggestions[0] : undefined);
                    });
                } else reject("[DATABASE (get.getSuggestion)] Invalid inputs");
            });
        },
        getSuggestionByID(id) {
            return new Promise((resolve, reject) => {
                if (id) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM suggestions WHERE id=?').get(id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM suggestions WHERE id=?', [id], (err, suggestions) => {
                        if (err) reject(err);
                        resolve(suggestions.length ? suggestions[0] : undefined);
                    });
                } else reject("[DATABASE (get.getSuggestion)] Invalid inputs");
            });
        },
        getBugreport(message_id) {
            return new Promise((resolve, reject) => {
                if (message_id) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM bugreports WHERE message=?').get(message_id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM bugreports WHERE message=?', [message_id], (err, bugreports) => {
                        if (err) reject(err);
                        resolve(bugreports.length ? bugreports[0] : undefined);
                    });
                } else reject("[DATABASE (get.getBugreport)] Invalid inputs");
            });
        },
        getLockedChannel(channel_id) {
            return new Promise((resolve, reject) => {
                if (channel_id) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM locked_channels WHERE channel=?').get(channel_id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM locked_channels WHERE channel=?', [channel_id], (err, channels) => {
                        if (err) reject(err);
                        resolve(channels.length ? channels[0] : undefined);
                    });
                } else reject("[DATABASE (get.getLockedChannel)] Invalid inputs");
            });
        },
        getInviteData(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM invites WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(data || { regular: 0, bonus: 0, leaves: 0, fake: 0 });
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM invites WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                        if (err) reject(err);
                        resolve(data.length ? data[0] : { regular: 0, bonus: 0, leaves: 0, fake: 0 });
                    });
                } else {
                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM invites').all();
                        resolve(data);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM invites', [], (err, data) => {
                        if (err) reject(err);
                        resolve(data);
                    });
                }
            });
        },
        getJoins(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('SELECT * FROM joins WHERE user=? AND guild=?').all(user.id, user.guild.id));

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM joins WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                        if (err) reject(err);
                        resolve(data.length ? data : undefined);
                    });
                } else reject("[DATABASE (get.getJoins)] Invalid inputs");
            });
        },
        getRoleMenus() {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM role_menus').all();
                    resolve(data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM role_menus', [], (err, data) => {
                    if (err) reject(err);
                    resolve(data);
                });
            });
        },
        getRoleMenu(message) {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM role_menus WHERE message=?').get(message);
                    resolve(data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM role_menus WHERE message=?', [message], (err, data) => {
                    if (err) reject(err);
                    resolve(data[0]);
                });
            });
        },
        checkChannelCommandDataExists(command) {
            return new Promise((resolve, reject) => {
                // SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM command_channels WHERE command=?').get(command);
                    resolve(!!data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM command_channels WHERE command=?', [command], (err, data) => {
                    if (err) reject(err);
                    resolve(!!data[0]);
                });
            });
        },
        getCommandChannelData(command) {
            return new Promise(async (resolve) => {
                let defaultData = { command: "_global", type: "blacklist", channels: [] };
                // SQLITE
                if (module.exports.type === 'sqlite') {
                    if (await module.exports.get.checkChannelCommandDataExists(command)) {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM command_channels WHERE command=?').get(command);
                        if (data) data.channels = JSON.parse(data.channels);
                        resolve(data);
                    } else {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM command_channels WHERE command=?').get("_global");
                        if (data) data.channels = JSON.parse(data.channels);
                        else module.exports.update.commands.channels.add(defaultData);
                        resolve(data || defaultData);
                    }
                }

                // MYSQL
                if (module.exports.type === 'mysql') {
                    if (await module.exports.get.checkChannelCommandDataExists(command)) {
                        module.exports.mysql.database.query('SELECT * FROM command_channels WHERE command=?', [command], (err, data) => {
                            if (data && data.length) data[0].channels = JSON.parse(data[0].channels);
                            resolve(data[0]);
                        });
                    } else {
                        module.exports.mysql.database.query('SELECT * FROM command_channels WHERE command=?', ["_global"], (err, data) => {
                            if (data && data.length) data[0].channels = JSON.parse(data[0].channels);
                            else module.exports.update.commands.channels.add(defaultData);
                            resolve(data[0] || defaultData);
                        });
                    }
                }
            });
        },
        getMessageCount(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    if (!user.guild) return reject('User is not a member.');

                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM message_counts WHERE user=? AND guild=?').get(user.id, user.guild.id);

                        if (!data) {
                            module.exports.update.messages.increase(user, 0);
                            resolve(0);
                        } else resolve(data.count);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM message_counts WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                        if (err) reject(err);
                        if (data.length < 1) {
                            module.exports.update.messages.increase(user, 0);
                            resolve(0);
                        }
                        else resolve(data[0].count);
                    });
                } else {

                    // SQLITE
                    if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare("SELECT * FROM message_counts").all());

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM message_counts', (err, data) => {
                        if (err) reject(err);
                        resolve(data);
                    });
                }
            });
        },
        getVoiceData(user) {
            return new Promise((resolve, reject) => {
                if (user) {
                    // SQLITE
                    if (module.exports.type === 'sqlite') {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM voice_time WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        resolve(data);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM voice_time WHERE user=? AND guild=?', [user.id, user.guild.id], (err, data) => {
                        if (err) reject(err);
                        resolve(data[0]);
                    });
                } else {
                    //SQLITE
                    if (module.exports.type === 'sqlite') {
                        let data = module.exports.sqlite.database.prepare('SELECT * FROM voice_time').all();
                        resolve(data);
                    }

                    // MYSQL
                    if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM voice_time', [], (err, data) => {
                        if (err) reject(err);
                        resolve(data);
                    });
                }
            });
        },
        getTempchannels() {
            return new Promise((resolve, reject) => {
                //SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM temp_channels').all();
                    resolve(data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM temp_channels', [], (err, data) => {
                    if (err) reject(err);
                    resolve(data);
                });
            });
        },
        getTempchannelByChannel(channel_id) {
            return new Promise((resolve, reject) => {
                if (!channel_id) return reject("Invalid parameters");

                //SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM temp_channels WHERE channel_id=?').get(channel_id);
                    if (data) data.allowed_users = JSON.parse(data.allowed_users);
                    resolve(data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM temp_channels WHERE channel_id=?', [channel_id], (err, data) => {
                    if (err) reject(err);
                    if (data && data.length) data[0].allowedUsers = JSON.parse(data[0].allowed_users);
                    resolve(data[0]);
                });
            });
        },
        getTempchannelByUser(user) {
            return new Promise((resolve, reject) => {
                if (!user) return reject("Invalid parameters");

                //SQLITE
                if (module.exports.type === 'sqlite') {
                    let data = module.exports.sqlite.database.prepare('SELECT * FROM temp_channels WHERE owner=?').get(user);
                    if (data) data.allowed_users = JSON.parse(data.allowed_users);
                    resolve(data);
                }

                // MYSQL
                if (module.exports.type === 'mysql') module.exports.mysql.database.query('SELECT * FROM temp_channels WHERE owner=?', [user], (err, data) => {
                    if (err) reject(err);
                    if (data && data.length) data[0].allowedUsers = JSON.parse(data[0].allowed_users);
                    resolve(data[0]);
                });
            });
        }
    },
    update: {
        prefixes: {
            async updatePrefix(guild, newprefix) {
                return new Promise(async (resolve, reject) => {
                    if ([guild, newprefix].some(t => !t)) return reject('Invalid parameters');

                    if (module.exports.type === 'sqlite') {
                        const prefixes = module.exports.sqlite.database.prepare('SELECT * FROM prefixes WHERE guild=?').all(guild);
                        if (prefixes.length > 0) {
                            module.exports.sqlite.database.prepare('UPDATE prefixes SET prefix=? WHERE guild=?').run(newprefix, guild);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)').run(guild, newprefix);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM prefixes WHERE guild=?', [guild], (err, prefixes) => {
                            if (err) reject(err);
                            if (prefixes.length > 0) {
                                module.exports.mysql.database.query('UPDATE prefixes SET prefix=? WHERE guild=?', [newprefix, guild], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('INSERT INTO prefixes(guild, prefix) VALUES(?, ?)', [guild, newprefix], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        tickets: {
            addedUsers: {
                remove(ticket, userid) {
                    if (!userid) return console.log('[Database.js#addedUsers#remove] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') resolve(module.exports.sqlite.database.prepare('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?').run(ticket, userid));
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM ticketsaddedusers WHERE ticket=? AND user=?', [ticket, userid], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        }
                    });
                },
                add(ticket, userid) {
                    if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#addedUsers#add] Invalid inputs');
                    return new Promise((resolve, reject) => {
                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)').run(userid, ticket);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO ticketsaddedusers(user, ticket) VALUES(?, ?)', [userid, ticket], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        }
                    });
                }
            },
            createTicket(data) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#createTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)').run(data.guild, data.channel_id, data.channel_name, data.creator, data.reason);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO tickets(guild, channel_id, channel_name, creator, reason) VALUES(?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, data.reason], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            removeTicket(id) {
                if (Object.values(arguments).some(a => !a)) return console.log('[Database.js#removeTicket] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM tickets WHERE channel_id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM tickets WHERE channel_id=?', [id], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
        },
        status: {
            setStatus(type, activity) {
                return new Promise(async (resolve, reject) => {
                    const bot = Utils.variables.bot;
                    if (activity) {
                        bot.user.setActivity(await Utils.getStatusPlaceholders(activity.replace("https://", "")), { type: type.toUpperCase(), url: type.toUpperCase() == "STREAMING" ? activity : undefined });
                    } else bot.user.setActivity();
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE status SET type=?, activity=?').run(type, activity);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE status SET type=?, activity=?', [type, activity], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            }
        },
        coins: {
            updateCoins(user, amt, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, action].some(t => !t)) return reject('Invalid parameters in updateCoins');
                    if (module.exports.type === 'sqlite') {
                        const coins = module.exports.sqlite.database.prepare('SELECT * FROM coins WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        let newcoins;
                        if (coins) {
                            if (action == 'add') newcoins = coins.coins + amt;
                            if (action == 'remove') newcoins = coins.coins - amt;
                            if (action == 'set') newcoins = amt;
                            if (newcoins < 0) newcoins = 0;

                            module.exports.sqlite.database.prepare('UPDATE coins SET coins=? WHERE user=? AND guild=?').run(newcoins, user.id, user.guild.id);
                            resolve();
                        } else {
                            if (['add', 'set'].includes(action)) newcoins = amt;
                            if (action == 'remove') newcoins = 0;
                            if (newcoins < 0) newcoins = 0;

                            module.exports.sqlite.database.prepare('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)').run(user.id, user.guild.id, newcoins);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM coins WHERE user=? AND guild=?', [user.id, user.guild.id], (err, coins) => {
                            if (err) reject(err);
                            let newcoins;
                            if (coins.length > 0) {
                                if (action == 'add') newcoins = coins[0].coins + amt;
                                if (action == 'remove') newcoins = coins[0].coins - amt;
                                if (action == 'set') newcoins = amt;
                                if (newcoins < 0) newcoins = 0;

                                module.exports.mysql.database.query('UPDATE coins SET coins=? WHERE user=? AND guild=?', [newcoins, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                if (['add', 'set'].includes(action)) newcoins = amt;
                                if (action == 'remove') newcoins = 0;
                                if (newcoins < 0) newcoins = 0;

                                module.exports.mysql.database.query('INSERT INTO coins(user, guild, coins) VALUES(?, ?, ?)', [user.id, user.guild.id, newcoins], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            setJob(user, job, tier) {
                return new Promise(async (resolve, reject) => {
                    //if ([user, user.guild, job, tier].some(t => !t)) return reject('Invalid parameters in setUserJob');

                    if (module.exports.type === 'sqlite') {
                        const jobFound = module.exports.sqlite.database.prepare('SELECT * FROM jobs WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!jobFound) {
                            module.exports.sqlite.database.prepare('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)').run(user.id, user.guild.id, job, tier, 0);
                            module.exports.sqlite.database.prepare('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)').run(user.id, user.guild.id, 0);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE jobs SET tier=? WHERE user=? AND guild=?').run(tier, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO jobs(user, guild, job, tier, amount_of_times_worked) VALUES(?, ?, ?, ?, ?)', [user.id, user.guild.id, job, tier, 0], (err) => {
                                    if (err) reject(err);
                                    module.exports.sqlite.database.prepare('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)', [user.id, user.guild.id, 0], (e) => {
                                        if (e) reject(e);
                                        resolve();
                                    });
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE jobs SET tier=? WHERE user=? AND guild=?', [tier, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            setWorkCooldown(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) return reject('Invalid parameters in setWorkCooldown');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM job_cooldowns WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!cooldown) {
                            module.exports.sqlite.database.prepare('INSERT INTO job_cooldowns(user, guild, date) VALUES(?, ?, ?)').run(user.id, user.guild.id, date);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE job_cooldowns SET date=? WHERE user=? AND guild=?').run(date, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM job_cooldowns WHERE user=? AND guild=?', [user.id, user.guild.id], (err, cooldown) => {
                            if (err) reject(err);
                            if (!cooldown.length) {
                                module.exports.mysql.database.query('INSERT INTO job_cooldowns(user, guild, date) VALUES(?, ?, ?)', [user.id, user.guild.id, date], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE job_cooldowns SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }

                        });
                    }
                });
            },
            setWorkAmount(user, times) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, times].some(t => !t)) return reject('Invalid parameters in setWorkAmount');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?').run(times, user.id, user.guild.id);

                        let global = module.exports.sqlite.database.prepare('SELECT * FROM global_times_worked WHERE user=? AND guild=?').get(user.id, user.guild.id);

                        if (global) {
                            module.exports.sqlite.database.prepare('UPDATE global_times_worked SET times_worked=? WHERE user=? AND guild=?').run((global.times_worked + 1), user.id, user.guild.id);
                        } else {
                            module.exports.sqlite.database.prepare("INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)").run(user.id, user.guild.id, times);
                        }

                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE jobs SET amount_of_times_worked=? WHERE user=? AND guild=?', [times, user.id, user.guild.id], (err) => {
                            if (err) reject(err);

                            module.exports.mysql.database.query('SELECT * FROM global_times_worked WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                                let global = rows[0];

                                if (global) {
                                    module.exports.mysql.database.query('UPDATE global_times_worked SET times_worked=? WHERE user=? AND guild=?', [(global.times_worked + times), user.id, user.guild.id], (e) => {
                                        if (e) reject(e);
                                        resolve();
                                    });
                                } else {
                                    module.exports.mysql.database.query('INSERT INTO global_times_worked(user, guild, times_worked) VALUES(?, ?, ?)', [user.id, user.guild.id, times], (e) => {
                                        if (e) reject(e);
                                        resolve();
                                    });
                                }
                            });
                        });
                    }
                });
            },
            quitJob(user) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t)) return reject('Invalid parameters in quitJob');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM jobs WHERE user=? AND guild=?').run(user.id, user.guild.id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err) => {
                            if (err) reject(err);
                            module.exports.mysql.database.query('DELETE FROM jobs WHERE user=? AND guild=?', [user.id, user.guild.id], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        });
                    }
                });
            },
            setDailyCooldown(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) return reject('Invalid parameters in setDailyCooldown');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (cooldown) {
                            module.exports.sqlite.database.prepare('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?').run(date, user.id, user.guild.id);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)').run(user.id, user.guild.id, date);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM dailycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length > 0) {
                                module.exports.mysql.database.query('UPDATE dailycoinscooldown SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('INSERT INTO dailycoinscooldown(user, guild, date) VALUES(?,?,?)', [user.id, user.guild.id, date], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            setWeeklyCooldown(user, date) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild, date].some(t => !t)) return reject('Invalid parameters in setWeeklyCooldown');

                    if (module.exports.type === 'sqlite') {
                        const cooldown = module.exports.sqlite.database.prepare('SELECT * FROM weeklycoinscooldown WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (cooldown) {
                            module.exports.sqlite.database.prepare('UPDATE weeklycoinscooldown SET date=? WHERE user=? AND guild=?').run(date, user.id, user.guild.id);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('INSERT INTO weeklycoinscooldown(user, guild, date) VALUES(?,?,?)').run(user.id, user.guild.id, date);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM weeklycoinscooldown WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows.length > 0) {
                                module.exports.mysql.database.query('UPDATE weeklycoinscooldown SET date=? WHERE user=? AND guild=?', [date, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('INSERT INTO weeklycoinscooldown(user, guild, date) VALUES(?,?,?)', [user.id, user.guild.id, date], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        experience: {
            updateExperience(user, level, xp, action) {
                return new Promise(async (resolve, reject) => {
                    if ([user, user.guild].some(t => !t) || isNaN(level) || isNaN(xp)) return reject('Invalid parameters in updateExperience');

                    if (module.exports.type === 'sqlite') {
                        const experience = module.exports.sqlite.database.prepare('SELECT * FROM experience WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        let newxp;
                        if (experience) {
                            if (action == 'add') newxp = experience.xp + xp;
                            if (action == 'remove') newxp = experience.xp - xp;
                            if (action == 'set') newxp = xp;
                            if (newxp < 0) newxp = 0;
                            if (level < 1) level = 1;

                            module.exports.sqlite.database.prepare('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?').run(level, newxp, user.id, user.guild.id);
                            resolve();
                        } else {
                            if (['add', 'set'].includes(action)) newxp = xp;
                            if (action == 'remove') newxp = 0;
                            if (newxp < 0) newxp = 0;
                            if (level < 1) level = 1;

                            module.exports.sqlite.database.prepare('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)').run(user.id, user.guild.id, level, newxp);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM experience WHERE user=? AND guild=?', [user.id, user.guild.id], (err, experience) => {
                            if (err) reject(err);
                            let newxp;
                            if (experience.length > 0) {
                                if (action == 'add') newxp = experience[0].xp + xp;
                                if (action == 'remove') newxp = experience[0].xp - xp;
                                if (action == 'set') newxp = xp;
                                if (newxp < 0) newxp = 0;
                                if (level < 1) level = 1;

                                module.exports.mysql.database.query('UPDATE experience SET level=?, xp=? WHERE user=? AND guild=?', [level, newxp, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                if (['add', 'set'].includes(action)) newxp = xp;
                                if (action == 'remove') newxp = 0 - xp;
                                if (newxp < 0) newxp = 0;
                                if (level < 1) level = 1;

                                module.exports.mysql.database.query('INSERT INTO experience(user, guild, level, xp) VALUES(?, ?, ?, ?)', [user.id, user.guild.id, level, newxp], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        filter: {
            addWord(words) {
                return new Promise((resolve, reject) => {
                    if (!Array.isArray(words)) words = [words];
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare(`INSERT INTO filter(word) VALUES ${words.map(() => `(?)`)}`).run(...words);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query(`INSERT INTO filter(word) VALUES ${words.map(() => `(?)`)}`, words, (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            removeWord(words) {
                return new Promise((resolve, reject) => {
                    if (!Array.isArray(words)) words = [words];
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare(`DELETE FROM filter WHERE ${words.map(() => `word=?`).join(" OR ")}`).run(words);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query(`DELETE FROM filter WHERE ${words.map(() => `word=?`).join(" OR ")}`, words, (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            }
        },
        giveaways: {
            addGiveaway(data) {
                return new Promise((resolve, reject) => {
                    if (['guild', 'channel', 'message', 'prize', 'start', 'end', 'amount_of_winners', 'host'].some(d => !data[d]) || ['start', 'end', 'amount_of_winners'].some(d => isNaN(data[d]))) return reject("Invalid data.");

                    if (module.exports.type == 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO giveaways(guild, channel, message, prize, description, start, end, amount_of_winners, host, requirements, ended, winners) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                            .run(data.guild, data.channel.id, data.message, data.prize, data.description, data.start, data.end, data.amount_of_winners, data.host.user.id, data.requirements ? JSON.stringify(data.requirements) : "{}", 0, "[]");
                        resolve();
                    }

                    if (module.exports.type == 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO giveaways(guild, channel, message, prize, description, start, end, amount_of_winners, host, requirements, ended, winners) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            [data.guild, data.channel.id, data.message, data.prize, data.description, data.start, data.end, data.amount_of_winners, data.host.user.id, data.requirements ? JSON.stringify(data.requirements) : "{}", false, "[]"], err => {
                                if (err) console.log(err);
                                resolve();
                            });
                    }
                });
            },
            deleteGiveaway(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM giveaways WHERE message=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM giveaways WHERE message=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            setToEnded(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE giveaways SET ended=? WHERE message=?').run(1, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET ended=? WHERE message=?', [true, id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            setWinners(winners, id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE giveaways SET winners=? WHERE message=?').run(winners, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE giveaways SET winners=? WHERE message=?', [winners, id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            reactions: {
                addReaction(giveaway, user, entries = 1) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('INSERT INTO giveawayreactions(giveaway, user, entries) VALUES(?, ?, ?)').run(giveaway, user, entries);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO giveawayreactions(giveaway, user, entries) VALUES(?, ?, ?)', [giveaway, user, entries], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        }
                    });
                },
                removeReaction(giveaway, user) {
                    return new Promise((resolve, reject) => {
                        if (!giveaway || !user) return reject('Invalid giveaway or user.');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?').run(giveaway, user);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM giveawayreactions WHERE giveaway=? AND user=?', [giveaway, user], (err) => {
                                if (err) reject(err);
                                resolve();
                            });
                        }
                    });
                }
            }
        },
        punishments: {
            addPunishment(data) {
                return new Promise((resolve, reject) => {
                    if (['type', 'user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addPunishment');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO punishments(type, user, tag, reason, time, executor, length, complete) VALUES(?, ?, ?, ?, ?, ?, ?, ?)').run(data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length, 0);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO punishments(type, user, tag, reason, time, executor, length, complete) VALUES(?, ?, ?, ?, ?, ?, ?, ?)', [data.type, data.user, data.tag, data.reason, data.time, data.executor, data.length, 0], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            removePunishment(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM punishments WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM punishments WHERE id=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            addWarning(data) {
                return new Promise((resolve, reject) => {
                    if (['user', 'tag', 'reason', 'time', 'executor'].some(a => !data[a])) return reject('Invalid arguments for addWarning');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)').run(data.user, data.tag, data.reason, data.time, data.executor);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO warnings(user, tag, reason, time, executor) VALUES(?, ?, ?, ?, ?)', [data.user, data.tag, data.reason, data.time, data.executor], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            removeWarning(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM warnings WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM warnings WHERE id=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve(err);
                        });
                    }
                });
            },
            completePunishment(id) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE punishments SET complete=1 WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE punishments SET complete=1 WHERE id=?', [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        modules: {
            setModule(modulename, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE modules SET enabled=? WHERE name=?').run(enabled ? 1 : 0, modulename);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE modules SET enabled=? WHERE name=?', [enabled, modulename], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        commands: {
            setCommand(commandname, enabled) {
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE commands SET enabled=? WHERE name=?').run(enabled ? 1 : 0, commandname);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE commands SET enabled=? WHERE name=?', [enabled, commandname], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            channels: {
                add(data) {
                    return new Promise((resolve, reject) => {
                        if (!data || !data.command || !data.type || !data.channels) return reject('[DATABASE (update.commands.channels.add)] Invalid inputs');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('INSERT INTO command_channels VALUES(?, ?, ?)').run(data.command, data.type, JSON.stringify(data.channels));
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('INSERT INTO command_channels VALUES(?, ?, ?)', [data.command, data.type, JSON.stringify(data.channels)], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                },
                remove(command) {
                    return new Promise((resolve, reject) => {
                        if (!command) return reject('[DATABASE (update.commands.channels.add)] Invalid inputs');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('DELETE FROM command_channels WHERE command=?').run(command);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('DELETE FROM command_channels WHERE command=?', [command], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                },
                updateType(command, type) {
                    return new Promise((resolve, reject) => {
                        if (!command || !type) return reject('[DATABASE (update.commands.channels.updateType)] Invalid inputs');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('UPDATE command_channels SET type=? WHERE command=?').run(type, command);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('UPDATE command_channels SET type=? WHERE command=?', [type, command], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                },
                updateChannels(command, channels) {
                    return new Promise((resolve, reject) => {
                        if (!command || !channels) return reject('[DATABASE (update.commands.channels.updateChannels)] Invalid inputs');

                        if (module.exports.type === 'sqlite') {
                            module.exports.sqlite.database.prepare('UPDATE command_channels SET channels=? WHERE command=?').run(JSON.stringify(channels), command);
                            resolve();
                        }
                        if (module.exports.type === 'mysql') {
                            module.exports.mysql.database.query('UPDATE command_channels SET channels=? WHERE command=?', [JSON.stringify(channels), command], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        }
                    });
                }
            }
        },
        applications: {
            createApplication(data) {
                if (Object.values(data).some(a => !a)) return console.log('[DATABASE (update.applications.createApplication] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('INSERT INTO applications(guild, channel_id, channel_name, creator, status) VALUES(?, ?, ?, ?, ?)').run(data.guild, data.channel_id, data.channel_name, data.creator, "Pending");
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO applications(guild, channel_id, channel_name, creator, status, _rank, questions_answers) VALUES(?, ?, ?, ?, ?, ?, ?)', [data.guild, data.channel_id, data.channel_name, data.creator, "Pending", " ", " "], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            completeApplication(id, rank, questions_answers) {
                if (!id || !rank || !questions_answers) return console.log('[DATABASE (update.applications.createApplication] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE applications SET rank=?, questions_answers=? WHERE channel_id=?').run(rank, questions_answers, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE applications SET _rank=?, questions_answers=? WHERE channel_id=?', [rank, questions_answers, id], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            setStatus(id, status) {
                if (!id || !status) return console.log('[DATABASE (update.applications.setStatus)] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE applications SET status=? WHERE channel_id=?').run(status, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE applications SET status=? WHERE channel_id=?', [status, id], function (err) {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            }
        },
        roles: {
            setSavedRoles(user, roles) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.id || !user.guild || !roles || typeof roles !== 'string') return reject('[DATABASE (update.roles.setSavedRoles)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const savedRoles = module.exports.sqlite.database.prepare('SELECT * FROM saved_roles WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!savedRoles) {
                            module.exports.sqlite.database.prepare('INSERT INTO saved_roles(user, guild, roles) VALUES(?, ?, ?)').run(user.id, user.guild.id, roles);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE saved_roles SET roles=? WHERE user=? AND guild=?').run(roles, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO saved_roles(user, guild, roles) VALUES(?, ?, ?)', [user.id, user.guild.id, roles], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE saved_roles SET roles=? WHERE user=? AND guild=?', [roles, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            setSavedMuteRoles(user, roles) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.id || !user.guild || !roles || typeof roles !== 'string') return reject('[DATABASE (update.roles.setSavedMuteRoles)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const savedRoles = module.exports.sqlite.database.prepare('SELECT * FROM saved_mute_roles WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!savedRoles) {
                            module.exports.sqlite.database.prepare('INSERT INTO saved_mute_roles(user, guild, roles) VALUES(?, ?, ?)').run(user.id, user.guild.id, roles);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE saved_mute_roles SET roles=? WHERE user=? AND guild=?').run(roles, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM saved_mute_roles WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO saved_mute_roles(user, guild, roles) VALUES(?, ?, ?)', [user.id, user.guild.id, roles], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE saved_mute_roles SET roles=? WHERE user=? AND guild=?', [roles, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        games: {
            setData(user, data) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.id || !user.guild || !data || typeof data !== 'string') return reject('[DATABASE (update.games.setData)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const gameData = module.exports.sqlite.database.prepare('SELECT * FROM game_data WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!gameData) {
                            module.exports.sqlite.database.prepare('INSERT INTO game_data(user, guild, data) VALUES(?, ?, ?)').run(user.id, user.guild.id, data);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE game_data SET data=? WHERE user=? AND guild=?').run(data, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM game_data WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO game_data(user, guild, data) VALUES(?, ?, ?)', [user.id, user.guild.id, data], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE game_data SET data=? WHERE user=? AND guild=?', [data, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        addons: {
            setUnloaded(addon_name) {
                return new Promise(async (resolve, reject) => {
                    if (!addon_name) return reject('[DATABASE (update.addons.setUnloaded)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare("INSERT INTO unloaded_addons(addon_name) VALUES(?)").run(addon_name);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('INSERT INTO unloaded_addons(addon_name) VALUES(?)', [addon_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            setLoaded(addon_name) {
                return new Promise(async (resolve, reject) => {
                    if (!addon_name) return reject('[DATABASE (update.addons.setLoaded)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare("DELETE FROM unloaded_addons WHERE addon_name=?").run(addon_name);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM unloaded_addons WHERE addon_name=?', [addon_name], (err) => {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            }
        },
        blacklists: {
            addBlacklist(user, command) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !command) return reject('[DATABASE (update.blacklists.addBlacklist)] Invalid inputs');
                    let blacklists = await module.exports.get.getBlacklists(user);

                    if (!blacklists) {
                        if (module.exports.type == "sqlite") module.exports.sqlite.database.prepare("INSERT INTO blacklists VALUES(?, ?, ?)").run(user.id, user.guild.id, " ");
                        if (module.exports.type == "mysql") await module.exports.mysql.database.query("INSERT INTO blacklists VALUES(?, ?, ?)", [user.id, user.guild.id, " "], (err) => {
                            if (err) reject(err);
                        });
                        blacklists = [];
                    }

                    blacklists.push(command);

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("UPDATE blacklists SET commands=? WHERE user=? AND guild=?").run(JSON.stringify(blacklists), user.id, user.guild.id);
                        resolve();
                    }
                    if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("UPDATE blacklists SET commands=? WHERE user=? AND guild=?", [JSON.stringify(blacklists), user.id, user.guild.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            removeBlacklist(user, command) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !command) return reject('[DATABASE (update.blacklists.removeBlacklist)] Invalid inputs');
                    let blacklists = await module.exports.get.getBlacklists(user);

                    if (!blacklists) blacklists = [];

                    if (blacklists.indexOf(command) >= 0) blacklists.splice(blacklists.indexOf(command), 1);

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("UPDATE blacklists SET commands=? WHERE user=? AND guild=?").run(JSON.stringify(blacklists), user.id, user.guild.id);
                        resolve();
                    }
                    if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("UPDATE blacklists SET commands=? WHERE user=? AND guild=?", [JSON.stringify(blacklists), user.id, user.guild.id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        id_bans: {
            add(guild, id, executor, reason) {
                return new Promise(async (resolve, reject) => {
                    if (!id || !guild || !executor) return reject('[DATABASE (update.id_bans.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO id_bans(guild, id, executor, reason) VALUES(?, ?, ?, ?)").run(guild.id, id, executor.id, reason ? reason : null);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO id_bans(guild, id, executor, reason) VALUES(?, ?, ?, ?)", [guild.id, id, executor.id, reason ? reason : null], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            remove(guild, id) {
                return new Promise(async (resolve, reject) => {
                    if (!id || !guild) return reject('[DATABASE (update.id_bans.remove)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("DELETE FROM id_bans WHERE guild=? AND id=?").run(guild.id, id);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("DELETE FROM id_bans WHERE guild=? AND id=?", [guild.id, id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        reminders: {
            add(member, time, text) {
                return new Promise(async (resolve, reject) => {
                    if (!member || !time || !text) return reject('[DATABASE (update.reminders.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO reminders(member, time, reminder) VALUES(?, ?, ?)").run(member.user.id, time, text);
                        let reminders = await module.exports.get.getReminders();
                        resolve(Math.max(...reminders.map(r => r.id)));
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO reminders(member, time, reminder) VALUES(?, ?, ?)", [member.user.id, time, text], async (err) => {
                            if (err) reject(err);
                            else {
                                let reminders = await module.exports.get.getReminders();
                                resolve(Math.max(...reminders.map(r => r.id)));
                            }
                        });
                    }
                });
            },
            remove(id) {
                return new Promise(async (resolve, reject) => {
                    if (!id) return reject('[DATABASE (update.reminders.remove)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("DELETE FROM reminders WHERE id=?").run(id);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("DELETE FROM reminders WHERE id=?", [id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        announcements: {
            add(announcement) {
                return new Promise(async (resolve, reject) => {
                    if (["Channel", "Interval", "Type"].some(property => !announcement[property]) || (!announcement.Embed && !announcement.Content)) return reject('[DATABASE (update.announcements.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO announcements(announcement_data) VALUES(?)").run(JSON.stringify(announcement));
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO announcements(announcement_data) VALUES(?)", [JSON.stringify(announcement)], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            remove(id) {
                if (!id) return console.log('[DATABASE (update.announcements.remove)] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('DELETE FROM announcements WHERE id=?').run(id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('DELETE FROM announcements WHERE id=?', [id], function (err) {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            },
            setNextBroadcast(id, date) {
                if (!id || !date) return console.log('[DATABASE (update.announcements.setNextBroadcast)] Invalid inputs');
                return new Promise((resolve, reject) => {
                    if (module.exports.type === 'sqlite') {
                        module.exports.sqlite.database.prepare('UPDATE announcements SET next_broadcast=? WHERE id=?').run(date, id);
                        resolve();
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('UPDATE announcements SET next_broadcast=? WHERE id=?', [date, id], function (err) {
                            if (err) reject(err);
                            resolve();
                        });
                    }
                });
            }
        },
        suggestions: {
            add(data) {
                return new Promise(async (resolve, reject) => {
                    if (["guild", "channel", "message", "suggestion", "creator", "status", "votes", "created_on"].some(p => !data[p])) return reject('[DATABASE (update.suggestions.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO suggestions(guild, channel, message, suggestion, creator, status, votes, created_on, image) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)").run(...Object.values(data));
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO suggestions(guild, channel, message, suggestion, creator, status, votes, created_on, image) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)", Object.values(data), async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            setStatus(channel, message, status, votes, changedBy, old_message) {
                return new Promise(async (resolve, reject) => {
                    if (!channel || !message || !status || !votes || !changedBy || !old_message) return reject('[DATABASE (update.suggestions.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("UPDATE suggestions SET channel=?, message=?, status=?, status_changed_on=?, votes=?, status_changed_by=? WHERE message=?").run(channel, message, status, Date.now(), JSON.stringify(votes), changedBy, old_message);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("UPDATE suggestions SET channel=?, message=?, status=?, status_changed_on=?, votes=?, status_changed_by=? WHERE message=?", [channel, message, status, Date.now(), JSON.stringify(votes), changedBy, old_message], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        bugreports: {
            // guild text, channel text, message text, suggestion text, creator text, status text, votes text, created_on integer, status_changed_on integer
            add(data) {
                return new Promise(async (resolve, reject) => {
                    if (["guild", "channel", "message", "bug", "creator", "status", "created_on"].some(p => !data[p])) return reject('[DATABASE (update.bugreports.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO bugreports(guild, channel, message, bug, creator, status, created_on, image) VALUES(?, ?, ?, ?, ?, ?, ?, ?)").run(...Object.values(data));
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO bugreports(guild, channel, message, bug, creator, status, created_on, image) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", Object.values(data), async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            setStatus(channel, message, status, changedBy, old_message) {
                return new Promise(async (resolve, reject) => {
                    if (!channel || !message || !status || !changedBy || !old_message) return reject('[DATABASE (update.bugreports.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("UPDATE bugreports SET channel=?, message=?, status=?, status_changed_on=?, status_changed_by=? WHERE message=?").run(channel, message, status, Date.now(), changedBy, old_message);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("UPDATE bugreports SET channel=?, message=?, status=?, status_changed_on=?, status_changed_by=? WHERE message=?", [channel, message, status, Date.now(), changedBy, old_message], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        locked_channels: {
            add(guild, channel, permissions) {
                return new Promise(async (resolve, reject) => {
                    if (!guild || !channel || !permissions) return reject('[DATABASE (update.locked_channels.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO locked_channels(guild, channel, permissions) VALUES(?, ?, ?)").run(guild, channel, JSON.stringify(permissions));
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO locked_channels(guild, channel, permissions) VALUES(?, ?, ?)", [guild, channel, JSON.stringify(permissions)], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            remove(guild, channel) {
                return new Promise(async (resolve, reject) => {
                    if (!guild || !channel) return reject('[DATABASE (update.locked_channels.remove)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("DELETE FROM locked_channels WHERE guild=? AND channel=?").run(guild, channel);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("DELETE FROM locked_channels WHERE guild=? AND channel=?", [guild, channel], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        invites: {
            updateData(user, data) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !data) return reject('[DATABASE (update.invites.updateData)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        let inviteData = module.exports.sqlite.database.prepare("SELECT * FROM invites WHERE user=? AND guild=?").get(user.id, user.guild.id);
                        if (inviteData) {
                            module.exports.sqlite.database.prepare("UPDATE invites SET regular=?, bonus=?, leaves=?, fake=? WHERE user=? AND guild=?").run(data.regular, data.bonus, data.leaves, data.fake, user.id, user.guild.id);
                        } else {
                            module.exports.sqlite.database.prepare("INSERT INTO invites(guild, user, regular, bonus, leaves, fake) VALUES(?, ?, ?, ?, ?, ?)").run(user.guild.id, user.id, data.regular, data.bonus, data.leaves, data.fake);
                        }
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("SELECT * FROM invites WHERE user=? AND guild=?", [user.id, user.guild.id], (err, inviteData) => {
                            if (inviteData.length) {
                                module.exports.mysql.database.query("UPDATE invites SET regular=?, bonus=?, leaves=?, fake=? WHERE user=? AND guild=?", [data.regular, data.bonus, data.leaves, data.fake, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            } else {
                                module.exports.mysql.database.query("INSERT INTO invites(guild, user, regular, bonus, leaves, fake) VALUES(?, ?, ?, ?, ?, ?)", [user.guild.id, user.id, data.regular, data.bonus, data.leaves, data.fake], (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                });
                            }
                        });
                    }
                });
            },
            addJoin(user, inviter) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !inviter) return reject('[DATABASE (update.invites.addJoin)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO joins(guild, user, inviter, time) VALUES(?, ?, ?, ?)").run(user.guild.id, user.id, inviter.id, Date.now());
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO joins(guild, user, inviter, time) VALUES(?, ?, ?, ?)", [user.guild.id, user.id, inviter.id, Date.now()], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
        },
        role_menus: {
            add(message, name) {
                return new Promise(async (resolve, reject) => {
                    if (!message) return reject('[DATABASE (update.role_menus.add)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO role_menus(guild, channel, message, name) VALUES(?, ?, ?, ?)").run(message.guild.id, message.channel.id, message.id, name.toLowerCase());
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO role_menus(guild, channel, message, name) VALUES(?, ?, ?, ?)", [message.guild.id, message.channel.id, message.id, name.toLowerCase()], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            remove(message) {
                return new Promise(async (resolve, reject) => {
                    if (!message) return reject('[DATABASE (update.role_menus.remove)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("DELETE FROM role_menus WHERE message=?").run(message);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("DELETE FROM role_menus WHERE message=?", [message], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        },
        messages: {
            increase(user, amount = 1) {
                return new Promise(async (resolve, reject) => {
                    if (!user || typeof amount != "number" || !user.id || !user.guild) return reject('[DATABASE (update.messages.increase)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM message_counts WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!data) {
                            module.exports.sqlite.database.prepare('INSERT INTO message_counts(guild, user, count) VALUES(?, ?, ?)').run(user.guild.id, user.id, amount);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE message_counts SET count=? WHERE user=? AND guild=?').run(data.count + amount, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM message_counts WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO message_counts(guild, user, count) VALUES(?, ?, ?)', [user.guild.id, user.id, amount], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE message_counts SET count=? WHERE user=? AND guild=?', [rows[0].count + amount, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            decrease(amount = 1) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !amount || !user.id || !user.guild) return reject('[DATABASE (update.messages.increase)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM message_counts WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (data) {
                            module.exports.sqlite.database.prepare('UPDATE message_counts SET count=? WHERE user=? AND guild=?').run(data.count - amount > 0 ? data.count - count : 0, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM message_counts WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (rows[0]) {
                                module.exports.mysql.database.query('UPDATE message_counts SET count=? WHERE user=? AND guild=?', [rows[0].count - amount > 0 ? rows[0].count - count : 0, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        voice_time: {
            updateJoinTime(user, time) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.guild) return reject('[DATABASE (update.voice_time.updateJoinTime)] Invalid inputs');

                    time = time ? time : null;

                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM voice_time WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!data) {
                            module.exports.sqlite.database.prepare('INSERT INTO voice_time(guild, user, total_time, join_date) VALUES(?, ?, ?, ?)').run(user.guild.id, user.id, 0, time);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE voice_time SET join_date=? WHERE user=? AND guild=?').run(time, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM voice_time WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO voice_time(guild, user, total_time, join_date) VALUES(?, ?, ?, ?)', [user.guild.id, user.id, 0, time], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE voice_time SET join_date=? WHERE user=? AND guild=?', [time, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            },
            addVoiceTime(user, amount) {
                return new Promise(async (resolve, reject) => {
                    if (!user || !user.guild || isNaN(amount)) return reject('[DATABASE (update.voice_time.addVoiceTime)] Invalid inputs');

                    if (module.exports.type === 'sqlite') {
                        const data = module.exports.sqlite.database.prepare('SELECT * FROM voice_time WHERE user=? AND guild=?').get(user.id, user.guild.id);
                        if (!data) {
                            module.exports.sqlite.database.prepare('INSERT INTO voice_time(guild, user, total_time, join_date) VALUES(?, ?, ?, ?)').run(user.guild.id, user.id, amount, null);
                            resolve();
                        } else {
                            module.exports.sqlite.database.prepare('UPDATE voice_time SET total_time=? WHERE user=? AND guild=?').run(data.total_time + amount, user.id, user.guild.id);
                            resolve();
                        }
                    }
                    if (module.exports.type === 'mysql') {
                        module.exports.mysql.database.query('SELECT * FROM voice_time WHERE user=? AND guild=?', [user.id, user.guild.id], (err, rows) => {
                            if (err) reject(err);
                            if (!rows[0]) {
                                module.exports.mysql.database.query('INSERT INTO voice_time(guild, user, total_time, join_date) VALUES(?, ?, ?, ?)', [user.guild.id, user.id, amount, null], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            } else {
                                module.exports.mysql.database.query('UPDATE voice_time SET total_time=? WHERE user=? AND guild=?', [rows[0].total_time + amount, user.id, user.guild.id], (err) => {
                                    if (err) reject(err);
                                    resolve();
                                });
                            }
                        });
                    }
                });
            }
        },
        temp_channels: {
            create(channel, owner, settings) {
                return new Promise(async (resolve, reject) => {
                    if (!channel || !owner || !settings) return reject('[DATABASE (update.temp_channels.create)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("INSERT INTO temp_channels(guild, channel_id, channel_name, owner, public, allowed_users, max_members, bitrate) VALUES(?, ?, ?, ?, ?, ?, ?, ?)").run(channel.guild.id, channel.id, channel.name, owner.id, settings.public ? 1 : 0, JSON.stringify(settings.allowed_users), settings.max_members, settings.bitrate);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("INSERT INTO temp_channels(guild, channel_id, channel_name, owner, public, allowed_users, max_members, bitrate) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [channel.guild.id, channel.id, channel.name, owner.id, settings.public, JSON.stringify(settings.allowed_users), settings.max_members, settings.bitrate], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            delete(guild_id, channel_id) {
                return new Promise(async (resolve, reject) => {
                    if (!guild_id || !channel_id) return reject('[DATABASE (update.temp_channels.delete)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare("DELETE FROM temp_channels WHERE guild=? AND channel_id=?").run(guild_id, channel_id);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query("DELETE FROM temp_channels WHERE guild=? AND channel_id=?", [guild_id, channel_id], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            },
            update(channel_id, setting, value) {
                return new Promise(async (resolve, reject) => {
                    if (!channel_id || !setting) return reject('[DATABASE (update.temp_channels.update)] Invalid inputs');

                    if (module.exports.type == "sqlite") {
                        module.exports.sqlite.database.prepare(`UPDATE temp_channels SET ${setting}=? WHERE channel_id=?`).run(value, channel_id);
                        resolve();
                    } else if (module.exports.type == "mysql") {
                        module.exports.mysql.database.query(`UPDATE temp_channels SET ${setting}=? WHERE channel_id=?`, [value, channel_id], async (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            }
        }
    }
};
