import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// Apple's home-screen icon convention adds its own rounded-square mask on
// top of whatever's supplied, so this is drawn as a full-bleed square
// (no border-radius here, unlike icon.tsx) — iOS handles the corners.
export default function AppleIcon() {
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
        <div style={{ display: 'flex', fontSize: 100, fontWeight: 800, color: '#F8FAFC' }}>D</div>
      </div>
    ),
    { ...size }
  );
}
