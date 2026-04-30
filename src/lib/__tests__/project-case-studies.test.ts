import { describe, expect, it } from 'vitest';
import {
  getCaseStudyPathForProject,
  getCaseStudyPathsByProjectId,
  getProjectCaseStudyBySlug,
  getProjectCaseStudySlugs,
} from '@/lib/project-case-studies';

describe('project case study content helpers', () => {
  it('discovers committed MDX case studies by slug', () => {
    expect(getProjectCaseStudySlugs()).toContain('robotic-arm-puppeteer');
  });

  it('loads required frontmatter and markdown body', () => {
    const caseStudy = getProjectCaseStudyBySlug('robotic-arm-puppeteer');

    expect(caseStudy).toMatchObject({
      slug: 'robotic-arm-puppeteer',
      projectId: 'robotic-arm-puppeteer',
      title: 'Robotic Arm Puppeteer',
    });
    expect(caseStudy?.body).toContain('## Problem');
  });

  it('rejects unsafe slugs before reading from disk', () => {
    expect(getProjectCaseStudyBySlug('../portfolio')).toBeNull();
  });

  it('maps project ids to canonical case study routes', () => {
    expect(getCaseStudyPathForProject('robotic-arm-puppeteer')).toBe(
      '/projects/robotic-arm-puppeteer'
    );
    expect(getCaseStudyPathsByProjectId()).toMatchObject({
      'robotic-arm-puppeteer': '/projects/robotic-arm-puppeteer',
    });
  });
});
