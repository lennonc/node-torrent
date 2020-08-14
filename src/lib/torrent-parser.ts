import { readFileSync } from 'fs';
import crypto from 'crypto';
import * as bencode from 'bencode';
import { Torrent } from '../types/torrent';
import { toBufferBE, toBigIntBE } from 'bigint-buffer';

export const BLOCK_LEN = Math.pow(2, 14);

export function pieceLength(torrent: Torrent, pieceIndex: number): number {
  const totalLength: number = Number(toBigIntBE(size(torrent)));
  const pieceLength: number = torrent.info['piece length'];

  const lastPieceLength = totalLength % pieceLength;
  const lastPieceIndex = Math.floor(totalLength / pieceLength);

  return lastPieceIndex === pieceIndex ? lastPieceLength : pieceLength;
}

export function blocksPerPiece(torrent: Torrent, pieceIndex: number): number {
  const pieceLen: number = pieceLength(torrent, pieceIndex)
  return Math.ceil(pieceLen / BLOCK_LEN);
}

export function blockLength(torrent: Torrent, pieceIndex: number, blockIndex: number): number {
  const pieceLen = pieceLength(torrent, pieceIndex);

  const lastPieceLength = pieceLen % BLOCK_LEN;
  const lastPieceIndex = Math.floor(pieceLen / BLOCK_LEN);

  return blockIndex === lastPieceIndex ? lastPieceLength : BLOCK_LEN;
}

export function open(filePath: string): Torrent {
  return bencode.decode(readFileSync(filePath));
}

export function size(torrent: Torrent): Buffer {
  const size = torrent.info.files ?
    torrent.info.files.map((file: any) => file.length).reduce((a: any, b: any) => a + b) :
    torrent.info.length;

  // const buf: Buffer = Buffer.from(size);

  // return bignum.toBuffer(size, { size: 8 });
  // BigInt(size).to
  return toBufferBE(BigInt(size), 8)

}

export function infoHash(torrent: Torrent): Buffer {
  const info = bencode.encode(torrent.info);
  return crypto.createHash('sha1').update(info).digest();
}
