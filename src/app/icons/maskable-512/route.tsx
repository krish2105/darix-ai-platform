import { ImageResponse } from 'next/og';

// A plain Route Handler (not the special icon.tsx convention) so its URL
// is a fixed, known path — manifest.ts references it directly by src.
// "Maskable" per the Web Manifest spec means Android/other OSes may crop
// this to a circle or squircle, so the mark is drawn inside roughly the
// center 60% "safe zone" with full-bleed background around it, rather
// than the icon.tsx/apple-icon.tsx versions which fill the whole canvas.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #38BDF8, #8B5CF6)',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 220,
            fontWeight: 800,
            color: '#F8FAFC',
          }}
        >
          D
        </div>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
