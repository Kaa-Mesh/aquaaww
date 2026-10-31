const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const pngToIco = (m => m.default || m)(require('png-to-ico'));

const R = __dirname + '/';
const W = 250, H = 250;

// Color palette:
const cream = '#F9F0E3';
const tapeGold = '#E9B24E';
const ink = '#342725';
const blushRed = '#CF2E27';

// The 😊 emoji logo SVG
const emojiSvg = `<svg width="250" height="250" viewBox="0 0 250 250" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="125" cy="125" r="112" fill="${tapeGold}" stroke="${ink}" stroke-width="10"/>
  <!-- Smiling eyes -->
  <path d="M 66 106 C 72 82, 102 82, 108 106" fill="none" stroke="${ink}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 142 106 C 148 82, 178 82, 184 106" fill="none" stroke="${ink}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Rosy blush cheeks -->
  <ellipse cx="58" cy="134" rx="20" ry="12" fill="${blushRed}" opacity="0.75"/>
  <ellipse cx="192" cy="134" rx="20" ry="12" fill="${blushRed}" opacity="0.75"/>
  <!-- Warm smiling mouth -->
  <path d="M 78 142 C 82 186, 168 186, 172 142" fill="none" stroke="${ink}" stroke-width="13" stroke-linecap="round"/>
</svg>`;

// Monochrome emoji for menu bar / tray
const monoEmoji = (color) => `<g>
  <circle cx="125" cy="125" r="110" fill="none" stroke="${color}" stroke-width="20"/>
  <path d="M 66 106 C 72 82, 102 82, 108 106" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round"/>
  <path d="M 142 106 C 148 82, 178 82, 184 106" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round"/>
  <ellipse cx="58" cy="134" rx="14" ry="9" fill="${color}"/>
  <ellipse cx="192" cy="134" rx="14" ry="9" fill="${color}"/>
  <path d="M 78 142 C 82 186, 168 186, 172 142" fill="none" stroke="${color}" stroke-width="20" stroke-linecap="round"/>
</g>`;

// Place inside canvas with optional background
function place(cw, ch, hh, body, bg) {
  const s = hh / H, w = W * s, x = (cw - w) / 2, y = (ch - hh) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}">${bg || ''}<g transform="translate(${x} ${y}) scale(${s})">${body}</g></svg>`;
}

const png = async (svg, out, px, py) => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg), { density: 300 }).resize(px, py || px).png().toFile(out);
};

(async () => {
  console.log('Generating all logo assets with 😊 emoji...');

  // Save source SVG files
  fs.writeFileSync(R + 'assets/aquaaww-logo-source.svg', emojiSvg.trim());
  fs.writeFileSync(R + 'assets/logo.svg', emojiSvg.trim());
  fs.writeFileSync(R + 'mobile/www/img/design/logo.svg', emojiSvg.trim());
  if (fs.existsSync(R + 'site/assets')) fs.writeFileSync(R + 'site/assets/aquaaww-logo.svg', emojiSvg.trim());

  // Web favicon
  if (fs.existsSync(R + 'site')) {
    fs.writeFileSync(R + 'site/favicon.svg', place(64, 64, 52, emojiSvg.replace(/<svg[^>]*>|<\/svg>/g, ''), `<rect width="64" height="64" rx="14" fill="${cream}"/>`));
    await png(place(180, 180, 140, emojiSvg.replace(/<svg[^>]*>|<\/svg>/g, ''), `<rect width="180" height="180" fill="${cream}"/>`), R + 'site/assets/apple-touch-icon-v2.png', 180);
  }

  // Desktop icons (squircle cream tile)
  const innerEmoji = emojiSvg.replace(/<svg[^>]*>|<\/svg>/g, '');
  const tile = `<rect x="100" y="100" width="824" height="824" rx="185" fill="${cream}"/>`;
  await png(place(1024, 1024, 620, innerEmoji, tile), R + 'build/icon.png', 1024);
  await png(place(1024, 1024, 620, innerEmoji, tile), R + 'assets/app-icon.png', 512);
  fs.writeFileSync(R + 'assets/app-icon.svg', place(1024, 1024, 620, innerEmoji, tile));

  // Windows build/icon.ico (all standard icon resolutions)
  const icoBuffers = [];
  for (const s of [16, 24, 32, 48, 64, 128, 256]) {
    const icoSvg = place(s, s, Math.round(s * 0.75), innerEmoji, `<rect width="${s}" height="${s}" rx="${Math.round(s * 0.2)}" fill="${cream}"/>`);
    icoBuffers.push(await sharp(Buffer.from(icoSvg), { density: 400 }).resize(s, s).png().toBuffer());
  }
  fs.writeFileSync(R + 'build/icon.ico', await pngToIco(icoBuffers));
  console.log('build/icon.ico created:', fs.statSync(R + 'build/icon.ico').size, 'bytes');

  // Menu bar / Tray icons (crisp 18px and Retina 36px)
  await png(place(18, 18, 16, monoEmoji('#000')), R + 'assets/trayTemplate.png', 18, 18);
  await png(place(36, 36, 32, monoEmoji('#000')), R + 'assets/trayTemplate@2x.png', 36, 36);
  await png(place(36, 36, 32, monoEmoji('#fff')), R + 'assets/tray-white.png', 36, 36);

  // Android mipmap icons
  const RES = R + 'mobile/android/app/src/main/res';
  const D = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(D)) {
    const a = Math.round(108 * k), l = Math.round(48 * k);
    await png(place(108, 108, 60, innerEmoji), `${RES}/mipmap-${d}/ic_launcher_foreground.png`, a);
    await png(place(48, 48, 36, innerEmoji, `<rect width="48" height="48" rx="10" fill="${cream}"/>`), `${RES}/mipmap-${d}/ic_launcher.png`, l);
    await png(place(48, 48, 36, innerEmoji, `<circle cx="24" cy="24" r="24" fill="${cream}"/>`), `${RES}/mipmap-${d}/ic_launcher_round.png`, l);
  }
  await png(place(96, 96, 80, monoEmoji('#fff')), `${RES}/drawable/ic_stat_drop.png`, 96);
  await png(place(288, 288, 180, innerEmoji), `${RES}/drawable/splash_drop.png`, 576);

  console.log('All icons successfully generated!');
})();
