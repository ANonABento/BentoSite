import { SEARCH_CARD } from '../BentoGrid.constants';
import type {
  Camera,
  CardLayout,
  ExclusionZone,
  SearchCardState,
  Size,
} from '../BentoGrid.types';
import { screenToCanvas } from '../core/useViewport';

export const SEARCH_CARD_BODY_ID = '__search__';

export interface SearchPhysicsState {
  layout: CardLayout;
  isStatic: boolean;
  exclusionZone: ExclusionZone | null;
}

function getExpandedSearchLayout(): CardLayout {
  return {
    id: SEARCH_CARD_BODY_ID,
    x: -SEARCH_CARD.EXPANDED_WIDTH / 2,
    y: -SEARCH_CARD.EXPANDED_HEIGHT / 2,
    width: SEARCH_CARD.EXPANDED_WIDTH,
    height: SEARCH_CARD.EXPANDED_HEIGHT,
    rotation: 0,
    size: '2x1',
  };
}

export function getSearchCardPhysicsState(
  search: Pick<SearchCardState, 'compression' | 'screenPosition' | 'width' | 'height'>,
  camera: Camera,
  windowSize: Size,
): SearchPhysicsState {
  if (search.compression <= 0) {
    return {
      layout: getExpandedSearchLayout(),
      isStatic: false,
      exclusionZone: null,
    };
  }

  const left = search.screenPosition.x - search.width / 2;
  const top = search.screenPosition.y - search.height / 2;
  const right = search.screenPosition.x + search.width / 2;
  const bottom = search.screenPosition.y + search.height / 2;
  const topLeft = screenToCanvas(left, top, camera, windowSize);
  const bottomRight = screenToCanvas(right, bottom, camera, windowSize);
  const width = bottomRight.x - topLeft.x;
  const height = bottomRight.y - topLeft.y;
  const layout: CardLayout = {
    id: SEARCH_CARD_BODY_ID,
    x: topLeft.x,
    y: topLeft.y,
    width,
    height,
    rotation: 0,
    size: '2x1',
  };

  return {
    layout,
    isStatic: true,
    exclusionZone: {
      x: layout.x,
      y: layout.y,
      width: layout.width,
      height: layout.height,
      padding: SEARCH_CARD.EXCLUSION_PADDING,
    },
  };
}
