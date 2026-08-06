import type { ServerRenewPrefs } from "@/features/settings/server-renew-prefs";

export interface RenewPreviewResponse {
  ok?: boolean;
  message?: string;
  scanned?: number;
  candidateCount?: number;
  source?: string;
  items?: Array<{
    fullDomain: string;
    outcome: string;
    errorMessage?: string;
    remainingDays?: number;
  }>;
}

export interface RenewTestNotificationResponse {
  ok?: boolean;
  message?: string;
  source?: string;
  channels?: Array<{
    channel: "email" | "telegram";
    ok: boolean;
    message?: string;
  }>;
}

export function buildRenewDraftRequest(serverDraft: ServerRenewPrefs) {
  return {
    useDraft: true,
    draft: {
      autoRenewEnabled: serverDraft.autoRenewEnabled,
      autoRenewDays: 180,
      autoRenewRegisteredOnly: serverDraft.autoRenewRegisteredOnly,
      notifyOnSuccess: serverDraft.notifyOnSuccess,
      channelEmail: serverDraft.channelEmail,
      channelTelegram: serverDraft.channelTelegram,
      email: serverDraft.email,
      telegramChatId: serverDraft.telegramChatId,
      telegramHint: serverDraft.telegramHint,
      consentAt: serverDraft.consentAt,
    },
  };
}
