/**
 * 光印 Lumark — Cloudflare Worker
 * 靜態網站由 assets 提供；這裡只處理 /api/fetch：
 * 代替瀏覽器下載使用者貼上的相片 / 影片網址（很多網站不允許跨網域讀取）。
 */

const MAX_BYTES = 300 * 1024 * 1024; // 300 MB
const MEDIA_TYPE = /^(image|video)\//i;
const MEDIA_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|svg|heic|heif|tiff?|dng|nef|cr2|cr3|arw|raf|orf|rw2|mp4|m4v|mov|webm|mkv|avi|wmv|flv|mpg|mpeg|ts|3gp)$/i;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/fetch') return proxyMedia(request, url);
    return env.ASSETS.fetch(request);
  },
};

function error(status, code) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function proxyMedia(request, url) {
  if (request.method !== 'GET') return error(405, 'method');

  // 只接受本站頁面發出的請求，避免被當成公開代理
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  if ((site && site !== 'same-origin') || (origin && origin !== url.origin)) return error(403, 'forbidden');

  let target;
  try { target = new URL(url.searchParams.get('url') || ''); } catch { return error(400, 'invalid_url'); }
  if (!/^https?:$/.test(target.protocol) || target.username || target.password) return error(400, 'invalid_url');
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(target.hostname) || target.hostname === url.hostname) {
    return error(400, 'invalid_url');
  }

  let upstream;
  try {
    upstream = await fetch(target.href, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; LumarkFetcher/1.0)', accept: 'image/*,video/*,*/*;q=0.5' },
      cf: { cacheTtl: 300 },
    });
  } catch {
    return error(502, 'fetch_failed');
  }
  if (!upstream.ok || !upstream.body) return error(502, 'fetch_failed');

  const type = (upstream.headers.get('content-type') || '').split(';')[0].trim();
  const looksLikeMedia = MEDIA_TYPE.test(type)
    || ((type === 'application/octet-stream' || type === 'binary/octet-stream' || !type) && MEDIA_EXT.test(new URL(upstream.url).pathname));
  if (!looksLikeMedia) return error(415, 'not_media');

  const length = Number(upstream.headers.get('content-length')) || 0;
  if (length > MAX_BYTES) return error(413, 'too_large');

  // 沒有 Content-Length 時邊傳邊計算，超過上限就中斷
  let sent = 0;
  const limiter = new TransformStream({
    transform(chunk, controller) {
      sent += chunk.byteLength;
      if (sent > MAX_BYTES) controller.error(new Error('too_large'));
      else controller.enqueue(chunk);
    },
  });

  const headers = new Headers({
    'content-type': type || 'application/octet-stream',
    'cache-control': 'private, max-age=300',
    'x-content-type-options': 'nosniff',
    'x-final-url': upstream.url,
  });
  if (length) headers.set('content-length', String(length));
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) headers.set('content-disposition', disposition);
  return new Response(upstream.body.pipeThrough(limiter), { status: 200, headers });
}
