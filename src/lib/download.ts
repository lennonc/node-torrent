import net from 'net';
import { Buffer } from 'buffer'

import * as message from './message';
import * as tracker from './tracker';
import { Torrent, Peer } from '../types/torrent';
import { Socket } from 'dgram';

export default function (torrent: Torrent) {
  const requested: any[]= [];
  tracker.getPeers(torrent, (peers: Peer[]) => {
    peers.forEach((peer: Peer) => download(peer, torrent, requested));
  });
}

function download(peer: Peer, torrent: Torrent, requested: any) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  onWholeMsg(socket, (msg: any) => messageHandler(msg, socket, requested));
}

function messageHandler(msg: any, socket: net.Socket, requested: any) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested())
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler();
    if (m.id === 1) unchokeHandler();
    if (m.id === 4) haveHandler(m.payload, socket, requested);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload);

  }
}

function chokeHandler() {  }

function unchokeHandler() {  }

function haveHandler(payload: Buffer, socket: net.Socket, requested: any) {
  const pieceIndex = payload.readUInt32BE(0);

  if (!requested[pieceIndex]) {
    socket.write(message.buildRequest());
  }

  requested[pieceIndex] = true;
}

function bitfieldHandler(payload) {  }

function pieceHandler(payload) {  }

function isHandshake(msg: any): Boolean {
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
