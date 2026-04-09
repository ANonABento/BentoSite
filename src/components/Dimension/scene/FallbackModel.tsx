import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { FallbackModelProps } from '../Dimension.types';
import { isMobileDevice } from '../Dimension.utils';
import { BillboardText } from './BillboardText';
import { SCENE_COLORS } from './constants';

export function FallbackModel({ error }: FallbackModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [clicked, setClicked] = useState(false);
  const isMobile = useMemo(() => isMobileDevice(), []);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      <Box
        ref={meshRef}
        position={[0, 0, 0]}
        scale={clicked ? 1.5 : 1}
        onClick={() => setClicked((previous) => !previous)}
        castShadow={!isMobile}
        receiveShadow={!isMobile}
        frustumCulled
      >
        <meshStandardMaterial
          color={error ? SCENE_COLORS.error : SCENE_COLORS.model}
          wireframe
        />
      </Box>

      {error ? (
        <BillboardText
          text="MODEL ERROR"
          position={[0, 2.5, 0]}
          color={SCENE_COLORS.errorText}
          size={0.6}
        />
      ) : null}

      <BillboardText
        text="Click cube • Using fallback geometry"
        position={[0, -2.5, 0]}
        color={SCENE_COLORS.muted}
        size={0.4}
      />
    </group>
  );
}
