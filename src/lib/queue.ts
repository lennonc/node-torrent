import * as torrentParser from './torrent-parser';
import { Torrent, PieceBlock } from '../types/torrent';

export default class Queue {
  private _torrent: Torrent;
  private _queue: PieceBlock[];
  public choked: boolean;

  constructor(torrent: Torrent) {
    this._torrent = torrent;
    this._queue = [];
    this.choked = true;
  }

  enqueue(pieceIndex: number): void {
    const nBlocks = torrentParser.blocksPerPiece(this._torrent, pieceIndex);

    for (let i = 0; i < nBlocks; i++) {
      const pieceBlock: PieceBlock = {
        index: pieceIndex,
        begin: i * torrentParser.BLOCK_LEN,
        length: torrentParser.blockLength(this._torrent, pieceIndex, i)
      };

      this._queue.push(pieceBlock);
    }
  }

  deque(): PieceBlock | any {
    return this._queue.shift()
  }

  peek(): PieceBlock | undefined {
    return this._queue[0];
  }

  length(): number {
    return this._queue.length;
  }
}
