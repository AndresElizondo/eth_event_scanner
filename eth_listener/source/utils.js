"use strict";
const fs = require('fs');

exports.readConfig = function(filepath) {
    let rawdata = fs.readFileSync(filepath);
    let config = JSON.parse(rawdata);
    return config
}