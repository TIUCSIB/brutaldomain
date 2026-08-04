export function formatSyncedAt(timestamp: number | null, now = Date.now()): string {
  if (timestamp === null) return "尚未同步";

  const delta = Math.max(0, now - timestamp);
  const seconds = Math.floor(delta / 1000);
  if (seconds < 15) return "刚刚同步";
  if (seconds < 60) return `${seconds} 秒前同步`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前同步`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前同步`;

  const days = Math.floor(hours / 24);
  return `${days} 天前同步`;
}
