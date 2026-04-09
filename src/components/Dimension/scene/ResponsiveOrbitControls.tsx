import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ResponsiveOrbitControlsProps } from '../Dimension.types';

export const ResponsiveOrbitControls = forwardRef<
  OrbitControlsImpl | null,
  ResponsiveOrbitControlsProps
>(function ResponsiveOrbitControls(
  {
    autoRotate,
    isMobile,
    rotationSpeed = 1,
    onZoomChange,
  },
  ref
) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const lastZoomRef = useRef(-1);

  useImperativeHandle(ref, () => controlsRef.current);

  const handleChange = useCallback(() => {
    if (!controlsRef.current || !onZoomChange) {
      return;
    }

    const distance = Math.round(controlsRef.current.object.position.length());
    if (distance !== lastZoomRef.current) {
      lastZoomRef.current = distance;
      onZoomChange(distance);
    }
  }, [onZoomChange]);

  return (
    <OrbitControls
      ref={controlsRef}
      onChange={handleChange}
      autoRotate={autoRotate}
      autoRotateSpeed={2 * rotationSpeed}
      enableZoom
      enablePan
      enableRotate
      minDistance={isMobile ? 4 : 3}
      maxDistance={isMobile ? 40 : 30}
      enableDamping
      dampingFactor={isMobile ? 0.1 : 0.05}
      screenSpacePanning={isMobile}
      maxPolarAngle={Math.PI / 2}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: isMobile ? THREE.TOUCH.DOLLY_PAN : THREE.TOUCH.DOLLY_ROTATE,
      }}
    />
  );
});
