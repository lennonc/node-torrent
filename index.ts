import fs from 'fs';

const torrent = fs.readFileSync('puppy.torrent');
console.log('====================================');
console.log(torrent.toString('utf8'));
console.log('====================================');
