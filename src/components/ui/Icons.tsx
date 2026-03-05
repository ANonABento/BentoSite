/**
 * Shared Icon Component Library
 * Centralized SVG icons to avoid duplication across components
 * All icons follow a consistent API with size and className props
 */

import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  /** Icon size in pixels (default: 16) */
  size?: number;
}

const defaultProps: IconProps = {
  size: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function createIcon(path: React.ReactNode, viewBox = '0 0 24 24') {
  return function Icon({ size = 16, className, ...props }: IconProps) {
    return (
      <svg
        {...defaultProps}
        {...props}
        width={size}
        height={size}
        viewBox={viewBox}
        className={className}
      >
        {path}
      </svg>
    );
  };
}

// === COMMON ICONS ===

/** Checkmark icon for success states */
export const CheckIcon = createIcon(
  <path d="M5 13l4 4L19 7" />
);

/** Copy/clipboard icon */
export const CopyIcon = createIcon(
  <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
);

/** Thumbs up icon for positive feedback */
export const ThumbsUpIcon = createIcon(
  <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
);

/** Thumbs down icon for negative feedback */
export const ThumbsDownIcon = createIcon(
  <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
);

/** Document/file download icon */
export const DocumentDownloadIcon = createIcon(
  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
);

/** Folder icon */
export const FolderIcon = createIcon(
  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
);

/** Send/paper plane icon */
export const SendIcon = createIcon(
  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
);

/** Search/magnifying glass icon */
export const SearchIcon = createIcon(
  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
);

/** Close/X icon */
export const CloseIcon = createIcon(
  <path d="M6 18L18 6M6 6l12 12" />
);

/** Menu/hamburger icon */
export const MenuIcon = createIcon(
  <path d="M4 6h16M4 12h16M4 18h16" />
);

/** Chevron down icon */
export const ChevronDownIcon = createIcon(
  <path d="M19 9l-7 7-7-7" />
);

/** Chevron up icon */
export const ChevronUpIcon = createIcon(
  <path d="M5 15l7-7 7 7" />
);

/** Chevron left icon */
export const ChevronLeftIcon = createIcon(
  <path d="M15 19l-7-7 7-7" />
);

/** Chevron right icon */
export const ChevronRightIcon = createIcon(
  <path d="M9 5l7 7-7 7" />
);

/** External link icon */
export const ExternalLinkIcon = createIcon(
  <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
);

/** Share icon */
export const ShareIcon = createIcon(
  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
);

/** Play icon */
export const PlayIcon = createIcon(
  <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
);

/** Pause icon */
export const PauseIcon = createIcon(
  <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
);

/** Refresh/reload icon */
export const RefreshIcon = createIcon(
  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
);

/** Settings/cog icon */
export const SettingsIcon = createIcon(
  <>
    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </>
);

/** Info/information icon */
export const InfoIcon = createIcon(
  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
);

/** Warning/alert triangle icon */
export const WarningIcon = createIcon(
  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
);

/** Error/exclamation circle icon */
export const ErrorIcon = createIcon(
  <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
);

/** Camera icon */
export const CameraIcon = createIcon(
  <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
);

/** Fullscreen icon */
export const FullscreenIcon = createIcon(
  <path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
);

/** Keyboard icon */
export const KeyboardIcon = createIcon(
  <>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
  </>
);

/** Grid/cube icon for 3D viewer */
export const CubeIcon = createIcon(
  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
);

/** Wireframe icon */
export const WireframeIcon = createIcon(
  <>
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </>
);

/** Reset/undo icon */
export const ResetIcon = createIcon(
  <path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
);

/** Rotate icon */
export const RotateIcon = createIcon(
  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
);

/** Zoom in icon */
export const ZoomInIcon = createIcon(
  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
);

/** Zoom out icon */
export const ZoomOutIcon = createIcon(
  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
);

/** Screenshot/image icon */
export const ScreenshotIcon = createIcon(
  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
);

// === MOBILE TAB ICONS ===

/** 3D/dimension icon for mobile tabs */
export const DimensionTabIcon = createIcon(
  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
);

/** Chat/message icon for mobile tabs */
export const ChatTabIcon = createIcon(
  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
);

/** Media/image icon for mobile tabs */
export const MediaTabIcon = createIcon(
  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
);

/** Games/controller icon for mobile tabs */
export const GamesTabIcon = createIcon(
  <>
    <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </>
);
