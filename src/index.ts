import path from 'path';
import download from './lib/download';
import * as torrentParser from './lib/torrent-parser';


const torrentSource: string = path.join(__dirname, '/puppy.torrent')
const torrent = torrentParser.open(torrentSource);
// const torrent = torrentParser.open(process.argv[2]);
// console.log('====================================');
// console.log(process.argv[2]);
// console.log('====================================');
download(torrent);

