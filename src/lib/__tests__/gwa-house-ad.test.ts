import { describe, expect, it } from 'vitest';
import { gwaFilmEmbedUrl, gwaSiteUrl } from '../gwa-house-ad';

describe('gwaSiteUrl', () => {
  it('tags the gwawrestling.com link with this site as the source', () => {
    const url = new URL(gwaSiteUrl());
    expect(url.origin).toBe('https://www.gwawrestling.com');
    expect(url.pathname).toBe('/');
    expect(url.searchParams.get('utm_source')).toBe('howmanydayssince');
    expect(url.searchParams.get('utm_medium')).toBe('house_ad');
    expect(url.searchParams.get('utm_campaign')).toBe('gwa_day_2026');
  });
});

describe('gwaFilmEmbedUrl', () => {
  it('points at the GWA Day 2026 film on the privacy-enhanced player and starts it', () => {
    const url = new URL(gwaFilmEmbedUrl());
    expect(url.origin).toBe('https://www.youtube-nocookie.com');
    expect(url.pathname).toBe('/embed/LKhoHMmcpkc');
    expect(url.searchParams.get('autoplay')).toBe('1');
  });
});
