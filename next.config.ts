import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { formats: ['image/avif', 'image/webp'] },
  // Lets the dev server be previewed through a Cloudflare quick tunnel.
  allowedDevOrigins: ['*.trycloudflare.com'],
  // Projects open in the viewfinder over the board; old project links land there.
  async redirects() {
    return [{ source: '/projects/:id', destination: '/?project=:id', permanent: true }];
  },
};

export default nextConfig;
