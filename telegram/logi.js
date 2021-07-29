const colors = require('colors/safe');

let log = (msg) => {
    console.log(`[LOG] ${colors.brightBlue(msg)}`);
}

module.exports.log = log;