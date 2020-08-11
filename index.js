"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var torrent = fs_1.readFileSync('puppy.torrent');
console.log('====================================');
console.log(torrent.toString('utf8'));
console.log('====================================');
