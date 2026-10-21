/* 手寫簽名板：選筆刷與顏色，簽完後轉成透明背景的簽名圖片 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // 筆刷：寬度倍率、是否依速度變細（毛筆）、筆頭形狀
  const BRUSHES = {
    pen: { label: 'pen', widthK: 1, speed: false, cap: 'round' },
    marker: { label: 'marker', widthK: 2.2, speed: false, cap: 'round' },
    brush: { label: 'brush', widthK: 2.6, speed: true, cap: 'round' },
  };

  let strokes = [];   // [{ brush, color, size, points: [{x, y, w}] }]（座標為簽名板的比例 0..1）
  let current = null;
  let opts = { brush: 'pen', color: '#111111', size: 4 };
  let resolveOpen = null;
  let canvas, ctx, dpr = 1;

  function init() {
    canvas = $('pad-canvas');
    ctx = canvas.getContext('2d');
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') up(); });
    new ResizeObserver(() => { if ($('sign-pad').open) resize(); }).observe(canvas);

    document.querySelectorAll('[data-pad-brush]').forEach((b) => b.addEventListener('click', () => {
      opts.brush = b.dataset.padBrush; syncUi();
    }));
    document.querySelectorAll('[data-pad-color]').forEach((b) => b.addEventListener('click', () => {
      opts.color = b.dataset.padColor; syncUi();
    }));
    $('pad-color-picker').addEventListener('input', (e) => { opts.color = e.target.value; syncUi(); });
    $('pad-size').addEventListener('input', (e) => { opts.size = Number(e.target.value); syncUi(); });
    $('pad-undo').addEventListener('click', () => { strokes.pop(); redraw(); syncUi(); });
    $('pad-clear').addEventListener('click', () => { strokes = []; redraw(); syncUi(); });
    $('pad-cancel').addEventListener('click', () => close(null));
    $('pad-done').addEventListener('click', () => close(strokes.length ? exportImage() : null));
    $('sign-pad').addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
  }

  function syncUi() {
    document.querySelectorAll('[data-pad-brush]').forEach((b) => b.classList.toggle('active', b.dataset.padBrush === opts.brush));
    document.querySelectorAll('[data-pad-color]').forEach((b) => b.classList.toggle('active', b.dataset.padColor === opts.color));
    $('pad-size').value = opts.size;
    $('pad-size-val').textContent = opts.size;
    if (/^#/.test(opts.color)) $('pad-color-picker').value = opts.color;
    // 淺色墨水時改用深色底，才看得到
    $('pad-surface').classList.toggle('dark', !Frame.isDark(opts.color));
    $('pad-undo').disabled = !strokes.length;
    $('pad-clear').disabled = !strokes.length;
    $('pad-done').disabled = !strokes.length;
    $('pad-placeholder').hidden = strokes.length > 0 || !!current;
  }

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(3, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    redraw();
  }

  /* ---------- 繪製 ---------- */

  function point(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, t: e.timeStamp, p: e.pressure };
  }

  function widthFor(stroke, pt, prev) {
    const b = BRUSHES[stroke.brush];
    let w = stroke.size * b.widthK;
    // 觸控筆有壓力感應時依壓力調整（滑鼠固定為 0.5）
    if (pt.p && pt.p !== 0.5) w *= 0.4 + pt.p * 1.2;
    if (b.speed && prev) {
      const r = canvas.getBoundingClientRect();
      const dist = Math.hypot((pt.x - prev.x) * r.width, (pt.y - prev.y) * r.height);
      const v = dist / Math.max(1, pt.t - prev.t); // px/ms
      const k = Math.max(0.25, Math.min(1.15, 1.15 - v * 0.45));
      w = prev.w ? prev.w * 0.6 + w * k * 0.4 : w * k; // 平滑變化
    }
    return w;
  }

  function down(e) {
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 部分裝置不支援 */ }
    const pt = point(e);
    current = { brush: opts.brush, color: opts.color, size: opts.size, points: [] };
    pt.w = widthFor(current, pt, null);
    current.points.push(pt);
    strokes.push(current);
    syncUi();
    redraw();
  }

  function move(e) {
    if (!current) return;
    e.preventDefault();
    let evts = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    if (!evts.length) evts = [e];
    for (const ce of evts) {
      const pt = point(ce);
      const prev = current.points[current.points.length - 1];
      pt.w = widthFor(current, pt, prev);
      current.points.push(pt);
    }
    redraw();
  }

  function up() {
    if (!current) return;
    current = null;
    syncUi();
  }

  // 用每段中點做二次曲線，筆跡比較平滑；寬度逐段變化（毛筆效果）
  function drawStroke(c, s, W, H, scale) {
    const pts = s.points;
    c.strokeStyle = s.color;
    c.fillStyle = s.color;
    c.lineCap = BRUSHES[s.brush].cap;
    c.lineJoin = 'round';
    if (pts.length === 1) {
      c.beginPath();
      c.arc(pts[0].x * W, pts[0].y * H, (pts[0].w * scale) / 2, 0, Math.PI * 2);
      c.fill();
      return;
    }
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const m0 = i === 1 ? p0 : { x: (pts[i - 2].x + p0.x) / 2, y: (pts[i - 2].y + p0.y) / 2 };
      const m1 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      c.lineWidth = ((p0.w + p1.w) / 2) * scale;
      c.beginPath();
      c.moveTo(m0.x * W, m0.y * H);
      c.quadraticCurveTo(p0.x * W, p0.y * H, m1.x * W, m1.y * H);
      c.stroke();
    }
    const last = pts[pts.length - 1], before = pts[pts.length - 2];
    c.lineWidth = last.w * scale;
    c.beginPath();
    c.moveTo(((before.x + last.x) / 2) * W, ((before.y + last.y) / 2) * H);
    c.lineTo(last.x * W, last.y * H);
    c.stroke();
  }

  function redraw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((s) => drawStroke(ctx, s, canvas.width, canvas.height, dpr));
  }

  /** 以 3 倍解析度輸出透明背景的簽名，並裁掉多餘空白 */
  function render(data) {
    const k = 3;
    const out = document.createElement('canvas');
    out.width = Math.round(data.w * k);
    out.height = Math.round(data.h * k);
    const c = out.getContext('2d');
    data.strokes.forEach((s) => drawStroke(c, s, out.width, out.height, k));
    return Frame.trimTransparent(out);
  }

  function exportImage() {
    const r = canvas.getBoundingClientRect();
    const data = { strokes: JSON.parse(JSON.stringify(strokes)), w: Math.round(r.width), h: Math.round(r.height) };
    return { canvas: render(data), data };
  }

  /* ---------- 開啟 / 關閉 ---------- */

  function open(previous) {
    if (!canvas) init();
    strokes = previous && previous.strokes && previous.strokes.length ? JSON.parse(JSON.stringify(previous.strokes)) : [];
    if (strokes.length) opts.color = strokes[strokes.length - 1].color;
    const dlg = $('sign-pad');
    dlg.showModal();
    requestAnimationFrame(() => { resize(); syncUi(); });
    return new Promise((resolve) => { resolveOpen = resolve; });
  }

  function close(result) {
    $('sign-pad').close();
    current = null;
    if (resolveOpen) { resolveOpen(result); resolveOpen = null; }
  }

  window.SignPad = { open, render };
})();
