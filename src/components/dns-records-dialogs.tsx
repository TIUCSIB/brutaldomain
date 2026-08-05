'use client'

import type { FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buildDnsRecordFqdn, contentPlaceholderForType, describeDnsRecordTarget } from '@/features/domains/dns-record-name'
import { DNS_RECORD_TYPES, type DnsRecord, type DnsRecordType } from '@/features/domains/types'

export type RecordForm = {
  type: DnsRecordType
  name: string
  content: string
  ttl: string
  proxied: boolean
  priority: string
}

export const emptyForm: RecordForm = {
  type: 'A',
  name: '@',
  content: '',
  ttl: '3600',
  proxied: false,
  priority: '',
}

export function formFromRecord(record: DnsRecord): RecordForm {
  return {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: String(record.ttl),
    proxied: record.proxied,
    priority: record.priority === undefined ? '' : String(record.priority),
  }
}

const TTL_PRESETS = [
  { label: '1 分', value: '60' },
  { label: '5 分', value: '300' },
  { label: '1 时', value: '3600' },
  { label: '1 天', value: '86400' },
] as const

interface RecordEditorDialogProps {
  editingRecord: DnsRecord | null
  form: RecordForm
  formError?: string | null
  onChange: (form: RecordForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  open: boolean
  proxyEditing: boolean
  submitting: boolean
  /** Zone apex, e.g. biscuit.ccwu.cc — used for Cloudflare-style name preview. */
  zoneDomain: string
}

export function RecordEditorDialog({
  editingRecord,
  form,
  formError = null,
  onChange,
  onOpenChange,
  onSubmit,
  open,
  proxyEditing,
  submitting,
  zoneDomain,
}: RecordEditorDialogProps) {
  const fqdn = buildDnsRecordFqdn(form.name || '@', zoneDomain)
  const target = describeDnsRecordTarget(form.type, form.content)
  const proxyHint = form.proxied ? '并通过 Cloudflare 代理其流量。' : '（仅 DNS，不经 Cloudflare 代理）。'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto rounded-none border-slate-950 bg-white text-slate-950 shadow-[7px_7px_0_0_#0f172a]">
        <DialogHeader>
          <DialogTitle>{editingRecord ? '编辑记录' : '添加记录'}</DialogTitle>
          <DialogDescription>只需填写主机名相对部分（如 www 或 @），完整域名会自动拼接。</DialogDescription>
        </DialogHeader>

        <div className="border-2 border-slate-950 bg-blue-50 px-4 py-3 text-sm font-bold leading-6 text-slate-800 shadow-[3px_3px_0_0_#0f172a]">
          <span className="break-all font-black text-slate-950">{fqdn}</span>
          {' 指向 '}
          <span className="break-all font-black text-[#0b46c4]">{target}</span>
          {proxyHint}
        </div>

        <form id="dns-record-form" onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)]">
            <div className="grid gap-2">
              <Label htmlFor="dns-type" className="font-black">
                类型
              </Label>
              <Select value={form.type} onValueChange={(value: DnsRecordType) => onChange({ ...form, type: value })}>
                <SelectTrigger id="dns-type" className="w-full rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none border-slate-950 bg-white">
                  {DNS_RECORD_TYPES.map((type) => (
                    <SelectItem key={type} value={type} className="rounded-none">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dns-name" className="font-black">
                名称 *
              </Label>
              <div className="flex min-w-0 items-stretch border-2 border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a] focus-within:border-slate-950 focus-within:ring-2 focus-within:ring-[#1261ff] focus-within:ring-offset-2">
                <Input
                  id="dns-name"
                  required
                  value={form.name}
                  onChange={(event) => onChange({ ...form, name: event.target.value })}
                  placeholder="@ 或 www"
                  className="min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <span className="hidden max-w-[45%] shrink-0 items-center truncate border-l-2 border-slate-950 bg-slate-50 px-3 text-xs font-black text-slate-600 sm:inline-flex">
                  .{zoneDomain}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dns-content" className="font-black">
              内容 *
            </Label>
            <Input
              id="dns-content"
              required
              value={form.content}
              onChange={(event) => onChange({ ...form, content: event.target.value })}
              placeholder={contentPlaceholderForType(form.type)}
              className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="dns-ttl" className="font-black">
                TTL（秒）
              </Label>
              <Input
                id="dns-ttl"
                type="number"
                min="1"
                step="1"
                required
                value={form.ttl}
                onChange={(event) => onChange({ ...form, ttl: event.target.value })}
                className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"
              />
              <div className="flex flex-wrap gap-1.5">
                {TTL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={form.ttl === preset.value ? 'default' : 'outline'}
                    className="h-7 rounded-none px-2 text-[11px]"
                    onClick={() => onChange({ ...form, ttl: preset.value })}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dns-priority" className="font-black">
                优先级
              </Label>
              <Input
                id="dns-priority"
                type="number"
                min="0"
                step="1"
                value={form.priority}
                onChange={(event) => onChange({ ...form, priority: event.target.value })}
                placeholder="MX / SRV 可选"
                className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 border-2 border-slate-950 bg-blue-50 p-3 font-black">
            <input type="checkbox" checked={form.proxied} disabled={!proxyEditing} onChange={(event) => onChange({ ...form, proxied: event.target.checked })} className="size-5 accent-[#1261ff]" />
            {proxyEditing ? '开启 Cloudflare 代理' : '代理状态当前只读'}
          </label>

          {formError ? (
            <div role="alert" className="border-2 border-slate-950 bg-[#ffecef] p-3 text-xs font-bold text-slate-950 shadow-[2px_2px_0_0_#0f172a]">
              {formError}
              <span className="mt-1 block text-slate-700">输入已保留，修正后可直接重试。</span>
            </div>
          ) : null}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none border-slate-950 bg-white shadow-[2px_2px_0_0_#0f172a]">
            取消
          </Button>
          <Button type="submit" form="dns-record-form" disabled={submitting} className="rounded-none border-slate-950 bg-[#1261ff] text-white shadow-[2px_2px_0_0_#0f172a]">
            {submitting ?
              '保存中…'
            : formError ?
              editingRecord ?
                '重试保存'
              : '重试添加'
            : editingRecord ?
              '保存更改'
            : '添加记录'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
