/** Mask API keys like `cfsd_500******053e4` (prefix + stars + last 4). */
export function maskApiKey(value: string): string {
  if (!value) return "";
  if (value.length <= 12) {
    return `${value.slice(0, 4)}******${value.slice(-2)}`;
  }

  const prefixEnd = value.indexOf("_");
  const prefix =
    prefixEnd > 0 && prefixEnd <= 8
      ? value.slice(0, Math.min(prefixEnd + 4, 12))
      : value.slice(0, 8);

  return `${prefix}******${value.slice(-4)}`;
}

/** Mask secrets: keep first 4 and last 4 when long enough. */
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "******";
  return `${value.slice(0, 4)}******${value.slice(-4)}`;
}
