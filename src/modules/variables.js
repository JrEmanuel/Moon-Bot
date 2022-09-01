const Utils = require('./utils.js');
module.exports = {
    set: function (variable, value, expireAfter = 0) {
        if (variable == 'set') return Utils.error('Cannot set variable \'set\'');
        this[variable] = value;
        if (expireAfter > 0)
            setTimeout(function () {
                delete this[variable];
            }, expireAfter);
        return value;
    }
};
