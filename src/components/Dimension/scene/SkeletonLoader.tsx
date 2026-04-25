import { useMemo, useRef } from 'react';
import { Box } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { isMobileDevice } from '../Dimension.utils';
import { SCENE_COLORS } from './constants';
import { ResponsiveOrbitControls } from './ResponsiveOrbitControls';
import { StationaryBackground } from './StationaryBackground';

export function SkeletonLoader() {
  const isMobile = useMemo(() => isMobileDevice(), []);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[15, 15, 15]} intensity={isMobile ? 0.6 : 0.8} />
      <pointLight position={[-10, 10, -10]} intensity={isMobile ? 0.2 : 0.4} />
      <StationaryBackground />
      <Box position={[0, 0, 0]} scale={[1, 1, 1]} frustumCulled>
        <meshStandardMaterial color={SCENE_COLORS.skeleton} wireframe />
      </Box>
      <ResponsiveOrbitControls ref={controlsRef} autoRotate isMobile={isMobile} />
    </>
  );
}
