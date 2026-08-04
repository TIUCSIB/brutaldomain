import { describe, expect, it } from "vitest";

import { maskApiKey, maskSecret } from "./sensitive-value";

describe("maskApiKey", () => {
  it("masks long dnshe-style keys", () => {
    expect(maskApiKey("cfsd_500ca1e57a5d55e135b63b3b668053e4")).toBe(
      "cfsd_500******53e4",
    );
  });

  it("handles short values", () => {
    expect(maskApiKey("abcd1234")).toBe("abcd******34");
  });
});

describe("maskSecret", () => {
  it("masks secrets with head and tail", () => {
    expect(maskSecret("supersecretvalue99")).toBe("supe******ue99");
  });

  it("fully masks very short secrets", () => {
    expect(maskSecret("short")).toBe("******");
  });
});
