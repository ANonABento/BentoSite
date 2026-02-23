import portfolioContent from '@/content/portfolio.json';
import type { MapLocation } from '@/components/Viewfinder/Viewfinder.types';

type ExperienceEntry = (typeof portfolioContent.experience)[number];
type EducationEntry = (typeof portfolioContent.education)[number];

function hasCoordinates(
  entry: ExperienceEntry | EducationEntry
): entry is (ExperienceEntry | EducationEntry) & { coordinates: { lat: number; lng: number } } {
  return 'coordinates' in entry && entry.coordinates != null;
}

function toDetailBullets(description?: string): string[] {
  if (!description) return [];
  return description
    .split('.')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function getMapLocations(ids?: string[]): MapLocation[] {
  const locations: MapLocation[] = [];

  for (const exp of portfolioContent.experience) {
    if (!hasCoordinates(exp)) continue;
    if (ids && !ids.includes(exp.id)) continue;
    locations.push({
      id: exp.id,
      label: exp.company,
      sublabel: exp.role,
      location: exp.location,
      coordinates: exp.coordinates,
      period: exp.period,
      type: 'work',
      details: toDetailBullets(exp.description),
    });
  }

  for (const edu of portfolioContent.education) {
    if (!hasCoordinates(edu)) continue;
    if (ids && !ids.includes(edu.id)) continue;
    locations.push({
      id: edu.id,
      label: edu.institution,
      sublabel: edu.degree,
      location: edu.location,
      coordinates: edu.coordinates,
      period: edu.period,
      type: 'education',
      details: [`Studying ${edu.degree}.`],
    });
  }

  return locations;
}

export function getAllMapLocations(): MapLocation[] {
  return getMapLocations();
}

export function formatLocationAssistantMessage(location: MapLocation): string {
  const header =
    location.type === 'education'
      ? `Was in ${location.location} for ${location.period} studying ${location.sublabel} at ${location.label}.`
      : `Was in ${location.location} for ${location.period} working as ${location.sublabel} at ${location.label}.`;

  const bulletLines =
    location.details.length > 0
      ? location.details.map((detail) => `- ${detail}`)
      : ['- Built hands-on experience and shipped meaningful work there.'];

  return `${header}\n\nSome things I did there:\n${bulletLines.join('\n')}\n\nAsk if you would like to know anything else.`;
}
