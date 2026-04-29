import { describe, expect, it } from 'vitest';
import { SEARCH_CARD } from '../BentoGrid.constants';
import { getSearchCardPresentation } from '../cards/useSearchCardState';

const windowSize = { width: 1000, height: 800 };

function cameraForScreenPosition(x: number, y: number, zoom = 1) {
  return {
    x: (x - windowSize.width / 2) / zoom,
    y: (y - windowSize.height / 2) / zoom,
    zoom,
  };
}

describe('getSearchCardPresentation', () => {
  it('uses the regular 2x1 card size while fully on-screen', () => {
    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(windowSize.width / 2, windowSize.height / 2),
      windowSize,
    );

    expect(presentation.edge).toBe('none');
    expect(presentation.compression).toBe(0);
    expect(presentation.width).toBe(SEARCH_CARD.EXPANDED_WIDTH);
    expect(presentation.height).toBe(SEARCH_CARD.EXPANDED_HEIGHT);
    expect(presentation.screenPosition.x).toBe(windowSize.width / 2);
    expect(presentation.screenPosition.y).toBe(windowSize.height / 2);
  });

  it('matches the regular grid slot size at the current zoom level', () => {
    const zoom = 1.5;
    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(windowSize.width / 2, windowSize.height / 2, zoom),
      windowSize,
    );

    expect(presentation.edge).toBe('none');
    expect(presentation.width).toBe(SEARCH_CARD.EXPANDED_WIDTH * zoom);
    expect(presentation.height).toBe(SEARCH_CARD.EXPANDED_HEIGHT * zoom);
  });

  it('starts side compression as soon as the regular slot crosses the left edge', () => {
    const offscreenDistance = 60;
    const regularCenterX =
      SEARCH_CARD.EDGE_PADDING + SEARCH_CARD.EXPANDED_WIDTH / 2 - offscreenDistance;

    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(regularCenterX, windowSize.height / 2),
      windowSize,
    );

    const expectedCompression = offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE;

    expect(presentation.edge).toBe('left');
    expect(presentation.compression).toBeCloseTo(expectedCompression);
    expect(presentation.width).toBeLessThan(SEARCH_CARD.EXPANDED_WIDTH);
    expect(presentation.width).toBeGreaterThan(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
    expect(presentation.height).toBe(SEARCH_CARD.EXPANDED_HEIGHT);
    expect(presentation.screenPosition.x).toBeCloseTo(
      SEARCH_CARD.EDGE_PADDING + presentation.width / 2,
    );
  });

  it('starts vertical compression as soon as the regular slot crosses the top edge', () => {
    const offscreenDistance = 45;
    const regularCenterY =
      SEARCH_CARD.EDGE_PADDING + SEARCH_CARD.EXPANDED_HEIGHT / 2 - offscreenDistance;

    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(windowSize.width / 2, regularCenterY),
      windowSize,
    );

    const expectedCompression = offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE;

    expect(presentation.edge).toBe('top');
    expect(presentation.compression).toBeCloseTo(expectedCompression);
    expect(presentation.width).toBe(SEARCH_CARD.EXPANDED_WIDTH);
    expect(presentation.height).toBeLessThan(SEARCH_CARD.EXPANDED_HEIGHT);
    expect(presentation.height).toBeGreaterThan(SEARCH_CARD.COLLAPSED_HEIGHT);
    expect(presentation.screenPosition.y).toBeCloseTo(
      SEARCH_CARD.EDGE_PADDING + presentation.height / 2,
    );
  });

  it('fully squashes and clamps after enough off-screen travel', () => {
    const regularCenterX = -SEARCH_CARD.EXPANDED_WIDTH;
    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(regularCenterX, windowSize.height / 2),
      windowSize,
    );

    expect(presentation.edge).toBe('left');
    expect(presentation.compression).toBe(1);
    expect(presentation.width).toBe(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
    expect(presentation.screenPosition.x).toBe(
      SEARCH_CARD.EDGE_PADDING + SEARCH_CARD.SQUASHED_SIDE_WIDTH / 2,
    );
  });
});
