const fs = require('fs');

function createPNG(size) {
    const bpp = 4;
    const scanline = size * bpp + 1;
    const rawData = [];

    for (let y = 0; y < size; y++) {
        rawData.push(0); // filter byte
        for (let x = 0; x < size; x++) {
            const cx = size / 2;
            const cy = size / 2;
            const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            const maxR = size * 0.42;
            if (r <= maxR) {
                // Indigo gradient circle
                const t = r / maxR;
                rawData.push(Math.round(99 + 30 * t));  // R
                rawData.push(Math.round(102 + 30 * t)); // G
                rawData.push(241);                        // B
                rawData.push(255);                        // A
            } else {
                // Dark background
                rawData.push(11);  // R
                rawData.push(15);  // G
                rawData.push(26);  // B
                rawData.push(255); // A
            }
        }
    }

    const data = Buffer.from(rawData);

    // CRC32 table
    const crc32Table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        crc32Table[i] = c;
    }

    function crc32(buf) {
        let c = -1;
        for (let i = 0; i < buf.length; i++) c = crc32Table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ -1) >>> 0;
    }

    function adler32(buf) {
        let a = 1, b = 0;
        for (let i = 0; i < buf.length; i++) {
            a = (a + buf[i]) % 65521;
            b = (b + a) % 65521;
        }
        return ((b << 16) | a) >>> 0;
    }

    function deflateStore(d) {
        const blocks = [];
        let pos = 0;
        while (pos < d.length) {
            const blockSize = Math.min(d.length - pos, 65535);
            const last = pos + blockSize >= d.length ? 1 : 0;
            const b = Buffer.alloc(5 + blockSize);
            b[0] = last;
            b.writeUInt16LE(blockSize, 1);
            b.writeUInt16LE(blockSize ^ 0xFFFF, 3);
            d.copy(b, 5, pos, pos + blockSize);
            blocks.push(b);
            pos += blockSize;
        }
        return Buffer.concat(blocks);
    }

    function zlibWrap(d) {
        const deflated = deflateStore(d);
        const ad = adler32(d);
        const buf = Buffer.alloc(2 + deflated.length + 4);
        buf[0] = 0x78;
        buf[1] = 0x01;
        deflated.copy(buf, 2);
        buf.writeUInt32BE(ad, buf.length - 4);
        return buf;
    }

    function chunk(type, d) {
        const len = Buffer.alloc(4);
        len.writeUInt32BE(d.length);
        const t = Buffer.from(type);
        const c = Buffer.alloc(4);
        c.writeUInt32BE(crc32(Buffer.concat([t, d])));
        return Buffer.concat([len, t, d, c]);
    }

    const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type RGBA

    const compressed = zlibWrap(data);
    return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

fs.writeFileSync('public/icons/icon-192.png', createPNG(192));
fs.writeFileSync('public/icons/icon-512.png', createPNG(512));
console.log('Icons created successfully');
