const COLUMN_KEY = "brutaldomain.domain-columns.v1";
const VIEWS_KEY = "brutaldomain.domain-views.v1";
export const DOMAIN_PREFS_EVENT = "brutaldomain-domain-prefs";

export const DOMAIN_COLUMN_IDS = [
  "status",
  "provider",
  "expiry",
  "created",
  "actions",
] as const;

export type DomainColumnId = (typeof DOMAIN_COLUMN_IDS)[number];

export const DOMAIN_COLUMN_LABELS: Record<DomainColumnId, string> = {
  status: "状态",
  provider: "Provider",
  expiry: "到期时间",
  created: "创建时间",
  actions: "操作",
};

export type DomainColumnPrefs = Record<DomainColumnId, boolean>;

export const DEFAULT_DOMAIN_COLUMNS: DomainColumnPrefs = {
  status: true,
  provider: true,
  expiry: true,
  created: true,
  actions: true,
};

export interface SavedDomainView {
  id: string;
  name: string;
  query: string;
  createdAt: number;
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DOMAIN_PREFS_EVENT));
}

export function readDomainColumnPrefs(): DomainColumnPrefs {
  if (typeof window === "undefined") return DEFAULT_DOMAIN_COLUMNS;
  try {
    const raw = window.localStorage.getItem(COLUMN_KEY);
    if (!raw) return DEFAULT_DOMAIN_COLUMNS;
    const parsed = JSON.parse(raw) as Partial<DomainColumnPrefs>;
    return {
      ...DEFAULT_DOMAIN_COLUMNS,
      ...Object.fromEntries(
        DOMAIN_COLUMN_IDS.map((id) => [
          id,
          typeof parsed[id] === "boolean" ? parsed[id]! : DEFAULT_DOMAIN_COLUMNS[id],
        ]),
      ),
    };
  } catch {
    return DEFAULT_DOMAIN_COLUMNS;
  }
}

export function writeDomainColumnPrefs(prefs: DomainColumnPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COLUMN_KEY, JSON.stringify(prefs));
  notify();
}

export function readSavedDomainViews(): SavedDomainView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(VIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SavedDomainView =>
          Boolean(item) &&
          typeof item === "object" &&
          typeof (item as SavedDomainView).id === "string" &&
          typeof (item as SavedDomainView).name === "string" &&
          typeof (item as SavedDomainView).query === "string",
      )
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function writeSavedDomainViews(views: SavedDomainView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(VIEWS_KEY, JSON.stringify(views.slice(0, 12)));
  notify();
}

export function upsertSavedDomainView(input: {
  name: string;
  query: string;
}): SavedDomainView[] {
  const name = input.name.trim();
  if (!name) return readSavedDomainViews();
  const existing = readSavedDomainViews().filter(
    (view) => view.name.toLowerCase() !== name.toLowerCase(),
  );
  const next: SavedDomainView[] = [
    {
      id: `view-${Date.now()}`,
      name,
      query: input.query,
      createdAt: Date.now(),
    },
    ...existing,
  ].slice(0, 12);
  writeSavedDomainViews(next);
  return next;
}

export function removeSavedDomainView(id: string) {
  writeSavedDomainViews(readSavedDomainViews().filter((view) => view.id !== id));
}
