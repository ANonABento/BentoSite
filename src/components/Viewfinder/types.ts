/**
 * The viewfinder's data: one project's details and the media it shows.
 * Pure types and helpers, shared by the server (content), the board and /studio.
 */

/** What a viewfinder item is, which picks its viewer. */
export type ViewfinderKind = 'image' | 'video' | 'embed' | 'model' | 'pdf';

export interface ViewfinderItem {
  kind: ViewfinderKind;
  /** An image path, a YouTube/Vimeo/MP4 link, any page URL (embed), an .stl/.glb path, or a PDF path. */
  src: string;
  /** Tab name; defaults to the kind's name. Images share one "Images" tab. */
  label?: string;
}

export const KIND_LABELS: Record<ViewfinderKind, string> = {
  image: 'Images',
  video: 'Video',
  embed: 'Live',
  model: '3D',
  pdf: 'PDF',
};

export interface ViewfinderProject {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  status: 'Completed' | 'In Progress';
  date: string;
  context?: string;
  award?: string;
  technologies: string[];
  links: { github?: string; docs?: string; liveDemo?: string };
  items: ViewfinderItem[];
}

/** One tab: all the images together, or a single other item. */
export interface ViewfinderTab {
  key: string;
  label: string;
  kind: ViewfinderKind;
  items: ViewfinderItem[];
}

export function tabsFor(items: ViewfinderItem[]): ViewfinderTab[] {
  const tabs: ViewfinderTab[] = [];
  items.forEach((item, index) => {
    if (item.kind === 'image') {
      const gallery = tabs.find((tab) => tab.kind === 'image');
      if (gallery) gallery.items.push(item);
      else tabs.push({ key: 'images', label: KIND_LABELS.image, kind: 'image', items: [item] });
    } else {
      tabs.push({ key: `${item.kind}-${index}`, label: item.label || KIND_LABELS[item.kind], kind: item.kind, items: [item] });
    }
  });
  return tabs;
}
