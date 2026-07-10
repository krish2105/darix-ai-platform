import fs from 'node:fs';
import path from 'node:path';
import { Font } from '@react-pdf/renderer';

// Registered once at module load. Helvetica (react-pdf's Base14 default)
// has no Arabic glyphs — without this, Arabic report text would render as
// empty boxes.
//
// Tajawal, not Noto Sans Arabic: Noto Sans Arabic's glyph-substitution
// tables crash react-pdf's bidi text reorderer (@react-pdf/textkit) on
// specific letter combinations — e.g. any word ending in خ (khah) followed
// by a space and more text, which includes "تاريخ" (date), reliably
// throws "Cannot read properties of undefined (reading 'id')" deep in
// reorderLine. Verified directly against @react-pdf/renderer 4.5.1. Tajawal
// (also a popular choice in Gulf/UAE government and business products)
// renders the identical strings without issue and is what's registered
// here.
//
// Loaded as a base64 data: URI built from a runtime-constructed path
// rather than `require.resolve()`/a static import: Turbopack tries to
// bundle any statically-referenced .woff as a JS module and fails with
// "Unknown module type" for a route handler. A path built from
// process.cwd() at runtime is invisible to that static analysis. To make
// sure the font file still ships in a Vercel serverless deploy (Next's
// output file tracer normally only bundles statically-detected
// dependencies), `outputFileTracingIncludes` in next.config.ts explicitly
// includes it for the PDF route — verify a downloaded Arabic PDF renders
// real glyphs (not tofu boxes) against your actual deployment, the same
// "confirm in the real environment" caveat as Telr/Sentry.
let registered = false;

export const ARABIC_FONT_FAMILY = 'Tajawal';

const loadFontDataUri = (weight: '400' | '700'): string => {
  const filePath = path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'tajawal',
    'files',
    `tajawal-arabic-${weight}-normal.woff`
  );
  const buffer = fs.readFileSync(filePath);
  return `data:font/woff;base64,${buffer.toString('base64')}`;
};

export const registerArabicFont = () => {
  if (registered) return;
  registered = true;

  Font.register({
    family: ARABIC_FONT_FAMILY,
    fonts: [
      { src: loadFontDataUri('400'), fontWeight: 'normal' },
      { src: loadFontDataUri('700'), fontWeight: 'bold' },
    ],
  });
};
