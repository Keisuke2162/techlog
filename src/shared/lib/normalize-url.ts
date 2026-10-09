const STRIP_QUERY_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_name',
  'gclid',
  'fbclid',
  'mc_eid',
  'mc_cid',
  'ref',
  '_hsenc',
  '_hsmi',
]);

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return trimmed;
  }
  parsed.protocol = parsed.protocol.toLowerCase();
  parsed.hostname = parsed.hostname.toLowerCase().replace(/\.$/u, '');

  const kept: Array<[string, string]> = [];
  parsed.searchParams.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower.startsWith('utm_') || STRIP_QUERY_KEYS.has(lower)) return;
    kept.push([key, value]);
  });
  parsed.search = '';
  for (const [k, v] of kept) parsed.searchParams.append(k, v);

  let pathname = parsed.pathname.replace(/\/+/gu, '/');
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.replace(/\/+$/u, '');
  parsed.pathname = pathname;

  if (
    (parsed.protocol === 'https:' && parsed.port === '443') ||
    (parsed.protocol === 'http:' && parsed.port === '80')
  ) {
    parsed.port = '';
  }

  return parsed.toString();
}
