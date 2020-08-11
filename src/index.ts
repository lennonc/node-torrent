import path from 'path';

import * as tracker from './lib/tracker';
import * as torrentParser from './lib/torrent-parser';
import { Peer } from './types/torrent';


const torrentSource: string = path.join(__dirname, '/puppy.torrent')
const torrent = torrentParser.open(torrentSource);

// console.log('====================================');
// console.log(torrent.getPeers);
// console.log('====================================');

tracker.getPeers(torrent, (peers: Peer[]) => {
  console.log('list of peers', peers)
})

