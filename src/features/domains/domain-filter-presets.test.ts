import { describe, expect, it } from "vitest";

import {
  DOMAIN_FILTER_PRESETS,
  presetToParamPatch,
} from "@/features/domains/domain-filter-presets";

describe("domain filter presets", () => {
  it("maps within-7 preset to risk query", () => {
    const preset = DOMAIN_FILTER_PRESETS.find((item) => item.id === "within-7")!;
    expect(presetToParamPatch(preset)).toEqual({
      page: null,
      risk: "within-7",
      status: null,
      sort: null,
      q: null,
    });
    expect(
      preset.match({
        expiryRisk: "within-7",
        status: "all",
        sort: "expiry-asc",
        search: "",
      }),
    ).toBe(true);
  });

  it("maps error preset to status only", () => {
    const preset = DOMAIN_FILTER_PRESETS.find((item) => item.id === "error")!;
    expect(presetToParamPatch(preset).status).toBe("Error");
    expect(presetToParamPatch(preset).risk).toBeNull();
  });
});
