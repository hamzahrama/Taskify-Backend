export function resolveAllowedOrigins(frontendValue?: string): string[] {
  const values = (frontendValue ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const normalized = new Set<string>();

  for (const value of values) {
    normalized.add(value.replace(/\/+$/, ''));
  }

  const localFallbacks = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  for (const value of localFallbacks) {
    normalized.add(value);
  }

  return [...normalized];
}
