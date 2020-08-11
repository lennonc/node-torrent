import dgram, { Socket } from 'dgram';
import { Buffer } from 'buffer';
import { parse, UrlWithStringQuery } from 'url';
import crypto from 'crypto';

import { Torrent, TorrentResponse, Peer } from '../types/torrent'

import * as torrentParser from './torrent-parser';
import * as util from './util';


export function getPeers(torrent: Torrent, callback: any) {
  const socket: Socket = dgram.createSocket('udp4');
  const url: string = torrent.announce.toString('utf8');

  udpSend(socket, buildConnectionRequest(), url);

  socket.on('message', (response: Buffer) => {
    if (isConnectResponse(response)) {
      console.log("Connecting");
      
      const connectionResponse = parseConnectionResponse(response);
      if (connectionResponse.connectionId) {
        const announceRequest = buildAnnounceRequest(connectionResponse.connectionId, torrent);
        udpSend(socket, announceRequest, url);
      }
    } else if (isAnnounceResponse(response)) {
      // 4. parse announce response
      console.log('====================================');
      console.log('Parsing Announce');
      console.log('====================================');
      const announceResp = parseAnnounceResponse(response);
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  })
} 

// TODO: Need to figure out types here
function udpSend(socket: any, message: any, rawUrl: any, callback = () => { }) {
  const url: UrlWithStringQuery = parse(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function buildConnectionRequest(): Buffer {
  const buffer: Buffer = Buffer.alloc(16)
  // Set the connectionId
  buffer.writeUInt32BE(0x417, 0); // 3
  buffer.writeUInt32BE(0x27101980, 4);

  // Set the action: Should always be 0 for a connection request
  buffer.writeUInt32BE(0, 8);

  // Set the transactionId: Just some random bytes
  crypto.randomBytes(4).copy(buffer, 12);
  return buffer;
}

// function responseType(response: Buffer): string {
//   const action = response.readUInt32BE(0);
//   if (action === 0) return 'connect';
//   if (action === 1) return 'announce';
// }

function isConnectResponse(response: Buffer): boolean {
  const action = response.readUInt32BE(0);
  return action === 0;
}

function isAnnounceResponse(response: Buffer): boolean {
  const action = response.readUInt32BE(0);
  return action === 0;
}

function buildAnnounceRequest(connectionId: Buffer, torrent: Torrent, port=6681): Buffer {
  const buffer: Buffer = Buffer.allocUnsafe(98);

  // connection id
  connectionId.copy(buffer, 0);
  // action
  buffer.writeUInt32BE(1, 8);
  // transaction id
  crypto.randomBytes(4).copy(buffer, 12);
  // info hash
  torrentParser.infoHash(torrent).copy(buffer, 16);
  // peerId
  util.generateId().copy(buffer, 36);
  // downloaded
  Buffer.alloc(8).copy(buffer, 56);
  // left
  torrentParser.size(torrent).copy(buffer, 64);
  // uploaded
  Buffer.alloc(8).copy(buffer, 72);
  // event
  buffer.writeUInt32BE(0, 80);
  // ip address
  buffer.writeUInt32BE(0, 80);
  // key
  crypto.randomBytes(4).copy(buffer, 88);
  // num want
  buffer.writeInt32BE(-1, 92);
  // port
  buffer.writeUInt16BE(port, 96);

  return buffer;

}

function parseConnectionResponse(response: Buffer): TorrentResponse {
  return {
    action: response.readUInt32BE(0),
    transactionId: response.readUInt32BE(4),
    connectionId: response.slice(8)
  }
}

function parseAnnounceResponse(response: Buffer): TorrentResponse {
  const group = (iterable: any, groupSize: number): any[] => {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: response.readUInt32BE(0),
    transactionId: response.readUInt32BE(4),
    leechers: response.readUInt32BE(8),
    seeders: response.readUInt32BE(12),
    peers: group(response.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join('.'),
        port: address.readUInt16BE(4)
      }
    })
  }
}
