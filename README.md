# Lumark (光印)

**Live site: https://lumark.yucheng208.net**

A web tool that adds a camera-info frame to your photos and videos. Everything runs in the browser, so your files are never uploaded.
The interface is available in Traditional Chinese, English and Japanese and follows your browser language. Visitors whose language isn't supported get a suggestion to use Google Translate.

## Features

- **Many formats**: JPG, PNG, WebP, SVG, HEIC/HEIF, RAW (DNG, NEF, CR2, CR3, ARW, RAF, ORF, RW2, PEF and more), GIF, and video in MP4, MOV, MKV, AVI, WMV and WebM. Videos the browser can't play (such as AVI and WMV) get a preview copy made with ffmpeg, while exports still use the original file at full resolution. RAW files show the camera's embedded preview right away, then switch to a full-resolution LibRaw decode in the background; details missing from the RAW (for example Fujifilm RAF) are read from that preview's EXIF. HEIC is decoded natively in Safari and with libheif in other browsers.
- **Import from a URL**: paste a photo or video link, or press Ctrl/⌘ + V to paste an image or link. Files from sites that block cross-origin downloads are fetched through the site's own Cloudflare Worker (images and videos only, up to 300 MB).
- **Reads photo details automatically**: camera, lens, focal length (converted to the 35mm equivalent for phones), ISO, aperture, shutter speed, date and time. Every field can be edited.
- **Detects place and weather**: looks up the city from the photo's GPS (for example, "New Taipei, Taiwan") and the weather and temperature at the time it was taken. If a photo has no GPS data (common with dedicated cameras), the device's current location is used automatically for the place, weather and temperature; this can be turned off. You can also switch to manual entry and type the place, weather (any text, or pick a preset) and temperature yourself.
- **Choose what to show**: exposure, camera, lens, logo, date, time, weather, temperature, place and coordinates. Dates can be YYYY/MM/DD or YYYY-MM-DD, and times 24-hour or 12-hour (shown as 下午 1:32, 1:32 PM or 午後1:32 depending on language).
- **Frame styles**: bottom bar only, or a full border on all four sides with adjustable width. Two layouts: Classic (details on the left, logo and camera on the right) and Centered (no logo; the brand name, e.g. FUJIFILM, sits above the model, followed by lens, exposure and date). Frame color can be white, black or any color from a color picker, a HEX/RGB value, or the eyedropper; text color adjusts automatically. The frame height scales with the photo's short side.
- **Signature**: three kinds that can all be used together: a text signature (six English cursive fonts, sans or serif), an image signature (PNG, JPG, WebP or SVG, white backgrounds removed), and a handwritten signature drawn on a signing pad with pen, marker or pressure-sensitive brush in any ink color (remembered in the browser). Each has its own position (photo corners, the frame, or anywhere by dragging it on the preview), size, opacity and color (auto, white, black, original, or any color by picker/HEX), plus an optional frosted-glass backing.
- **Cropping**: free, original, 1:1, 4:5, 3:2, 16:9 and more. Works with a mouse or touch.
- **Logos**: cameras (including RICOH, DJI, GoPro, Insta360 and Kodak), phones (Apple, Samsung, Google, Sony, Microsoft, Huawei, Xiaomi, vivo, ASUS and more), camera apps (Dazz Cam, detected from the photo's Software tag), media platforms (YouTube, Spotify, Apple Music, KKBOX, TikTok, Instagram and more; picked automatically for files imported from those sites) and AI tools (Gemini, ChatGPT, Claude, Grok and more). The logo is picked automatically from the camera brand. Every logo can be shown in black & white (white on dark frames, black on light frames) or in its brand colors. You can also upload your own logo; white backgrounds are removed automatically.
- **Video and GIF** (via ffmpeg.wasm): MP4, MOV and GIF in and out. You can remove audio, loop, play back and forth (boomerang), resize, and set the GIF frame rate.
- **Interface**: on desktop and tablets, settings are grouped into tabs (Frame, Signature, Details, Place, Export) with the download, save and print buttons always visible at the bottom. Tablets in landscape show the preview and settings side by side; in portrait they stack. Date uses the system date picker and time uses hour/minute selectors that follow the 24-hour or 12-hour setting (AM/PM only in 12-hour mode); changing them refreshes the auto-detected weather.
- **Mobile & theme**: system, light or dark theme. On phones it works like an app: preview on top, a thumbnail strip, tool tabs at the bottom (Frame, Signature, Details, Place, Export, More), and an add sheet for the photo library, files or a URL. It can also be added to the home screen.
- **Export**: photos keep their original format (JPG, PNG and WebP stay the same; HEIC, RAW and other formats are saved as JPG). Share straight to social media (Instagram, Threads, Facebook, LINE, X… through the system share sheet; where that isn't available the image is copied to the clipboard), download a single file, print it, or save it to the device. On phones this opens the share sheet, where “Save Image” / “Save Video” puts it straight into the photo library. You can also download everything as a ZIP.

## Local development

Requires Node.js 18 or later.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:8787.

## Deploying to Cloudflare

The site is static files in `public/` served as Cloudflare Workers static assets, plus a small Worker (`src/worker.js`) that only handles `/api/fetch` for URL imports. The configuration is in `wrangler.jsonc`.

```bash
npx wrangler login
```

```bash
npm run deploy
```

The Worker is served at the custom domain `lumark.yucheng208.net` (set under `routes` in `wrangler.jsonc`).

## Project structure

```
public/              The website that gets deployed
  index.html
  assets/            Scripts and styles (app, frame, crop, geo, media, i18n)
  logo/              Brand logos
  fonts/             Saira Semi Condensed (OFL)
  vendor/ffmpeg/     ffmpeg.wasm loader (the ~32 MB core is downloaded from jsDelivr when first needed)
  vendor/heic/       heic-to (libheif) for HEIC decoding, loaded only when needed
  vendor/libraw/     libraw-wasm for RAW decoding, loaded only when needed
src/worker.js        Cloudflare Worker for /api/fetch (URL import)
scripts/build-logos.mjs   Generates the phone, media platform and AI logos from simple-icons
wrangler.jsonc
```

## External services

- [OpenStreetMap Nominatim](https://nominatim.org/): turns coordinates into place names (at most one request per second)
- [Open-Meteo](https://open-meteo.com/): historical and recent weather (free for non-commercial use)
- [jsDelivr](https://www.jsdelivr.com/): serves exifr, JSZip and the ffmpeg core

Only coordinates and dates are sent to these services. Photos and videos are never uploaded.

## Credits and licenses

- The source code is released under the MIT License (see `LICENSE`). Logos and fonts are not covered by it.
- Phone and AI logos come from [Simple Icons](https://simpleicons.org/) (CC0). The ChatGPT, GoPro and RICOH logo images come from [Logos-World](https://logos-world.net/), the Dazz Cam logo from [dazz.ltd](https://dazz.ltd/), and the KKBOX logo from [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:KKBOX_logo.svg). Grok is not available in any of these, so it appears as text.
- All brand names and logos are trademarks of their owners and are used only to identify the capture device or generation tool.
- The Saira Semi Condensed font is licensed under the SIL Open Font License.
- Bundled decoders keep their own licenses: heic-to / libheif (LGPL-3.0), libraw-wasm (ISC) with LibRaw (LGPL-2.1 / CDDL-1.0), ffmpeg.wasm (MIT, core under GPL). License files are in `public/vendor/`.
