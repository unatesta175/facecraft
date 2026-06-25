export function toNumber(value: unknown): number {
  return Number(value ?? 0);
}

export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toDateOnly(value: Date | string): string {
  return toIsoString(value).split('T')[0];
}

export function omitPassword<T extends { passwordHash?: string }>(record: T) {
  const { passwordHash: _passwordHash, ...rest } = record;
  return rest;
}
