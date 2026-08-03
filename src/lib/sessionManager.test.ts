import { beforeEach, describe, expect, it } from "vitest";
import {
  generateSessionId,
  getSessionId,
  setSessionId,
  clearSessionId,
  getOrCreateSessionId,
} from "@/lib/sessionManager";

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe("sessionManager", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  // ─── generateSessionId ──────────────────────────────────────────────

  describe("generateSessionId", () => {
    it("returns a string", () => {
      expect(typeof generateSessionId()).toBe("string");
    });

    it("returns unique values on repeated calls", () => {
      const a = generateSessionId();
      const b = generateSessionId();
      expect(a).not.toBe(b);
    });

    it("matches UUID v4 format", () => {
      expect(generateSessionId()).toMatch(UUID_V4_RE);
    });
  });

  // ─── getSessionId ───────────────────────────────────────────────────

  describe("getSessionId", () => {
    it("returns null when no session is stored", () => {
      expect(getSessionId("app-1")).toBeNull();
    });

    it("returns the stored value", () => {
      sessionStorage.setItem("data-app-session-app-1", "my-session");
      expect(getSessionId("app-1")).toBe("my-session");
    });

    it("uses the correct storage key", () => {
      setSessionId("app-42", "sess-xyz");
      expect(sessionStorage.getItem("data-app-session-app-42")).toBe(
        "sess-xyz",
      );
    });
  });

  // ─── setSessionId ───────────────────────────────────────────────────

  describe("setSessionId", () => {
    it("stores value in sessionStorage", () => {
      setSessionId("app-1", "s1");
      expect(sessionStorage.getItem("data-app-session-app-1")).toBe("s1");
    });

    it("stores independent keys per dataAppId", () => {
      setSessionId("app-1", "sess-a");
      setSessionId("app-2", "sess-b");
      expect(getSessionId("app-1")).toBe("sess-a");
      expect(getSessionId("app-2")).toBe("sess-b");
    });
  });

  // ─── clearSessionId ─────────────────────────────────────────────────

  describe("clearSessionId", () => {
    it("removes the stored session", () => {
      setSessionId("app-1", "s1");
      clearSessionId("app-1");
      expect(getSessionId("app-1")).toBeNull();
    });

    it("is a no-op for a non-existent key", () => {
      expect(() => clearSessionId("app-999")).not.toThrow();
    });
  });

  // ─── getOrCreateSessionId ───────────────────────────────────────────

  describe("getOrCreateSessionId", () => {
    it("creates and stores a new ID when none exists", () => {
      const id = getOrCreateSessionId("app-1");
      expect(id).toMatch(UUID_V4_RE);
      expect(getSessionId("app-1")).toBe(id);
    });

    it("returns the existing ID when one is already stored", () => {
      setSessionId("app-1", "pre-existing");
      expect(getOrCreateSessionId("app-1")).toBe("pre-existing");
    });

    it("creates a valid UUID when generating", () => {
      const id = getOrCreateSessionId("app-new");
      expect(id).toMatch(UUID_V4_RE);
    });
  });
});
