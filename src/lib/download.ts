import net from 'net';
import { Buffer } from 'buffer'

import * as message from './message';
import * as tracker from './tracker';
import { Torrent, Peer, PieceBlock } from '../types/torrent';
import Piece from './pieces';
import Queue from './queue';

export default function (torrent: Torrent) {
  const requested: any[] = [];
  tracker.getPeers(torrent, (peers: Peer[]) => {
    const pieces = new Piece(torrent);
    peers.forEach((peer: Peer) => download(peer, torrent, pieces));
  });
}

function download(peer: Peer, torrent: Torrent, pieces: Piece) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  const queue: Queue = new Queue(torrent);
  onWholeMsg(socket, (msg: any) => messageHandler(msg, socket, pieces, queue));
}

function messageHandler(msg: any, socket: net.Socket, pieces: Piece, queue: Queue) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested())
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    // if (m.id === 4) haveHandler(m.payload, socket, requested, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload, socket, requested, queue);

  }
}

function chokeHandler(socket: net.Socket) {
  socket.end();
}

function unchokeHandler(socket: net.Socket, pieces: Piece, queue: any) {
  queue.choked = false;

  requestPiece(socket, pieces, queue);
}

function haveHandler(socket: net.Socket, pieces: Piece, queue: any, payload: Buffer) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length === 0;

  queue.queue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);

  // if (!requested[pieceIndex]) {
  //   socket.write(message.buildRequest(pieceIndex));
  // }

  // requested[pieceIndex] = true;
}

function bitfieldHandler(payload) { }

function pieceHandler(payload: any, socket: net.Socket, requested: any[], queue: any[]) {
  queue.shift()
  requestPiece(socket, requested, queue);
}

function requestPiece(socket: net.Socket, pieces: Piece, queue: Queue) {
  if (queue.choked) return null;

  while (queue.length()) {
    const pieceBlock: PieceBlock = queue.deque();
    if (pieces.needed(pieceBlock)) {
      socket.write(message.buildRequest(pieceBlock));
      pieces.addRequested(pieceBlock);
      break;
    }
  }
}


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
