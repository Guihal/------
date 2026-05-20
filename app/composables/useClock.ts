export function useClock() {
  return { nowIso: (): string => new Date().toISOString() }
}
