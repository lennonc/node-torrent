import { Interface } from "readline";

export interface Torrent {
  announce: Buffer;
  encoding: Buffer;
  'created by': Buffer;
  'creation date': number;
  info: TorrentInfo;
};

interface TorrentInfo {
  length: number;
  name: Buffer;
  'piece length': number;
  pieces: Buffer;
  files?: any
}

export interface PieceBlock {
  index: number;
  begin: number;
  length: number;
}

export interface Peer {
  ip: string;
  port: number
}

export interface TorrentResponse {
  action: number;
  transactionId: number;
  connectionId?: Buffer;
  leechers?: number;
  seeders?: number;
  peers?: Peer[]
}


