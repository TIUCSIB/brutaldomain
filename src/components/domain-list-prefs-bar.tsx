"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { BookmarkPlus, Columns3, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_DOMAIN_COLUMNS,
  DOMAIN_COLUMN_IDS,
  DOMAIN_COLUMN_LABELS,
  DOMAIN_PREFS_EVENT,
  readDomainColumnPrefs,
  readSavedDomainViews,
  removeSavedDomainView,
  upsertSavedDomainView,
  writeDomainColumnPrefs,
  type DomainColumnId,
  type DomainColumnPrefs,
  type SavedDomainView,
} from "@/features/domains/domain-list-prefs";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener(DOMAIN_PREFS_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(DOMAIN_PREFS_EVENT, handler);
  };
}

function getSnapshot() {
  return JSON.stringify({
    columns: readDomainColumnPrefs(),
    views: readSavedDomainViews(),
  });
}

function getServerSnapshot() {
  return JSON.stringify({
    columns: DEFAULT_DOMAIN_COLUMNS,
    views: [] as SavedDomainView[],
  });
}

export function useDomainListPrefs() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const parsed = JSON.parse(raw) as {
      columns: DomainColumnPrefs;
      views: SavedDomainView[];
    };
    return parsed;
  }, [raw]);
}

export function DomainListPrefsBar({
  currentQuery,
  onApplyView,
}: {
  currentQuery: string;
  onApplyView: (query: string) => void;
}) {
  const { columns, views } = useDomainListPrefs();
  const [name, setName] = useState("");
  const [showColumns, setShowColumns] = useState(false);

  function toggleColumn(id: DomainColumnId) {
    writeDomainColumnPrefs({ ...columns, [id]: !columns[id] });
  }

  function saveView() {
    const trimmed = name.trim();
    if (!trimmed) return;
    upsertSavedDomainView({ name: trimmed, query: currentQuery });
    setName("");
  }

  return (
    <div className="flex flex-col gap-2 border-2 border-border bg-secondary-background p-2.5 shadow-shadow">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={showColumns ? "default" : "outline"}
          className="h-8 rounded-none"
          onClick={() => setShowColumns((value) => !value)}
        >
          <Columns3 className="size-3.5" />
          列显示
        </Button>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="保存当前筛选为视图"
            className="h-8 max-w-[14rem] rounded-none text-xs"
            aria-label="视图名称"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 rounded-none"
            disabled={!name.trim()}
            onClick={saveView}
          >
            <BookmarkPlus className="size-3.5" />
            保存视图
          </Button>
        </div>
      </div>

      {showColumns ? (
        <div className="flex flex-wrap gap-2 border-t-2 border-border pt-2">
          {DOMAIN_COLUMN_IDS.map((id) => (
            <label
              key={id}
              className="inline-flex items-center gap-1.5 border-2 border-border bg-main/10 px-2 py-1 text-[11px] font-black"
            >
              <input
                type="checkbox"
                checked={columns[id]}
                onChange={() => toggleColumn(id)}
                className="size-3.5 accent-main"
              />
              {DOMAIN_COLUMN_LABELS[id]}
            </label>
          ))}
        </div>
      ) : null}

      {views.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t-2 border-border pt-2">
          <span className="self-center text-[11px] font-black text-foreground/60">
            已存视图
          </span>
          {views.map((view) => (
            <span key={view.id} className="inline-flex items-center gap-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 rounded-none px-2 text-[11px]"
                onClick={() => onApplyView(view.query)}
              >
                {view.name}
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 rounded-none"
                aria-label={`删除视图 ${view.name}`}
                onClick={() => removeSavedDomainView(view.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
