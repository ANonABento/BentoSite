import type { MetadataRoute } from 'next';
import { getGameCards } from '@/components/Playground/BentoHub/BentoHub.config';
import { PROJECTS, getProjectThumbnail } from '@/lib/projects-data';
import { siteConfig } from '@/lib/site-config';

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
};

type JsonLdObject = Record<string, unknown>;
type PortfolioProject = (typeof PROJECTS)[number];
type PhotographyJsonLdPhoto = {
  src: string;
  title: string;
  alt: string;
  location: string;
  year: string;
  width: number;
  height: number;
};

const SITE_NAME = 'bentOS';
const LANGUAGE = 'en-US';
const SITE_URL = siteConfig.url.replace(/\/$/, '');
const PERSON_ID = `${SITE_URL}#person`;
const WEBSITE_ID = `${SITE_URL}#website`;
const PORTFOLIO_PAGE_ID = `${SITE_URL}#portfolio`;
const PROJECTS_URL = `${SITE_URL}/projects`;
const PROJECTS_PAGE_ID = `${PROJECTS_URL}#projects`;
const PLAYGROUND_PAGE_ID = `${SITE_URL}/playground#playground`;
const PHOTOGRAPHY_URL = `${SITE_URL}/photography`;
const PHOTOGRAPHY_PAGE_ID = `${PHOTOGRAPHY_URL}#photography`;

const CORE_ROUTES: SitemapEntry[] = [
  { path: '/', changeFrequency: 'monthly', priority: 1 },
  { path: '/projects', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/photography', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/scrollable', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/playground', changeFrequency: 'monthly', priority: 0.7 },
];

export function getAbsoluteUrl(path = '/'): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function getSitemapEntries(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const playgroundRoutes = getGameCards()
    .filter((card) => card.href)
    .map<SitemapEntry>((card) => ({
      path: card.href as string,
      changeFrequency: 'monthly',
      priority: 0.5,
    }));

  return [...CORE_ROUTES, ...playgroundRoutes].map((route) => ({
    url: getAbsoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

export function buildSiteJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': [buildPersonJsonLd(), buildWebSiteJsonLd()],
  };
}

export function buildPortfolioPageJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildPersonJsonLd(),
      buildWebSiteJsonLd(),
      {
        '@type': ['ProfilePage', 'WebPage'],
        '@id': PORTFOLIO_PAGE_ID,
        url: SITE_URL,
        name: `${SITE_NAME} - ${siteConfig.name}`,
        description: siteConfig.description,
        inLanguage: LANGUAGE,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
        mainEntity: { '@id': PERSON_ID },
        hasPart: [
          { '@id': PROJECTS_PAGE_ID },
          { '@id': PLAYGROUND_PAGE_ID },
          { '@id': PHOTOGRAPHY_PAGE_ID },
        ],
      },
    ],
  };
}

export function buildProjectsPageJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildPersonJsonLd(),
      {
        '@type': 'CollectionPage',
        '@id': PROJECTS_PAGE_ID,
        url: PROJECTS_URL,
        name: `${siteConfig.name} Projects`,
        description:
          'Portfolio projects spanning robotics, embedded systems, AI, hardware, software, VR, accessibility, and games.',
        inLanguage: LANGUAGE,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: PROJECTS.length,
          itemListElement: PROJECTS.map((project, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: getAbsoluteUrl(`/?project=${encodeURIComponent(project.id)}`),
            item: buildProjectCreativeWorkJsonLd(project),
          })),
        },
      },
    ],
  };
}

export function buildPhotographyPageJsonLd(
  photos: readonly PhotographyJsonLdPhoto[]
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildPersonJsonLd(),
      buildWebSiteJsonLd(),
      {
        '@type': 'CollectionPage',
        '@id': PHOTOGRAPHY_PAGE_ID,
        url: PHOTOGRAPHY_URL,
        name: `${siteConfig.name} Photography`,
        description: 'A responsive photography portfolio gallery.',
        inLanguage: LANGUAGE,
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': PERSON_ID },
        mainEntity: {
          '@type': 'ImageGallery',
          numberOfItems: photos.length,
          associatedMedia: photos.map((photo) => ({
            '@type': 'ImageObject',
            contentUrl: getAbsoluteUrl(photo.src),
            name: photo.title,
            description: photo.alt,
            width: photo.width,
            height: photo.height,
            locationCreated: photo.location,
            dateCreated: photo.year,
            creator: { '@id': PERSON_ID },
          })),
        },
      },
    ],
  };
}

function buildPersonJsonLd(): JsonLdObject {
  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: siteConfig.name,
    jobTitle: siteConfig.title,
    url: SITE_URL,
    email: `mailto:${siteConfig.links.email}`,
    sameAs: [siteConfig.links.github, siteConfig.links.linkedin],
    knowsAbout: [
      'Hardware Engineering',
      'Software Development',
      'Robotics',
      'Embedded Systems',
      'Web Development',
      '3D Visualization',
      'ROS2',
      'PCB Design',
    ],
  };
}

function buildWebSiteJsonLd(): JsonLdObject {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
    description: siteConfig.description,
    inLanguage: LANGUAGE,
    author: { '@id': PERSON_ID },
    publisher: { '@id': PERSON_ID },
  };
}

function buildProjectCreativeWorkJsonLd(project: PortfolioProject): JsonLdObject {
  const image = getProjectThumbnail(project);

  return {
    '@type': 'CreativeWork',
    '@id': `${PROJECTS_URL}#${project.id}`,
    name: project.name,
    description: project.description ?? project.shortDescription,
    url: getAbsoluteUrl(`/?project=${encodeURIComponent(project.id)}`),
    creator: { '@id': PERSON_ID },
    genre: project.category,
    keywords: project.technologies,
    datePublished: getSchemaDate(project.dateCompleted),
    image: image ? getAbsoluteUrl(image) : undefined,
    codeRepository: project.links.github,
    sameAs: [project.links.liveDemo, project.links.docs].filter(Boolean),
  };
}

function getSchemaDate(dateCompleted?: string): string | undefined {
  if (!dateCompleted) return undefined;

  const [year, month] = dateCompleted.split('-');
  if (!year) return undefined;
  return month ? `${year}-${month}-01` : `${year}-01-01`;
}
