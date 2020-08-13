import { Buffer } from 'buffer';
import * as torrentParser from './torrent-parser';
import { Torrent } from '../types/torrent';
import * as util from './util';

export function buildHandshake(torrent: Torrent): Buffer {
  const buffer = Buffer.alloc(68);

  // pstrlen
  buffer.writeUInt8(19, 0);
  // pstr
  buffer.write('BitTorrent protocol', 1);
  // reserved
  buffer.writeUInt32BE(0, 20);
  buffer.writeUInt32BE(0, 24);
  // info hash
  torrentParser.infoHash(torrent).copy(buffer, 28);
  // peer id
  buffer.write(util.generateId().toString('utf8'));

  return buffer;
}

export function keepAlive() {
  return Buffer.alloc(4)
}

export function buildUnchoke(): Buffer {
  const buffer = Buffer.alloc(5);

  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(1, 4);
  return buffer;
}

export function buildInterested(): Buffer {
  const buffer = Buffer.alloc(5);
  // length
  buffer.writeUInt32BE(1, 0);
  // id
  buffer.writeUInt8(2, 4);
  return buffer;
};

export function buildUninterested() {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(3, 4);
  return buf;
};

export function buildHave(payload: any) {
  const buf = Buffer.alloc(9);
  // length
  buf.writeUInt32BE(5, 0);
  // id
  buf.writeUInt8(4, 4);
  // piece index
  buf.writeUInt32BE(payload, 5);
  return buf;
};

export function buildBitfield(bitfield: any) {
  const buf = Buffer.alloc(14);
  // length
  buf.writeUInt32BE(bitfield.length + 1, 0);
  // id
  buf.writeUInt8(5, 4);
  // bitfield
  bitfield.copy(buf, 5);
  return buf;
};

export function buildRequest(payload: any) {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

export function buildPiece(payload: any) {
  const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
};

export function buildCancel(payload: any) {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(8, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
};

export function buildPort(payload: any) {
  const buf = Buffer.alloc(7);
  // length
  buf.writeUInt32BE(3, 0);
  // id
  buf.writeUInt8(9, 4);
  // listen-port
  buf.writeUInt16BE(payload, 5);
  return buf;
};

export function parse(message: any) {
  const id = message.length > 4 ? message.readInt8(4) : null;
  let payload = message.length > 5 ? message.slice(5) : null;

  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4)
    };
    payload[id === 7 ? 'block' : 'length'] = rest;
  }

  return {
    size: message.readInt32BE(0),
    id,
    payload
  }
}
