import { useMemo } from 'react';
import { Grid } from '@react-three/drei';
import { GRID_POSITIONS, GRID_ROTATIONS, GRID_SIZE } from '../Dimension.config';
import { isMobileDevice } from '../Dimension.utils';
import { GRID_STYLE } from './constants';

export function StationaryBackground() {
  const isMobile = useMemo(() => isMobileDevice(), []);
  const fadeDistance = isMobile ? 20 : 30;

  return (
    <>
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.floor}
        {...GRID_STYLE}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.frontWall}
        rotation={GRID_ROTATIONS.frontWall}
        {...GRID_STYLE}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.backWall}
        rotation={GRID_ROTATIONS.backWall}
        {...GRID_STYLE}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.rightWall}
        rotation={GRID_ROTATIONS.rightWall}
        {...GRID_STYLE}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
      <Grid
        args={[GRID_SIZE, GRID_SIZE]}
        position={GRID_POSITIONS.leftWall}
        rotation={GRID_ROTATIONS.leftWall}
        {...GRID_STYLE}
        fadeDistance={fadeDistance}
        followCamera={false}
      />
    </>
  );
}
