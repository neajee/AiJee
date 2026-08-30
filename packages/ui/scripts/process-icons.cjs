const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const dir = path.join(__dirname, '../assets/images');
const source = PNG.sync.read(fs.readFileSync(path.join(dir, 'android-icon-monochrome.png')));
const dark = [23, 26, 31, 255];

function roundedIcon(size) {
  const out = new PNG({ width: size, height: size });
  const radius = size * 0.22;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const edgeX = Math.max(radius - x, x - (size - radius));
    const edgeY = Math.max(radius - y, y - (size - radius));
    const inside = Math.max(edgeX, edgeY) <= 0 ||
      Math.hypot(Math.max(edgeX, 0), Math.max(edgeY, 0)) <= radius;
    const i = (y * size + x) * 4;
    if (inside) [out.data[i], out.data[i + 1], out.data[i + 2], out.data[i + 3]] = dark;
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const sourceI = (Math.floor(y * source.height / size) * source.width + Math.floor(x * source.width / size)) * 4;
    // The Android foreground contains a white matte on antialiased edge
    // pixels. Dropping the faint fringe prevents a bright halo at 16-32px.
    const alpha = source.data[sourceI + 3] >= 160 ? 255 : 0;
    if (alpha) {
      out.data[i] = source.data[sourceI];
      out.data[i + 1] = source.data[sourceI + 1];
      out.data[i + 2] = source.data[sourceI + 2];
      out.data[i + 3] = 255;
    }
  }
  return out;
}

fs.writeFileSync(path.join(dir, 'icon.png'), PNG.sync.write(roundedIcon(1024)));
fs.writeFileSync(path.join(dir, 'splash-icon.png'), PNG.sync.write(roundedIcon(1024)));
fs.writeFileSync(path.join(dir, 'favicon.png'), PNG.sync.write(roundedIcon(64)));
