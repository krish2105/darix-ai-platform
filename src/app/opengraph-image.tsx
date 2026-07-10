import { ImageResponse } from 'next/og';

export const alt = 'Darix AI — Dubai AI Readiness Index';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #030712 0%, #07111F 60%, #111827 100%)',
          padding: 80,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #38BDF8, #8B5CF6)',
              display: 'flex',
            }}
          />
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, color: '#F8FAFC', letterSpacing: 2 }}>
            DARIX AI
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Dubai AI Readiness Index — Free AI Readiness Assessment for Businesses
        </div>
      </div>
    ),
    { ...size }
  );
}
