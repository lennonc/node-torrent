import { readFileSync } from 'fs';
import crypto from 'crypto';
import * as bencode from 'bencode';
import { Torrent } from '../types/torrent';
import { toBufferBE } from 'bigint-buffer';

export function open(filePath: string): Torrent {
  return bencode.decode(readFileSync(filePath));
}

export function size(torrent: Torrent): Buffer {
  const size = torrent.info.files ? 
    torrent.info.files.map((file: any) => file.length).reduce((a:any, b:any) => a + b) :
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
