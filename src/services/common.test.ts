import { describe, expect, it } from "vitest";
import { hasApiErrors, toApiResponse } from "@/services/common";

describe("hasApiErrors", () => {
  it("returns true when response has non-empty errors array", () => {
    const res = {
      data: null,
      status: 400,
      errors: [{ status: 400, title: "Bad", detail: "Invalid" }],
    };
    expect(hasApiErrors(res)).toBe(true);
  });

  it("returns false for success response or invalid input", () => {
    expect(hasApiErrors({ data: { id: 1 }, status: 200 })).toBe(false);
    expect(hasApiErrors({ status: 200, errors: [] })).toBe(false);
    expect(hasApiErrors(null)).toBe(false);
    expect(hasApiErrors({ errors: "not-array" })).toBe(false);
  });
});

describe("toApiResponse", () => {
  it("normalizes data and status into ApiResponse", () => {
    const res = toApiResponse({ id: 1 }, 200);
    expect(res.data).toEqual({ id: 1 });
    expect(res.status).toBe(200);
  });

  it("uses body.data when present, else uses data as payload", () => {
    expect(toApiResponse({ data: { nested: true } }, 200).data).toEqual({
      nested: true,
    });
    expect(toApiResponse({ id: 1 }, 200).data).toEqual({ id: 1 });
  });

  it("merges errors from third argument or from body", () => {
    const errors = [{ status: 422, title: "Bad", detail: "Failed" }];
    expect(toApiResponse({}, 422, errors).errors).toEqual(errors);
    const body = {
      data: null,
      errors: [{ status: 500, title: "E", detail: "Server" }],
    };
    expect(toApiResponse(body, 500).errors).toHaveLength(1);
    expect(toApiResponse(body, 500).errors?.[0].detail).toBe("Server");
  });
});
