// Builds web-ready images from the raw photography in assets-src/.
// Outputs responsive WebP files to public/img and a width manifest to frontend/shared/imageManifest.json.
import sharp from 'sharp';
import { copyFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const srcDir = path.resolve('assets-src');
const outDir = path.resolve('public/img');
const TARGET_WIDTHS = [640, 1280, 1920];
await mkdir(outDir, { recursive: true });

const manifest = {};
const files = (await readdir(srcDir)).filter((f) => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('logo'));

for (const file of files) {
  const name = file.replace(/\.[^.]+$/, '').replace(/_/g, '-');
  const input = path.join(srcDir, file);
  const { width = 1920, height = 1080 } = await sharp(input).metadata();
  const widths = [...new Set(TARGET_WIDTHS.map((w) => Math.min(w, width)))];
  for (const w of widths) {
    await sharp(input).resize({ width: w }).webp({ quality: 74 }).toFile(path.join(outDir, `${name}-${w}.webp`));
  }
  manifest[name] = { widths, ratio: +(width / height).toFixed(4) };
  console.log(`${name}: ${widths.join(', ')}`);
}

// The company logo is published unchanged, and the favicon is the same logo
// fitted into a square.
const logo = path.join(srcDir, 'logo.png');
await copyFile(logo, path.join(outDir, 'ihe-logo.png'));
const iconSizes = [16, 32, 48];
const icons = await Promise.all(
  iconSizes.map((s) => sharp(logo).resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()),
);
// .ico container holding PNG images
const header = Buffer.alloc(6 + 16 * icons.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icons.length, 4);
let offset = header.length;
icons.forEach((png, i) => {
  const entry = 6 + 16 * i;
  header[entry] = header[entry + 1] = iconSizes[i];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(png.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
await writeFile(path.resolve('public/favicon.ico'), Buffer.concat([header, ...icons]));

await writeFile(path.resolve('frontend/shared/imageManifest.json'), JSON.stringify(manifest, null, 2) + '\n');
