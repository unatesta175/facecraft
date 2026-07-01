export function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toDateOnly(value: Date | string): string {
  return toIsoString(value).split('T')[0];
}

export function omitPassword<T extends { passwordHash?: string }>(record: T): Omit<T, 'passwordHash'> {
  const rest = { ...record };
  delete (rest as { passwordHash?: string }).passwordHash;
  return rest as Omit<T, 'passwordHash'>;
}
