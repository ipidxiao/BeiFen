#!/usr/bin/env node
/**
 * Generate PWA icons (180, 192, 512) from favicon.svg.
 * 180×180 is used for iOS apple-touch-icon; 192/512 for manifest + SW cache.
 * Uses sharp when available; falls back to ImageMagick.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'icons');
const SVG_PATH = path.join(ROOT, 'favicon.svg');

const SIZES = [180, 192, 512];

async function withSharp() {
    const sharp = (await import('sharp')).default;
    const svg = fs.readFileSync(SVG_PATH);
    if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { sync: true });
    for (const size of SIZES) {
        const out = path.join(ICONS_DIR, `icon-${size}.png`);
        await sharp(svg, { density: Math.ceil((size / 64) * 72) })
            .resize(size, size)
            .png({ compressionLevel: 9 })
            .toFile(out);
        console.log(`Wrote ${path.relative(ROOT, out)}`);
    }
    // Maskable variant — same art with safe padding via extend
    const maskable = path.join(ICONS_DIR, 'icon-512-maskable.png');
    await sharp(svg, { density: 144 })
        .resize(410, 410)
        .extend({
            top: 51, bottom: 51, left: 51, right: 51,
            background: { r: 26, g: 26, b: 46, alpha: 1 },
        })
        .png({ compressionLevel: 9 })
        .toFile(maskable);
    console.log(`Wrote ${path.relative(ROOT, maskable)}`);
}

function withImageMagick() {
    if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { sync: true });
    for (const size of SIZES) {
        const out = path.join(ICONS_DIR, `icon-${size}.png`);
        execSync(`magick convert -background none "${SVG_PATH}" -resize ${size}x${size} "${out}"`, {
            stdio: 'inherit',
            cwd: ROOT,
        });
        console.log(`Wrote ${path.relative(ROOT, out)}`);
    }
}

async function main() {
    if (!fs.existsSync(SVG_PATH)) {
        console.error('favicon.svg not found');
        process.exit(1);
    }
    try {
        await withSharp();
        return;
    } catch (e) {
        console.warn('sharp unavailable:', e.message);
    }
    try {
        withImageMagick();
        return;
    } catch (e) {
        console.warn('ImageMagick unavailable:', e.message);
    }
    console.error('Install sharp (npm i -D sharp) or ImageMagick to generate PWA icons.');
    process.exit(1);
}

main();
