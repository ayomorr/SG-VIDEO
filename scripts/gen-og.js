/**
 * Renders public/og-image.png. The phone mark here is the same geometry as
 * app/icon.svg and components/logo.tsx — keep them in step, or share
 * the constants with scripts/gen-icons.js.
 *
 *   node scripts/gen-og.js
 */
const { Resvg } = require("@resvg/resvg-js");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const fontDir = path.join(ROOT, "app", "og", "fonts");
const outDir = path.join(ROOT, "public");
mkdirSync(outDir, { recursive: true });

/**
 * Poppins is bundled with next/font, not checked in as a .ttf, so these files
 * are usually absent. Fall back to system fonts rather than crashing — the
 * previous version did a bare readFileSync and the script could not run at
 * all.
 */
function loadFonts() {
  return ["poppins-600.ttf", "poppins-500.ttf"]
    .map((file) => path.join(fontDir, file))
    .filter((file) => existsSync(file))
    .map((file) => {
      const b = readFileSync(file);
      return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
    });
}

const fontBuffers = loadFonts();
if (fontBuffers.length === 0) {
  console.log("no bundled Poppins found, falling back to system fonts");
}

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="sdMark" x1="8" y1="8" x2="56" y2="56">
      <stop offset="0" stop-color="#00C2A8"/>
      <stop offset="0.5" stop-color="#2D6CDF"/>
      <stop offset="1" stop-color="#A79CFF"/>
    </linearGradient>
    <linearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00C2A8"/>
      <stop offset="0.6" stop-color="#2D6CDF"/>
      <stop offset="1" stop-color="#A79CFF"/>
    </linearGradient>
    <radialGradient id="blobTeal" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#00C2A8" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#00C2A8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blobLav" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#A79CFF" stop-opacity="0.3"/>
      <stop offset="1" stop-color="#A79CFF" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" fill="none" stroke="rgba(247,249,252,0.045)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="#0B1B2B"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <circle cx="1020" cy="120" r="330" fill="url(#blobTeal)"/>
  <circle cx="180" cy="620" r="340" fill="url(#blobLav)"/>

  <g font-family="Poppins">
    <text x="88" y="130" font-size="24" font-weight="600" fill="#00C2A8" letter-spacing="8">SCROLL DETECT</text>

    <text x="86" y="232" font-size="78" font-weight="600" fill="#F7F9FC" letter-spacing="-2">Scroll smarter.</text>
    <text x="86" y="326" font-size="78" font-weight="600" fill="#F7F9FC" letter-spacing="-2">Live more.</text>

    <text x="88" y="382" font-size="29" font-weight="500" fill="rgba(247,249,252,0.68)">Your phone shouldn't steal your night.</text>

    <rect x="88" y="418" width="430" height="58" rx="29" fill="rgba(0,194,168,0.14)" stroke="#00C2A8" stroke-opacity="0.45"/>
    <text x="116" y="456" font-size="22" font-weight="500" fill="#00C2A8">Free · iOS &amp; Android · Private by design</text>
  </g>

  <!-- The real brand mark, at 4.1x the 64-unit icon box. -->
  <g transform="translate(906 162) scale(4.1)">
    <rect x="6" y="6" width="52" height="52" rx="16" fill="#0B1B2B"/>
    <rect x="20.5" y="8" width="23" height="48" rx="6.5" fill="#0B1B2B" stroke="url(#sdMark)" stroke-width="2"/>
    <rect x="23.5" y="12.5" width="17" height="39" rx="3.5" fill="#101F30"/>
    <path d="M32 20 V26" stroke="url(#sdMark)" stroke-width="4" stroke-linecap="round"/>
    <path d="M27.5 25.5 L32 30.5 L36.5 25.5" stroke="url(#sdMark)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="32" cy="36.2" r="2.2" fill="url(#sdMark)"/>
    <circle cx="32" cy="44.5" r="6" fill="#071321"/>
    <circle cx="32" cy="44.5" r="6" stroke="url(#sdMark)" stroke-width="2" fill="none" opacity="0.9"/>
    <rect x="29.25" y="14.75" width="5.5" height="2" rx="1" fill="#F7F9FC" fill-opacity="0.85"/>
  </g>
  <rect x="906" y="162" width="262" height="262" rx="16" fill="none" stroke="url(#badge)" stroke-width="4"/>
  <text x="1037" y="482" font-family="Poppins" font-size="24" font-weight="600" fill="#F7F9FC" text-anchor="middle">scrolldictive.app</text>
</svg>
`;

const resvg = new Resvg(svg, {
  font: {
    fontBuffers,
    loadSystemFonts: fontBuffers.length === 0,
    defaultFontFamily: "Poppins",
  },
});
const png = resvg.render().asPng();
writeFileSync(path.join(outDir, "og-image.png"), png);
console.log("wrote public/og-image.png", png.length, "bytes");
