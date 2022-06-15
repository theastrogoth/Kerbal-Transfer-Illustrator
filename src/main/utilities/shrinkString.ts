import { gzip, ungzip } from 'pako';
import { Buffer } from 'buffer';

export function compress(s: string = ''){
  const compressed = gzip(s);
  const buffer = Buffer.from(compressed);
  return buffer.toString('base64');
}

export function decompress(s: string = ''){
  const buffer = Buffer.from(Buffer.from(s, 'base64'));
  const decompressed = new TextDecoder().decode(ungzip(buffer));
  return decompressed.toString();
}
