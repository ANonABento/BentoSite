import { describe, expect, it } from 'vitest';
import { SEARCH_CARD } from '../BentoGrid.constants';
import { getSearchCardPhysicsState, getSearchCardPresentation } from '../search';

const windowSize = { width: 1000, height: 800 };

function cameraForScreenPosition(x: number, y: number, zoom = 1) {
  return {
    x: (x - windowSize.width / 2) / zoom,
    y: (y - windowSize.height / 2) / zoom,
    zoom,
  };
}

describe('BentoGrid search card presentation', () => {
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

  it('compresses proportionally when the regular slot crosses a side edge', () => {
    const offscreenDistance = 60;
    const regularCenterX = SEARCH_CARD.EDGE_PADDING
      + SEARCH_CARD.EXPANDED_WIDTH / 2
      - offscreenDistance;
    const presentation = getSearchCardPresentation(
      cameraForScreenPosition(regularCenterX, windowSize.height / 2),
      windowSize,
    );

    expect(presentation.edge).toBe('left');
    expect(presentation.compression).toBeCloseTo(
      offscreenDistance / SEARCH_CARD.COMPRESSION_DISTANCE,
    );
    expect(presentation.width).toBeLessThan(SEARCH_CARD.EXPANDED_WIDTH);
    expect(presentation.width).toBeGreaterThan(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
    expect(presentation.height).toBe(SEARCH_CARD.EXPANDED_HEIGHT);
  });

  it('turns a stuck presentation into a static physics body with an exclusion zone', () => {
    const camera = cameraForScreenPosition(-SEARCH_CARD.EXPANDED_WIDTH, windowSize.height / 2);
    const presentation = getSearchCardPresentation(camera, windowSize);
    const physics = getSearchCardPhysicsState(presentation, camera, windowSize);

    expect(physics.isStatic).toBe(true);
    expect(physics.exclusionZone).not.toBeNull();
    expect(physics.layout.width).toBeCloseTo(SEARCH_CARD.SQUASHED_SIDE_WIDTH);
    expect(physics.layout.height).toBeCloseTo(SEARCH_CARD.EXPANDED_HEIGHT);
  });
});
