// Site configuration - centralized metadata for SEO and social sharing
// Update these values with your actual information before launch

export const siteConfig = {
  // Personal info
  name: 'Bob',
  title: 'Hardware & Software Engineer',
  description:
    'Interactive portfolio showcasing hardware and software projects with 3D visualization and AI-powered chat.',

  // URLs - update with your actual domain
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://yourportfolio.com',
  ogImage: '/og-image.png',

  // Social links
  links: {
    github: 'https://github.com/yourusername',
    linkedin: 'https://linkedin.com/in/yourprofile',
    email: 'your@email.com',
  },

  // SEO keywords
  keywords: [
    'hardware engineer',
    'software engineer',
    'portfolio',
    '3D visualization',
    'robotics',
    'embedded systems',
    'React',
    'Next.js',
    'Three.js',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
