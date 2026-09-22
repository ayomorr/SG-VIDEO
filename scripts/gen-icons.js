const { Resvg } = require("@resvg/resvg-js");
const { writeFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const OUT = path.join(process.cwd(), "public");
mkdirSync(OUT, { recursive: true });

const shield =
  "M16 2.2c5.4 2.3 10.7 3.3 13.4 3.8v9.7c0 8.1-6.3 13.6-13.4 16.4C9 29.3 2.6 23.8 2.6 15.7V6c2.7-.5 8-1.5 13.4-3.8Z";
const notch =
  "M11.8 9.2h8.4l-4.2 5.1 4.2 5.1h-8.4l4.2-5.1-4.2-5.1Z";

function iconSvg(size, glyphScale) {
  const t = size / 2;
  const g = size / 32 * glyphScale;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0F2233"/>
      <stop offset="1" stop-color="#0B1B2B"/>
    </linearGradient>
    <radialGradient id="glowT" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="#00C2A8" stop-opacity="0.26"/>
      <stop offset="1" stop-color="#00C2A8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowL" cx="0.5" cy="1.05" r="0.75">
      <stop offset="0" stop-color="#A79CFF" stop-opacity="0.2"/>
      <stop offset="1" stop-color="#A79CFF" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shield" x1="4" y1="2" x2="28" y2="30">
      <stop offset="0" stop-color="#00C2A8"/>
      <stop offset="1" stop-color="#2D6CDF"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
  <circle cx="${t}" cy="${t * 0.42}" r="${t * 0.72}" fill="url(#glowT)"/>
  <circle cx="${t}" cy="${t * 1.12}" r="${t * 0.75}" fill="url(#glowL)"/>
  <g transform="translate(${t} ${t}) scale(${g}) translate(-16 -15.75)">
    <path d="${shield}" fill="url(#shield)"/>
    <path d="${notch}" fill="#0B1B2B" fill-opacity="0.92"/>
    <circle cx="16" cy="5" r="1.1" fill="#0B1B2B" fill-opacity="0.9"/>
  </g>
</svg>`;
}

function render(name, size, glyphScale) {
  const svg = iconSvg(size, glyphScale);
  const png = new Resvg(svg).render().asPng();
  writeFileSync(path.join(OUT, name), png);
  console.log("wrote", name, png.length, "bytes");
}

function writeSvg() {
  const svg = iconSvg(512, 0.95);
  writeFileSync(path.join(OUT, "icon.svg"), svg);
  console.log("wrote icon.svg", svg.length, "bytes");
}

render("icon-192.png", 192, 0.95);
render("icon-512.png", 512, 0.95);
render("icon-maskable-512.png", 512, 0.72);
render("apple-touch-icon-180.png", 180, 0.95);
writeSvg();