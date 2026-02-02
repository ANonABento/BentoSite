import { track } from '@vercel/analytics';

/**
 * Analytics event tracking utilities for the portfolio site.
 * Uses Vercel Analytics for privacy-friendly, cookie-free tracking.
 */
export const analytics = {
  /**
   * Track when a project is viewed in the Viewfinder
   */
  projectViewed: (projectId: string, projectName: string) => {
    track('project_viewed', { projectId, projectName });
  },

  /**
   * Track when a chat message is sent to the AI assistant
   */
  chatMessageSent: () => {
    track('chat_message_sent');
  },

  /**
   * Track when the resume is downloaded
   */
  resumeDownloaded: () => {
    track('resume_downloaded');
  },

  /**
   * Track when email is copied to clipboard
   */
  emailCopied: () => {
    track('email_copied');
  },

  /**
   * Track when a skill badge is clicked to ask AI
   */
  skillClicked: (skill: string) => {
    track('skill_clicked', { skill });
  },

  /**
   * Track when projects modal is opened
   */
  projectsModalOpened: () => {
    track('projects_modal_opened');
  },

  /**
   * Track external link clicks (GitHub, LinkedIn, live demos)
   */
  externalLinkClicked: (linkType: 'github' | 'linkedin' | 'live_demo', url: string) => {
    track('external_link_clicked', { linkType, url });
  },
};
