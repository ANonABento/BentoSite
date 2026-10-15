import { HomeGrid } from './_components/HomeGrid';
import { boardProjects, getLayout, infoContent, introProfile, viewfinderProjects } from '@/lib/board';
import { SITE_URL, about, experience, getFeatured, profile } from '@/lib/content';

export default function Home() {
  // Card sizes, places and image framing all come from the layout, edited in /studio.
  const layout = getLayout();
  return (
    <>
      <HomeGrid layout={layout} projects={boardProjects(layout)} profile={introProfile()} info={infoContent()} details={viewfinderProjects()} />
      <ServerSummary />
    </>
  );
}

/**
 * The board only renders in the browser, so search engines and link scrapers
 * get this plain summary in the HTML instead, plus a Person record for search
 * results. Hidden from screen readers, which get the board itself.
 */
function ServerSummary() {
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    url: SITE_URL,
    email: `mailto:${profile.email}`,
    alumniOf: profile.university,
    worksFor: { '@type': 'Organization', name: experience[0].company },
    sameAs: [profile.github, profile.linkedin],
  };
  return (
    <div className="sr-only" aria-hidden="true">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <h1>
        {profile.name}, {profile.title}
      </h1>
      <p>{about}</p>
      <h2>Experience</h2>
      <ul>
        {experience.map((e) => (
          <li key={e.id}>
            {e.role} at {e.company} ({e.period}): {e.summary}
          </li>
        ))}
      </ul>
      <h2>Selected projects</h2>
      <ul>
        {getFeatured().map((p) => (
          <li key={p.id}>
            <a href={`/?project=${p.id}`}>{p.name}</a>: {p.shortDescription}
          </li>
        ))}
      </ul>
      <a href="/projects">All projects</a>
    </div>
  );
}
