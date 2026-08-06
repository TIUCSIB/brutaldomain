import { describe, expect, it } from "vitest";

import {
  validateAddDomainInput,
  validateCreateDnsRecordInput,
  validateUpdateDnsRecordInput,
  validateWhoisDomain,
} from "@/features/domains/input-validation";

describe("domain input validation", () => {
  it("accepts a valid domain registration payload", () => {
    const result = validateAddDomainInput({
      subdomain: "hello-world",
      rootdomain: "us.kg",
    });

    expect(result.errors).toEqual([]);
    expect(result.value).toEqual({
      subdomain: "hello-world",
      rootdomain: "us.kg",
    });
  });

  it("rejects invalid whois domains", () => {
    expect(validateWhoisDomain("bad domain")[0]).toContain("格式无效");
  });

  it("requires MX priority and valid DNS names", () => {
    const result = validateCreateDnsRecordInput({
      type: "MX",
      name: "@",
      content: "mail.example.com",
    });

    expect(result.errors[0]).toContain("priority");
  });

  it("rejects empty DNS patch payloads", () => {
    const result = validateUpdateDnsRecordInput({});

    expect(result.errors[0]).toContain("至少提交一个可更新字段");
  });
});
