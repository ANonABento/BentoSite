import { JsonLd } from '@/components/seo/JsonLd';
import { buildPhotographyPageJsonLd } from '@/lib/seo';
import photoManifest from '../../../public/photos/manifest.json';
import { PhotographyGallery } from './_components/PhotographyGallery';
import type { PhotoManifest } from './_components/PhotographyGallery.types';

const photos = photoManifest.photos satisfies PhotoManifest['photos'];

export default function PhotographyPage() {
  return (
    <>
      <JsonLd id="photography-json-ld" data={buildPhotographyPageJsonLd(photos)} />
      <PhotographyGallery photos={photos} />
    </>
  );
}
