import { describe, it, expect } from 'vitest';
import { normalizeUrl } from './normalize-url';

describe('normalizeUrl', () => {
  it('lowercases host and keeps path', () => {
    expect(normalizeUrl('HTTPS://Example.COM/Foo/Bar')).toBe('https://example.com/Foo/Bar');
  });

  it('strips utm_* and tracking params', () => {
    expect(
      normalizeUrl('https://example.com/post?utm_source=x&utm_medium=y&id=42&fbclid=abc'),
    ).toBe('https://example.com/post?id=42');
  });

  it('removes trailing slash except root', () => {
    expect(normalizeUrl('https://example.com/foo/')).toBe('https://example.com/foo');
    expect(normalizeUrl('https://example.com/')).toBe('https://example.com/');
  });

  it('keeps fragment', () => {
    expect(normalizeUrl('https://example.com/doc#section')).toBe('https://example.com/doc#section');
  });

  it('collapses duplicate slashes in path', () => {
    expect(normalizeUrl('https://example.com//a//b')).toBe('https://example.com/a/b');
  });

  it('strips default port', () => {
    expect(normalizeUrl('https://example.com:443/x')).toBe('https://example.com/x');
    expect(normalizeUrl('http://example.com:80/x')).toBe('http://example.com/x');
  });

  it('keeps non-default port', () => {
    expect(normalizeUrl('https://example.com:8080/x')).toBe('https://example.com:8080/x');
  });

  it('returns trimmed input when parsing fails', () => {
    expect(normalizeUrl('   not a url  ')).toBe('not a url');
  });

  it('returns trimmed input for non-http(s) protocols', () => {
    expect(normalizeUrl('ftp://example.com/')).toBe('ftp://example.com/');
  });

  it('is idempotent', () => {
    const once = normalizeUrl('https://Example.com/foo/?utm_source=x');
    expect(normalizeUrl(once)).toBe(once);
  });

  it('removes trailing dot from host', () => {
    expect(normalizeUrl('https://example.com./x')).toBe('https://example.com/x');
  });

  it('empty input returns empty', () => {
    expect(normalizeUrl('')).toBe('');
  });
});
