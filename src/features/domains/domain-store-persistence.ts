export function subscribeToHydration(): () => void {
  return () => undefined;
}

export function getClientHydrationSnapshot(): boolean {
  return true;
}

export function getServerHydrationSnapshot(): boolean {
  return false;
}
