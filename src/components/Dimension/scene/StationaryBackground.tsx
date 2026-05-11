import { Grid } from '@react-three/drei';
import { GRID_POSITIONS, GRID_ROTATIONS, GRID_SIZE } from '../Dimension.config';
import { GRID_STYLE } from './constants';
import { useTheme } from '@/lib/theme-context';

interface ThemedGridStyle {
  cellColor: string;
  sectionColor: string;
}

/** Mirrored from theme.css to avoid the html-class cascade lag — see the
 *  comment on VIEWER_THEMES in Dimension.viewport.tsx. */
const GRID_THEMES: Record<'dark' | 'light', ThemedGridStyle> = {
  dark: { cellColor: GRID_STYLE.cellColor, sectionColor: GRID_STYLE.sectionColor },
  light: { cellColor: 'rgba(168, 78, 24, 0.18)', sectionColor: 'rgba(168, 78, 24, 0.32)' },
};

function useThemedGridStyle(): ThemedGridStyle {
  const { theme } = useTheme();
  return GRID_THEMES[theme];
}

export function StationaryBackground({ isMobile }: { isMobile: boolean }) {
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
