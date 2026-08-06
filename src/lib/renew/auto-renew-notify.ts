import 'server-only'

import type { ServerRenewPrefs } from '@/features/settings/server-renew-prefs'
import { sendEmailMessage } from '@/lib/notify/email'
import { sendTelegramMessage } from '@/lib/notify/telegram'
import type { RunAutoRenewResult } from '@/lib/renew/run-auto-renew'

export type RenewNotificationChannelResult = {
  channel: 'email' | 'telegram'
  ok: boolean
  message?: string
}

async function sendRenewNotificationChannels(input: {
  renewPrefs: Pick<ServerRenewPrefs, 'channelEmail' | 'channelTelegram' | 'email' | 'telegramChatId'>
  subject: string
  text: string
  dryRun?: boolean
}) {
  const channels: RenewNotificationChannelResult[] = []
  if (input.renewPrefs.channelEmail) {
    const result = await sendEmailMessage({
      to: input.renewPrefs.email,
      subject: input.subject,
      text: input.text,
      dryRun: input.dryRun,
    })
    channels.push({ channel: 'email', ok: result.ok, message: result.message })
  }
  if (input.renewPrefs.channelTelegram) {
    const result = await sendTelegramMessage({
      chatId: input.renewPrefs.telegramChatId,
      text: input.text,
      dryRun: input.dryRun,
    })
    channels.push({ channel: 'telegram', ok: result.ok, message: result.message })
  }
  return channels
}

export async function sendAutoRenewSummary(input: {
  renewPrefs: Pick<ServerRenewPrefs, 'channelEmail' | 'channelTelegram' | 'email' | 'telegramChatId'>
  result: RunAutoRenewResult
  dryRun?: boolean
}) {
  const succeeded = input.result.items.filter((item) => item.outcome === 'succeeded')
  if (succeeded.length === 0) {
    return [] as RenewNotificationChannelResult[]
  }

  const text = [
    '✅ DNSHEDomain 自动续费成功',
    '',
    `成功数量：${succeeded.length}`,
    '',
    ...succeeded
      .flatMap((item, index) => [
        `${index + 1}. ${item.fullDomain}`,
        item.newExpiresAt ? `   新到期：${item.newExpiresAt}` : '   新到期：待确认',
        item.chargedAmount ? `   扣费：${item.chargedAmount}` : null,
        '',
      ])
      .filter((line): line is string => Boolean(line)),
    '请登录控制台查看完整执行记录。',
  ].join('\n')

  return sendRenewNotificationChannels({
    renewPrefs: input.renewPrefs,
    subject: `自动续费成功（${succeeded.length}）`,
    text,
    dryRun: input.dryRun,
  })
}

export async function sendAutoRenewTestNotification(input: { renewPrefs: Pick<ServerRenewPrefs, 'channelEmail' | 'channelTelegram' | 'email' | 'telegramChatId'> }) {
  const text = ['🧪 DNSHEDomain 测试通知', '', '这是一条自动续费测试消息。', '如果你收到了，说明当前通知渠道配置可用。', '', '当前测试只验证通知发送，不会触发真实续费。'].join('\n')

  return sendRenewNotificationChannels({
    renewPrefs: input.renewPrefs,
    subject: '自动续费测试通知',
    text,
  })
}
