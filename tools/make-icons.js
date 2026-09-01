/**
 * Generator ikon PWA (tanpa dependency eksternal).
 * Jalankan:  node pwa/tools/make-icons.js
 * Hasil:     pwa/icons/*.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- PNG encoder ----------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Canvas sederhana (RGBA float, koordinat 0..1) ----------
function createCanvas(size) {
  return { size, px: new Float64Array(size * size * 4) };
}

function blend(c, x, y, rgb, a) {
  if (a <= 0 || x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  const dstA = c.px[i + 3];
  const outA = a + dstA * (1 - a);
  if (outA <= 0) return;
  for (let k = 0; k < 3; k++) {
    c.px[i + k] = (rgb[k] * a + c.px[i + k] * dstA * (1 - a)) / outA;
  }
  c.px[i + 3] = outA;
}

// Isi area berdasarkan fungsi cakupan sdf(x,y) -> jarak (negatif = di dalam)
function fillShape(c, sdf, colorFn) {
  const s = c.size;
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const d = sdf((x + 0.5) / s, (y + 0.5) / s);
      // anti-alias 1.2 piksel
      const a = Math.min(1, Math.max(0, 0.5 - d * s / 1.2));
      if (a > 0) blend(c, x, y, colorFn((x + 0.5) / s, (y + 0.5) / s), a);
    }
  }
}

function sdfRoundRect(cx, cy, w, h, r) {
  return (x, y) => {
    const qx = Math.abs(x - cx) - (w / 2 - r);
    const qy = Math.abs(y - cy) - (h / 2 - r);
    const ax = Math.max(qx, 0), ay = Math.max(qy, 0);
    return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
  };
}

function sdfSegment(x0, y0, x1, y1, halfW) {
  return (x, y) => {
    const dx = x1 - x0, dy = y1 - y0;
    const len2 = dx * dx + dy * dy || 1e-9;
    let t = ((x - x0) * dx + (y - y0) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) - halfW;
  };
}

const hex = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const GREEN_TOP = hex('#2a8c46');
const GREEN_BOTTOM = hex('#14532d');
const WHITE = hex('#ffffff');
const CLIP = hex('#14532d');
const LINE = hex('#c9e4d2');
const CHECK = hex('#1e6b33');

/**
 * Menggambar ikon. `inset` = seberapa kecil isi ikon relatif kanvas
 * (dipakai untuk versi maskable agar aman dari pemotongan bulat).
 */
function drawIcon(c, opts) {
  const { radius, inset } = opts;
  const bgRadius = radius;

  // Latar hijau bergradasi
  fillShape(
    c,
    sdfRoundRect(0.5, 0.5, 1, 1, bgRadius),
    (x, y) => [
      GREEN_TOP[0] + (GREEN_BOTTOM[0] - GREEN_TOP[0]) * y,
      GREEN_TOP[1] + (GREEN_BOTTOM[1] - GREEN_TOP[1]) * y,
      GREEN_TOP[2] + (GREEN_BOTTOM[2] - GREEN_TOP[2]) * y,
    ]
  );

  // Semua isi digambar dalam kotak [0.5 - k/2, 0.5 + k/2]
  const k = inset;
  const m = (v) => 0.5 + (v - 0.5) * k;
  const sc = (v) => v * k;

  // Papan / kertas
  fillShape(c, sdfRoundRect(m(0.5), m(0.53), sc(0.56), sc(0.66), sc(0.07)), () => WHITE);
  // Penjepit papan
  fillShape(c, sdfRoundRect(m(0.5), m(0.215), sc(0.26), sc(0.1), sc(0.045)), () => CLIP);
  // Garis teks
  fillShape(c, sdfRoundRect(m(0.5), m(0.365), sc(0.38), sc(0.05), sc(0.025)), () => LINE);
  fillShape(c, sdfRoundRect(m(0.43), m(0.455), sc(0.24), sc(0.05), sc(0.025)), () => LINE);
  // Tanda centang
  fillShape(c, sdfSegment(m(0.355), m(0.63), m(0.455), m(0.725), sc(0.045)), () => CHECK);
  fillShape(c, sdfSegment(m(0.455), m(0.725), m(0.665), m(0.505), sc(0.045)), () => CHECK);
}

function render(size, opts) {
  const ss = 4; // supersampling
  const c = createCanvas(size * ss);
  drawIcon(c, opts);

  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < ss; dy++) {
        for (let dx = 0; dx < ss; dx++) {
          const i = ((y * ss + dy) * c.size + (x * ss + dx)) * 4;
          const pa = c.px[i + 3];
          r += c.px[i] * pa; g += c.px[i + 1] * pa; b += c.px[i + 2] * pa; a += pa;
        }
      }
      const n = ss * ss;
      const i = (y * size + x) * 4;
      const alpha = a / n;
      out[i] = alpha > 0 ? Math.round(Math.min(1, r / a) * 255) : 0;
      out[i + 1] = alpha > 0 ? Math.round(Math.min(1, g / a) * 255) : 0;
      out[i + 2] = alpha > 0 ? Math.round(Math.min(1, b / a) * 255) : 0;
      out[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, out);
}

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });

const targets = [
  ['favicon-32.png', 32, { radius: 0.22, inset: 1.0 }],
  ['icon-192.png', 192, { radius: 0.22, inset: 1.0 }],
  ['icon-512.png', 512, { radius: 0.22, inset: 1.0 }],
  ['icon-maskable-512.png', 512, { radius: 0.5, inset: 0.62 }],
  ['apple-touch-icon-180.png', 180, { radius: 0.0001, inset: 0.86 }],
];

for (const [name, size, opts] of targets) {
  fs.writeFileSync(path.join(dir, name), render(size, opts));
  console.log('dibuat:', name, size + 'x' + size);
}
