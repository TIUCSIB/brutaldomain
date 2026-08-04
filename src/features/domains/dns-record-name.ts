/**
 * DNS record name helpers (Cloudflare-style relative names).
 * Users type `www` / `@` / `aaa`, not the full FQDN.
 */

export function normalizeDnsRecordName(name: string, zoneDomain: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed === "@") return "@";

  const zone = zoneDomain.replace(/\.$/, "").toLowerCase();
  const value = trimmed.replace(/\.$/, "");
  const lower = value.toLowerCase();

  if (lower === zone) return "@";
  if (lower.endsWith(`.${zone}`)) {
    const relative = value.slice(0, -(zone.length + 1));
    return relative || "@";
  }

  return value;
}

export function buildDnsRecordFqdn(name: string, zoneDomain: string): string {
  const zone = zoneDomain.replace(/\.$/, "");
  const relative = normalizeDnsRecordName(name, zone);
  if (relative === "@") return zone;
  return `${relative}.${zone}`;
}

export function describeDnsRecordTarget(
  type: string,
  content: string,
): string {
  const value = content.trim();
  if (!value) {
    switch (type) {
      case "A":
        return "[IPv4 地址]";
      case "AAAA":
        return "[IPv6 地址]";
      case "CNAME":
        return "[目标主机名]";
      case "MX":
        return "[邮件服务器]";
      case "TXT":
        return "[文本内容]";
      case "NS":
        return "[名称服务器]";
      case "SRV":
        return "[服务目标]";
      default:
        return "[内容]";
    }
  }
  return value;
}

export function contentPlaceholderForType(type: string): string {
  switch (type) {
    case "A":
      return "192.0.2.1";
    case "AAAA":
      return "2001:db8::1";
    case "CNAME":
      return "target.example.com";
    case "MX":
      return "mail.example.com";
    case "TXT":
      return "v=spf1 include:_spf.example.com ~all";
    case "NS":
      return "ns1.example.com";
    case "SRV":
      return "target.example.com";
    default:
      return "记录内容";
  }
}
