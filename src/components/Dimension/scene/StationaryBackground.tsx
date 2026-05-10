import { useMemo } from 'react';
import { Grid } from '@react-three/drei';
import { GRID_POSITIONS, GRID_ROTATIONS, GRID_SIZE } from '../Dimension.config';
import { isMobileDevice } from '../Dimension.utils';
import { GRID_STYLE } from './constants';
import { useTheme } from '@/lib/theme-context';

interface ThemedGridStyle {
  cellColor: string;
  sectionColor: string;
}

/** Reads `--viewfinder-grid-*` from :root so grid lines flip with the theme. */
function readThemedGridStyle(theme: 'dark' | 'light'): ThemedGridStyle {
  const fallback: ThemedGridStyle = theme === 'light'
    ? { cellColor: 'rgba(168, 78, 24, 0.18)', sectionColor: 'rgba(168, 78, 24, 0.32)' }
    : { cellColor: GRID_STYLE.cellColor, sectionColor: GRID_STYLE.sectionColor };
  if (typeof window === 'undefined') return fallback;
  const root = window.getComputedStyle(document.documentElement);
  const read = (name: string, defaultValue: string) =>
    root.getPropertyValue(name).trim() || defaultValue;
  return {
    cellColor: read('--viewfinder-grid-cell', fallback.cellColor),
    sectionColor: read('--viewfinder-grid-section', fallback.sectionColor),
  };
}

function useThemedGridStyle(): ThemedGridStyle {
  const { theme } = useTheme();
  return useMemo(() => readThemedGridStyle(theme), [theme]);
}

export function StationaryBackground() {
  const isMobile = useMemo(() => isMobileDevice(), []);
  const fadeDistance = isMobile ? 20 : 30;
  const { cellColor, sectionColor } = useThemedGridStyle();

  const themedStyle = {
    ...GRID_STYLE,
    cellColor,
    sectionColor,
  };

  return (
    <>
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.floor}
        {...themedStyle}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.frontWall}
        rotation={GRID_ROTATIONS.frontWall}
        {...themedStyle}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.backWall}
        rotation={GRID_ROTATIONS.backWall}
        {...themedStyle}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.rightWall}
        rotation={GRID_ROTATIONS.rightWall}
        {...themedStyle}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.leftWall}
        rotation={GRID_ROTATIONS.leftWall}
        {...themedStyle}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
    </>
  );
}
