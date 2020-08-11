import { readFileSync } from 'fs';
import * as bencode from 'bencode';

const torrent = bencode.decode(readFileSync('puppy.torrent'));
console.log('====================================');
console.log(torrent.announce.toString('utf8'));
console.log('====================================');
