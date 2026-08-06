import "server-only";

export interface NotifyEnvStatus {
  telegramConfigured: boolean;
  emailConfigured: boolean;
  cronSecretConfigured: boolean;
  defaultEmail: string | null;
  defaultTelegramChatId: string | null;
  fromEmail: string | null;
}

function trim(value: string | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

export function readTelegramBotToken(): string | null {
  return trim(process.env.TELEGRAM_BOT_TOKEN);
}

export function readResendApiKey(): string | null {
  return trim(process.env.RESEND_API_KEY);
}

export function readNotifyFromEmail(): string | null {
  return trim(process.env.NOTIFY_FROM_EMAIL) ?? "BrutalDomain <onboarding@resend.dev>";
}

export function readDefaultNotifyEmail(): string | null {
  return trim(process.env.NOTIFY_EMAIL);
}

export function readDefaultTelegramChatId(): string | null {
  return trim(process.env.TELEGRAM_CHAT_ID);
}

export function readCronSecret(): string | null {
  return trim(process.env.CRON_SECRET);
}

export function getNotifyEnvStatus(): NotifyEnvStatus {
  const fromEmail = readNotifyFromEmail();
  return {
    telegramConfigured: Boolean(readTelegramBotToken()),
    emailConfigured: Boolean(readResendApiKey()),
    cronSecretConfigured: Boolean(readCronSecret()),
    defaultEmail: readDefaultNotifyEmail(),
    defaultTelegramChatId: readDefaultTelegramChatId(),
    fromEmail,
  };
}

export function isCronAuthorized(request: Request): boolean {
  const secret = readCronSecret();
  if (!secret) return false;

  const header =
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    null;
  return header === secret;
}
