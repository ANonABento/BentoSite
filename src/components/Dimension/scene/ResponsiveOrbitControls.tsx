import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ResponsiveOrbitControlsProps } from '../Dimension.types';

export const ResponsiveOrbitControls = forwardRef<
  OrbitControlsImpl | null,
  ResponsiveOrbitControlsProps
>(function ResponsiveOrbitControls(
  {
    isMobile,
    onZoomChange,
  },
  ref
) {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const lastZoomRef = useRef(-1);
  const invalidate = useThree((state) => state.invalidate);

  useImperativeHandle(ref, () => controlsRef.current);

  const handleChange = useCallback(() => {
    invalidate();

    if (!controlsRef.current || !onZoomChange) {
      return;
    }

    const distance = Math.round(controlsRef.current.object.position.length());
    if (distance !== lastZoomRef.current) {
      lastZoomRef.current = distance;
      onZoomChange(distance);
    }
  }, [invalidate, onZoomChange]);

  // Auto-rotation is owned by the model's `useFrame` (model spins on its own
  // axis, the camera and grid stay still). Drei's `autoRotate` would orbit
  // the camera AROUND the model and stack with the model's self-rotation —
  // the two un-synced motions are exactly the "non-smooth" feel.
  return (
    <OrbitControls
      ref={controlsRef}
      onChange={handleChange}
      autoRotate={false}
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
