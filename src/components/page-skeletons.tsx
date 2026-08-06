import { Skeleton } from "@/components/ui/skeleton";

function Shell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="mx-auto w-full max-w-[1280px] space-y-4"
    >
      {children}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Shell label="正在加载总览">
      <Skeleton className="h-16 w-full max-w-md rounded-none" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-none" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-none" />
        <Skeleton className="h-56 rounded-none" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-none" />
        <Skeleton className="h-48 rounded-none" />
      </div>
    </Shell>
  );
}

export function DomainsListSkeleton() {
  return (
    <Shell label="正在加载域名列表">
      <Skeleton className="h-14 w-full max-w-lg rounded-none" />
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-none" />
        ))}
      </div>
    </Shell>
  );
}

export function SettingsSkeleton() {
  return (
    <Shell label="正在加载设置">
      <Skeleton className="h-14 w-full max-w-md rounded-none" />
      <Skeleton className="h-10 w-64 rounded-none" />
      <Skeleton className="h-64 w-full rounded-none" />
    </Shell>
  );
}

export function WhoisSkeleton() {
  return (
    <Shell label="正在加载 WHOIS">
      <Skeleton className="h-14 w-full max-w-md rounded-none" />
      <Skeleton className="h-24 w-full rounded-none" />
      <Skeleton className="h-48 w-full rounded-none" />
    </Shell>
  );
}

export function GlobalDnsSkeleton() {
  return (
    <Shell label="正在加载全局 DNS">
      <Skeleton className="h-14 w-full max-w-lg rounded-none" />
      <Skeleton className="h-20 w-full rounded-none" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-none" />
        ))}
      </div>
    </Shell>
  );
}
