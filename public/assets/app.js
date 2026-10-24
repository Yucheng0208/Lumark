/* 光印 Lumark — 主程式 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const t = I18n.t;
  const PREVIEW_MAX = 1800; // 預覽最長邊（像素），輸出一律原尺寸

  /* ---------- 設定（記在瀏覽器） ---------- */

  const SETTINGS_KEY = 'lumark.settings';
  const DEFAULTS = {
    logo: 'auto',
    frameColor: '#ffffff', // 邊框顏色（預設白色，可選黑色或任意顏色）
    layout: 'classic',     // classic：左資訊＋右 Logo；center：資訊置中、不放 Logo
    logoColor: 'mono',     // mono：依邊框自動黑／白；original：品牌原色
    // 作者簽名：文字與圖片可以同時使用，位置可拖曳（custom 時 x、y 為整張圖的比例）
    sigText: { on: false, text: '', font: 'script', pos: 'photo-br', x: 0.85, y: 0.85, sizePct: 5, opacity: 0.9, color: 'auto', glass: false },
    sigImage: { on: false, pos: 'photo-bl', x: 0.15, y: 0.85, sizePct: 6, opacity: 0.9, color: 'auto', glass: false },
    sigDraw: { on: false, pos: 'photo-tr', x: 0.85, y: 0.15, sizePct: 7, opacity: 0.95, color: 'original', glass: false },
    framePct: 10,
    style: 'bar',        // bar：只有底部資訊列；border：另外三邊也加框
    borderPct: 4,
    video: { format: 'mp4', mute: false, loops: 1, boomerang: false, gifInfinite: true, fps: 15, maxWidth: 0 },
    tempUnit: 'C',
    dateFormat: 'slash', // slash：YYYY/MM/DD；dash：YYYY-MM-DD
    timeFormat: '24',    // 24 或 12 小時制
    locFormat: 'country-city',
    autoGeo: true, // 相片沒有 GPS 時，用手機／電腦目前位置取得地點、天氣與溫度
    suffix: '_lumark',
    quality: 95,
    show: {
      shot: true, brand: true, model: true, lens: true, logo: true, date: true, time: true,
      weather: true, temp: true, location: true, coords: false,
    },
  };

  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return {
        ...DEFAULTS, ...s,
        show: { ...DEFAULTS.show, ...(s.show || {}) },
        video: { ...DEFAULTS.video, ...(s.video || {}) },
        sigText: { ...DEFAULTS.sigText, ...(s.sigText || {}) },
        sigImage: { ...DEFAULTS.sigImage, ...(s.sigImage || {}) },
        sigDraw: { ...DEFAULTS.sigDraw, ...(s.sigDraw || {}) },
        _hadSigDraw: !!s.sigDraw,
      };
    } catch (e) { return structuredClone(DEFAULTS); }
  }

  const settings = loadSettings();
  // 舊版的手寫簽名放在「圖片簽名」裡；改為獨立的手寫簽名後，沿用原本的位置與開關
  if (!settings._hadSigDraw) {
    let hadDrawn = false;
    try { hadDrawn = !!localStorage.getItem('lumark.drawnSig'); } catch (e) { /* ignore */ }
    if (hadDrawn && settings.sigImage.on) {
      const { on, pos, x, y, sizePct, opacity, color, glass } = settings.sigImage;
      Object.assign(settings.sigDraw, { on, pos, x, y, sizePct, opacity, color, glass });
      settings.sigImage.on = false;
    }
  }
  delete settings._hadSigDraw;
  if (!Frame.parseColor(settings.frameColor)) settings.frameColor = '#ffffff';
  // 舊版預設為關閉；改為預設開啟後，對已存過設定的使用者套用一次
  if (!settings.autoGeoV2) { settings.autoGeo = true; settings.autoGeoV2 = true; }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* 無痕模式 */ }
  }

  const state = { photos: [], activeId: null, mode: 'preview', customLogos: {} };
  let nextId = 1;

  /* ---------- 介面主題 / 語言 ---------- */

  function applyUiTheme(value) {
    if (value === 'light' || value === 'dark') document.documentElement.dataset.theme = value;
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem('lumark.uiTheme', value); } catch (e) { /* ignore */ }
    // 桌機的下拉選單與手機「更多」分頁的按鈕保持同步
    $('ui-theme').value = value;
    document.querySelectorAll('[data-ui-theme]').forEach((b) => b.classList.toggle('active', b.dataset.uiTheme === value));
  }

  function initUiControls() {
    let uiTheme = 'auto';
    try { uiTheme = localStorage.getItem('lumark.uiTheme') || 'auto'; } catch (e) { /* ignore */ }
    applyUiTheme(uiTheme);
    $('ui-theme').addEventListener('change', (e) => applyUiTheme(e.target.value));
    document.querySelectorAll('[data-ui-theme]').forEach((b) => b.addEventListener('click', () => applyUiTheme(b.dataset.uiTheme)));

    const langOptions = I18n.SUPPORTED.map((l) => `<option value="${l.code}">${l.label}</option>`).join('');
    ['ui-lang', 'ui-lang-m'].forEach((id) => {
      $(id).innerHTML = langOptions;
      $(id).value = I18n.lang;
      $(id).addEventListener('change', (e) => {
        I18n.setLang(e.target.value);
        $('ui-lang').value = $('ui-lang-m').value = e.target.value;
      });
    });

    // 瀏覽器語言不在支援清單時，建議使用 Google 翻譯
    const other = I18n.unsupportedBrowserLang();
    let dismissed = false;
    try { dismissed = localStorage.getItem('lumark.translateDismissed') === other; } catch (e) { /* ignore */ }
    if (other && !dismissed) {
      const target = other.split('-')[0];
      $('translate-text').textContent =
        `Lumark isn’t available in ${I18n.languageName(other)} yet. You can read it in your language with`;
      $('translate-link').href = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(target)}&u=${encodeURIComponent(location.href)}`;
      $('translate-banner').hidden = false;
      $('translate-close').addEventListener('click', () => {
        $('translate-banner').hidden = true;
        try { localStorage.setItem('lumark.translateDismissed', other); } catch (e) { /* ignore */ }
      });
    }
  }

  function refreshTexts() {
    I18n.apply();
    fillLogoSelect();
    fillWeatherSelect();
    $('frame-size-val').textContent = t('f.frameSize.val', { n: settings.framePct });
    $('border-size-val').textContent = t('f.borderSize.val', { n: settings.borderPct });
    renderList();
    updatePlaceStatus();
    if (active()) {
      if (state.mode === 'crop') editor.commit(); else renderPreview();
    }
  }

  window.addEventListener('langchange', () => {
    // 地名改用新語言重新查詢
    state.photos.forEach((p) => { if (p.locAuto && p.exif.lat != null) detectPlace(p, { weather: false }); });
    refreshTexts();
  });

  /* ---------- 選單 ---------- */

  function fillLogoSelect() {
    const sel = $('logo-select');
    const opt = (v, label) => `<option value="${escapeHtml(v)}">${escapeHtml(label)}</option>`;
    const group = (g, label) => `<optgroup label="${escapeHtml(label)}">${
      Frame.LOGOS.filter((l) => l.group === g).map((l) => opt(l.key, l.label)).join('')}</optgroup>`;
    const custom = Object.keys(state.customLogos);
    sel.innerHTML = opt('auto', t('f.logo.auto')) + opt('none', t('f.logo.none'))
      + group('app', 'Lumark') + group('camera', t('f.logo.camera')) + group('phone', t('f.logo.phone'))
      + group('camapp', t('f.logo.camapp')) + group('media', t('f.logo.media')) + group('ai', t('f.logo.ai'))
      + (custom.length ? `<optgroup label="${escapeHtml(t('f.logo.customGroup'))}">${
        custom.map((k) => opt(k, t('f.logo.custom') + k.replace(/^custom:/, ''))).join('')}</optgroup>` : '');
    sel.value = settings.logo.startsWith('custom:') && !state.customLogos[settings.logo] ? 'auto' : settings.logo;
  }

  const WEATHER_KEYS = ['clear', 'partly', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunder'];
  // 天氣可選預設（晴、雨…，切換語言會跟著翻譯）也可手動輸入任何文字
  const weatherText = (v) => (WEATHER_KEYS.includes(v) ? t('w.' + v) : v || '');
  function weatherValue(text) {
    const s = text.trim();
    const key = WEATHER_KEYS.find((k) => t('w.' + k) === s);
    return key || s;
  }
  function fillWeatherSelect() {
    $('weather-list').innerHTML = WEATHER_KEYS.map((k) => `<option value="${escapeHtml(t('w.' + k))}"></option>`).join('');
    const p = active();
    $('f-weather').value = p ? weatherText(p.exif.weather) : '';
  }

  /* 地點與天氣：自動偵測 / 手動輸入 */
  function syncPlaceMode() {
    const p = active();
    const mode = p && !(p.locAuto && p.weatherAuto) ? 'manual' : 'auto';
    document.querySelectorAll('[data-place-mode]').forEach((b) => {
      b.classList.toggle('active', b.dataset.placeMode === mode);
      b.disabled = !p;
    });
  }
  function setManual(p) {
    p.locAuto = false; p.weatherAuto = false;
    if (p.placeStatus === 'place.noGps' || p.placeStatus === 'place.failed') p.placeStatus = '';
    syncPlaceMode(); updatePlaceStatus();
  }

  /* ---------- 相片管理 ---------- */

  async function addFiles(files) {
    const list = [...files].filter((f) => /^(image|video)\//.test(f.type) || /\.(jpe?g|png|webp|gif|tiff?|bmp|avif)$/i.test(f.name)
      || Media.kindOf(f) !== 'photo' || Decode.formatOf(f) !== 'std');
    if (!list.length) return;
    setStatus(t('st.reading', { n: list.length }));
    setBusy(t('st.reading', { n: list.length }));
    for (const file of list) {
      let url = URL.createObjectURL(file);
      try {
        const kind = Media.kindOf(file);
        let img, exif, W, H, poster = url;
        let exportScale = 1;
        let needFullRaw = false;
        if (kind === 'video') {
          exif = await Media.readVideoMeta(file);
          try {
            img = await Media.loadVideo(url);
          } catch (err) {
            // AVI、WMV、部分 MKV 等瀏覽器無法播放：先轉一份預覽檔
            const label = t('st.transcoding', { name: file.name });
            setStatus(label);
            setBusy(label);
            const pr = await Media.transcodePreview(file, progressHandler(label));
            $('progress').hidden = true;
            URL.revokeObjectURL(url);
            url = pr.url;
            img = await Media.loadVideo(url);
            if (pr.origW) exportScale = pr.origW / img.videoWidth;
          }
          W = img.videoWidth; H = img.videoHeight;
        } else if (kind === 'photo' && Decode.formatOf(file) === 'raw') {
          // RAW：先顯示相機內嵌的預覽（快），完整解析度在背景解碼後自動替換
          setStatus(t('st.decodingRaw', { name: file.name }));
          setBusy(t('st.decodingRaw', { name: file.name }));
          const [prev, ex] = await Promise.all([Decode.rawPreview(file).catch(() => null), Frame.readExif(file)]);
          if (prev) {
            const prevExif = await Frame.readExif(new File([prev.blob], 'preview.jpg', { type: 'image/jpeg', lastModified: file.lastModified }));
            exif = Decode.mergeExif(ex, prevExif);
            URL.revokeObjectURL(url);
            url = prev.url; poster = url;
            img = await Frame.loadImage(url);
            needFullRaw = true;
          } else {
            const dec = await Decode.decodeRaw(file);
            URL.revokeObjectURL(url);
            url = dec.url; poster = url;
            exif = Decode.fillFromLibRaw(ex, dec.meta);
            img = await Frame.loadImage(url);
          }
          W = img.naturalWidth; H = img.naturalHeight;
        } else if (kind === 'photo' && Decode.formatOf(file) !== 'std') {
          // HEIC / RAW：先解碼成 JPEG，參數仍從原檔讀取
          const fmt = Decode.formatOf(file);
          if (fmt !== 'svg') setStatus(t(fmt === 'raw' ? 'st.decodingRaw' : 'st.decodingHeic', { name: file.name }));
          const [dec, ex] = await Promise.all([
            fmt === 'raw' ? Decode.decodeRaw(file) : fmt === 'svg' ? Decode.decodeSvg(file) : Decode.decodeHeic(file),
            Frame.readExif(file),
          ]);
          URL.revokeObjectURL(url);
          url = dec.url; poster = url;
          exif = Decode.fillFromLibRaw(ex, dec.meta);
          img = await Frame.loadImage(url);
          W = img.naturalWidth; H = img.naturalHeight;
          if (dec.method === 'preview') setStatus(t('st.rawPreview', { name: file.name, w: W, h: H }));
        } else {
          [img, exif] = await Promise.all([Frame.loadImage(url),
            kind === 'gif' ? Media.readVideoMeta(file) : Frame.readExif(file)]);
          W = img.naturalWidth; H = img.naturalHeight;
        }
        const still = Media.snapshot(img, W, H, 2048);
        if (kind !== 'photo') poster = await new Promise((r) => still.toBlob((b) => r(URL.createObjectURL(b)), 'image/jpeg', 0.9));
        const photo = {
          id: nextId++, kind, file, name: file.name, url, img, poster, W, H, exportScale,
          exif, crop: null, ratio: null, ratioKey: 'free',
          thumb: makeThumb(still),
          addr: null, locAuto: true, weatherAuto: true, placeStatus: '',
        };
        state.photos.push(photo);
        const first = !state.activeId;
        if (first) state.activeId = photo.id;
        renderList();
        if (first) selectPhoto(photo.id); // 第一張馬上顯示，不用等全部讀完
        autoPlace(photo);
        if (needFullRaw) photo.fullPromise = upgradeRaw(photo);
      } catch (err) {
        URL.revokeObjectURL(url);
        console.error(err);
        setStatus(t('st.readFail', { name: file.name }));
      }
    }
    setBusy('');
    // 清掉「讀取中 / 轉換中 xx%」之類的進度訊息，保留錯誤或提示
    if (/…|%$/.test($('status').textContent)) setStatus('');
    $('progress').hidden = true;
    selectPhoto(state.activeId);
  }

  /* 預覽區上的讀取提示（手機版狀態列不在畫面上，所以需要這個） */
  let busyMsg = '';
  let pendingRaw = 0;
  function setBusy(msg) { busyMsg = msg || ''; syncBusy(); }
  function syncBusy() {
    const text = busyMsg || (pendingRaw ? t('st.rawUpgrading') : '');
    $('stage-busy').hidden = !text;
    $('stage-busy-text').textContent = text;
  }

  /** 背景完整解碼 RAW，完成後替換預覽（裁切範圍會依比例換算） */
  async function upgradeRaw(p) {
    pendingRaw++; syncBusy();
    try {
      const dec = await Decode.decodeRaw(p.file);
      p.exif = Decode.fillFromLibRaw(p.exif, dec.meta);
      if (dec.method !== 'libraw' || !state.photos.includes(p)) { URL.revokeObjectURL(dec.url); return; }
      const img = await Frame.loadImage(dec.url);
      const nW = img.naturalWidth, nH = img.naturalHeight;
      if (p.crop) {
        const sameShape = Math.abs(nW / nH - p.W / p.H) < 0.02;
        const s = nW / p.W;
        p.crop = sameShape ? { x: Math.round(p.crop.x * s), y: Math.round(p.crop.y * s), w: Math.round(p.crop.w * s), h: Math.round(p.crop.h * s) } : null;
      }
      URL.revokeObjectURL(p.url);
      Object.assign(p, { url: dec.url, poster: dec.url, img, W: nW, H: nH, thumb: makeThumb(Media.snapshot(img, nW, nH, 512)) });
      renderList();
      if (p === active()) { fillForm(p); if (state.mode === 'crop') openCrop(); else renderPreview(); }
    } catch (e) {
      console.warn('full RAW decode failed; keeping the embedded preview', e);
    } finally {
      pendingRaw--; syncBusy();
    }
  }

  function makeThumb(src) {
    const c = document.createElement('canvas');
    const s = 128 / Math.min(src.width, src.height);
    c.width = Math.round(src.width * s); c.height = Math.round(src.height * s);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }

  function removePhoto(id) {
    const i = state.photos.findIndex((p) => p.id === id);
    if (i < 0) return;
    releaseItem(state.photos[i]);
    state.photos.splice(i, 1);
    if (state.activeId === id) {
      const next = state.photos[Math.min(i, state.photos.length - 1)];
      state.activeId = next ? next.id : null;
    }
    selectPhoto(state.activeId);
  }

  function releaseItem(p) {
    if (p.kind === 'video') { p.img.pause(); p.img.removeAttribute('src'); p.img.load(); }
    URL.revokeObjectURL(p.url);
    if (p.poster !== p.url) URL.revokeObjectURL(p.poster);
  }

  function active() { return state.photos.find((p) => p.id === state.activeId) || null; }

  function selectPhoto(id) {
    state.activeId = id;
    const p = active();
    $('dropzone').hidden = !!p;
    $('stage').hidden = !p;
    ['export-one', 'save-device', 'print-one', 'save-top', 'share-social'].forEach((id) => { $(id).disabled = !p; });
    $('export-all').disabled = state.photos.length < 2;
    resetSaveButton();
    renderList();
    fillForm(p);
    updatePlaceStatus();
    syncVideoUi();
    if (!p) { stopPlayback(); return; }
    if (state.mode === 'crop') openCrop(); else renderPreview();
  }

  function renderList() {
    $('count').textContent = state.photos.length;
    $('photo-list').innerHTML = state.photos.map((p) => {
      const c = cropOf(p);
      return `<li class="photo-item${p.id === state.activeId ? ' active' : ''}" data-id="${p.id}">
        <img src="${p.thumb}" alt="">
        <div><div class="name" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</div>
        <div class="meta">${c.w}×${c.h}${p.exif.model ? ' · ' + escapeHtml(p.exif.model) : ''}</div></div>
        <button class="remove" type="button" aria-label="${escapeHtml(t('list.remove'))}" data-remove="${p.id}">×</button>
      </li>`;
    }).join('');
  }

  /* ---------- 表單 ---------- */

  const exifInputs = [...document.querySelectorAll('input[data-key]')];

  function fillForm(p) {
    exifInputs.forEach((el) => {
      let v = p ? p.exif[el.dataset.key] ?? '' : '';
      // 日期選擇器的值必須是 YYYY-MM-DD；時間選擇器是 HH:MM
      if (el.dataset.key === 'date') {
        const m = String(v).match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})/);
        v = m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : '';
      }
      if (el.dataset.key === 'time') {
        const m = String(v).match(/^(\d{1,2}):(\d{2})/);
        v = m ? `${m[1].padStart(2, '0')}:${m[2]}` : '';
      }
      el.value = v;
      el.disabled = !p;
    });
    syncTimePicker();
    $('f-coords').value = p ? Geo.formatCoords(p.exif.lat, p.exif.lon) : '';
    $('f-coords').disabled = !p;
    $('f-weather').disabled = !p;
    fillWeatherSelect();
    syncPlaceMode();
  }

  /* ---------- 地點與天氣 ---------- */

  function placeLabel(p) {
    return p.addr ? Geo.formatPlace(p.addr, settings.locFormat, I18n.lang) : '';
  }

  function autoPlace(p) {
    if (p.exif.lat != null) detectPlace(p);
    else if (settings.autoGeo) useMyLocation(p);
    else { p.placeStatus = 'place.noGps'; updatePlaceStatus(); }
  }

  async function detectPlace(p, { weather = true } = {}) {
    if (p.exif.lat == null || p.exif.lon == null) {
      p.placeStatus = 'place.noGps';
      updatePlaceStatus();
      return;
    }
    p.placeStatus = 'place.looking';
    updatePlaceStatus();
    const { lat, lon } = p.exif;
    const jobs = [];
    jobs.push(Geo.reverseGeocode(lat, lon, I18n.geoLang).then((addr) => {
      p.addr = addr;
      if (p.locAuto) p.exif.location = placeLabel(p);
    }));
    if (weather && p.weatherAuto) {
      const d = parseDate(p.exif.date);
      const hour = parseInt((p.exif.time || '12').split(':')[0], 10);
      if (d) {
        jobs.push(Geo.weatherAt(lat, lon, d, isNaN(hour) ? 12 : hour).then((w) => {
          if (w && p.weatherAuto) { p.exif.weather = w.key; p.exif.temp = w.temp === '' ? '' : String(w.temp); }
        }));
      }
    }
    const results = await Promise.allSettled(jobs);
    p.placeStatus = results.some((r) => r.status === 'rejected') ? 'place.failed' : '';
    if (results.some((r) => r.status === 'rejected')) console.warn(results);
    updatePlaceStatus();
    if (p === active()) { fillForm(p); renderPreview(); }
  }

  async function useMyLocation(p) {
    try {
      p.placeStatus = 'place.looking';
      updatePlaceStatus();
      const pos = await Geo.currentPosition();
      p.exif.lat = pos.lat; p.exif.lon = pos.lon;
      p.locAuto = true; p.weatherAuto = true;
      p.coordsFromDevice = true;
      syncPlaceMode();
      if (p === active()) fillForm(p);
      await detectPlace(p);
      if (!p.placeStatus) { p.placeStatus = 'place.fromDevice'; updatePlaceStatus(); }
    } catch (e) {
      p.placeStatus = 'place.geoDenied';
      updatePlaceStatus();
    }
  }

  function parseDate(s) {
    const m = String(s || '').match(/(\d{4})\D(\d{1,2})\D(\d{1,2})/);
    if (!m) return null;
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  function updatePlaceStatus() {
    const p = active();
    $('place-status').textContent = p && p.placeStatus ? t(p.placeStatus) : '';
  }

  /* ---------- 預覽 ---------- */

  function cropOf(p) { return p.crop || { x: 0, y: 0, w: p.W, h: p.H }; }

  function logoKeyFor(p) {
    if (!settings.show.logo || settings.layout === 'center') return 'none';
    if (settings.logo === 'auto') return Frame.logoForMake(p.exif.make, p.exif.model) || Frame.logoForSoftware(p.exif.software) || p.sourceLogo || 'none';
    return settings.logo;
  }

  /* 日期：YYYY/MM/DD 或 YYYY-MM-DD（輸入欄位兩種寫法都接受） */
  function formatDate(d) {
    const m = String(d).match(/^(\d{4})\D(\d{1,2})\D(\d{1,2})$/);
    if (!m) return d;
    const sep = settings.dateFormat === 'dash' ? '-' : '/';
    return [m[1], m[2].padStart(2, '0'), m[3].padStart(2, '0')].join(sep);
  }

  /* 時間：24 小時制，或依語言顯示 12 小時制（下午 1:32／1:32 PM／午後1:32） */
  function formatTime(tm) {
    const m = String(tm).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return tm;
    const h = +m[1], mm = m[2];
    if (settings.timeFormat !== '12') return `${String(h).padStart(2, '0')}:${mm}`;
    const h12 = h % 12 || 12;
    const pm = h >= 12;
    if (I18n.lang === 'en') return `${h12}:${mm} ${pm ? 'PM' : 'AM'}`;
    if (I18n.lang === 'ja') return `${pm ? '午後' : '午前'}${h12}:${mm}`;
    return `${pm ? '下午' : '上午'} ${h12}:${mm}`;
  }

  /* 置中版型的品牌名稱：EXIF 廠牌 → 相機 App（Dazz Cam）→ 手動選的 Logo 名稱 */
  function brandFor(p) {
    const b = Frame.brandName(p.exif.make);
    if (b) return b;
    if (Frame.logoForSoftware(p.exif.software) === 'Dazz') return 'Dazz Cam';
    if (settings.logo !== 'auto' && settings.logo !== 'none' && !settings.logo.startsWith('custom:')) {
      const info = Frame.LOGOS.find((l) => l.key === settings.logo);
      if (info) return info.label;
    }
    return '';
  }

  function linesFor(p) {
    return Frame.buildLines(p.exif, settings.show, {
      brand: brandFor(p),
      date: formatDate,
      time: formatTime,
      weatherLabel: weatherText,
      tempUnit: settings.tempUnit,
      coords: Geo.formatCoords,
    });
  }

  function frameOpts(extra) {
    return {
      frameColor: settings.frameColor, layout: settings.layout, framePct: settings.framePct,
      style: settings.style, borderPct: settings.borderPct, signatures: signatureList(), ...extra,
    };
  }

  function logoOpts() {
    return { dark: Frame.isDark(settings.frameColor), mono: settings.logoColor === 'mono' };
  }

  /* 作者簽名：圖片存在記憶體（不寫入瀏覽器儲存空間） */
  let signatureImage = null;
  let drawnImage = null; // 手寫簽名的圖片
  function signatureList() {
    const list = [];
    const st = settings.sigText, si = settings.sigImage, sd = settings.sigDraw;
    if (st.on && st.text.trim()) list.push({ ...st, id: 'text', kind: 'text', text: st.text.trim() });
    if (si.on && signatureImage) list.push({ ...si, id: 'image', kind: 'image', image: signatureImage });
    if (sd.on && drawnImage) list.push({ ...sd, id: 'draw', kind: 'image', image: drawnImage });
    return list;
  }

  function layoutOf(crop, even) { return Frame.frameLayout(crop.w, crop.h, frameOpts({ even })); }

  let renderToken = 0;
  let previewLogo = null;
  async function renderPreview() {
    const p = active();
    if (!p || state.mode !== 'preview') { stopPlayback(); return; }
    const token = ++renderToken;
    const crop = cropOf(p);
    const logo = await Frame.getLogo(logoKeyFor(p), state.customLogos, logoOpts());
    if (token !== renderToken) return;
    previewLogo = logo;
    drawPreviewFrame(p);
    const layout = layoutOf(crop);
    $('dims').textContent = t('dims.output', { w: layout.width, h: layout.height, b: layout.bar });
    if (p.kind === 'photo') stopPlayback(); else startPlayback(p);
  }

  function drawPreviewFrame(p) {
    const crop = cropOf(p);
    const layout = layoutOf(crop);
    const scale = Math.min(1, PREVIEW_MAX / Math.max(layout.width, layout.height), p.kind === 'photo' ? 1 : 1280 / layout.width);
    lastPreview = { scale, L: Frame.drawFrame($('preview'), p.img, crop, linesFor(p), previewLogo, frameOpts({ scale })) };
  }
  let lastPreview = null;

  /* 影片 / GIF 預覽：持續重畫目前影格 */
  let playing = null;
  let rafId = 0;
  function startPlayback(p) {
    if (playing !== p) {
      stopPlayback();
      playing = p;
      if (p.kind === 'video' && !p.userPaused) p.img.play().catch(() => {});
    }
    syncPlayButton();
    if (!rafId) {
      const tick = () => {
        rafId = 0;
        if (!playing || playing !== active() || state.mode !== 'preview') return;
        drawPreviewFrame(playing);
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
  }
  function stopPlayback() {
    if (playing && playing.kind === 'video') playing.img.pause();
    playing = null;
    cancelAnimationFrame(rafId); rafId = 0;
  }
  function syncPlayButton() {
    const p = active();
    const btn = $('play-toggle');
    btn.hidden = !p || p.kind !== 'video' || state.mode !== 'preview';
    if (p && p.kind === 'video') btn.textContent = p.img.paused ? '▶' : '❚❚';
  }

  /* ---------- 模式切換 / 裁切 ---------- */

  const RATIO_KEYS = { free: null, orig: 'orig', 1: 1, '4/5': 4 / 5, '5/4': 5 / 4, '3/2': 3 / 2, '2/3': 2 / 3, '16/9': 16 / 9, '9/16': 9 / 16 };

  const editor = new CropEditor({
    area: $('crop-area'), img: $('crop-img'), box: $('crop-box'),
    onChange(crop, ratio) {
      const p = active();
      if (!p) return;
      p.crop = (crop.x === 0 && crop.y === 0 && crop.w === p.W && crop.h === p.H) ? null : crop;
      p.ratio = ratio;
      const layout = layoutOf(crop);
      $('dims').textContent = t('dims.crop', { cw: crop.w, ch: crop.h, w: layout.width, h: layout.height });
    },
  });

  function setMode(mode) {
    state.mode = mode;
    $('mode-preview').classList.toggle('active', mode === 'preview');
    $('mode-crop').classList.toggle('active', mode === 'crop');
    $('preview-wrap').hidden = mode !== 'preview';
    $('crop-wrap').hidden = mode !== 'crop';
    if (mode === 'crop') { stopPlayback(); syncPlayButton(); openCrop(); }
    else { renderList(); renderPreview(); }
  }

  function openCrop() {
    const p = active();
    if (!p) return;
    setActiveChip(p.ratioKey);
    editor.load(p.poster, p.W, p.H, p.crop, p.ratio);
    editor.commit();
  }

  function setActiveChip(key) {
    document.querySelectorAll('#ratio-chips .chip').forEach((c) => c.classList.toggle('active', c.dataset.ratio === key));
  }

  /* ---------- 輸出 ---------- */

  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const IOS_MAX_AREA = 16777216;

  async function renderFull(p, onProgress) {
    if (p.kind !== 'photo') return renderVideo(p, onProgress);
    if (p.fullPromise) await p.fullPromise; // RAW 等完整解析度解碼完再輸出
    const crop = cropOf(p);
    const logo = await Frame.getLogo(logoKeyFor(p), state.customLogos, logoOpts());
    const layout = layoutOf(crop);
    let scale = 1;
    if (isIOS && layout.width * layout.height > IOS_MAX_AREA) {
      scale = Math.sqrt(IOS_MAX_AREA / (layout.width * layout.height)) * 0.99;
    }
    const canvas = document.createElement('canvas');
    Frame.drawFrame(canvas, p.img, crop, linesFor(p), logo, frameOpts({ scale }));
    const fmt = photoFormat(p);
    let blob = await new Promise((res) => canvas.toBlob(res, fmt.mime, settings.quality / 100));
    // 瀏覽器不支援該格式編碼時（toBlob 會改回 PNG）退回 JPEG
    if (!blob || blob.type !== fmt.mime) blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', settings.quality / 100));
    canvas.width = canvas.height = 0;
    return blob;
  }

  async function renderVideo(p, onProgress) {
    const c = cropOf(p);
    // 預覽是轉檔後的縮小版時，把裁切座標換算回原始解析度；H.264 需要偶數尺寸
    const s = p.exportScale || 1;
    const crop = {
      x: Math.round(c.x * s), y: Math.round(c.y * s),
      w: Math.floor((c.w * s) / 2) * 2, h: Math.floor((c.h * s) / 2) * 2,
    };
    const layout = layoutOf(crop, true);
    const logo = await Frame.getLogo(logoKeyFor(p), state.customLogos, logoOpts());
    const canvas = document.createElement('canvas');
    Frame.drawFrame(canvas, p.img, crop, linesFor(p), logo, frameOpts({ even: true, overlayOnly: true }));
    const overlay = await new Promise((res) => canvas.toBlob(res, 'image/png'));
    const v = settings.video;
    return Media.exportVideo({
      file: p.file, crop, layout, overlay,
      bg: settings.frameColor,
      format: v.format, mute: v.mute, loops: v.loops, boomerang: v.boomerang,
      gifInfinite: v.gifInfinite, fps: v.fps, maxWidth: Number(v.maxWidth) || 0,
    }, onProgress || (() => {}));
  }

  /* 相片依原檔格式輸出：JPG→JPG、PNG→PNG、WebP→WebP；
     HEIC、RAW、TIFF 等瀏覽器無法編碼的格式改輸出 JPG */
  const canEncodeWebp = (() => {
    try { const c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').startsWith('data:image/webp'); }
    catch (e) { return false; }
  })();

  function photoFormat(p) {
    const ext = (p.name.match(/\.([^.]+)$/) || [, ''])[1];
    if (/^jpe?g$/i.test(ext)) return { mime: 'image/jpeg', ext };
    if (/^png$/i.test(ext)) return { mime: 'image/png', ext };
    if (/^webp$/i.test(ext) && canEncodeWebp) return { mime: 'image/webp', ext };
    if (/^svgz?$/i.test(ext)) return { mime: 'image/png', ext: 'png' }; // 向量圖輸出為透明 PNG
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  function outExt(p) { return p.kind === 'photo' ? photoFormat(p).ext : settings.video.format; }

  function outName(p) {
    return `${p.name.replace(/\.[^.]+$/, '')}${settings.suffix}.${outExt(p)}`;
  }

  function progressHandler(prefix) {
    return (phase, r) => {
      const pct = Math.round(r * 100);
      $('progress').hidden = false;
      $('progress').value = pct;
      setStatus(`${prefix ? prefix + ' — ' : ''}${t(phase === 'download' ? 'st.ffmpegDownload' : 'st.encoding', { p: pct })}`);
    };
  }

  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function exportOne() {
    const p = active();
    if (!p) return;
    busy(true, t('st.exporting'));
    try { download(await renderFull(p, progressHandler('')), outName(p)); setStatus(t('st.exported', { name: outName(p) })); }
    catch (e) { console.error(e); setStatus(cancelled ? t('st.cancelled') : t('st.exportFail')); }
    finally { busy(false); }
  }

  /* ---------- 儲存至裝置 ---------- */
  // 手機：用系統分享選單（iPhone 選「儲存影像 / 影片」即存進相簿）
  // 電腦：可選擇儲存位置（支援的瀏覽器），否則一般下載
  const isTouchDevice = matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
  let pendingShare = null;

  function resetSaveButton() {
    pendingShare = null;
    $('save-device').querySelector('.tbtn-label').textContent = t('tb.save');
  }

  async function shareFile(file) {
    try {
      await navigator.share({ files: [file] });
      setStatus(t('st.saved', { name: file.name }));
    } catch (e) {
      if (e.name === 'AbortError') { setStatus(''); return; }
      // 影片處理太久，瀏覽器不再視為使用者操作：請使用者再點一次
      if (e.name === 'NotAllowedError') {
        pendingShare = file;
        $('save-device').querySelector('.tbtn-label').textContent = t('tb.saveTap');
        setStatus(t('st.saveTap'));
        return;
      }
      throw e;
    }
  }

  async function saveToDevice() {
    const p = active();
    if (!p) return;
    if (pendingShare) {
      const file = pendingShare;
      resetSaveButton();
      try { await shareFile(file); } catch (e) { console.error(e); download(file, file.name); }
      return;
    }
    busy(true, t('st.exporting'));
    try {
      const blob = await renderFull(p, progressHandler(''));
      const file = new File([blob], outName(p), { type: blob.type });
      if (isTouchDevice && navigator.canShare && navigator.canShare({ files: [file] })) {
        await shareFile(file);
      } else if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: file.name,
            types: [{ description: file.type, accept: { [file.type]: [`.${outExt(p)}`] } }],
          });
          const w = await handle.createWritable();
          await w.write(file);
          await w.close();
          setStatus(t('st.saved', { name: file.name }));
        } catch (e) {
          if (e.name === 'AbortError') setStatus('');
          else { download(file, file.name); setStatus(t('st.exported', { name: file.name })); }
        }
      } else {
        download(file, file.name);
        setStatus(t('st.exported', { name: file.name }));
      }
    } catch (e) { console.error(e); setStatus(cancelled ? t('st.cancelled') : t('st.exportFail')); }
    finally { busy(false); }
  }

  /* ---------- 分享到社群 ----------
     手機與支援的電腦瀏覽器：開啟系統分享選單（Instagram、Threads、Facebook、LINE、X…），檔案直接附上
     不支援時：把圖片複製到剪貼簿，可直接貼到貼文；再不行就下載檔案 */
  let pendingSocial = null;
  function setShareLabel(key) { $('share-social').querySelector('span').textContent = t(key === 'btn.share' ? 'tb.share' : 'tb.shareTap'); }

  async function toPngBlob(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const img = await Frame.loadImage(url);
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      return await new Promise((res) => c.toBlob(res, 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }

  async function deliverToSocial(file) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: file.name });
        setStatus(t('st.shared'));
        return;
      } catch (e) {
        if (e.name === 'AbortError') { setStatus(''); return; }
        // 影片處理太久，瀏覽器不再視為使用者操作：請使用者再點一次
        if (e.name === 'NotAllowedError') {
          pendingSocial = file;
          setShareLabel('btn.shareTap');
          setStatus(t('st.shareTap'));
          return;
        }
        console.warn(e);
      }
    }
    if (file.type.startsWith('image/') && navigator.clipboard && window.ClipboardItem) {
      try {
        const png = file.type === 'image/png' ? file : await toPngBlob(file);
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
        setStatus(t('st.copiedForSocial'));
        return;
      } catch (e) { console.warn('clipboard', e); }
    }
    download(file, file.name);
    setStatus(t('st.shareFallback'));
  }

  async function shareSocial() {
    const p = active();
    if (!p) return;
    if (pendingSocial) {
      const file = pendingSocial;
      pendingSocial = null;
      setShareLabel('btn.share');
      await deliverToSocial(file);
      return;
    }
    busy(true, t('st.exporting'));
    try {
      const blob = await renderFull(p, progressHandler(''));
      await deliverToSocial(new File([blob], outName(p), { type: blob.type }));
    } catch (e) { console.error(e); setStatus(cancelled ? t('st.cancelled') : t('st.exportFail')); }
    finally { busy(false); }
  }

  /* ---------- 列印 ---------- */

  async function renderStill(p) {
    const crop = cropOf(p);
    const logo = await Frame.getLogo(logoKeyFor(p), state.customLogos, logoOpts());
    const canvas = document.createElement('canvas');
    Frame.drawFrame(canvas, p.img, crop, linesFor(p), logo, frameOpts({ scale: 1 }));
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
    canvas.width = canvas.height = 0;
    return blob;
  }

  async function printCurrent() {
    const p = active();
    if (!p) return;
    busy(true, t('st.printing'));
    try {
      // 影片 / GIF 列印目前畫面
      if (p.fullPromise) await p.fullPromise;
      const blob = p.kind === 'photo' ? await renderFull(p) : await renderStill(p);
      const url = URL.createObjectURL(blob);
      const img = await Frame.loadImage(url);
      const landscape = img.naturalWidth > img.naturalHeight;
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      doc.open();
      doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(outName(p).replace(/\.\w+$/, ''))}</title>
        <style>@page{size:${landscape ? 'landscape' : 'portrait'};margin:8mm}
        html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}
        img{max-width:100%;max-height:100%;object-fit:contain}</style></head>
        <body><img src="${url}" alt=""></body></html>`);
      doc.close();
      const pimg = doc.querySelector('img');
      if (!pimg.complete) await new Promise((r) => { pimg.onload = r; pimg.onerror = r; });
      frame.contentWindow.focus();
      frame.contentWindow.print();
      setStatus('');
      setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60000);
    } catch (e) { console.error(e); setStatus(t('st.exportFail')); }
    finally { busy(false); }
  }

  async function exportAll() {
    if (!state.photos.length) return;
    busy(true);
    try {
      const zip = new JSZip();
      const used = new Set();
      for (let i = 0; i < state.photos.length; i++) {
        const p = state.photos[i];
        const label = t('st.exportingN', { i: i + 1, n: state.photos.length, name: p.name });
        setStatus(label);
        let name = outName(p), n = 1;
        while (used.has(name)) name = outName(p).replace(/(\.\w+)$/, `_${n++}$1`);
        used.add(name);
        zip.file(name, await renderFull(p, progressHandler(label)));
      }
      setStatus(t('st.zipping'));
      download(await zip.generateAsync({ type: 'blob' }), 'lumark.zip');
      setStatus(t('st.exportedN', { n: state.photos.length }));
    } catch (e) { console.error(e); setStatus(cancelled ? t('st.cancelled') : t('st.exportFail')); }
    finally { busy(false); }
  }

  let cancelled = false;
  function busy(on, msg) {
    if (on) cancelled = false;
    ['export-one', 'save-device', 'print-one', 'save-top', 'share-social'].forEach((id) => { $(id).disabled = on || !active(); });
    $('export-all').disabled = on || state.photos.length < 2;
    $('cancel-export').hidden = !on;
    if (!on) $('progress').hidden = true;
    if (msg) setStatus(msg);
  }

  function setStatus(msg) { $('status').textContent = msg; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- 事件 ---------- */

  $('file-input').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });

  const stagePanel = document.querySelector('.stage-panel');
  let dragDepth = 0;
  document.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; stagePanel.classList.add('dragging'); });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; stagePanel.classList.remove('dragging'); } });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragDepth = 0;
    stagePanel.classList.remove('dragging');
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  });

  $('photo-list').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { removePhoto(Number(rm.dataset.remove)); return; }
    const li = e.target.closest('.photo-item');
    if (li) selectPhoto(Number(li.dataset.id));
  });

  $('remove-all').addEventListener('click', () => {
    state.photos.forEach(releaseItem);
    state.photos = [];
    selectPhoto(null);
  });

  $('mode-preview').addEventListener('click', () => setMode('preview'));
  $('mode-crop').addEventListener('click', () => setMode('crop'));
  $('crop-done').addEventListener('click', () => setMode('preview'));
  $('crop-reset').addEventListener('click', () => {
    const p = active();
    if (p) p.ratioKey = 'free';
    setActiveChip('free');
    editor.reset();
  });

  $('ratio-chips').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    const p = active();
    if (!chip || !p) return;
    const key = chip.dataset.ratio;
    p.ratioKey = key;
    setActiveChip(key);
    const r = RATIO_KEYS[key];
    editor.setRatio(r === 'orig' ? p.W / p.H : r);
  });

  $('logo-select').addEventListener('change', (e) => { settings.logo = e.target.value; saveSettings(); renderPreview(); });

  $('logo-upload').addEventListener('change', (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const key = `custom:${f.name.replace(/\.[^.]+$/, '')}`;
    const reader = new FileReader();
    reader.onload = () => {
      state.customLogos[key] = { src: reader.result, removeWhite: $('logo-remove-white').checked };
      Frame.logoCache.delete(key);
      settings.logo = key;
      fillLogoSelect();
      renderPreview();
    };
    reader.readAsDataURL(f);
  });

  $('logo-remove-white').addEventListener('change', (e) => {
    Object.entries(state.customLogos).forEach(([k, v]) => { v.removeWhite = e.target.checked; Frame.logoCache.delete(k); });
    renderPreview();
  });

  function bindSeg(attr, key) {
    const btns = document.querySelectorAll(`[${attr}]`);
    const sync = () => btns.forEach((b) => b.classList.toggle('active', b.getAttribute(attr) === settings[key]));
    btns.forEach((b) => b.addEventListener('click', () => {
      settings[key] = b.getAttribute(attr);
      saveSettings(); sync(); renderPreview();
    }));
    sync();
  }
  bindSeg('data-unit', 'tempUnit');
  bindSeg('data-date-format', 'dateFormat');
  bindSeg('data-time-format', 'timeFormat');

  /* ---------- 時間選擇器：依「時間格式」顯示 24 小時制，或 12 小時制加上午／下午 ---------- */

  const pad2 = (n) => String(n).padStart(2, '0');
  function buildTimePicker() {
    const is12 = settings.timeFormat === '12';
    const cur = $('tp-hour').value, curM = $('tp-min').value;
    const empty = '<option value="">--</option>';
    $('tp-hour').innerHTML = empty + (is12
      ? Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')
      : Array.from({ length: 24 }, (_, i) => `<option value="${i}">${pad2(i)}</option>`).join(''));
    $('tp-min').innerHTML = empty + Array.from({ length: 60 }, (_, i) => `<option value="${i}">${pad2(i)}</option>`).join('');
    $('tp-ampm').innerHTML = `<option value="am">${escapeHtml(t('f.am'))}</option><option value="pm">${escapeHtml(t('f.pm'))}</option>`;
    $('tp-ampm').hidden = !is12;
    // 12 小時制有三個選單，整行顯示才不會被截斷
    $('time-picker').closest('.field').classList.toggle('full', is12);
    // 英文是 1:32 PM（上午下午放後面），中文、日文是 下午 1:32（放前面）
    $('time-picker').classList.toggle('ampm-after', I18n.lang === 'en');
    $('tp-hour').setAttribute('aria-label', t('f.hour'));
    if (cur !== undefined) { $('tp-hour').value = cur; $('tp-min').value = curM; }
    syncTimePicker();
  }

  function syncTimePicker() {
    const m = String($('f-time').value || '').match(/^(\d{1,2}):(\d{2})/);
    const disabled = !active();
    ['tp-hour', 'tp-min', 'tp-ampm'].forEach((id) => { $(id).disabled = disabled; });
    if (!m) { $('tp-hour').value = ''; $('tp-min').value = ''; return; }
    const h = +m[1], mi = +m[2];
    if (settings.timeFormat === '12') {
      $('tp-hour').value = String(h % 12 || 12);
      $('tp-ampm').value = h >= 12 ? 'pm' : 'am';
    } else {
      $('tp-hour').value = String(h);
    }
    $('tp-min').value = String(mi);
  }

  function onTimePicked() {
    const hv = $('tp-hour').value, mv = $('tp-min').value;
    if (hv === '' && mv === '') { $('f-time').value = ''; }
    else {
      let h = Number(hv || 0);
      if (settings.timeFormat === '12') {
        h = h % 12;
        if ($('tp-ampm').value === 'pm') h += 12;
      }
      $('f-time').value = `${pad2(h)}:${pad2(Number(mv || 0))}`;
    }
    $('f-time').dispatchEvent(new Event('input'));
    $('f-time').dispatchEvent(new Event('change'));
  }
  ['tp-hour', 'tp-min', 'tp-ampm'].forEach((id) => $(id).addEventListener('change', onTimePicked));
  document.querySelectorAll('[data-time-format]').forEach((b) => b.addEventListener('click', buildTimePicker));
  window.addEventListener('langchange', buildTimePicker);
  buildTimePicker();

  /* ---------- 版型、邊框顏色、Logo 顏色 ---------- */

  bindSeg('data-layout', 'layout');
  bindSeg('data-logo-color', 'logoColor');
  const syncLayoutMode = () => { $('settings-panel').dataset.layoutMode = settings.layout; };
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', syncLayoutMode));
  syncLayoutMode();

  function setFrameColor(hex, from) {
    const c = Frame.parseColor(hex);
    if (!c) return false;
    settings.frameColor = c;
    saveSettings();
    document.querySelectorAll('[data-frame-color]').forEach((b) => b.classList.toggle('active', b.dataset.frameColor === c));
    if (from !== 'picker') $('frame-color-picker').value = c;
    if (from !== 'text') { $('frame-color-text').value = c.toUpperCase(); $('frame-color-text').classList.remove('invalid'); }
    renderPreview();
    return true;
  }
  document.querySelectorAll('[data-frame-color]').forEach((b) => b.addEventListener('click', () => setFrameColor(b.dataset.frameColor)));
  $('frame-color-picker').addEventListener('input', (e) => setFrameColor(e.target.value, 'picker'));
  $('frame-color-text').addEventListener('input', (e) => {
    const ok = !e.target.value.trim() || setFrameColor(e.target.value, 'text');
    e.target.classList.toggle('invalid', !ok);
  });
  $('frame-color-text').addEventListener('change', (e) => { if (setFrameColor(e.target.value)) e.target.blur(); });

  setFrameColor(settings.frameColor);

  /* ---------- 作者簽名（文字、圖片兩張卡片） ---------- */

  const SIG = { text: settings.sigText, image: settings.sigImage, draw: settings.sigDraw };

  function syncSigCard(k) {
    const sg = SIG[k];
    $(`sig-card-${k}`).classList.toggle('on', sg.on);
    $(`sig-${k}-on`).checked = sg.on;
    $(`sig-${k}-pos`).value = sg.pos;
    $(`sig-${k}-size`).value = sg.sizePct;
    $(`sig-${k}-size-val`).textContent = `${sg.sizePct}%`;
    $(`sig-${k}-opacity`).value = Math.round(sg.opacity * 100);
    $(`sig-${k}-opacity-val`).textContent = `${Math.round(sg.opacity * 100)}%`;
    $(`sig-${k}-glass`).checked = !!sg.glass;
    document.querySelectorAll(`[data-sig="${k}"][data-sig-color]`).forEach((b) => b.classList.toggle('active', b.dataset.sigColor === sg.color));
    const hex = /^#/.test(sg.color) ? sg.color : '';
    const picker = document.querySelector(`.sig-color-picker[data-sig="${k}"]`);
    const text = document.querySelector(`.sig-color-text[data-sig="${k}"]`);
    if (hex) picker.value = hex;
    if (document.activeElement !== text) { text.value = hex.toUpperCase(); text.classList.remove('invalid'); }
  }
  function changeSig(k, patch) {
    Object.assign(SIG[k], patch);
    saveSettings(); syncSigCard(k); renderPreview();
  }

  // 手寫字體從 Google Fonts 載入（只在用到時載入一次）
  let scriptFontReady = null;
  // 草寫字體從 Google Fonts 載入：每種字體只在第一次選用時載入
  const fontLoads = {};
  function loadWebFont(key) {
    const family = Frame.WEB_FONTS[key];
    if (!family) return Promise.resolve();
    if (!fontLoads[key]) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      const weight = key === 'dancing' ? ':wght@600' : '';
      link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}${weight}&display=swap`;
      document.head.appendChild(link);
      fontLoads[key] = new Promise((r) => { link.onload = r; link.onerror = r; })
        .then(() => document.fonts.load(`${key === 'dancing' ? 600 : 400} 48px "${family}"`)).catch(() => {});
    }
    return fontLoads[key];
  }
  function ensureScriptFont() {
    if (!SIG.text.on) return Promise.resolve();
    return loadWebFont(SIG.text.font);
  }

  ['text', 'image', 'draw'].forEach((k) => {
    $(`sig-${k}-on`).addEventListener('change', (e) => { changeSig(k, { on: e.target.checked }); ensureScriptFont().then(renderPreview); });
    $(`sig-${k}-pos`).addEventListener('change', (e) => changeSig(k, { pos: e.target.value }));
    $(`sig-${k}-size`).addEventListener('input', (e) => changeSig(k, { sizePct: Number(e.target.value) }));
    $(`sig-${k}-opacity`).addEventListener('input', (e) => changeSig(k, { opacity: Number(e.target.value) / 100 }));
    $(`sig-${k}-glass`).addEventListener('change', (e) => changeSig(k, { glass: e.target.checked }));
    document.querySelectorAll(`[data-sig="${k}"][data-sig-color]`).forEach((b) => b.addEventListener('click', () => changeSig(k, { color: b.dataset.sigColor })));
    document.querySelector(`.sig-color-picker[data-sig="${k}"]`).addEventListener('input', (e) => changeSig(k, { color: e.target.value }));
    document.querySelector(`.sig-color-text[data-sig="${k}"]`).addEventListener('input', (e) => {
      const c = Frame.parseColor(e.target.value);
      e.target.classList.toggle('invalid', !!e.target.value.trim() && !c);
      if (c) changeSig(k, { color: c });
    });
    syncSigCard(k);
  });

  $('sig-text').value = SIG.text.text;
  $('sig-text').addEventListener('input', (e) => {
    changeSig('text', { text: e.target.value, on: SIG.text.on || !!e.target.value.trim() });
    ensureScriptFont().then(renderPreview);
  });
  $('sig-font').value = SIG.text.font;
  $('sig-font').addEventListener('change', (e) => { changeSig('text', { font: e.target.value }); ensureScriptFont().then(renderPreview); });

  // 簽名圖片：PNG、JPG、WebP、SVG 都可以；選擇顏色時整張圖會改成該顏色（SVG 也能自由調色）
  let sigFile = null;
  // 手寫簽名：筆跡存在這台裝置的瀏覽器中，下次開啟還在
  let drawnSig = null;
  try { drawnSig = JSON.parse(localStorage.getItem('lumark.drawnSig') || 'null'); } catch (e) { drawnSig = null; }
  const hasDrawn = () => !!(drawnSig && drawnSig.strokes && drawnSig.strokes.length);

  async function loadSignatureImage() {
    if (!sigFile) { signatureImage = null; renderPreview(); return; }
    let src = sigFile;
    if (/svg/i.test(sigFile.type) || /\.svg$/i.test(sigFile.name)) {
      // SVG 先轉成高解析度點陣，避免放大後模糊
      const dec = await Decode.decodeSvg(sigFile);
      src = await fetch(dec.url).then((r) => r.blob());
      URL.revokeObjectURL(dec.url);
    }
    const url = URL.createObjectURL(src);
    try {
      const img = await Frame.loadImage(url);
      signatureImage = Frame.trimTransparent($('sig-remove-white').checked ? Frame.removeWhite(img) : img);
    } finally { URL.revokeObjectURL(url); }
    renderPreview();
  }
  $('sig-upload').addEventListener('change', (e) => {
    sigFile = e.target.files[0] || null;
    e.target.value = '';
    $('sig-file').textContent = sigFile ? sigFile.name : '';
    if (sigFile && !SIG.image.on) changeSig('image', { on: true });
    loadSignatureImage();
  });
  $('sig-remove-white').addEventListener('change', loadSignatureImage);

  /* 手寫簽名（獨立的第三種簽名）：在簽名板上簽，之後可重新編輯 */
  function syncDrawStatus() {
    $('sig-draw-label').textContent = t(hasDrawn() ? 'pad.edit' : 'pad.open');
    $('sig-draw-status').textContent = hasDrawn() ? t('pad.saved') : '';
  }
  $('sig-draw').addEventListener('click', async () => {
    const res = await SignPad.open(drawnSig);
    if (!res) return;
    drawnSig = res.data;
    try { localStorage.setItem('lumark.drawnSig', JSON.stringify(drawnSig)); } catch (e) { /* 空間不足或無痕模式 */ }
    drawnImage = res.canvas;
    syncDrawStatus();
    changeSig('draw', { on: true });
  });
  // 打開手寫簽名卡片但還沒簽過時，直接開啟簽名板
  $('sig-draw-on').addEventListener('change', (e) => { if (e.target.checked && !hasDrawn()) $('sig-draw').click(); });
  if (hasDrawn()) drawnImage = SignPad.render(drawnSig);
  syncDrawStatus();
  window.addEventListener('langchange', syncDrawStatus);
  ensureScriptFont().then(renderPreview);

  /* 在預覽上直接拖曳簽名到任何位置 */
  let sigDrag = null;
  function previewPoint(e) {
    const cv = $('preview');
    const r = cv.getBoundingClientRect();
    if (!lastPreview || !r.width) return null;
    const k = cv.width / r.width / lastPreview.scale; // 螢幕像素 → 整張圖座標
    return { x: (e.clientX - r.left) * k, y: (e.clientY - r.top) * k, L: lastPreview.L };
  }
  function hitSignature(pt) {
    const boxes = (pt && pt.L.sigBoxes) || {};
    for (const id of ['draw', 'image', 'text']) {
      const b = boxes[id];
      if (b && pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h) return { id, box: b };
    }
    return null;
  }
  $('preview').addEventListener('pointerdown', (e) => {
    const pt = previewPoint(e);
    const hit = hitSignature(pt);
    if (!hit) return;
    e.preventDefault();
    try { $('preview').setPointerCapture(e.pointerId); } catch (err) { /* 部分裝置不支援 */ }
    sigDrag = { id: hit.id, dx: pt.x - (hit.box.x + hit.box.w / 2), dy: pt.y - (hit.box.y + hit.box.h / 2) };
    document.body.classList.add('dragging-sig');
  });
  $('preview').addEventListener('pointermove', (e) => {
    const pt = previewPoint(e);
    if (!pt) return;
    if (!sigDrag) { document.body.classList.toggle('over-sig', !!hitSignature(pt)); return; }
    const sg = SIG[sigDrag.id];
    sg.pos = 'custom';
    sg.x = Math.max(0, Math.min(1, (pt.x - sigDrag.dx) / pt.L.width));
    sg.y = Math.max(0, Math.min(1, (pt.y - sigDrag.dy) / pt.L.height));
    $(`sig-${sigDrag.id}-pos`).value = 'custom';
    const p = active();
    if (p) requestAnimationFrame(() => drawPreviewFrame(p));
  });
  const endDrag = () => {
    if (!sigDrag) return;
    sigDrag = null;
    document.body.classList.remove('dragging-sig');
    saveSettings();
    renderPreview();
  };
  $('preview').addEventListener('pointerup', endDrag);
  $('preview').addEventListener('pointercancel', endDrag);
  $('preview').style.touchAction = 'none';

  bindSeg('data-style', 'style');
  document.querySelectorAll('[data-style]').forEach((b) => b.addEventListener('click', () => {
    $('border-field').hidden = settings.style !== 'border';
  }));
  $('border-field').hidden = settings.style !== 'border';
  $('border-size').value = settings.borderPct;
  $('border-size').addEventListener('input', (e) => {
    settings.borderPct = Number(e.target.value);
    $('border-size-val').textContent = t('f.borderSize.val', { n: settings.borderPct });
    saveSettings(); renderPreview();
  });

  /* 影片設定 */
  function syncVideoUi() {
    const p = active();
    const v = settings.video;
    $('video-group').hidden = !state.photos.some((x) => x.kind !== 'photo');
    document.querySelectorAll('[data-vformat]').forEach((b) => b.classList.toggle('active', b.dataset.vformat === v.format));
    document.querySelectorAll('.gif-only').forEach((el) => { el.hidden = v.format !== 'gif'; });
    document.querySelectorAll('.mov-only').forEach((el) => { el.hidden = v.format === 'gif'; });
    syncPlayButton();
  }
  document.querySelectorAll('[data-vformat]').forEach((b) => b.addEventListener('click', () => {
    settings.video.format = b.dataset.vformat; saveSettings(); syncVideoUi();
  }));
  const bindVideo = (id, key, parse) => {
    const el = $(id);
    if (el.type === 'checkbox') el.checked = !!settings.video[key]; else el.value = settings.video[key];
    el.addEventListener('change', () => {
      settings.video[key] = el.type === 'checkbox' ? el.checked : parse(el.value);
      saveSettings();
    });
  };
  bindVideo('v-mute', 'mute');
  bindVideo('v-loops', 'loops', (x) => Math.max(1, Math.min(20, parseInt(x, 10) || 1)));
  bindVideo('v-boomerang', 'boomerang');
  bindVideo('v-gif-infinite', 'gifInfinite');
  bindVideo('v-fps', 'fps', Number);
  bindVideo('v-maxwidth', 'maxWidth', Number);
  $('play-toggle').addEventListener('click', () => {
    const p = active();
    if (!p || p.kind !== 'video') return;
    if (p.img.paused) { p.userPaused = false; p.img.play().catch(() => {}); }
    else { p.userPaused = true; p.img.pause(); }
    syncPlayButton();
  });
  $('cancel-export').addEventListener('click', () => { cancelled = true; Media.cancel(); });

  $('frame-size').value = settings.framePct;
  $('frame-size').addEventListener('input', (e) => {
    settings.framePct = Number(e.target.value);
    $('frame-size-val').textContent = t('f.frameSize.val', { n: settings.framePct });
    saveSettings(); renderPreview();
  });

  document.querySelectorAll('[data-show]').forEach((cb) => {
    cb.checked = !!settings.show[cb.dataset.show];
    cb.addEventListener('change', () => {
      settings.show[cb.dataset.show] = cb.checked;
      saveSettings(); renderPreview();
    });
  });

  $('quality').value = settings.quality;
  $('quality-val').textContent = settings.quality;
  $('quality').addEventListener('input', (e) => {
    settings.quality = Number(e.target.value);
    $('quality-val').textContent = e.target.value;
    saveSettings();
  });

  $('suffix').value = settings.suffix;
  $('suffix').addEventListener('input', (e) => { settings.suffix = e.target.value; saveSettings(); });

  exifInputs.forEach((el) => el.addEventListener('input', () => {
    const p = active();
    if (!p) return;
    p.exif[el.dataset.key] = el.value.trim();
    // 自己修改地點或溫度就改為手動，之後不會被自動偵測覆蓋
    if (el.dataset.key === 'location' || el.dataset.key === 'temp') setManual(p);
    renderPreview();
  }));

  // 改了拍攝日期或時間：自動模式下依新的時間重新查詢當時天氣
  let weatherTimer = 0;
  ['f-date', 'f-time'].forEach((id) => $(id).addEventListener('change', () => {
    const p = active();
    if (!p || !p.weatherAuto || p.exif.lat == null) return;
    clearTimeout(weatherTimer);
    weatherTimer = setTimeout(() => detectPlace(p), 400);
  }));

  $('f-weather').addEventListener('input', (e) => {
    const p = active();
    if (!p) return;
    p.exif.weather = weatherValue(e.target.value);
    setManual(p);
    renderPreview();
  });

  document.querySelectorAll('[data-place-mode]').forEach((b) => b.addEventListener('click', () => {
    const p = active();
    if (!p) return;
    if (b.dataset.placeMode === 'manual') { setManual(p); return; }
    p.locAuto = true; p.weatherAuto = true;
    syncPlaceMode();
    autoPlace(p);
  }));

  $('f-coords').addEventListener('change', (e) => {
    const p = active();
    if (!p) return;
    const c = Geo.parseCoords(e.target.value);
    if (!e.target.value.trim()) { p.exif.lat = p.exif.lon = null; renderPreview(); return; }
    if (!c) { e.target.value = Geo.formatCoords(p.exif.lat, p.exif.lon); return; }
    p.exif.lat = c.lat; p.exif.lon = c.lon;
    e.target.value = Geo.formatCoords(c.lat, c.lon);
    // 自動模式才依新座標重新查詢；手動模式只更新座標
    if (p.locAuto || p.weatherAuto) detectPlace(p); else renderPreview();
  });

  $('loc-format').value = settings.locFormat;
  $('loc-format').addEventListener('change', (e) => {
    settings.locFormat = e.target.value;
    saveSettings();
    state.photos.forEach((p) => { if (p.locAuto && p.addr) p.exif.location = placeLabel(p); });
    fillForm(active());
    renderPreview();
  });

  $('btn-detect').addEventListener('click', () => {
    const p = active();
    if (!p) return;
    p.locAuto = true; p.weatherAuto = true;
    syncPlaceMode();
    detectPlace(p);
  });
  $('btn-my-location').addEventListener('click', () => { const p = active(); if (p) useMyLocation(p); });

  $('auto-geo').checked = settings.autoGeo;
  $('auto-geo').addEventListener('change', (e) => { settings.autoGeo = e.target.checked; saveSettings(); });

  $('export-one').addEventListener('click', exportOne);
  $('save-device').addEventListener('click', saveToDevice);
  $('share-social').addEventListener('click', shareSocial);
  $('print-one').addEventListener('click', printCurrent);
  $('export-all').addEventListener('click', exportAll);

  /* ---------- 從網址匯入 ---------- */

  const MIME_EXT = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
    'image/svg+xml': 'svg', 'image/heic': 'heic', 'image/heif': 'heif', 'image/bmp': 'bmp', 'image/tiff': 'tif',
    'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'video/x-matroska': 'mkv',
    'video/x-msvideo': 'avi', 'video/x-ms-wmv': 'wmv', 'video/mpeg': 'mpg', 'video/3gpp': '3gp',
  };

  function nameFromResponse(res, href) {
    const cd = res.headers.get('content-disposition') || '';
    const m = cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="?([^";]+)"?/i);
    let name = '';
    try { name = m ? decodeURIComponent(m[1]) : decodeURIComponent(new URL(href).pathname.split('/').pop() || ''); } catch (e) { /* ignore */ }
    name = name.replace(/[\\/:*?"<>|]+/g, '_').slice(-120) || 'image';
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!/\.[a-z0-9]{2,5}$/i.test(name) && MIME_EXT[type]) name += `.${MIME_EXT[type]}`;
    return name;
  }

  async function importUrl(raw) {
    let u;
    try { u = new URL(String(raw).trim()); } catch (e) { setStatus(t('st.urlInvalid')); return; }
    if (!/^https?:$/.test(u.protocol)) { setStatus(t('st.urlInvalid')); return; }
    setStatus(t('st.urlFetching'));
    setBusy(t('st.urlFetching'));
    let res = null;
    // 先直接下載（支援跨網域的網站），失敗再透過本站的 Cloudflare Worker 代為下載
    try {
      res = await fetch(u.href, { mode: 'cors', credentials: 'omit' });
      if (!res.ok || !/^(image|video)\//.test(res.headers.get('content-type') || '')) res = null;
    } catch (e) { res = null; }
    if (!res) {
      try { res = await fetch(`api/fetch?url=${encodeURIComponent(u.href)}`); } catch (e) { res = null; }
      if (!res || !res.ok) {
        const code = res && res.status;
        setStatus(t(code === 415 ? 'st.urlNotMedia' : code === 413 ? 'st.urlTooLarge' : code === 400 ? 'st.urlInvalid' : 'st.urlFailed'));
        setBusy('');
        return;
      }
    }
    try {
      const finalUrl = res.headers.get('x-final-url') || res.url || u.href;
      const blob = await res.blob();
      const file = new File([blob], nameFromResponse(res, finalUrl), { type: blob.type });
      const before = state.photos.length;
      await addFiles([file]);
      // 依來源網站自動挑影音平台 Logo（例如 YouTube、Spotify）
      const added = state.photos.slice(before);
      const host = new URL(finalUrl).hostname;
      added.forEach((p) => { p.sourceLogo = Frame.logoForHost(host) || Frame.logoForHost(u.hostname); });
      if (added.length) { $('url-input').value = ''; renderPreview(); }
    } catch (e) {
      console.error(e);
      setStatus(t('st.urlFailed'));
      setBusy('');
    }
  }

  $('url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    importUrl($('url-input').value);
  });

  // 貼上：圖片檔直接加入；網址則從網址匯入（在輸入框內打字時不攔截）
  document.addEventListener('paste', (e) => {
    const target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) && target.id !== 'url-input') return;
    const files = [...(e.clipboardData?.files || [])];
    if (files.length) { e.preventDefault(); addFiles(files); return; }
    const text = (e.clipboardData?.getData('text') || '').trim();
    if (/^https?:\/\/\S+$/i.test(text) && target.id !== 'url-input') { e.preventDefault(); $('url-input').value = text; importUrl(text); }
  });

  /* ---------- 回到頂端 / 頁尾 ---------- */

  document.querySelectorAll('.copyright-year').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- 手機 App 介面：底部分頁、加入選單、儲存 ---------- */

  const isPhoneLayout = () => matchMedia('(max-width: 720px)').matches;

  function setTab(name) {
    if (name === 'more' && !isPhoneLayout()) name = 'frame'; // 電腦版的介面設定在頂部列
    $('settings-panel').dataset.tab = name;
    document.querySelectorAll('#tabbar .tab, .inspector-tabs .itab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $('settings-panel').scrollTop = 0;
    try { localStorage.setItem('lumark.tab', name); } catch (e) { /* ignore */ }
  }
  document.querySelectorAll('#tabbar .tab, .inspector-tabs .itab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
  let savedTab = 'frame';
  try { savedTab = localStorage.getItem('lumark.tab') || 'frame'; } catch (e) { /* ignore */ }
  setTab(['frame', 'sign', 'info', 'place', 'export', 'more'].includes(savedTab) ? savedTab : 'frame');

  const sheet = $('add-sheet');
  function openAddSheet() {
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else $('file-input').click();
  }
  // 手機點「＋」打開選單；電腦維持直接選擇檔案
  $('add-btn').addEventListener('click', (e) => { if (isPhoneLayout()) { e.preventDefault(); openAddSheet(); } });
  $('dz-add').addEventListener('click', () => { if (isPhoneLayout()) openAddSheet(); else $('file-input').click(); });
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) { sheet.close(); return; } // 點背景關閉
    const action = e.target.closest('[data-sheet]')?.dataset.sheet;
    if (!action) return;
    sheet.close();
    if (action === 'files') $('file-input').click();
  });
  $('sheet-url-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const url = $('sheet-url-input').value;
    sheet.close();
    $('sheet-url-input').value = '';
    importUrl(url);
  });
  $('save-top').addEventListener('click', saveToDevice);

  // 桌機版是各面板內部捲動，手機版是整頁捲動，兩者都要處理
  const scrollers = [window, ...document.querySelectorAll('.panel')];
  const scrollTopOf = (el) => (el === window ? window.scrollY : el.scrollTop);
  function syncBackToTop() {
    $('back-to-top').hidden = !scrollers.some((el) => scrollTopOf(el) > 300);
  }
  scrollers.forEach((el) => el.addEventListener('scroll', syncBackToTop, { passive: true }));
  $('back-to-top').addEventListener('click', () => {
    const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scrollers.forEach((el) => el.scrollTo({ top: 0, behavior: smooth }));
  });

  /* ---------- 啟動 ---------- */

  initUiControls();
  refreshTexts();
  fillForm(null);
  // 確保 canvas 繪字前字型已載入
  Promise.all([document.fonts.load('700 20px Saira'), document.fonts.load('400 20px Saira')])
    .then(() => renderPreview()).catch(() => {});
})();
