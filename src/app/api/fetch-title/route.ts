import { NextResponse } from 'next/server';
import { decodeHtmlBuffer, parseTitleFromHtml } from '@/features/articles/application/parse-title';

const MAX_BYTES = 500 * 1024;
const TIMEOUT_MS = 5_000;

function isDisallowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h === '::1' || h === '0.0.0.0') {
    return true;
  }
  // IPv4 literal ranges
  const octets = h.split('.');
  if (octets.length === 4 && octets.every((o) => /^\d+$/.test(o))) {
    const [a, b] = octets.map((o) => Number(o));
    if (a === 127) return true;
    if (a === 10) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && typeof b === 'number' && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 0) return true;
  }
  return false;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('url');
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return NextResponse.json({ error: 'unsupported protocol' }, { status: 400 });
  }
  if (isDisallowedHost(target.hostname)) {
    return NextResponse.json({ error: 'disallowed host' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(target.toString(), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; TechLog/1.0; +https://github.com/Keisuke2162/techlog)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ja,en;q=0.8',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json({ error: 'not html' }, { status: 415 });
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('empty body');

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(value);
      if (total >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }

    const buf = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      buf.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const html = decodeHtmlBuffer(buf);
    const parsed = parseTitleFromHtml(html);
    return NextResponse.json(parsed, {
      headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'timeout'
        : err instanceof Error
          ? err.message
          : 'fetch failed';
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
