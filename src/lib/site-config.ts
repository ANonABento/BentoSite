// Site configuration - centralized metadata for SEO and social sharing
// Kevin Jiang's portfolio configuration

export const siteConfig = {
  // Personal info
  name: 'Kevin Jiang',
  title: 'Robotics & Embedded Systems Engineer',
  description:
    'Interactive portfolio showcasing robotics, embedded systems, and AI projects. UWaterloo Computer Engineering student building robots that think.',

  // URLs
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kevinjiang.dev',
  ogImage: '/og-image.png',

  // Social links
  links: {
    github: 'https://github.com/ANonABento',
    linkedin: 'https://linkedin.com/in/ANonABento',
    email: 'k69jiang@uwaterloo.ca',
  },

  // SEO keywords
  keywords: [
    'robotics engineer',
    'embedded systems',
    'ROS2',
    'computer engineering',
    'UWaterloo',
    'hardware engineer',
    'AI robotics',
    'Python',
    'C++',
    'STM32',
    'ESP32',
    'PCB design',
    '3D printing',
    'Three.js',
    'portfolio',
  ],
} as const;

export type SiteConfig = typeof siteConfig;
