import { describe, expect, it } from "vitest";
import { routes } from "@/components/layout";

describe("layout routes", () => {
  it("exposes the Dashboard route pointing at /", () => {
    expect(routes.some((r) => r.title === "Dashboard" && r.url === "/")).toBe(
      true,
    );
  });
});
