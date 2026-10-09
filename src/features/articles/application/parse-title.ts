export interface ParsedTitle {
  title: string;
  siteName: string;
}

function extractMetaContent(html: string, propertyOrName: string): string | null {
  const re = new RegExp(
    `<meta\\b[^>]*?(?:property|name)\\s*=\\s*["']${escapeRegex(propertyOrName)}["'][^>]*>`,
    'i',
  );
  const match = html.match(re);
  if (!match) return null;
  const contentMatch = match[0].match(/content\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return contentMatch ? (contentMatch[1] ?? contentMatch[2] ?? null) : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractCharset(html: string): string | null {
  const metaCharset = html.match(/<meta[^>]+charset\s*=\s*["']?([a-zA-Z0-9_\-]+)["']?/i);
  if (metaCharset?.[1]) return metaCharset[1].toLowerCase();
  const httpEquiv = html.match(/charset\s*=\s*([a-zA-Z0-9_\-]+)/i);
  return httpEquiv?.[1]?.toLowerCase() ?? null;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });
}

export function parseTitleFromHtml(html: string): ParsedTitle {
  const head = html.slice(0, 200_000);
  const ogTitle = extractMetaContent(head, 'og:title');
  const twitterTitle = extractMetaContent(head, 'twitter:title');
  const ogSiteName = extractMetaContent(head, 'og:site_name');
  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const htmlTitle = titleMatch?.[1]?.trim();
  const rawTitle = ogTitle || twitterTitle || htmlTitle || '';
  const title = decodeHtmlEntities(rawTitle).replace(/\s+/g, ' ').trim();
  const siteName = decodeHtmlEntities(ogSiteName ?? '').trim();
  return { title, siteName };
}

export function decodeHtmlBuffer(buf: Uint8Array): string {
  const sniff = new TextDecoder('ascii', { fatal: false }).decode(buf.slice(0, 4096));
  const charset = extractCharset(sniff);
  const label = normalizeCharset(charset);
  try {
    return new TextDecoder(label, { fatal: false }).decode(buf);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(buf);
  }
}

function normalizeCharset(charset: string | null): string {
  if (!charset) return 'utf-8';
  const lower = charset.toLowerCase();
  if (lower === 'shift-jis' || lower === 'shift_jis' || lower === 'sjis') return 'shift_jis';
  if (lower === 'euc-jp' || lower === 'euc_jp') return 'euc-jp';
  if (lower === 'iso-2022-jp') return 'iso-2022-jp';
  return lower;
}
