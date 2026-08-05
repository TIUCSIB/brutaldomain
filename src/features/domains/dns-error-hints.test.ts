import { describe, expect, it } from "vitest";

import { getDnsErrorHint } from "@/features/domains/dns-error-hints";
import { ApiRequestError } from "@/lib/api/request-error";

describe("getDnsErrorHint", () => {
  it("maps not found", () => {
    expect(getDnsErrorHint(new ApiRequestError("missing", 404))).toContain(
      "不存在",
    );
  });

  it("maps conflict text", () => {
    expect(getDnsErrorHint(new Error("record already exists"))).toContain(
      "冲突",
    );
  });
});
