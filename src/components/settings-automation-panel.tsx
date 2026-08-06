'use client'

import { useEffect, useRef, useState } from 'react'
import { Save } from 'lucide-react'

import { SettingsRenewSection } from '@/components/settings-renew-section'
import { SettingsRenewEnableDialog } from '@/components/settings-renew-enable-dialog'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { normalizeServerRenewPrefs, validateServerRenewPrefs, type ServerRenewPrefs } from '@/features/settings/server-renew-prefs'
import { useServerRenewPrefs } from '@/features/settings/use-server-renew-prefs'

export function SettingsAutomationPanel() {
  const { prefs: renewPrefs, status: renewStatus, storage: renewStorage, loading: renewLoading, loaded: renewLoaded, save: saveRenew, refresh: refreshRenew } = useServerRenewPrefs()

  const [renewDraft, setRenewDraft] = useState<Partial<ServerRenewPrefs>>({})
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingSave, setPendingSave] = useState<(() => Promise<void>) | null>(null)
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    void refreshRenew()
  }, [refreshRenew])

  const renewView = normalizeServerRenewPrefs({
    ...renewPrefs,
    ...renewDraft,
  })

  function patchRenew(partial: Partial<ServerRenewPrefs>) {
    setRenewDraft((current) => ({ ...current, ...partial }))
  }

  async function persistAll(withConsent: boolean) {
    const nextRenew = normalizeServerRenewPrefs({
      ...renewView,
      autoRenewDays: 180,
      consentAt:
        renewView.autoRenewEnabled && withConsent ? (renewView.consentAt ?? new Date().toISOString())
        : renewView.autoRenewEnabled ? renewView.consentAt
        : null,
    })

    const renewErrors = validateServerRenewPrefs(nextRenew)
    if (renewErrors.length > 0) {
      toast.error('无法保存自动续费配置', {
        description: renewErrors[0],
      })
      return
    }

    setSaving(true)
    try {
      const renewSaved = await saveRenew(nextRenew)
      setRenewDraft({})

      const whereRenew =
        renewSaved.persistedToBlob ? 'Vercel Blob'
        : renewSaved.persistedToDisk ? '本地 .data/'
        : renewSaved.backend === 'memory' ? '仅内存'
        : renewSaved.backend
      toast.success('已保存', {
        description: renewSaved.warning || `自动续费 → ${whereRenew}`,
      })
    } catch (error) {
      toast.error('保存失败', {
        description: error instanceof Error ? error.message : '未知错误',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (renewView.autoRenewEnabled && !renewPrefs.consentAt && !renewView.consentAt) {
      setPendingSave(() => async () => {
        await persistAll(true)
      })
      setConfirmOpen(true)
      return
    }
    await persistAll(Boolean(renewView.consentAt || renewPrefs.consentAt))
  }

  return (
    <>
      <div className="space-y-4">
        <SettingsRenewSection serverDraft={renewView} onServerPatch={patchRenew} status={renewStatus} storage={renewStorage} serverLoading={renewLoading && !renewLoaded} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" size="sm" disabled={saving || (renewLoading && !renewLoaded)} onClick={() => void handleSave()}>
            <Save className="size-3.5" />
            {saving ? '保存中…' : '保存设置'}
          </Button>
        </div>
      </div>

      <SettingsRenewEnableDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false)
          const task = pendingSave
          setPendingSave(null)
          if (task) void task()
        }}
      />
    </>
  )
}
