import "server-only";

import {
  readNotifyFromEmail,
  readResendApiKey,
} from "@/lib/env/notify-env";

export interface EmailSendResult {
  ok: boolean;
  skipped?: boolean;
  message?: string;
  id?: string;
}

export async function sendEmailMessage(input: {
  to: string;
  subject: string;
  text: string;
  dryRun?: boolean;
}): Promise<EmailSendResult> {
  const to = input.to.trim();
  if (!to) {
    return { ok: false, message: "缺少收件邮箱" };
  }

  const apiKey = readResendApiKey();
  if (!apiKey) {
    return {
      ok: false,
      message: "服务端未配置 RESEND_API_KEY",
    };
  }

  const from = readNotifyFromEmail() ?? "BrutalDomain <onboarding@resend.dev>";

  if (input.dryRun) {
    return {
      ok: true,
      skipped: true,
      message: `dry-run：将发送到 ${to}（from ${from}）`,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: input.subject,
      text: input.text,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
    message?: string;
    name?: string;
  } | null;

  if (!response.ok) {
    return {
      ok: false,
      message:
        payload?.message ||
        payload?.name ||
        `Resend API 失败（HTTP ${response.status}）`,
    };
  }

  return {
    ok: true,
    id: payload?.id,
    message: "Email 已发送",
  };
}
