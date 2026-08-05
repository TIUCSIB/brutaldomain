import type { ExpiryRiskFilter, StatusFilter } from "@/features/domains/utils";

export interface DomainFilterPreset {
  id: string;
  label: string;
  patch: {
    risk?: ExpiryRiskFilter | null;
    status?: StatusFilter | null;
    sort?: string | null;
    q?: string | null;
  };
  match: (params: {
    expiryRisk: string;
    status: string;
    sort: string;
    search: string;
  }) => boolean;
}

export const DOMAIN_FILTER_PRESETS: DomainFilterPreset[] = [
  {
    id: "expired",
    label: "已过期",
    patch: { risk: "expired", status: null, sort: "expiry-asc", q: null },
    match: ({ expiryRisk }) => expiryRisk === "expired",
  },
  {
    id: "within-7",
    label: "7 天内",
    patch: { risk: "within-7", status: null, sort: "expiry-asc", q: null },
    match: ({ expiryRisk }) => expiryRisk === "within-7",
  },
  {
    id: "within-30",
    label: "30 天内",
    patch: { risk: "within-30", status: null, sort: "expiry-asc", q: null },
    match: ({ expiryRisk }) => expiryRisk === "within-30",
  },
  {
    id: "error",
    label: "异常",
    patch: { status: "Error", risk: null, sort: null, q: null },
    match: ({ status }) => status === "Error",
  },
  {
    id: "pending",
    label: "待处理",
    patch: { status: "Pending", risk: null, sort: null, q: null },
    match: ({ status }) => status === "Pending",
  },
];

export function presetToParamPatch(
  preset: DomainFilterPreset,
): Record<string, string | null> {
  const patch: Record<string, string | null> = {
    page: null,
  };

  if ("risk" in preset.patch) {
    patch.risk =
      !preset.patch.risk || preset.patch.risk === "all"
        ? null
        : preset.patch.risk;
  }
  if ("status" in preset.patch) {
    patch.status =
      !preset.patch.status || preset.patch.status === "all"
        ? null
        : preset.patch.status;
  }
  if ("sort" in preset.patch) {
    patch.sort =
      !preset.patch.sort || preset.patch.sort === "expiry-asc"
        ? null
        : preset.patch.sort;
  }
  if ("q" in preset.patch) {
    patch.q = preset.patch.q || null;
  }

  return patch;
}

export function buildDomainFilterPresetChips(
  params: {
    expiryRisk: string;
    status: string;
    sort: string;
    search: string;
  },
  setParams: (patch: Record<string, string | null>) => void,
) {
  return DOMAIN_FILTER_PRESETS.map((preset) => {
    const active = preset.match(params);
    return {
      id: preset.id,
      label: preset.label,
      active,
      onSelect: () => {
        if (active) {
          setParams({
            risk: null,
            status: null,
            sort: null,
            q: null,
            page: null,
          });
          return;
        }
        setParams(presetToParamPatch(preset));
      },
    };
  });
}
