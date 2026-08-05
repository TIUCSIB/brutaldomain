import { describe, expect, it } from "vitest";

import {
  applyDnsTemplate,
  DNS_BATCH_TEMPLATES,
  DNS_TEMPLATES,
} from "@/features/domains/dns-templates";

const base = {
  type: "A" as const,
  name: "",
  content: "",
  ttl: "300",
  proxied: true,
  priority: "",
};

describe("DNS templates", () => {
  it("includes dmarc and caa templates", () => {
    const ids = DNS_TEMPLATES.map((item) => item.id);
    expect(ids).toContain("dmarc");
    expect(ids).toContain("caa-letsencrypt");
    expect(ids).toContain("apex-aaaa");
  });

  it("fills www cname and dmarc mailto with zone", () => {
    const www = DNS_TEMPLATES.find((item) => item.id === "www-cname")!;
    const dmarc = DNS_TEMPLATES.find((item) => item.id === "dmarc")!;
    expect(applyDnsTemplate(www, "example.com", base).content).toBe(
      "example.com",
    );
    expect(applyDnsTemplate(dmarc, "example.com", base).content).toContain(
      "dmarc@example.com",
    );
  });

  it("builds google mx batch with five records", () => {
    const batch = DNS_BATCH_TEMPLATES.find(
      (item) => item.id === "google-workspace-mx",
    )!;
    const records = batch.build("example.com");
    expect(records).toHaveLength(5);
    expect(records.every((item) => item.type === "MX")).toBe(true);
    expect(records[0]?.priority).toBe(1);
  });

  it("builds mail basics with zone-specific dmarc", () => {
    const batch = DNS_BATCH_TEMPLATES.find((item) => item.id === "mail-basics")!;
    const records = batch.build("acme.test");
    expect(records).toHaveLength(2);
    expect(records[1]?.content).toContain("dmarc@acme.test");
  });
});
