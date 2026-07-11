import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/lib/i18n/translations';

// Routes and static-metadata files that must never get a locale prefix
// rewritten onto them — API routes are locale-agnostic, /auth/callback is
// a fixed redirect URI registered with Supabase, and sitemap.xml/robots.txt
// are single files that themselves list both locales' URLs (see
// src/app/sitemap.ts).
const LOCALE_EXEMPT_RE = /^\/(api|auth)(\/|$)|^\/(sitemap\.xml|robots\.txt)$/;
const LOCALE_PREFIX_RE = new RegExp(`^/(${locales.join('|')})(?:/|$)`);

// Keeps the Supabase auth session cookie fresh on every request so Server
// Components can rely on a valid session without each of them refreshing
// tokens themselves. Also implements "as-needed" locale-prefixed routing:
// the default locale (en) is served unprefixed (its pages live under
// src/app/[locale]/... on disk, matched here via an internal rewrite so the
// browser's URL bar never shows /en), while other locales (ar) require and
// keep their prefix. This is what makes /ar/... a genuinely distinct,
// crawlable URL for Arabic content instead of the same URL as English.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let rewriteUrl: URL | null = null;

  if (!LOCALE_EXEMPT_RE.test(pathname)) {
    const match = pathname.match(LOCALE_PREFIX_RE);

    if (match?.[1] === defaultLocale) {
      // Never serve duplicate content at both /foo and /en/foo — the
      // default locale's canonical URL is always the unprefixed one.
      const url = request.nextUrl.clone();
      url.pathname = pathname.replace(LOCALE_PREFIX_RE, '/') || '/';
      return NextResponse.redirect(url, 308);
    }

    if (!match) {
      rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${defaultLocale}${pathname}`;
    }
  }

  const buildResponse = () =>
    rewriteUrl ? NextResponse.rewrite(rewriteUrl!, { request }) : NextResponse.next({ request });

  let response = buildResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase isn't configured yet (e.g. local dev before env vars are
    // set) — let the request through rather than crashing every page.
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Rebuilt with the same rewrite-or-next shape as above so a
        // mid-request cookie refresh can never silently drop the rewrite.
        response = buildResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
