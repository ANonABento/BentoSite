/**
 * Tracks which projects the dashboard has already auto-prompted the chat about.
 *
 * Deliberately module scoped rather than a ref: React Strict Mode unmounts and
 * remounts the dashboard in development, and a per-instance ref meant the
 * project rundown was sent to the chat twice. It also keeps the rundown from
 * re-firing when the visitor clears the chat and the effect re-evaluates.
 */

const promptedProjectIds = new Set<string>();

/**
 * True the first time it is asked about a project id, false afterwards.
 * Asking marks the project as prompted.
 */
export function claimAutoPrompt(projectId: string): boolean {
  if (promptedProjectIds.has(projectId)) return false;
  promptedProjectIds.add(projectId);
  return true;
}

/** Test seam. Not used by the app — the set is intentionally session-long. */
export function resetAutoPromptTracker(): void {
  promptedProjectIds.clear();
}
