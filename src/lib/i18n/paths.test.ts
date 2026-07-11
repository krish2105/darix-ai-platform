import { describe, expect, it } from 'vitest';
import { localeAlternates, localePath } from './paths';

describe('localePath', () => {
  it('leaves the default locale (en) unprefixed', () => {
    expect(localePath('en', '/dashboard')).toBe('/dashboard');
    expect(localePath('en', '/')).toBe('/');
  });

  it('prefixes non-default locales', () => {
    expect(localePath('ar', '/dashboard')).toBe('/ar/dashboard');
  });

  it('prefixes the root path without a trailing slash', () => {
    expect(localePath('ar', '/')).toBe('/ar');
  });
});

describe('localeAlternates', () => {
  it('sets canonical to the current locale and cross-links every locale plus x-default', () => {
    expect(localeAlternates('ar', '/case-studies')).toEqual({
      canonical: '/ar/case-studies',
      languages: {
        en: '/case-studies',
        ar: '/ar/case-studies',
        'x-default': '/case-studies',
      },
    });
  });

  it('x-default always points at the default (en) locale, even when called from en', () => {
    expect(localeAlternates('en', '/terms').languages['x-default']).toBe('/terms');
  });
});
