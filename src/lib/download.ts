import net from 'net';
import { Buffer } from 'buffer'
import * as fs from 'fs'

import * as message from './message';
import * as tracker from './tracker';
import { Torrent, Peer, PieceBlock } from '../types/torrent';
import Piece from './pieces';
import Queue from './queue';

export default function (torrent: Torrent, path: string) {
  tracker.getPeers(torrent, (peers: Peer[]) => {
    const pieces = new Piece(torrent);
    const file = fs.openSync(path, 'w')
    peers.forEach((peer: Peer) => download(peer, torrent, pieces, file));
  });
}

function download(peer: Peer, torrent: Torrent, pieces: Piece, file: number) {
  const socket = new net.Socket();
  socket.on('error', console.log);
  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });
  const queue: Queue = new Queue(torrent);
  onWholeMsg(socket, (msg: any) => messageHandler(msg, socket, pieces, queue, torrent, file));
}

function messageHandler(msg: any, socket: net.Socket, pieces: Piece, queue: Queue, torrent: Torrent, file: number) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested())
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler(socket);
    if (m.id === 1) unchokeHandler(socket, pieces, queue);
    // if (m.id === 4) haveHandler(m.payload, socket, requested, queue);
    if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
    if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
    if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload);

  }
}

function chokeHandler(socket: net.Socket) {
  socket.end();
}

function unchokeHandler(socket: net.Socket, pieces: Piece, queue: any) {
  queue.choked = false;

  requestPiece(socket, pieces, queue);
}

function haveHandler(socket: net.Socket, pieces: Piece, queue: Queue, payload: Buffer) {
  const pieceIndex = payload.readUInt32BE(0);
  const queueEmpty = queue.length() === 0;

  queue.enqueue(pieceIndex);
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function bitfieldHandler(socket: net.Socket, pieces: Piece, queue: Queue, payload: Buffer) {
  const queueEmpty = queue.length() === 0;

  payload.forEach((byte, i) => {
    for (let j = 0; j < 8; j++) {
      if (byte % 2) queue.enqueue(i * 8 + 7 - j);
      byte = Math.floor(byte / 2);
    }
  })
  if (queueEmpty) requestPiece(socket, pieces, queue);
}

function pieceHandler(socket: net.Socket, pieces: Piece, queue: Queue, torrent: Torrent, file: number, pieceResp: any) {
  console.log(pieceResp);
  pieces.addReceived(pieceResp)

  const offset = pieceResp.index * torrent.info['piece length'] + pieceResp.begin;
  fs.write(file, pieceResp.block, 0, pieceResp.block.length, offset, () => { });


  if (pieces.isDone()) {
    console.log('DONE!');
    socket.end();
    try { fs.closeSync(file); } catch (e) { }
  } else {
    requestPiece(socket, pieces, queue);
  }
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
