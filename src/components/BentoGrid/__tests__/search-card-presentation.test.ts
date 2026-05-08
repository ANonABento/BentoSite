import { describe, expect, it } from 'vitest';
import { SEARCH_CARD } from '../BentoGrid.constants';
import { getSearchCardPresentation } from '../cards/useSearchCardState';

const windowSize = { width: 1000, height: 800 };
const cardWidth = SEARCH_CARD.EXPANDED_WIDTH;
const cardHeight = SEARCH_CARD.EXPANDED_HEIGHT;

// The search card sits at canvas (0, 0). The camera position determines
// where the card appears on screen.
function cameraForScreenPosition(x: number, y: number, zoom = 1) {
  // canvasToScreen: screenX = (canvasX + camera.x) * zoom + centerX
  // For the card center at canvas (cardWidth/2, cardHeight/2):
  //   screenX = (cardWidth/2 + camera.x) * zoom + windowSize.width/2
  // Solve for camera.x:
  //   camera.x = (x - windowSize.width/2) / zoom - cardWidth/2
  return {
    x: (x - windowSize.width / 2) / zoom - cardWidth / 2,
    y: (y - windowSize.height / 2) / zoom - cardHeight / 2,
    zoom,
  };
}

function present(camera: { x: number; y: number; zoom: number }) {
  return getSearchCardPresentation(0, 0, cardWidth, cardHeight, camera, windowSize);
}

describe('getSearchCardPresentation', () => {
  it('uses the regular 2x1 card size while fully on-screen', () => {
    const presentation = present(
      cameraForScreenPosition(windowSize.width / 2, windowSize.height / 2),
    );

    expect(presentation.edge).toBe('none');
    expect(presentation.compression).toBe(0);
    expect(presentation.width).toBe(cardWidth);
    expect(presentation.height).toBe(cardHeight);
    expect(presentation.canvasWidth).toBe(cardWidth);
    expect(presentation.canvasHeight).toBe(cardHeight);
  });

  it('keeps fixed overlay dimensions in screen pixels at non-default zoom', () => {
    const presentation = present(
      cameraForScreenPosition(windowSize.width / 2, windowSize.height / 2, 2),
    );

    expect(presentation.width).toBe(cardWidth * 2);
    expect(presentation.height).toBe(cardHeight * 2);
    expect(presentation.canvasWidth).toBe(cardWidth);
    expect(presentation.canvasHeight).toBe(cardHeight);
  });

  it('starts side compression as soon as the regular slot crosses the left edge', () => {
    const offscreenDistance = 60;
    const regularCenterX =
      SEARCH_CARD.EDGE_PADDING + cardWidth / 2 - offscreenDistance;

    const presentation = present(
      cameraForScreenPosition(regularCenterX, windowSize.height / 2),
    );

    const expectedCompression = offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE;

    expect(presentation.edge).toBe('left');
    expect(presentation.compression).toBeCloseTo(expectedCompression);
    expect(presentation.width).toBeLessThan(cardWidth);
    expect(presentation.width).toBeGreaterThan(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
    expect(presentation.height).toBe(cardHeight);
  });

  it('starts vertical compression as soon as the regular slot crosses the top edge', () => {
    const offscreenDistance = 45;
    const regularCenterY =
      SEARCH_CARD.EDGE_PADDING + cardHeight / 2 - offscreenDistance;

    const presentation = present(
      cameraForScreenPosition(windowSize.width / 2, regularCenterY),
    );

    const expectedCompression = offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE;

    expect(presentation.edge).toBe('top');
    expect(presentation.compression).toBeCloseTo(expectedCompression);
    expect(presentation.width).toBe(cardWidth);
    expect(presentation.height).toBeLessThan(cardHeight);
    expect(presentation.height).toBeGreaterThan(SEARCH_CARD.COLLAPSED_HEIGHT);
  });

  it('fully squashes and clamps after enough off-screen travel', () => {
    const regularCenterX = -cardWidth;
    const presentation = present(
      cameraForScreenPosition(regularCenterX, windowSize.height / 2),
    );

    expect(presentation.edge).toBe('left');
    expect(presentation.compression).toBe(1);
    expect(presentation.width).toBe(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
  });
});
