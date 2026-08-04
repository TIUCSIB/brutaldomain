import { resetDemoData as resetRepositoryDemoData } from "./mock-domain-repository";

export const serverSnapshotState = resetRepositoryDemoData();

export function toDomainId(id: number | string): number {
  const value = typeof id === "number" ? id : Number(id);

  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`Invalid domain id: ${id}`);
  }

  return value;
}
