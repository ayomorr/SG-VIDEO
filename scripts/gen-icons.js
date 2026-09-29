/**
 * Renders every icon the project ships from one source of truth: the phone
 * mark below, which is byte-identical to `app/icon.svg` and to `LogoMark` in
 * `components/logo.tsx`. Re-run after changing any of them so the raster
 * icons, the apple touch icon and the favicon can never drift from the site
 * logo.
 *
 *   node scripts/gen-icons.js
 */
const { Resvg } = require("@resvg/resvg-js");
const { writeFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

const OUT = path.join(process.cwd(), "public");
const APP = path.join(process.cwd(), "app");
mkdirSync(OUT, { recursive: true });

/** The phone, in the same 64-unit box as `app/icon.svg`. Centred on 32,32. */
const PHONE = `
    <rect x="20.5" y="8" width="23" height="48" rx="6.5" fill="#0B1B2B" stroke="url(#sd-mark)" stroke-width="2"/>
    <rect x="23.5" y="12.5" width="17" height="39" rx="3.5" fill="#101F30"/>
    <path d="M32 20 V26" stroke="url(#sd-mark)" stroke-width="4" stroke-linecap="round"/>
    <path d="M27.5 25.5 L32 30.5 L36.5 25.5" stroke="url(#sd-mark)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="32" cy="36.2" r="2.2" fill="url(#sd-mark)"/>
    <circle cx="32" cy="44.5" r="6" fill="#071321"/>
    <circle cx="32" cy="44.5" r="6" stroke="url(#sd-mark)" stroke-width="2" fill="none" opacity="0.9"/>
    <rect x="29.25" y="14.75" width="5.5" height="2" rx="1" fill="#F7F9FC" fill-opacity="0.85"/>`;

const DEFS = `
    <linearGradient id="sd-mark" x1="8" y1="8" x2="56" y2="56">
      <stop stop-color="#00C2A8"/>
      <stop offset="0.5" stop-color="#2D6CDF"/>
      <stop offset="1" stop-color="#A79CFF"/>
    </linearGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0F2233"/>
      <stop offset="1" stop-color="#0B1B2B"/>
    </linearGradient>`;

/**
 * @param size    output edge length in px
 * @param scale   1 = the phone exactly as drawn in app/icon.svg
 * @param tile    "rounded" = the site's rounded square, "full" = full-bleed
 *                for a launcher that applies its own mask
 */
function iconSvg(size, scale = 1, tile = "rounded") {
  const bg =
    tile === "rounded"
      ? `<rect x="6" y="6" width="52" height="52" rx="16" fill="#0B1B2B"/>`
      : `<rect width="64" height="64" fill="url(#bg)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
  <defs>${DEFS}
  </defs>
  ${bg}
  <g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${PHONE}
  </g>
</svg>`;
}

function render(file, svg) {
  const png = new Resvg(svg).render().asPng();
  writeFileSync(path.join(OUT, file), png);
  console.log("wrote public/" + file, png.length, "bytes");
}

function writeAppIcon() {
  writeFileSync(
    path.join(APP, "icon.svg"),
    iconSvg(64, 1, 16).replace(/ width="64" height="64"/, "") + "\n",
  );
  console.log("wrote app/icon.svg");
}

/**
 * Packs the rendered PNGs into a real .ico (PNG-compressed entries, which
 * every browser since IE11 understands). Without this, anything that falls
 * back to /favicon.ico still shows the stock create-next-app "N".
 */
function writeFavicon() {
  const images = [16, 32, 48].map((size) => ({
    size,
    data: new Resvg(iconSvg(size, 1, "rounded")).render().asPng(),
  }));

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach((img, i) => {
    const at = i * 16;
    dir.writeUInt8(img.size, at + 0);
    dir.writeUInt8(img.size, at + 1);
    dir.writeUInt8(0, at + 2); // palette size
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // colour planes
    dir.writeUInt16LE(32, at + 6); // bits per pixel
    dir.writeUInt32LE(img.data.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += img.data.length;
  });

  const ico = Buffer.concat([header, dir, ...images.map((i) => i.data)]);
  writeFileSync(path.join(APP, "favicon.ico"), ico);
  console.log("wrote app/favicon.ico", ico.length, "bytes");
}

// Rounded-square tiles for the icons an OS places on a home screen or dock.
render("icon-192.png", iconSvg(192));
render("icon-512.png", iconSvg(512));
// Apple composes its own squircle mask, so the tile has to be full-bleed and
// the phone pulled in so the rounded body does not sit under the mask curve.
render("apple-touch-icon-180.png", iconSvg(180, 0.8, "full"));
// A launcher may crop up to 10% off every edge, so the glyph is pulled in to
// stay inside the 80% safe zone. The phone is 48 units tall, so 0.82 keeps it
// inside 51.2 while still reading large.
render("icon-maskable-512.png", iconSvg(512, 0.82, "full"));

// NOTE: deliberately no public/icon.svg. The App Router already serves
// app/icon.svg at /icon.svg, and a second file at that path makes the route
// 500 on a route collision.

writeAppIcon();
writeFavicon();
