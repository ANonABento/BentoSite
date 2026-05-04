import { ImageResponse } from 'next/og';
import { siteConfig } from '@/lib/site-config';

export const runtime = 'edge';

export const alt = `${siteConfig.name} - Portfolio`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(224, 123, 60, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(224, 123, 60, 0.15) 0%, transparent 50%)',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
          }}
        >
          {/* Name */}
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #e07b3c 0%, #e07b3c 50%, #06b6d4 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {siteConfig.name}
          </h1>

          {/* Title */}
          <p
            style={{
              fontSize: 32,
              color: '#9ca3af',
              margin: '16px 0 0 0',
              fontWeight: 500,
            }}
          >
            {siteConfig.title}
          </p>

          {/* Tagline */}
          <p
            style={{
              fontSize: 20,
              color: '#6b7280',
              margin: '24px 0 0 0',
              maxWidth: 600,
              textAlign: 'center',
            }}
          >
            Interactive Portfolio with 3D Visualization
          </p>
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.6)',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(224, 123, 60, 0.6)',
            }}
          />
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'rgba(6, 182, 212, 0.6)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
