import {
  DNS_RECORD_TYPES,
  type AddDomainInput,
  type CreateDnsRecordInput,
  type UpdateDnsRecordInput,
} from "@/features/domains/types";
import type { DnsheCreateKeyBody } from "@/lib/dnshe/types";

const ROOT_DOMAIN_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const SUBDOMAIN_PATTERN =
  /^(?=.{1,190}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))*$/i;
const DNS_NAME_PATTERN =
  /^(?:@|\*|\*\.(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*|(?!-)[a-z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-z0-9-]{1,63}(?<!-))*)$/i;
const WHOIS_DOMAIN_PATTERN = ROOT_DOMAIN_PATTERN;
const DNS_RECORD_TYPE_SET = new Set<string>(DNS_RECORD_TYPES);
const TTL_MIN = 60;
const TTL_MAX = 86400;
const PRIORITY_MIN = 0;
const PRIORITY_MAX = 65535;

function isRecordType(value: unknown): value is CreateDnsRecordInput["type"] {
  return typeof value === "string" && DNS_RECORD_TYPE_SET.has(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function pushTtlError(errors: string[], value: number | undefined) {
  if (typeof value !== "number") return;
  if (!Number.isInteger(value) || value < TTL_MIN || value > TTL_MAX) {
    errors.push(`TTL 必须是 ${TTL_MIN}-${TTL_MAX} 的整数`);
  }
}

function pushPriorityError(errors: string[], value: number | undefined | null) {
  if (value === null || typeof value === "undefined") return;
  if (!Number.isInteger(value) || value < PRIORITY_MIN || value > PRIORITY_MAX) {
    errors.push(`Priority 必须是 ${PRIORITY_MIN}-${PRIORITY_MAX} 的整数`);
  }
}

export function validateWhoisDomain(value: string): string[] {
  const domain = value.trim().toLowerCase();
  const errors: string[] = [];
  if (!domain) {
    errors.push("domain is required");
  } else if (!WHOIS_DOMAIN_PATTERN.test(domain)) {
    errors.push("域名格式无效");
  }
  return errors;
}

export function validateAddDomainInput(input: unknown): {
  errors: string[];
  value: AddDomainInput;
} {
  const body = isPlainObject(input) ? input : {};
  const value = {
    subdomain: readString(body.subdomain).toLowerCase(),
    rootdomain: readString(body.rootdomain).toLowerCase(),
  };
  const errors: string[] = [];

  if (!value.subdomain) {
    errors.push("subdomain is required");
  } else if (!SUBDOMAIN_PATTERN.test(value.subdomain)) {
    errors.push("子域名前缀格式无效");
  }

  if (!value.rootdomain) {
    errors.push("rootdomain is required");
  } else if (!ROOT_DOMAIN_PATTERN.test(value.rootdomain)) {
    errors.push("根域名格式无效");
  }

  return { errors, value };
}

export function validateCreateDnsRecordInput(input: unknown): {
  errors: string[];
  value: CreateDnsRecordInput;
} {
  const body = isPlainObject(input) ? input : {};
  const value: CreateDnsRecordInput = {
    type: isRecordType(body.type) ? body.type : "A",
    name: readString(body.name),
    content: readString(body.content),
    ttl: readOptionalNumber(body.ttl),
    proxied: typeof body.proxied === "boolean" ? body.proxied : undefined,
    priority: readOptionalNumber(body.priority),
  };
  const errors: string[] = [];

  if (!isRecordType(body.type)) {
    errors.push("DNS 记录类型无效");
  }
  if (!value.name) {
    errors.push("记录名不能为空");
  } else if (value.name.length > 255 || !DNS_NAME_PATTERN.test(value.name)) {
    errors.push("记录名格式无效");
  }
  if (!value.content) {
    errors.push("记录值不能为空");
  } else if (value.content.length > 2048) {
    errors.push("记录值过长");
  }

  pushTtlError(errors, value.ttl);
  pushPriorityError(errors, value.priority);

  if (value.type === "MX" && typeof value.priority !== "number") {
    errors.push("MX 记录必须填写 priority");
  }

  return { errors, value };
}

export function validateUpdateDnsRecordInput(input: unknown): {
  errors: string[];
  value: UpdateDnsRecordInput;
} {
  const body = isPlainObject(input) ? input : {};
  const value: UpdateDnsRecordInput = {
    type: isRecordType(body.type) ? body.type : undefined,
    name: readOptionalString(body.name),
    content: readOptionalString(body.content),
    ttl: readOptionalNumber(body.ttl),
    priority:
      body.priority === null
        ? null
        : readOptionalNumber(body.priority),
  };
  const errors: string[] = [];

  const touchedFields = Object.values(value).filter(
    (item) => typeof item !== "undefined",
  ).length;
  if (touchedFields === 0) {
    errors.push("至少提交一个可更新字段");
  }

  if (typeof body.type !== "undefined" && !isRecordType(body.type)) {
    errors.push("DNS 记录类型无效");
  }
  if (typeof value.name === "string") {
    if (!value.name) {
      errors.push("记录名不能为空");
    } else if (value.name.length > 255 || !DNS_NAME_PATTERN.test(value.name)) {
      errors.push("记录名格式无效");
    }
  }
  if (typeof value.content === "string") {
    if (!value.content) {
      errors.push("记录值不能为空");
    } else if (value.content.length > 2048) {
      errors.push("记录值过长");
    }
  }

  pushTtlError(errors, value.ttl);
  pushPriorityError(errors, value.priority);

  return { errors, value };
}

export function validateCreateKeyInput(input: unknown): {
  errors: string[];
  value: DnsheCreateKeyBody;
} {
  const body = isPlainObject(input) ? input : {};
  const value: DnsheCreateKeyBody = {
    key_name: readString(body.key_name),
    ip_whitelist: readOptionalString(body.ip_whitelist),
  };
  const errors: string[] = [];

  if (!value.key_name) {
    errors.push("key_name is required");
  } else if (value.key_name.length > 100) {
    errors.push("key_name 不能超过 100 个字符");
  }

  if (
    typeof value.ip_whitelist === "string" &&
    value.ip_whitelist.length > 1000
  ) {
    errors.push("ip_whitelist 不能超过 1000 个字符");
  }

  return { errors, value };
}
