import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let savedTop: PropertyDescriptor | undefined;

function mockEmbedded(embedded: boolean) {
  savedTop = Object.getOwnPropertyDescriptor(window, "top");
  Object.defineProperty(window, "top", {
    value: embedded ? ({} as Window) : window.self,
    configurable: true,
  });
}

function restoreTop() {
  if (savedTop) {
    Object.defineProperty(window, "top", savedTop);
  } else {
    Object.defineProperty(window, "top", {
      value: window.self,
      configurable: true,
    });
  }
}

describe("auth-bridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    restoreTop();
  });

  describe("isEmbedded", () => {
    it("returns false when not in an iframe", async () => {
      mockEmbedded(false);
      const { isEmbedded } = await import("./auth-bridge");
      expect(isEmbedded()).toBe(false);
    });

    it("returns true when in an iframe", async () => {
      mockEmbedded(true);
      const { isEmbedded } = await import("./auth-bridge");
      expect(isEmbedded()).toBe(true);
    });
  });
});
