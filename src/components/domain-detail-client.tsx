"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { ActivityTimeline } from "@/components/activity-timeline";
import { AppShell } from "@/components/app-shell";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import {
  DomainDetailHeader,
  DomainOverviewSection,
} from "@/components/domain-detail-sections";
import { LoadingState, NotFoundState } from "@/components/domain-detail-primitives";
import { DnsRecords } from "@/components/dns-records";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { getErrorMessage } from "@/features/domains/utils";

interface DomainDetailClientProps {
  id: string;
}

export function DomainDetailClient({ id }: DomainDetailClientProps) {
  const router = useRouter();
  const {
    activities,
    createDnsRecord,
    deleteDnsRecord,
    deleteDomain,
    error,
    features,
    getDnsRecords,
    getDomain,
    hasDomainDetailCache,
    hydrated,
    initialized,
    isDomainDetailLoading,
    refreshDomain,
    refreshDomainDetail,
    renewDomain,
    updateDnsRecord,
  } = useDomainStore();
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const dangerInputRef = useRef<HTMLInputElement>(null);
  const domain = getDomain(id);
  const hasCachedDetail = hasDomainDetailCache(id);
  const detailLoading = isDomainDetailLoading(id);

  useEffect(() => {
    void refreshDomainDetail(id);
  }, [id, refreshDomainDetail]);

  const dnsRecords = useMemo(
    () => (domain ? getDnsRecords(domain.id) : []),
    [domain, getDnsRecords],
  );
  const domainActivities = useMemo(
    () =>
      domain
        ? activities.filter((entry) => entry.domain_id === domain.id)
        : [],
    [activities, domain],
  );

  if (
    !hydrated ||
    (!initialized && !domain) ||
    (detailLoading && !domain && !hasCachedDetail)
  ) {
    return <LoadingState />;
  }

  if (!domain) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-[1280px] space-y-4">
          <ConfigErrorBanner error={error} />
          <NotFoundState id={id} />
        </div>
      </AppShell>
    );
  }

  const currentDomain = domain;

  async function handleRenew() {
    setBusyAction("renew");
    try {
      const renewed = await renewDomain(currentDomain.id);
      toast.success("续期成功", {
        description: `New expiry: ${renewed.expires_at}`,
      });
    } catch (caught) {
      toast.error("续期失败", {
        description: getErrorMessage(caught),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRefresh() {
    setBusyAction("refresh");
    try {
      if (features.domainRefresh) await refreshDomain(currentDomain.id);
      else await refreshDomainDetail(currentDomain.id, { force: true });
      toast.success("状态已刷新", {
        description: currentDomain.full_domain,
      });
    } catch (caught) {
      toast.error("刷新失败", {
        description: getErrorMessage(caught),
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function copyDomain() {
    try {
      await navigator.clipboard.writeText(currentDomain.full_domain);
      toast.success("已复制域名");
    } catch {
      toast.error("复制失败");
    }
  }

  function focusDangerZone() {
    dangerInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    dangerInputRef.current?.focus({ preventScroll: true });
  }

  async function handleDelete() {
    if (deleteConfirmation !== currentDomain.full_domain) return;
    setBusyAction("delete");
    try {
      await deleteDomain(currentDomain.id);
      toast.success("域名已删除", {
        description: currentDomain.full_domain,
      });
      router.push("/domains");
    } catch (caught) {
      toast.error("删除失败", {
        description: getErrorMessage(caught),
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1280px] space-y-4">
        <ConfigErrorBanner error={error} />
        <DomainDetailHeader
          busyAction={busyAction}
          domain={currentDomain}
          features={features}
          onCopy={copyDomain}
          onFocusDanger={focusDangerZone}
          onRefresh={handleRefresh}
          onRenew={handleRenew}
        />

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="dns">
              DNS
              <span className="border border-current px-1 text-[10px] font-black">
                {dnsRecords.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="activity">
              动态
              <span className="border border-current px-1 text-[10px] font-black">
                {domainActivities.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DomainOverviewSection
              busyAction={busyAction}
              deleteConfirmation={deleteConfirmation}
              domain={currentDomain}
              features={features}
              inputRef={dangerInputRef}
              onDelete={handleDelete}
              onDeleteConfirmationChange={setDeleteConfirmation}
            />
          </TabsContent>

          <TabsContent value="dns">
            <DnsRecords
              domainId={currentDomain.id}
              zoneDomain={currentDomain.full_domain}
              records={dnsRecords}
              canWrite={features.dnsWrite}
              proxyEditing={features.proxyEditing}
              createRecord={createDnsRecord}
              updateRecord={updateDnsRecord}
              deleteRecord={deleteDnsRecord}
            />
          </TabsContent>

          <TabsContent value="activity">
            <ActivityTimeline
              activities={domainActivities}
              emptyTitle="暂无动态"
              emptyDescription="本会话内对该域名的添加、续期、DNS 变更会记录在此（本地审计）。"
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
