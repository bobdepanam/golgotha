// Dimensions d'une image lues dans son en-tête (aucune dépendance, aucun décodage).
// Formats : WebP (VP8, VP8L, VP8X), PNG, JPEG, GIF. AVIF et autres : null.
import fs from 'node:fs';

export function imageSize(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(64);
    fs.readSync(fd, head, 0, 64, 0);
    // PNG : IHDR
    if (head[0] === 0x89 && head.toString('ascii', 1, 4) === 'PNG') {
      return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
    }
    // GIF
    if (head.toString('ascii', 0, 3) === 'GIF') {
      return { width: head.readUInt16LE(6), height: head.readUInt16LE(8) };
    }
    // WebP
    if (head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = head.toString('ascii', 12, 16);
      if (chunk === 'VP8 ') return { width: head.readUInt16LE(26) & 0x3fff, height: head.readUInt16LE(28) & 0x3fff };
      if (chunk === 'VP8L') {
        const b = head.readUInt32LE(21);
        return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
      }
      if (chunk === 'VP8X') return { width: head.readUIntLE(24, 3) + 1, height: head.readUIntLE(27, 3) + 1 };
      return null;
    }
    // JPEG : parcours des segments jusqu'à un SOFn
    if (head[0] === 0xff && head[1] === 0xd8) {
      const size = fs.fstatSync(fd).size;
      let pos = 2;
      const seg = Buffer.alloc(9);
      while (pos < size) {
        fs.readSync(fd, seg, 0, 9, pos);
        if (seg[0] !== 0xff) return null;
        const marker = seg[1];
        const len = seg.readUInt16BE(2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: seg.readUInt16BE(7), height: seg.readUInt16BE(5) };
        }
        pos += 2 + len;
      }
    }
    return null;
  } finally {
    fs.closeSync(fd);
  }
}
