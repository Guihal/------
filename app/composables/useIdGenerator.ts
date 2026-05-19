export function useIdGenerator() {
  return {
    generateId: (): string => crypto.randomUUID(),
  }
}
