import net from 'net';
import { Buffer } from 'buffer'

import * as message from './message';
import * as tracker from './tracker';
import { Torrent, Peer } from '../types/torrent';

export default function (torrent: Torrent) {
  tracker.getPeers(torrent, (peers: Peer[]) => {
    peers.forEach((peer: Peer) => download(peer, torrent));
  });
}

function download(peer: Peer, torrent: Torrent) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  onWholeMsg(socket, (msg: any) => messageHandler(msg, socket));
}

function messageHandler(msg: any, socket: net.Socket) {
  if (isHandshake(msg)) socket.write(message.buildInterested())
}

function isHandshake(msg: any) {
  return msg.length === msg.readUInt8(0) + 49 &&
    msg.toString('utf8', 1) === 'BitTorrent protocol';
}

function onWholeMsg(socket: net.Socket, callback: any) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on('data', recvBuf => {
    // msgLen calculates the length of a whole message
    const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.slice(0, msgLen()));
      savedBuf = savedBuf.slice(msgLen());
      handshake = false;
    }
  });
}
