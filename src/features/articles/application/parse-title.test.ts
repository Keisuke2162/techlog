import { describe, it, expect } from 'vitest';
import { parseTitleFromHtml } from './parse-title';

describe('parseTitleFromHtml', () => {
  it('reads <title> when no OGP', () => {
    const r = parseTitleFromHtml(`<html><head><title>Hello World</title></head></html>`);
    expect(r.title).toBe('Hello World');
    expect(r.siteName).toBe('');
  });

  it('prefers og:title over <title>', () => {
    const html = `
      <html><head>
      <title>Fallback</title>
      <meta property="og:title" content="OGP Title" />
      <meta property="og:site_name" content="Example Blog" />
      </head></html>`;
    const r = parseTitleFromHtml(html);
    expect(r.title).toBe('OGP Title');
    expect(r.siteName).toBe('Example Blog');
  });

  it('falls back to twitter:title', () => {
    const html = `<html><head><meta name="twitter:title" content="Twitter Title" /></head></html>`;
    expect(parseTitleFromHtml(html).title).toBe('Twitter Title');
  });

  it('decodes HTML entities', () => {
    const r = parseTitleFromHtml(
      `<html><head><title>A &amp; B &lt;good&gt; &#39;ok&#39;</title></head></html>`,
    );
    expect(r.title).toBe("A & B <good> 'ok'");
  });

  it('decodes numeric and hex entities', () => {
    const r = parseTitleFromHtml(
      `<html><head><title>&#x1F680; rocket &#9731; snowman</title></head></html>`,
    );
    expect(r.title).toContain('🚀');
    expect(r.title).toContain('☃');
  });

  it('collapses whitespace', () => {
    const r = parseTitleFromHtml(`<html><head><title>  Hello\n\n  World  </title></head></html>`);
    expect(r.title).toBe('Hello World');
  });

  it('returns empty when nothing found', () => {
    const r = parseTitleFromHtml(`<html><head></head><body>nothing</body></html>`);
    expect(r.title).toBe('');
    expect(r.siteName).toBe('');
  });

  it('handles single-quoted attributes', () => {
    const html = `<html><head><meta property='og:title' content='Single Quoted' /></head></html>`;
    expect(parseTitleFromHtml(html).title).toBe('Single Quoted');
  });

  it('handles title tag with attributes', () => {
    const html = `<html><head><title lang="en">Attr Title</title></head></html>`;
    expect(parseTitleFromHtml(html).title).toBe('Attr Title');
  });
});
