import { HomeGrid } from './_components/HomeGrid';
import { boardProjects, getLayout, infoContent, introProfile } from '@/lib/board';

export default function Home() {
  // Card sizes, places and image framing all come from the layout, edited in /studio.
  const layout = getLayout();
  return <HomeGrid layout={layout} projects={boardProjects(layout)} profile={introProfile()} info={infoContent()} />;
}
