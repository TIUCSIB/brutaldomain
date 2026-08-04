"use client";

import { useMemo, useState } from "react";

import type { Subdomain } from "@/features/domains/types";
import { copyText } from "@/lib/clipboard";

export function useDomainSelection(
  filteredDomains: readonly Subdomain[],
  visibleDomains: readonly Subdomain[],
) {
  const [rawSelectedIds, setRawSelectedIds] = useState<Set<number>>(
    () => new Set(),
  );

  const validIds = useMemo(
    () => new Set(filteredDomains.map((domain) => domain.id)),
    [filteredDomains],
  );

  const selectedIds = useMemo(() => {
    if (rawSelectedIds.size === 0) return rawSelectedIds;
    let changed = false;
    const next = new Set<number>();
    for (const id of rawSelectedIds) {
      if (validIds.has(id)) next.add(id);
      else changed = true;
    }
    return changed ? next : rawSelectedIds;
  }, [rawSelectedIds, validIds]);

  function toggleSelect(id: number) {
    setRawSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setRawSelectedIds((current) => {
      const effective = new Set(
        [...current].filter((id) => validIds.has(id)),
      );
      const allSelected =
        visibleDomains.length > 0 &&
        visibleDomains.every((domain) => effective.has(domain.id));
      const next = new Set(effective);
      if (allSelected) {
        for (const domain of visibleDomains) next.delete(domain.id);
      } else {
        for (const domain of visibleDomains) next.add(domain.id);
      }
      return next;
    });
  }

  async function copySelectedNames(): Promise<
    { ok: true; count: number } | { ok: false; reason: "empty" | "failed" }
  > {
    const names = filteredDomains
      .filter((domain) => selectedIds.has(domain.id))
      .map((domain) => domain.full_domain);
    if (names.length === 0) return { ok: false, reason: "empty" };
    const ok = await copyText(names.join("\n"));
    return ok
      ? { ok: true, count: names.length }
      : { ok: false, reason: "failed" };
  }

  return {
    selectedIds,
    toggleSelect,
    toggleSelectAllVisible,
    copySelectedNames,
  };
}
