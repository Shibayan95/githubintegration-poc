import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initAhoy } from "@/lib/ahoy-init";

const mockAhoy = vi.hoisted(() => ({
  configure: vi.fn(),
  track: vi.fn(),
  trackView: vi.fn(),
}));

const mockEnv = vi.hoisted(() => ({
  VITE_APP_ID: "test-app-id" as string | undefined,
  VITE_API_BASE_URL: "https://api.example.com" as string | undefined,
}));

vi.mock("ahoy.js", () => ({ default: mockAhoy }));
vi.mock("@/env/client", () => ({ env: mockEnv }));

describe("initAhoy", () => {
  const savedPushState = history.pushState;
  const savedReplaceState = history.replaceState;
  const savedFetch = window.fetch;
  const savedEventSource = window.EventSource;

  // Track window event listeners added by initAhoy so they can be removed
  // between tests — without this, popstate/pagehide handlers accumulate and
  // fire multiple times in later tests.
  const addedListeners: Array<[string, EventListener]> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.PROD = true;
    mockEnv.VITE_APP_ID = "test-app-id";
    mockEnv.VITE_API_BASE_URL = "https://api.example.com";

    const origAdd = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation(
      (
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (listener) addedListeners.push([type, listener as EventListener]);
        return origAdd(type, listener as EventListener, options);
      },
    );
  });

  afterEach(() => {
    import.meta.env.PROD = false;
    history.pushState = savedPushState;
    history.replaceState = savedReplaceState;
    window.fetch = savedFetch;
    window.EventSource = savedEventSource;
    addedListeners.forEach(([type, listener]) => {
      window.removeEventListener(type, listener);
    });
    addedListeners.length = 0;
    vi.restoreAllMocks();
  });

  // ─── early exit ─────────────────────────────────────────────────────

  describe("early exit conditions", () => {
    it("does not initialize when not in production", async () => {
      import.meta.env.PROD = false;
      await initAhoy();
      expect(mockAhoy.configure).not.toHaveBeenCalled();
    });

    it("does not initialize when VITE_APP_ID is missing", async () => {
      mockEnv.VITE_APP_ID = undefined;
      await initAhoy();
      expect(mockAhoy.configure).not.toHaveBeenCalled();
    });

    it("does not initialize when VITE_API_BASE_URL is missing", async () => {
      mockEnv.VITE_API_BASE_URL = undefined;
      await initAhoy();
      expect(mockAhoy.configure).not.toHaveBeenCalled();
    });
  });

  // ─── ahoy configuration ─────────────────────────────────────────────

  describe("ahoy configuration", () => {
    it("configures ahoy with correct endpoints and app id header", async () => {
      await initAhoy();
      expect(mockAhoy.configure).toHaveBeenCalledWith({
        urlPrefix: "https://api.example.com",
        visitsUrl: "/enterprise/api/v1/agentic_coding/analytics/track",
        eventsUrl: "/enterprise/api/v1/agentic_coding/analytics/track",
        headers: { "X-App-Id": "test-app-id" },
      });
    });

    it("strips trailing slash from apiUrl", async () => {
      mockEnv.VITE_API_BASE_URL = "https://api.example.com/";
      await initAhoy();
      expect(mockAhoy.configure).toHaveBeenCalledWith(
        expect.objectContaining({ urlPrefix: "https://api.example.com" }),
      );
    });

    it("calls trackView on init", async () => {
      await initAhoy();
      expect(mockAhoy.trackView).toHaveBeenCalledTimes(1);
    });
  });

  // ─── history patching ────────────────────────────────────────────────

  describe("history patching", () => {
    it("calls trackView on pushState", async () => {
      await initAhoy();
      history.pushState({}, "", "/new-path");
      expect(mockAhoy.trackView).toHaveBeenCalledTimes(2);
    });

    it("calls trackView on replaceState", async () => {
      await initAhoy();
      history.replaceState({}, "", "/replaced");
      expect(mockAhoy.trackView).toHaveBeenCalledTimes(2);
    });

    it("calls trackView on popstate", async () => {
      await initAhoy();
      vi.clearAllMocks();
      window.dispatchEvent(new PopStateEvent("popstate"));
      expect(mockAhoy.trackView).toHaveBeenCalledTimes(1);
    });
  });

  // ─── fetch interceptor ───────────────────────────────────────────────

  describe("fetch interceptor", () => {
    // Keep a ref to the underlying mock — after initAhoy wraps window.fetch,
    // window.fetch is the wrapper and no longer has vi mock methods on it.
    let underlyingFetch: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      underlyingFetch = vi.fn().mockResolvedValue({ status: 200 } as Response);
      window.fetch = underlyingFetch;
      await initAhoy();
    });

    it("tracks api_performance for backend requests", async () => {
      await window.fetch("https://api.example.com/some/endpoint");
      expect(mockAhoy.track).toHaveBeenCalledWith(
        "api_performance",
        expect.objectContaining({
          url: "https://api.example.com/some/endpoint",
          method: "GET",
          status: 200,
          duration_ms: expect.any(Number),
        }),
      );
    });

    it("does not track third-party requests", async () => {
      await window.fetch("https://cdn.example.com/asset.js");
      expect(mockAhoy.track).not.toHaveBeenCalled();
    });

    it("tracks failed requests with status 0", async () => {
      underlyingFetch.mockRejectedValueOnce(new Error("network error"));
      await expect(
        window.fetch("https://api.example.com/fail"),
      ).rejects.toThrow("network error");
      expect(mockAhoy.track).toHaveBeenCalledWith(
        "api_performance",
        expect.objectContaining({ status: 0, error: "network error" }),
      );
    });

    it("tracks POST method correctly", async () => {
      await window.fetch("https://api.example.com/endpoint", {
        method: "POST",
      });
      expect(mockAhoy.track).toHaveBeenCalledWith(
        "api_performance",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  // ─── page exit ───────────────────────────────────────────────────────

  describe("pagehide listener", () => {
    it("tracks page_exit on pagehide", async () => {
      await initAhoy();
      vi.clearAllMocks();
      window.dispatchEvent(new Event("pagehide"));
      expect(mockAhoy.track).toHaveBeenCalledWith(
        "page_exit",
        expect.objectContaining({
          url: expect.any(String),
          duration_ms: expect.any(Number),
        }),
      );
    });
  });
});
