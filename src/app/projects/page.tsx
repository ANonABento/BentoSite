/**
 * /projects - Projects showcase page
 *
 * Thin route shell. The grid and card renderer live behind a route-level
 * dynamic boundary so the page module does not eagerly import them.
 */

import { getCaseStudyPathsByProjectId } from '@/lib/project-case-studies';
import { ProjectsGridClient } from './_components/ProjectsGridClient';

export default function ProjectsPage() {
  return (
    <ProjectsGridClient
      caseStudyPathsByProjectId={getCaseStudyPathsByProjectId()}
    />
  );
}
