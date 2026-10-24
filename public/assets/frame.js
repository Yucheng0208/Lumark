/* EXIF 讀取與邊框繪製 */
(function () {
  'use strict';

  // group: camera / phone / ai；adapt: 黑色 Logo，在黑色邊框上會自動改成白色；darkFile: 黑色邊框專用的圖檔
  const LOGOS = [
    { key: 'Lumark', file: 'Lumark.png', label: '光印 Lumark', group: 'app' },
    { key: 'Nikon_yellow', file: 'Nikon_yellow.png', label: 'Nikon', group: 'camera' },
    { key: 'NXstudio', file: 'NXstudio.png', label: 'Nikon NX Studio', group: 'camera' },
    { key: 'Canon_red', file: 'Canon_red.png', label: 'Canon', group: 'camera' },
    { key: 'SONY', file: 'SONY.png', label: 'Sony', group: 'camera', adapt: true },
    { key: 'FUJIFILM', file: 'FUJIFILM.png', label: 'FUJIFILM', group: 'camera' },
    { key: 'Leica_red', file: 'Leica_red.png', label: 'Leica (red)', group: 'camera' },
    { key: 'Leica_black', file: 'Leica_black.png', label: 'Leica (black)', group: 'camera' },
    { key: 'Leica_text', file: 'Leica_text.png', label: 'Leica (text)', group: 'camera' },
    { key: 'HASSELBLAD_H', file: 'HASSELBLAD_H.png', label: 'Hasselblad', group: 'camera' },
    { key: 'lumix', file: 'lumix.png', label: 'Panasonic LUMIX', group: 'camera', adapt: true },
    { key: 'Ricoh', file: 'Ricoh.png', label: 'RICOH', group: 'camera' },
    { key: 'DJI', file: 'DJI.svg', label: 'DJI', group: 'camera', adapt: true },
    { key: 'Insta360', file: 'Insta360.svg', label: 'Insta360', group: 'camera', adapt: true },
    { key: 'Kodak', file: 'Kodak.svg', label: 'Kodak', group: 'camera' },
    { key: 'GoPro', file: 'GoPro.png', darkFile: 'GoPro_dark.png', label: 'GoPro', group: 'camera' },
    { key: 'Apple', file: 'Apple.svg', label: 'Apple', group: 'phone', adapt: true },
    { key: 'Samsung', file: 'Samsung.svg', label: 'Samsung', group: 'phone' },
    { key: 'Google', file: 'Google.svg', label: 'Google', group: 'phone' },
    { key: 'Sony_phone', file: 'SONY.png', label: 'Sony Xperia', group: 'phone', adapt: true },
    { key: 'Microsoft', file: 'Microsoft.svg', label: 'Microsoft', group: 'phone' },
    { key: 'Huawei', file: 'Huawei.svg', label: 'Huawei', group: 'phone' },
    { key: 'Honor', file: 'Honor.svg', label: 'Honor', group: 'phone', adapt: true },
    { key: 'Xiaomi', file: 'Xiaomi.svg', label: 'Xiaomi', group: 'phone' },
    { key: 'vivo', file: 'vivo.svg', label: 'vivo', group: 'phone' },
    { key: 'OPPO', file: 'OPPO.svg', label: 'OPPO', group: 'phone' },
    { key: 'OnePlus', file: 'OnePlus.svg', label: 'OnePlus', group: 'phone' },
    { key: 'ASUS', file: 'ASUS.svg', label: 'ASUS', group: 'phone', adapt: true },
    { key: 'Motorola', file: 'Motorola.svg', label: 'Motorola', group: 'phone' },
    { key: 'Nokia', file: 'Nokia.svg', label: 'Nokia', group: 'phone' },
    { key: 'LG', file: 'LG.svg', label: 'LG', group: 'phone' },
    { key: 'HTC', file: 'HTC.svg', label: 'HTC', group: 'phone' },
    { key: 'Sharp', file: 'Sharp.svg', label: 'Sharp', group: 'phone' },
    { key: 'Dazz', file: 'Dazz.png', darkFile: 'Dazz_dark.png', label: 'Dazz Cam', group: 'camapp' },
    { key: 'YouTube', file: 'YouTube.svg', label: 'YouTube', group: 'media' },
    { key: 'YouTubeMusic', file: 'YouTubeMusic.svg', label: 'YouTube Music', group: 'media' },
    { key: 'Spotify', file: 'Spotify.svg', label: 'Spotify', group: 'media' },
    { key: 'AppleMusic', file: 'AppleMusic.svg', label: 'Apple Music', group: 'media' },
    { key: 'KKBOX', file: 'KKBOX.svg', label: 'KKBOX', group: 'media' },
    { key: 'ApplePodcasts', file: 'ApplePodcasts.svg', label: 'Apple Podcasts', group: 'media' },
    { key: 'TikTok', file: 'TikTok.svg', label: 'TikTok', group: 'media', adapt: true },
    { key: 'Instagram', file: 'Instagram.svg', label: 'Instagram', group: 'media' },
    { key: 'Facebook', file: 'Facebook.svg', label: 'Facebook', group: 'media' },
    { key: 'Threads', file: 'Threads.svg', label: 'Threads', group: 'media', adapt: true },
    { key: 'X', file: 'X.svg', label: 'X', group: 'media', adapt: true },
    { key: 'Netflix', file: 'Netflix.svg', label: 'Netflix', group: 'media' },
    { key: 'Twitch', file: 'Twitch.svg', label: 'Twitch', group: 'media' },
    { key: 'Vimeo', file: 'Vimeo.svg', label: 'Vimeo', group: 'media' },
    { key: 'Bilibili', file: 'Bilibili.svg', label: 'bilibili', group: 'media' },
    { key: 'SoundCloud', file: 'SoundCloud.svg', label: 'SoundCloud', group: 'media' },
    { key: 'LINE', file: 'LINE.svg', label: 'LINE', group: 'media' },
    { key: 'Xiaohongshu', file: 'Xiaohongshu.svg', label: '小紅書', group: 'media' },
    { key: 'Deezer', file: 'Deezer.svg', label: 'Deezer', group: 'media' },
    { key: 'TIDAL', file: 'TIDAL.svg', label: 'TIDAL', group: 'media', adapt: true },
    { key: 'Gemini', file: 'Gemini.svg', label: 'Gemini', group: 'ai' },
    { key: 'ChatGPT', file: 'ChatGPT.png', label: 'ChatGPT', group: 'ai', adapt: true },
    { key: 'Claude', file: 'Claude.svg', label: 'Claude', group: 'ai' },
    { key: 'Anthropic', file: 'Anthropic.svg', label: 'Anthropic', group: 'ai', adapt: true },
    { key: 'Grok', text: 'Grok', label: 'Grok', group: 'ai', adapt: true },
    { key: 'DeepSeek', file: 'DeepSeek.svg', label: 'DeepSeek', group: 'ai' },
    { key: 'Meta', file: 'Meta.svg', label: 'Meta AI', group: 'ai' },
    { key: 'MistralAI', file: 'MistralAI.svg', label: 'Mistral AI', group: 'ai' },
    { key: 'Perplexity', file: 'Perplexity.svg', label: 'Perplexity', group: 'ai' },
    { key: 'Qwen', file: 'Qwen.svg', label: 'Qwen', group: 'ai' },
  ];

  // 依 EXIF 的 Make（廠牌）自動挑 Logo，Model 用來分辨 Sony 相機 / Xperia 手機
  const MAKE_TO_LOGO = [
    [/nikon/i, 'Nikon_yellow'],
    [/canon/i, 'Canon_red'],
    [/sony/i, (model) => (/xperia|^(so-|sog|xq-|[ef]\d{4}|g\d{4}|h\d{4}|i\d{4}|j\d{4})/i.test(model) ? 'Sony_phone' : 'SONY')],
    [/fuji/i, 'FUJIFILM'],
    [/leica/i, 'Leica_red'],
    [/hasselblad/i, 'HASSELBLAD_H'],
    [/panasonic|lumix/i, 'lumix'],
    // PENTAX 機身的 Make 也是 RICOH IMAGING，這類不套用理光 Logo
    [/ricoh/i, (model) => (/pentax/i.test(model) ? null : 'Ricoh')],
    [/^dji|hasselblad.*dji/i, 'DJI'],
    [/insta360|arashi/i, 'Insta360'],
    [/kodak/i, 'Kodak'],
    [/gopro/i, 'GoPro'],
    [/apple/i, 'Apple'],
    [/samsung/i, 'Samsung'],
    [/google/i, 'Google'],
    [/microsoft/i, 'Microsoft'],
    [/huawei/i, 'Huawei'],
    [/honor/i, 'Honor'],
    [/xiaomi|redmi|poco/i, 'Xiaomi'],
    [/vivo|iqoo/i, 'vivo'],
    [/oppo|realme/i, 'OPPO'],
    [/oneplus/i, 'OnePlus'],
    [/asus/i, 'ASUS'],
    [/motorola|lenovo/i, 'Motorola'],
    [/nokia|hmd/i, 'Nokia'],
    [/^lg/i, 'LG'],
    [/htc/i, 'HTC'],
    [/sharp/i, 'Sharp'],
  ];

  // 從網址匯入時，依來源網站自動挑影音平台 Logo
  const HOST_TO_LOGO = [
    [/(^|\.)(youtube\.com|youtu\.be|ytimg\.com|googlevideo\.com)$/i, 'YouTube'],
    [/(^|\.)(spotify\.com|scdn\.co|spotifycdn\.com)$/i, 'Spotify'],
    [/(^|\.)(music\.apple\.com|mzstatic\.com)$/i, 'AppleMusic'],
    [/(^|\.)(kkbox\.com|kfs\.io)$/i, 'KKBOX'],
    [/(^|\.)(tiktok\.com|tiktokcdn\.com|tiktokcdn-us\.com)$/i, 'TikTok'],
    [/(^|\.)(instagram\.com|cdninstagram\.com)$/i, 'Instagram'],
    [/(^|\.)(facebook\.com|fbcdn\.net)$/i, 'Facebook'],
    [/(^|\.)(threads\.net|threads\.com)$/i, 'Threads'],
    [/(^|\.)(x\.com|twitter\.com|twimg\.com)$/i, 'X'],
    [/(^|\.)(vimeo\.com|vimeocdn\.com)$/i, 'Vimeo'],
    [/(^|\.)(bilibili\.com|hdslb\.com)$/i, 'Bilibili'],
    [/(^|\.)(soundcloud\.com|sndcdn\.com)$/i, 'SoundCloud'],
    [/(^|\.)(twitch\.tv|jtvnw\.net)$/i, 'Twitch'],
    [/(^|\.)(xiaohongshu\.com|xhscdn\.com)$/i, 'Xiaohongshu'],
  ];

  function logoForHost(host) {
    const hit = HOST_TO_LOGO.find(([re]) => re.test(host || ''));
    return hit ? hit[1] : null;
  }

  // 相機 App 會寫在 EXIF 的 Software 欄位
  function logoForSoftware(sw) {
    if (/dazz/i.test(sw || '')) return 'Dazz';
    return null;
  }

  /** 把 EXIF 的廠牌整理成好看的品牌名稱（NIKON CORPORATION → NIKON） */
  const BRAND_NAMES = [
    [/^nikon/i, 'NIKON'], [/^canon/i, 'Canon'], [/^fuji/i, 'FUJIFILM'], [/^sony/i, 'SONY'],
    [/^ricoh/i, 'RICOH'], [/^pentax/i, 'PENTAX'], [/^olympus/i, 'OLYMPUS'], [/^om digital/i, 'OM SYSTEM'],
    [/^panasonic/i, 'Panasonic'], [/^leica/i, 'Leica'], [/^hasselblad/i, 'HASSELBLAD'], [/^sigma/i, 'SIGMA'],
    [/^dji/i, 'DJI'], [/^gopro/i, 'GoPro'], [/^insta360|^arashi/i, 'Insta360'], [/^kodak/i, 'Kodak'],
    [/^apple/i, 'Apple'], [/^samsung/i, 'Samsung'], [/^google/i, 'Google'], [/^huawei/i, 'HUAWEI'],
    [/^xiaomi/i, 'Xiaomi'], [/^vivo/i, 'vivo'], [/^oppo/i, 'OPPO'], [/^oneplus/i, 'OnePlus'], [/^asus/i, 'ASUS'],
    [/^honor/i, 'HONOR'], [/^motorola/i, 'Motorola'], [/^nothing/i, 'Nothing'], [/^microsoft/i, 'Microsoft'],
  ];
  function brandName(make) {
    const m = String(make || '').trim();
    if (!m) return '';
    const hit = BRAND_NAMES.find(([re]) => re.test(m));
    if (hit) return hit[1];
    // 去掉結尾的公司型態字樣（Co., Ltd.／Corporation／Inc.／GmbH…）
    let out = m;
    const SUFFIX = /[\s,]*(co\.?,?\s*ltd\.?|ltd\.?|limited|corporation|corp\.?|inc\.?|gmbh|ag|s\.?a\.?|imaging|company|camera)$/i;
    for (let i = 0; i < 4 && SUFFIX.test(out); i++) out = out.replace(SUFFIX, '');
    return out.replace(/[,.\s]+$/, '').trim() || m;
  }

  function logoForMake(make, model) {
    if (!make) return null;
    const hit = MAKE_TO_LOGO.find(([re]) => re.test(make));
    if (!hit) return null;
    return typeof hit[1] === 'function' ? hit[1](model || '') : hit[1];
  }

  /* ---------- 數值格式化 ---------- */

  function trimNum(n, digits) {
    return String(Number(n.toFixed(digits)));
  }

  function formatExposure(t) {
    if (typeof t !== 'number' || !isFinite(t) || t <= 0) return '';
    if (t >= 1) return trimNum(t, 1);
    const denom = Math.round(1 / t);
    if (Math.abs(1 / denom - t) / t > 0.03) return '1/' + trimNum(1 / t, 1);
    return '1/' + denom;
  }

  const pad2 = (n) => String(n).padStart(2, '0');

  // EXIF 時間沒有時區，exifr 會當成本地時間建立 Date，直接取各欄位即為相機上的當地時間
  function splitDate(d) {
    if (typeof d === 'string') {
      const m = d.match(/(\d{4})[:\-/](\d{2})[:\-/](\d{2})(?:[ T](\d{2}):(\d{2}))?/);
      if (!m) return null;
      return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] != null ? +m[4] : null, mi: m[5] != null ? +m[5] : null };
    }
    if (d instanceof Date && !isNaN(d)) {
      return { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes() };
    }
    return null;
  }

  /* ---------- Nikon MakerNote：鏡頭規格 (tag 0x0084) ---------- */
  function nikonLensFromMakerNote(buf) {
    try {
      if (!buf) return '';
      const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      if (String.fromCharCode(...u8.subarray(0, 5)) !== 'Nikon') return '';
      const base = 10;
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const le = u8[base] === 0x49;
      const ifd = dv.getUint32(base + 4, le);
      const count = dv.getUint16(base + ifd, le);
      for (let i = 0; i < count; i++) {
        const e = base + ifd + 2 + i * 12;
        if (dv.getUint16(e, le) !== 0x0084) continue;
        const off = base + dv.getUint32(e + 8, le);
        const r = (k) => {
          const den = dv.getUint32(off + k * 8 + 4, le);
          return den ? dv.getUint32(off + k * 8, le) / den : 0;
        };
        const [fMin, fMax, aMin, aMax] = [r(0), r(1), r(2), r(3)];
        if (!fMin) return '';
        const focal = fMin === fMax ? trimNum(fMin, 1) : `${trimNum(fMin, 1)}-${trimNum(fMax, 1)}`;
        const ap = aMin === aMax ? trimNum(aMin, 1) : `${trimNum(aMin, 1)}-${trimNum(aMax, 1)}`;
        return `${focal}mm f/${ap}`;
      }
    } catch (err) { /* 格式不符就放棄 */ }
    return '';
  }

  async function readExif(file) {
    let raw = {};
    try {
      raw = (await exifr.parse(file, {
        tiff: true, exif: true, gps: true, ifd1: false,
        xmp: true, iptc: false, icc: false, makerNote: true,
      })) || {};
    } catch (err) {
      console.warn('EXIF read failed', err);
    }
    let lens = raw.LensModel || raw.Lens || '';
    if (!lens && /nikon/i.test(raw.Make || '')) {
      lens = nikonLensFromMakerNote(raw.makerNote || raw.MakerNote);
    }
    const iso = raw.ISO ?? raw.ISOSpeedRatings ?? raw.PhotographicSensitivity;
    const model = (raw.Model || '').trim();
    // 手機鏡頭名稱常以機型開頭（iPhone 17 Pro Max back camera …），去掉重複的部分
    if (model && lens && String(lens).startsWith(model)) lens = String(lens).slice(model.length).trim() || lens;
    // 手機等小感光元件：改用等效 35mm 焦距（6.8mm → 24mm）
    let focal = raw.FocalLength;
    const eq = raw.FocalLengthIn35mmFormat ?? raw.FocalLengthIn35mmFilm;
    if (typeof focal === 'number' && focal < 15 && typeof eq === 'number' && eq > focal * 1.5) focal = eq;

    // 沒有拍攝時間時，退而使用檔案修改時間
    let when = splitDate(raw.DateTimeOriginal || raw.CreateDate || raw.ModifyDate);
    const dateFromFile = !when;
    if (!when && file.lastModified) when = splitDate(new Date(file.lastModified));

    const lat = typeof raw.latitude === 'number' && isFinite(raw.latitude) ? raw.latitude : null;
    const lon = typeof raw.longitude === 'number' && isFinite(raw.longitude) ? raw.longitude : null;

    return {
      make: raw.Make || '',
      model,
      lens: String(lens).trim().replace(/(\d+)\.0(?!\d)/g, '$1'),
      focal: typeof focal === 'number' ? trimNum(focal, 1) : '',
      iso: iso != null ? String(Array.isArray(iso) ? iso[0] : iso) : '',
      fnum: typeof raw.FNumber === 'number' ? raw.FNumber.toFixed(1) : '',
      exposure: formatExposure(raw.ExposureTime),
      date: when ? `${when.y}/${pad2(when.mo)}/${pad2(when.d)}` : '',
      time: when && when.h != null ? `${pad2(when.h)}:${pad2(when.mi)}` : '',
      lat, lon, dateFromFile,
      software: String(raw.Software || '').trim(),
      location: '',
      weather: '',
      temp: '',
    };
  }

  /* ---------- 組合邊框文字 ---------- */

  const SEP = '  ·  ';

  /**
   * @param ex    相片參數
   * @param show  勾選要顯示的項目
   * @param fmt   { weatherLabel(key), tempUnit: 'C'|'F', coords(lat,lon) }
   * @returns { left: [{text, bold}], right: [{text, bold}] }
   */
  function buildLines(ex, show, fmt) {
    const shot = [
      ex.focal && `${ex.focal}mm`,
      ex.iso && `ISO${ex.iso}`,
      ex.fnum && `f${ex.fnum}`,
      ex.exposure && `${ex.exposure}s`,
    ].filter(Boolean).join('  ');

    const when = [
      show.date && ex.date && (fmt.date ? fmt.date(ex.date) : ex.date),
      show.time && ex.time && (fmt.time ? fmt.time(ex.time) : ex.time),
    ].filter(Boolean).join(' ');
    let weather = show.weather && ex.weather ? fmt.weatherLabel(ex.weather) : '';
    if (show.temp && ex.temp !== '' && ex.temp != null && !isNaN(ex.temp)) {
      const c = Number(ex.temp);
      const tv = fmt.tempUnit === 'F' ? `${Math.round(c * 9 / 5 + 32)}°F` : `${c}°C`;
      weather = weather ? `${weather} ${tv}` : tv;
    }
    const extra = [
      when,
      weather,
      show.location && ex.location,
      show.coords && fmt.coords(ex.lat, ex.lon),
    ].filter(Boolean).join(SEP);

    const left = [];
    if (show.shot && shot) left.push({ text: shot, bold: true });
    if (extra) left.push({ text: extra, bold: false });

    const right = [];
    if (show.model && ex.model) right.push({ text: ex.model, bold: true });
    if (show.lens && ex.lens) right.push({ text: ex.lens, bold: false });

    // 置中版型：機身／鏡頭＋拍攝參數／其他資訊，各一行
    const center = [];
    const brand = show.brand && fmt.brand ? fmt.brand : '';
    if (brand) center.push({ text: brand, bold: true, spaced: true });
    let model = ex.model || '';
    // 型號開頭已經有品牌名稱時拿掉，避免重複（Canon EOS R5 → EOS R5）
    if (brand && model.toLowerCase().startsWith(brand.toLowerCase() + ' ')) model = model.slice(brand.length).trim();
    if (show.model && model) center.push({ text: model, bold: true });
    const mid = [show.lens && ex.lens, show.shot && shot].filter(Boolean).join(SEP);
    if (mid) center.push({ text: mid, bold: center.length === 0 });
    if (extra) center.push({ text: extra, bold: false });

    return { left, right, center };
  }

  /* ---------- Logo 載入（自動裁掉透明邊） ---------- */

  const logoCache = new Map();

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function trimTransparent(img) {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    let data;
    try { data = ctx.getImageData(0, 0, c.width, c.height).data; } catch (e) { return c; }
    let top = c.height, left = c.width, right = -1, bottom = -1;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (data[(y * c.width + x) * 4 + 3] > 8) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    if (right < 0) return c;
    const out = document.createElement('canvas');
    out.width = right - left + 1; out.height = bottom - top + 1;
    out.getContext('2d').drawImage(c, left, top, out.width, out.height, 0, 0, out.width, out.height);
    return out;
  }

  // 沒有官方圖檔的品牌以文字標示
  function textMark(text) {
    const size = 200;
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = `700 ${size}px -apple-system, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
    ctx.font = font;
    c.width = Math.ceil(ctx.measureText(text).width) + 8;
    c.height = Math.ceil(size * 1.3);
    ctx.font = font;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';
    ctx.fillText(text, 4, c.height / 2);
    return trimTransparent(c);
  }

  /** 把接近白色的背景轉成透明（讓使用者上傳的白底 Logo 可直接使用） */
  function removeWhite(src) {
    const c = document.createElement('canvas');
    c.width = src.width || src.naturalWidth; c.height = src.height || src.naturalHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    let img;
    try { img = ctx.getImageData(0, 0, c.width, c.height); } catch (e) { return c; }
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const min = Math.min(d[i], d[i + 1], d[i + 2]);
      if (min > 235) d[i + 3] = 0; // 純白 → 透明
      else if (min > 200) d[i + 3] = Math.round(d[i + 3] * (235 - min) / 35); // 反鋸齒邊緣漸變
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  /**
   * 漸層：stops 為 2 個以上的 HEX 顏色，平均分布、自動過渡
   * dir：h 由左到右、v 由上到下、d 由左上到右下
   */
  function linearGradient(ctx, x, y, w, h, stops, dir = 'h') {
    const g = dir === 'v' ? ctx.createLinearGradient(x, y, x, y + h)
      : dir === 'd' ? ctx.createLinearGradient(x, y, x + w, y + h)
      : ctx.createLinearGradient(x, y, x + w, y);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }
  const validStops = (stops) => (Array.isArray(stops) ? stops.map(parseColor).filter(Boolean) : []);

  /** 漸層的平均色：用來決定上面的文字、Logo 要用深色還是淺色 */
  function averageColor(stops) {
    const list = validStops(stops);
    if (!list.length) return '#ffffff';
    const sum = list.map(hexToRgb).reduce((a, c) => a.map((v, i) => v + c[i]), [0, 0, 0]);
    return rgbToHex(...sum.map((v) => v / list.length));
  }

  // color 為 gradient 時，依 stops 由左到右填入漸層
  function tint(src, color, stops) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    const list = validStops(stops);
    ctx.fillStyle = color === 'gradient' && list.length >= 2 ? linearGradient(ctx, 0, 0, c.width, c.height, list)
      : color === 'gradient' ? (list[0] || '#ffffff') : color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  /**
   * 單色 Logo：依「深淺」產生遮罩後填入單一顏色。
   * 透明背景的 Logo 直接變成黑／白剪影；有底色的 Logo（如 Nikon 黃底、Leica 紅圓）
   * 會把淺色部分去掉、保留深色字樣，所以任何 Logo 都能變成黑白兩色。
   */
  function monochrome(src, color) {
    const w = src.width, h = src.height;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(src, 0, 0);
    let img;
    try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return tint(src, color); }
    const d = img.data;
    const dark = new Float32Array(w * h);
    let max = 0;
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      const v = (1 - lum) * (d[i + 3] / 255);
      dark[j] = v;
      if (v > max) max = v;
    }
    if (max < 0.05) return tint(src, color); // 全是淺色（例如白色 Logo）：直接用外形
    const t0 = max * 0.15;
    const [r, g, b] = hexToRgb(color);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const a = Math.max(0, Math.min(1, (dark[j] - t0) / (max - t0)));
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = Math.round(a * 255);
    }
    ctx.putImageData(img, 0, 0);
    return trimTransparent(c);
  }

  async function loadLogoBase(key, customLogos) {
    const info = LOGOS.find((l) => l.key === key);
    const custom = customLogos && customLogos[key];
    if (info && info.text) return document.fonts.ready.then(() => textMark(info.text));
    if (custom) return loadImage(custom.src).then((img) => trimTransparent(custom.removeWhite ? removeWhite(img) : img)).catch(() => null);
    return loadImage(`logo/${info ? info.file : key + '.png'}`).then(trimTransparent).catch(() => null);
  }

  /**
   * @param opts { dark: 邊框是否為深色, mono: 是否使用單色 Logo }
   * mono：深色邊框用白色 Logo、淺色邊框用黑色 Logo；
   * 原色：深色邊框時，黑色 Logo（adapt）自動改白，有 darkFile 的改用深色版圖檔。
   */
  async function getLogo(key, customLogos, opts) {
    if (!key || key === 'none') return null;
    const o = typeof opts === 'string' ? { dark: opts === 'dark' } : (opts || {});
    const info = LOGOS.find((l) => l.key === key);
    let variant = key;
    if (o.mono) variant = `${key}@mono-${o.dark ? 'w' : 'b'}`;
    else if (o.dark && info && (info.adapt || info.darkFile)) variant = `${key}@dark`;
    if (logoCache.has(variant)) return logoCache.get(variant);
    let p;
    if (o.mono) {
      p = getLogo(key, customLogos, {}).then((c) => (c ? monochrome(c, o.dark ? '#ffffff' : '#000000') : null));
    } else if (variant !== key && info.darkFile) {
      p = loadImage(`logo/${info.darkFile}`).then(trimTransparent).catch(() => null);
    } else if (variant !== key) {
      p = getLogo(key, customLogos, {}).then((c) => (c ? tint(c, '#ffffff') : null));
    } else {
      p = loadLogoBase(key, customLogos);
    }
    logoCache.set(variant, p);
    return p;
  }

  /* ---------- 顏色 ---------- */

  function hexToRgb(hex) {
    const m = String(hex).replace('#', '');
    const full = m.length === 3 ? m.split('').map((x) => x + x).join('') : m;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }

  /** 接受 #fff、#ffffff、ffffff、rgb(1,2,3)、1,2,3、1 2 3；無效時回傳 null */
  function parseColor(input) {
    const s = String(input || '').trim().toLowerCase();
    let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
    if (m) return '#' + (m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1]);
    m = s.match(/^(?:rgba?\()?\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,/]+[\d.]+%?)?\s*\)?$/);
    if (m && [m[1], m[2], m[3]].every((v) => +v <= 255)) return rgbToHex(+m[1], +m[2], +m[3]);
    return null;
  }

  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const isDark = (hex) => luminance(hex) < 0.4;

  /** 依邊框顏色自動決定文字、次要文字、分隔線顏色 */
  function colorsFor(bg) {
    const dark = isDark(bg);
    const [r, g, b] = hexToRgb(bg);
    const mix = (t, k) => rgbToHex(r + (t - r) * k, g + (t - g) * k, b + (t - b) * k);
    return dark
      ? { bg, dark, text: '#ffffff', sub: mix(255, 0.62), divider: mix(255, 0.3) }
      : { bg, dark, text: '#000000', sub: mix(0, 0.6), divider: mix(0, 0.22) };
  }

  /* ---------- 繪製 ---------- */

  const FONT_STACK = 'Saira, "PingFang TC", "Hiragino Sans", "Noto Sans TC", "Noto Sans JP", "Microsoft JhengHei", sans-serif';
  // 英文草寫字體（Google Fonts，選用時才載入）；中文字會自動改用系統字體顯示
  const CURSIVE_FALLBACK = '"Snell Roundhand", "Segoe Script", cursive';
  const SIGNATURE_FONTS = {
    saira: FONT_STACK,
    serif: '"Times New Roman", "Songti TC", "Noto Serif TC", serif',
    script: `"Great Vibes", ${CURSIVE_FALLBACK}`,
    dancing: `"Dancing Script", ${CURSIVE_FALLBACK}`,
    allura: `"Allura", ${CURSIVE_FALLBACK}`,
    sacramento: `"Sacramento", ${CURSIVE_FALLBACK}`,
    alexbrush: `"Alex Brush", ${CURSIVE_FALLBACK}`,
    pacifico: `"Pacifico", ${CURSIVE_FALLBACK}`,
  };
  const WEB_FONTS = {
    script: 'Great Vibes', dancing: 'Dancing Script', allura: 'Allura',
    sacramento: 'Sacramento', alexbrush: 'Alex Brush', pacifico: 'Pacifico',
  };

  /**
   * 版面尺寸：底部資訊列高度（bar）與另外三邊的邊框（side）都依「裁切後」相片短邊的百分比計算，
   * 所以相片尺寸或裁切改變時，邊框會自動跟著變。
   * @param o { framePct, style: 'bar' | 'border', borderPct, even }  even=true 時取偶數（影片編碼需要）
   */
  function frameLayout(cropW, cropH, o) {
    const short = Math.min(cropW, cropH);
    const ev = (n) => (o.even ? Math.floor(n / 2) * 2 : Math.floor(n));
    const bar = ev(short * o.framePct / 100);
    const side = o.style === 'border' ? ev(short * (o.borderPct || 0) / 100) : 0;
    return {
      width: cropW + side * 2,
      height: side + cropH + bar,
      bar, side, imgX: side, imgY: side,
    };
  }

  /**
   * @param canvas  目標 canvas
   * @param img     已套用方向的圖片 / 影片元素
   * @param crop    {x,y,w,h}（原始像素）
   * @param lines   buildLines() 的結果
   * @param logo    canvas 或 null（置中版型不使用）
   * @param opts    { frameColor, layout: 'classic'|'center', framePct, style, borderPct, even, scale,
   *                  overlayOnly, signature }
   *                overlayOnly：相片區域保持透明（給影片疊圖用）
   */
  function drawFrame(canvas, img, crop, lines, logo, opts) {
    const scale = opts.scale || 1;
    const W = crop.w, H = crop.h;
    const L = frameLayout(W, H, opts);
    const { bar, side } = L;
    const theme = colorsFor(opts.frameColor || '#ffffff');

    const cw = Math.max(1, Math.round(L.width * scale));
    const ch = Math.max(1, Math.round(L.height * scale));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, L.width, L.height);
    const frameStops = validStops(opts.frameGradient && opts.frameGradient.stops);
    ctx.fillStyle = opts.frameGradient && frameStops.length >= 2
      ? linearGradient(ctx, 0, 0, L.width, L.height, frameStops, opts.frameGradient.dir)
      : theme.bg;
    ctx.fillRect(0, 0, L.width, L.height);
    if (opts.overlayOnly) ctx.clearRect(L.imgX, L.imgY, W, H);
    else ctx.drawImage(img, crop.x, crop.y, W, H, L.imgX, L.imgY, W, H);

    const barTop = side + H;
    const pad = Math.floor(bar / 5);
    // 有外框時文字與相片左右邊緣對齊
    const left = side > 0 ? side : pad;
    const right = side > 0 ? side + W : W - pad;
    const font = (bold, size) => `${bold ? 700 : 400} ${size}px ${FONT_STACK}`;
    const widthOf = (arr, size) => Math.max(0, ...arr.map((l) => { ctx.font = font(l.bold, size); return ctx.measureText(l.text).width; }));

    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    if (bar > 0 && opts.layout === 'center') {
      drawCentered();
    } else if (bar > 0) {
      drawClassic();
    }
    L.sigBoxes = {};
    (opts.signatures || []).forEach((sg) => { const box = drawSignature(sg); if (box) L.sigBoxes[sg.id] = box; });
    return L;

    function drawLines(arr, x, fontSize, lineGap, align) {
      const top = barTop + Math.round((bar - (fontSize + (arr.length - 1) * lineGap)) / 2);
      ctx.textAlign = align || 'left';
      arr.forEach((l, i) => {
        ctx.font = font(l.bold, fontSize);
        ctx.fillStyle = l.bold || l.spaced ? theme.text : theme.sub;
        // 品牌名稱字距加寬
        const spacing = l.spaced && 'letterSpacing' in ctx;
        if (spacing) ctx.letterSpacing = `${Math.round(fontSize * 0.22)}px`;
        ctx.fillText(l.text, x + (spacing && align === 'center' ? Math.round(fontSize * 0.11) : 0), top + i * lineGap);
        if (spacing) ctx.letterSpacing = '0px';
      });
      ctx.textAlign = 'left';
      return top;
    }

    /* 置中版型：沒有 Logo，所有資訊置中 */
    function drawCentered() {
      const arr = lines.center || [];
      if (!arr.length) return;
      let fontSize = Math.min(Math.floor(bar / 4), Math.floor(bar * 0.78 / (1 + (arr.length - 1) * 16 / 15)));
      const minSize = Math.floor(fontSize * 0.55);
      while (fontSize > minSize && widthOf(arr, fontSize) > right - left) fontSize = Math.max(minSize, Math.floor(fontSize * 0.95));
      drawLines(arr, (left + right) / 2, fontSize, Math.round(fontSize * 16 / 15), 'center');
    }

    /* 經典版型：左邊拍攝資訊，右邊 Logo ｜ 機身與鏡頭 */
    function drawClassic() {
      // 寬的文字型 Logo（ChatGPT、Samsung…）限制寬度，避免比文字還搶眼
      let logoH = Math.floor(bar / 1.5);
      let logoW = logo ? Math.round(logoH / logo.height * logo.width) : 0;
      const maxLogoW = Math.round(bar * 1.6);
      if (logoW > maxLogoW) { logoH = Math.round(logoH * maxLogoW / logoW); logoW = maxLogoW; }

      // Logo ｜ 分隔線 ｜ 文字 之間的距離
      const divGap = Math.round(pad * 0.9);
      const fixed = () => {
        let f = 0;
        if (lines.left.length && (lines.right.length || logoW)) f += pad * 2;
        if (logoW) f += logoW + (lines.right.length ? divGap * 2 : 0);
        return f;
      };
      // 字太長放不下時整體縮小字級（最小到 55%）
      let fontSize = Math.floor(bar / 4);
      const minSize = Math.floor(fontSize * 0.55);
      while (fontSize > minSize && widthOf(lines.left, fontSize) + widthOf(lines.right, fontSize) + fixed() > right - left) {
        fontSize = Math.max(minSize, Math.floor(fontSize * 0.95));
      }
      const lineGap = Math.round(fontSize * 16 / 15);

      drawLines(lines.left, left, fontSize, lineGap);

      const rightW = widthOf(lines.right, fontSize);
      const rx = right - rightW;
      if (lines.right.length) {
        const top = drawLines(lines.right, rx, fontSize, lineGap);
        if (logoW) {
          // 分隔線：比文字區塊短（約 60%）、置中、淺色
          const blockH = fontSize + (lines.right.length - 1) * lineGap;
          const h = Math.round(blockH * 0.6);
          const y = top + Math.round((blockH - h) / 2);
          ctx.strokeStyle = theme.divider;
          ctx.lineWidth = Math.max(1, Math.round(fontSize / 10));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(rx - divGap, y);
          ctx.lineTo(rx - divGap, y + h);
          ctx.stroke();
        }
      }
      if (logoW && logoH > 0) {
        const lx = lines.right.length ? rx - divGap * 2 - logoW : right - logoW;
        ctx.drawImage(logo, Math.round(lx), barTop + Math.round((bar - logoH) / 2), logoW, logoH);
      }
    }

    /**
     * 作者簽名（文字與圖片可同時存在）
     * sg = { id, kind: 'text'|'image', text, font, image, pos, x, y, sizePct, opacity, color, glass }
     * pos：photo-br／photo-bl／photo-tr／photo-tl（相片四角）、frame（邊框上）、custom（拖曳後的位置，
     *      x、y 為整張圖寬高的比例，代表簽名中心點）
     * color：auto（相片上白色、邊框上跟著文字顏色）、original（圖片原色）、或任何 HEX 顏色
     * 回傳在整張圖上的位置 {x, y, w, h}，給拖曳使用
     */
    function drawSignature(sg) {
      const short = Math.min(W, H);
      const onFrame = sg.pos === 'frame' && bar > 0;
      const h = onFrame ? Math.round(bar * Math.min(0.55, Math.max(0.2, sg.sizePct / 10))) : Math.round(short * sg.sizePct / 100);
      if (h <= 0) return null;
      const margin = Math.round(short * 0.03);

      let color = sg.color;
      const inFrameArea = onFrame || (sg.pos === 'custom' && sg.y * L.height > barTop && bar > 0);
      if (!color || color === 'auto') color = inFrameArea ? theme.text : '#ffffff';

      let mark;
      if (sg.kind === 'image' && sg.image) {
        mark = color === 'original' ? sg.image : tint(sg.image, color, sg.gradient);
      } else if (sg.kind === 'text' && sg.text) {
        mark = document.createElement('canvas');
        const mctx = mark.getContext('2d');
        const weight = sg.font === 'saira' ? 600 : sg.font === 'dancing' ? 600 : 400;
        const f = `${weight} ${h}px ${SIGNATURE_FONTS[sg.font] || FONT_STACK}`;
        mctx.font = f;
        mark.width = Math.ceil(mctx.measureText(sg.text).width + h * 0.4);
        mark.height = Math.ceil(h * 1.5);
        mctx.font = f;
        mctx.textBaseline = 'middle';
        mctx.fillStyle = color;
        mctx.fillText(sg.text, h * 0.2, mark.height / 2);
        mark = trimTransparent(mark);
      }
      if (!mark || !mark.width) return null;
      let mw = Math.round(h / mark.height * mark.width), mh = h;
      const maxW = onFrame ? Math.round(W * 0.3) : Math.round(W * 0.6);
      if (mw > maxW) { mh = Math.round(mh * maxW / mw); mw = maxW; }

      // 玻璃底板的留白
      const gx = sg.glass ? Math.round(mh * 0.5) : 0;
      const gy = sg.glass ? Math.round(mh * 0.32) : 0;
      const bw = mw + gx * 2, bh = mh + gy * 2;

      let x, y; // 外框（含玻璃）左上角
      if (sg.pos === 'custom') {
        x = Math.round(sg.x * L.width - bw / 2);
        y = Math.round(sg.y * L.height - bh / 2);
        x = Math.max(0, Math.min(L.width - bw, x));
        y = Math.max(0, Math.min(L.height - bh, y));
      } else if (onFrame) {
        x = opts.layout === 'center' ? right - bw : Math.round(L.width / 2 - bw / 2);
        y = barTop + Math.round((bar - bh) / 2);
      } else {
        const x0 = L.imgX + margin, x1 = L.imgX + W - margin - bw;
        const y0 = L.imgY + margin, y1 = L.imgY + H - margin - bh;
        x = /l$/.test(sg.pos) ? x0 : x1;
        y = /^photo-t/.test(sg.pos) ? y0 : y1;
      }

      if (sg.glass) drawGlass(x, y, bw, bh, inFrameArea, color === 'gradient' ? averageColor(sg.gradient) : color);

      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, sg.opacity));
      if (!sg.glass && !inFrameArea && color === '#ffffff') {
        ctx.shadowColor = 'rgba(0,0,0,.45)';
        ctx.shadowBlur = Math.max(2, mh * 0.08) * scale;
      }
      ctx.drawImage(mark, x + gx, y + gy, mw, mh);
      ctx.restore();
      return { x, y, w: bw, h: bh };
    }

    function roundRectPath(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else {
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      }
    }

    /**
     * 毛玻璃底板：模糊底下的相片、加上半透明亮面與邊緣高光。
     * 影片疊圖（overlayOnly）無法模糊底下的畫面，只保留半透明亮面。
     */
    function drawGlass(x, y, w, h, inFrameArea, markColor) {
      const r = Math.min(h / 2, w / 2);
      const darkMark = markColor !== 'original' && isDark(markColor); // 深色簽名配較亮的玻璃
      ctx.save();
      // 柔和陰影
      roundRectPath(x, y, w, h, r);
      ctx.shadowColor = 'rgba(0,0,0,.18)';
      ctx.shadowBlur = h * 0.35 * scale;
      ctx.shadowOffsetY = h * 0.06 * scale;
      ctx.fillStyle = 'rgba(255,255,255,0.01)';
      ctx.fill();
      ctx.restore();

      ctx.save();
      roundRectPath(x, y, w, h, r);
      ctx.clip();
      if (!opts.overlayOnly && 'filter' in ctx) {
        const blur = Math.max(3, Math.round(h * 0.22));
        const pad = blur * 3;
        // 只模糊簽名底下那一小塊（換算回原圖座標）
        const ix0 = Math.max(L.imgX, x - pad), iy0 = Math.max(L.imgY, y - pad);
        const ix1 = Math.min(L.imgX + W, x + w + pad), iy1 = Math.min(L.imgY + H, y + h + pad);
        if (ix1 > ix0 && iy1 > iy0) {
          ctx.filter = `blur(${blur * scale}px) saturate(1.35)`;
          ctx.drawImage(img, crop.x + (ix0 - L.imgX), crop.y + (iy0 - L.imgY), ix1 - ix0, iy1 - iy0, ix0, iy0, ix1 - ix0, iy1 - iy0);
          ctx.filter = 'none';
        }
      }
      const g = ctx.createLinearGradient(x, y, x, y + h);
      if (darkMark || inFrameArea) {
        g.addColorStop(0, 'rgba(255,255,255,0.62)');
        g.addColorStop(1, 'rgba(255,255,255,0.38)');
      } else {
        g.addColorStop(0, 'rgba(255,255,255,0.30)');
        g.addColorStop(1, 'rgba(255,255,255,0.10)');
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      // 上緣的光澤
      const sheen = ctx.createLinearGradient(x, y, x + w, y + h);
      sheen.addColorStop(0, 'rgba(255,255,255,0.28)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(x, y, w, h * 0.55);
      ctx.restore();

      ctx.save();
      roundRectPath(x + 0.5, y + 0.5, w - 1, h - 1, r);
      const edge = ctx.createLinearGradient(x, y, x, y + h);
      edge.addColorStop(0, 'rgba(255,255,255,0.75)');
      edge.addColorStop(1, 'rgba(255,255,255,0.18)');
      ctx.strokeStyle = edge;
      ctx.lineWidth = Math.max(1, h * 0.025);
      ctx.stroke();
      ctx.restore();
    }
  }

  window.Frame = { averageColor, brandName, logoForSoftware, WEB_FONTS, parseColor, colorsFor, isDark, removeWhite, trimTransparent, logoForHost, formatExposure, LOGOS, logoForMake, readExif, buildLines, getLogo, frameLayout, drawFrame, loadImage, logoCache };
})();
