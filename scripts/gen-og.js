const { Resvg } = require("@resvg/resvg-js");
const { readFileSync, writeFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const fontDir = path.join(ROOT, "app", "og", "fonts");
const outDir = path.join(ROOT, "public");
mkdirSync(outDir, { recursive: true });

const poppins600 = readFileSync(path.join(fontDir, "poppins-600.ttf"));
const poppins500 = readFileSync(path.join(fontDir, "poppins-500.ttf"));

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
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

  <g>
    <rect x="906" y="162" width="262" height="306" rx="52" fill="url(#badge)"/>
    <rect x="987" y="220" width="100" height="66" rx="40" fill="#0B1B2B"/>
    <rect x="1020" y="290" width="34" height="20" fill="#0B1B2B"/>
    <rect x="987" y="314" width="100" height="66" rx="40" fill="#0B1B2B"/>
    <rect x="918" y="424" width="238" height="46" rx="23" fill="#F7F9FC"/>
    <text x="1037" y="457" font-family="Poppins" font-size="20" font-weight="600" fill="#062018" text-anchor="middle">scrolldictive.app</text>
  </g>
</svg>
`;

const resvg = new Resvg(svg, {
  font: {
    fontBuffers: [poppins600, poppins500].map((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)),
    loadSystemFonts: false,
    defaultFontFamily: "Poppins",
  },
});
const png = resvg.render().asPng();
writeFileSync(path.join(outDir, "og-image.png"), png);
console.log("wrote", png.length, "bytes");