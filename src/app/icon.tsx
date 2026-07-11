import { ImageResponse } from 'next/og';

export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

// Same gradient square + wordmark-less mark used across the site's OG
// images (src/app/[locale]/opengraph-image.tsx) — reused here so the
// browser tab icon, Android home-screen icon, and social preview all read
// as the same brand mark.
export default function Icon() {
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
          borderRadius: 40,
        }}
      >
        <div style={{ display: 'flex', fontSize: 108, fontWeight: 800, color: '#F8FAFC' }}>D</div>
      </div>
    ),
    { ...size }
  );
}
