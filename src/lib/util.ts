import crypto from 'crypto';

let id: Buffer;

export function generateId(): Buffer {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from('-NT0001-').copy(id, 0);
  }

  return id;
};
