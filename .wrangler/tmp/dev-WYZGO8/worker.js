var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/worker.js
var MAX_BYTES = 300 * 1024 * 1024;
var MEDIA_TYPE = /^(image|video)\//i;
var MEDIA_EXT = /\.(jpe?g|png|webp|gif|avif|bmp|svg|heic|heif|tiff?|dng|nef|cr2|cr3|arw|raf|orf|rw2|mp4|m4v|mov|webm|mkv|avi|wmv|flv|mpg|mpeg|ts|3gp)$/i;
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/fetch") return proxyMedia(request, url);
    return env.ASSETS.fetch(request);
  }
};
function error(status, code) {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}
__name(error, "error");
async function proxyMedia(request, url) {
  if (request.method !== "GET") return error(405, "method");
  const site = request.headers.get("sec-fetch-site");
  const origin = request.headers.get("origin");
  if (site && site !== "same-origin" || origin && origin !== url.origin) return error(403, "forbidden");
  let target;
  try {
    target = new URL(url.searchParams.get("url") || "");
  } catch {
    return error(400, "invalid_url");
  }
  if (!/^https?:$/.test(target.protocol) || target.username || target.password) return error(400, "invalid_url");
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(target.hostname) || target.hostname === url.hostname) {
    return error(400, "invalid_url");
  }
  let upstream;
  try {
    upstream = await fetch(target.href, {
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; LumarkFetcher/1.0)", accept: "image/*,video/*,*/*;q=0.5" },
      cf: { cacheTtl: 300 }
    });
  } catch {
    return error(502, "fetch_failed");
  }
  if (!upstream.ok || !upstream.body) return error(502, "fetch_failed");
  const type = (upstream.headers.get("content-type") || "").split(";")[0].trim();
  const looksLikeMedia = MEDIA_TYPE.test(type) || (type === "application/octet-stream" || type === "binary/octet-stream" || !type) && MEDIA_EXT.test(new URL(upstream.url).pathname);
  if (!looksLikeMedia) return error(415, "not_media");
  const length = Number(upstream.headers.get("content-length")) || 0;
  if (length > MAX_BYTES) return error(413, "too_large");
  let sent = 0;
  const limiter = new TransformStream({
    transform(chunk, controller) {
      sent += chunk.byteLength;
      if (sent > MAX_BYTES) controller.error(new Error("too_large"));
      else controller.enqueue(chunk);
    }
  });
  const headers = new Headers({
    "content-type": type || "application/octet-stream",
    "cache-control": "private, max-age=300",
    "x-content-type-options": "nosniff",
    "x-final-url": upstream.url
  });
  if (length) headers.set("content-length", String(length));
  const disposition = upstream.headers.get("content-disposition");
  if (disposition) headers.set("content-disposition", disposition);
  return new Response(upstream.body.pipeThrough(limiter), { status: 200, headers });
}
__name(proxyMedia, "proxyMedia");

// ../../../Downloads/EXIFframe_maker-main/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../Downloads/EXIFframe_maker-main/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error2 = reduceError(e);
    const body = JSON.stringify(error2);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-7nmKCg/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../Downloads/EXIFframe_maker-main/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-7nmKCg/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
