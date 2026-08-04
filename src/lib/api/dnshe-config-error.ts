export const DNSHE_NOT_CONFIGURED_MESSAGE =
  "DNSHE is not configured. Set DNSHE_API_KEY and DNSHE_API_SECRET.";

export function isDnsheNotConfiguredMessage(message: string | null | undefined) {
  if (!message) return false;
  return (
    message.includes("DNSHE is not configured") ||
    message.includes("DNSHE API is not configured")
  );
}
