import * as torrentParser from './torrent-parser';
import { Torrent, PieceBlock } from "../types/torrent";

export default class Piece {
  private requested: boolean[][];
  private received: boolean[][];

  constructor(torrent: Torrent) {

    const buildPiecesArray = () => {
      const nPieces = torrent.info.pieces.length / 20;
      const arr = new Array(nPieces).fill(null);
      return arr.map((_, i) => new Array(torrentParser.blocksPerPiece(torrent, i)).fill(false))
    }

    this.requested = buildPiecesArray();
    this.received = buildPiecesArray();
  }

  addRequested(pieceBlock: PieceBlock): void {
    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LEN;
    this.requested[pieceBlock.index][blockIndex] = true;
  }

  addReceived(pieceBlock: PieceBlock): void {
    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LEN;
    this.received[pieceBlock.index][blockIndex] = true;
  }

  needed(pieceBlock: PieceBlock): boolean {
    if (this.requested.every(blocks => blocks.every(i => i))) {
      this.requested = this.received.map(blocks => blocks.slice());
    }

    const blockIndex = pieceBlock.begin / torrentParser.BLOCK_LEN;
    return !this.requested[pieceBlock.index][blockIndex];
  }

  isDone(): boolean {
    return this.received.every(blocks => blocks.every(i => i));
  }
}
