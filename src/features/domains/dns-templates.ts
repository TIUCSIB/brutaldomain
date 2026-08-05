import type { CreateDnsRecordInput, DnsRecordType } from "@/features/domains/types";

export interface DnsTemplateForm {
  type: DnsRecordType;
  name: string;
  content: string;
  ttl: string;
  proxied: boolean;
  priority: string;
}

export interface DnsTemplate {
  id: string;
  label: string;
  description: string;
  form: Partial<DnsTemplateForm> & { type: DnsRecordType; name: string };
}

export interface DnsBatchTemplate {
  id: string;
  label: string;
  description: string;
  build: (zoneDomain: string) => CreateDnsRecordInput[];
}

export const DNS_TEMPLATES: DnsTemplate[] = [
  {
    id: "apex-a",
    label: "根域 A",
    description: "@ → IPv4",
    form: { type: "A", name: "@", content: "", ttl: "3600", proxied: false },
  },
  {
    id: "apex-aaaa",
    label: "根域 AAAA",
    description: "@ → IPv6",
    form: { type: "AAAA", name: "@", content: "", ttl: "3600", proxied: false },
  },
  {
    id: "www-cname",
    label: "www CNAME",
    description: "www → 根域",
    form: {
      type: "CNAME",
      name: "www",
      content: "",
      ttl: "3600",
      proxied: false,
    },
  },
  {
    id: "spf",
    label: "SPF",
    description: "基础防伪邮件",
    form: {
      type: "TXT",
      name: "@",
      content: "v=spf1 include:_spf.google.com ~all",
      ttl: "3600",
      proxied: false,
    },
  },
  {
    id: "dmarc",
    label: "DMARC",
    description: "邮件策略 _dmarc",
    form: {
      type: "TXT",
      name: "_dmarc",
      content: "v=DMARC1; p=none; rua=mailto:dmarc@example.com",
      ttl: "3600",
      proxied: false,
    },
  },
  {
    id: "mx-google",
    label: "Google MX",
    description: "单条主 MX",
    form: {
      type: "MX",
      name: "@",
      content: "aspmx.l.google.com",
      priority: "1",
      ttl: "3600",
      proxied: false,
    },
  },
  {
    id: "caa-letsencrypt",
    label: "CAA LE",
    description: "仅允许 Let's Encrypt",
    form: {
      type: "CAA",
      name: "@",
      content: '0 issue "letsencrypt.org"',
      ttl: "3600",
      proxied: false,
    },
  },
];

export const DNS_BATCH_TEMPLATES: DnsBatchTemplate[] = [
  {
    id: "google-workspace-mx",
    label: "Google MX 全套",
    description: "5 条 Google Workspace MX",
    build: () => [
      {
        type: "MX",
        name: "@",
        content: "aspmx.l.google.com",
        ttl: 3600,
        proxied: false,
        priority: 1,
      },
      {
        type: "MX",
        name: "@",
        content: "alt1.aspmx.l.google.com",
        ttl: 3600,
        proxied: false,
        priority: 5,
      },
      {
        type: "MX",
        name: "@",
        content: "alt2.aspmx.l.google.com",
        ttl: 3600,
        proxied: false,
        priority: 5,
      },
      {
        type: "MX",
        name: "@",
        content: "alt3.aspmx.l.google.com",
        ttl: 3600,
        proxied: false,
        priority: 10,
      },
      {
        type: "MX",
        name: "@",
        content: "alt4.aspmx.l.google.com",
        ttl: 3600,
        proxied: false,
        priority: 10,
      },
    ],
  },
  {
    id: "mail-basics",
    label: "邮件基础",
    description: "SPF + DMARC",
    build: (zoneDomain) => [
      {
        type: "TXT",
        name: "@",
        content: "v=spf1 include:_spf.google.com ~all",
        ttl: 3600,
        proxied: false,
      },
      {
        type: "TXT",
        name: "_dmarc",
        content: `v=DMARC1; p=none; rua=mailto:dmarc@${zoneDomain}`,
        ttl: 3600,
        proxied: false,
      },
    ],
  },
];

export function applyDnsTemplate(
  template: DnsTemplate,
  zoneDomain: string,
  base: DnsTemplateForm,
): DnsTemplateForm {
  const next: DnsTemplateForm = {
    ...base,
    type: template.form.type,
    name: template.form.name,
    content: template.form.content ?? "",
    ttl: template.form.ttl ?? base.ttl,
    proxied: template.form.proxied ?? false,
    priority: template.form.priority ?? "",
  };

  if (template.id === "www-cname" && !next.content) {
    next.content = zoneDomain;
  }

  if (template.id === "dmarc" && next.content.includes("dmarc@example.com")) {
    next.content = `v=DMARC1; p=none; rua=mailto:dmarc@${zoneDomain}`;
  }

  return next;
}
