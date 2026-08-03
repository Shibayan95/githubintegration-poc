import { env } from "@/env/client";

const MAX_SSE_DATA_BYTES = 2048;

interface AhoyInstance {
  configure(options: Record<string, unknown>): void;
  track(name: string, props: Record<string, unknown>): void;
  trackView(): void;
}

function makeSafeTrack(ahoy: AhoyInstance) {
  return function safeTrack(name: string, props: Record<string, unknown>) {
    try {
      ahoy.track(name, props);
    } catch (_) {}
  };
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof Request !== "undefined" && input instanceof Request)
    return input.url;
  return input?.toString ? input.toString() : String(input);
}

function requestMethod(
  input: RequestInfo | URL,
  options?: RequestInit,
): string {
  if (options?.method) return String(options.method).toUpperCase();
  if (typeof Request !== "undefined" && input instanceof Request)
    return input.method.toUpperCase();
  return "GET";
}

function truncateSseData(parsed: unknown, raw: string | null): unknown {
  const size = raw?.length ?? 0;
  if (size <= MAX_SSE_DATA_BYTES) return parsed;
  if (typeof parsed === "string") return parsed.slice(0, MAX_SSE_DATA_BYTES);
  return null;
}

export async function initAhoy() {
  const appId = env.VITE_APP_ID;
  const apiUrl = env.VITE_API_BASE_URL;
  if (!import.meta.env.PROD || !appId || !apiUrl) return;

  const ahoy = (await import("ahoy.js")).default;
  const safeTrack = makeSafeTrack(ahoy);
  const API_BASE = (apiUrl as string).replace(/\/$/, "");

  ahoy.configure({
    urlPrefix: API_BASE,
    visitsUrl: "/enterprise/api/v1/agentic_coding/analytics/track",
    eventsUrl: "/enterprise/api/v1/agentic_coding/analytics/track",
    headers: { "X-App-Id": appId },
  });

  ahoy.trackView();

  const _pushState = history.pushState.bind(history);
  const _replaceState = history.replaceState.bind(history);
  history.pushState = (...args) => {
    _pushState(...args);
    ahoy.trackView();
  };
  history.replaceState = (...args) => {
    _replaceState(...args);
    ahoy.trackView();
  };
  window.addEventListener("popstate", () => ahoy.trackView());

  const originalFetch = window.fetch;
  window.fetch = (input, options) => {
    const urlStr = requestUrl(input);
    if (!urlStr.startsWith(API_BASE)) return originalFetch(input, options);

    const method = requestMethod(input, options);
    const start = performance.now();
    return originalFetch(input, options).then(
      (response) => {
        safeTrack("api_performance", {
          url: urlStr,
          method,
          status: response.status,
          duration_ms: Math.round(performance.now() - start),
        });
        return response;
      },
      (err) => {
        safeTrack("api_performance", {
          url: urlStr,
          method,
          status: 0,
          error: String(err?.message ?? err),
          duration_ms: Math.round(performance.now() - start),
        });
        throw err;
      },
    );
  };

  const OriginalEventSource = window.EventSource;
  if (OriginalEventSource) {
    function PatchedEventSource(url: string | URL, config?: EventSourceInit) {
      const es = new OriginalEventSource(url, config);
      const sseUrl = url?.toString();
      const connectedAt = performance.now();
      let firstEvent = true;

      function trackSse(type: string, e: MessageEvent) {
        const size = e.data?.length ?? 0;
        let parsed: unknown = null;
        if (e.data != null) {
          try {
            parsed = JSON.parse(e.data);
          } catch (_) {
            parsed = e.data;
          }
        }
        safeTrack("sse_event", {
          url: sseUrl,
          event_type: type,
          last_event_id: e.lastEventId || null,
          time_to_first_ms: firstEvent
            ? Math.round(performance.now() - connectedAt)
            : null,
          payload_size: size,
          data: truncateSseData(parsed, e.data),
        });
        firstEvent = false;
      }

      es.addEventListener("message", (e) =>
        trackSse("message", e as MessageEvent),
      );
      es.addEventListener("open", () => {
        safeTrack("sse_open", {
          url: sseUrl,
          duration_ms: Math.round(performance.now() - connectedAt),
        });
      });
      es.addEventListener("error", () => {
        safeTrack("sse_error", {
          url: sseUrl,
          ready_state: es.readyState,
          duration_ms: Math.round(performance.now() - connectedAt),
        });
      });

      const _origAdd = es.addEventListener.bind(es);
      const _origRemove = es.removeEventListener.bind(es);
      const listenerMap = new WeakMap<EventListener, EventListener>();

      type PatchableES = EventSource & {
        addEventListener(
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ): void;
        removeEventListener(
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | EventListenerOptions,
        ): void;
      };
      const patchable = es as PatchableES;

      patchable.addEventListener = (type, listener, options) => {
        if (
          type === "message" ||
          type === "error" ||
          type === "open" ||
          typeof listener !== "function"
        ) {
          return _origAdd(type, listener as EventListener, options);
        }
        const wrapped = (e: Event) => {
          trackSse(type, e as MessageEvent);
          (listener as EventListener)(e);
        };
        listenerMap.set(listener, wrapped);
        return _origAdd(type, wrapped, options);
      };
      patchable.removeEventListener = (type, listener, options) => {
        const wrapped =
          typeof listener === "function"
            ? listenerMap.get(listener)
            : undefined;
        return _origRemove(
          type,
          (wrapped ?? listener) as EventListener,
          options,
        );
      };

      return es;
    }
    PatchedEventSource.prototype = OriginalEventSource.prototype;
    PatchedEventSource.CONNECTING = OriginalEventSource.CONNECTING;
    PatchedEventSource.OPEN = OriginalEventSource.OPEN;
    PatchedEventSource.CLOSED = OriginalEventSource.CLOSED;
    window.EventSource = PatchedEventSource as unknown as typeof EventSource;
  }

  const pageOpenedAt = Date.now();
  window.addEventListener("pagehide", () => {
    safeTrack("page_exit", {
      url: window.location.pathname,
      duration_ms: Date.now() - pageOpenedAt,
    });
  });
}
