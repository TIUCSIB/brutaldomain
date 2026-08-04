import { describe, expect, it } from "vitest";

import { AUTH_UNAUTHORIZED_MESSAGE } from "@/lib/auth/constants";

import {
  ApiRequestError,
  classifyByStatus,
  classifyError,
  errorTitle,
} from "./request-error";

describe("classifyByStatus", () => {
  it("detects config errors", () => {
    expect(
      classifyByStatus(
        503,
        "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET.",
      ),
    ).toBe("config");
  });

  it("detects unauthorized", () => {
    expect(classifyByStatus(401, AUTH_UNAUTHORIZED_MESSAGE)).toBe(
      "unauthorized",
    );
  });

  it("detects rate limits", () => {
    expect(classifyByStatus(429, "Too many requests")).toBe("rate_limit");
  });
});

describe("classifyError", () => {
  it("reads ApiRequestError kind", () => {
    const error = new ApiRequestError("nope", 403, "forbidden");
    expect(classifyError(error)).toMatchObject({
      kind: "forbidden",
      message: "nope",
      status: 403,
    });
  });
});

describe("errorTitle", () => {
  it("returns chinese titles", () => {
    expect(errorTitle("unauthorized")).toBe("登录已过期");
    expect(errorTitle("config")).toBe("DNSHE 未配置");
  });
});
