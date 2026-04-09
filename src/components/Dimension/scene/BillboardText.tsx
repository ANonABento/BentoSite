import { useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { BillboardTextProps } from '../Dimension.types';
import { SCENE_COLORS } from './constants';

export function BillboardText({
  text,
  position,
  color = SCENE_COLORS.error,
  size = 0.8,
}: BillboardTextProps) {
  const textRef = useRef<THREE.Object3D>(null);

  useFrame((state) => {
    textRef.current?.lookAt(state.camera.position);
  });

  return (
    <Text
      ref={textRef}
      position={position}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      material-toneMapped={false}
    >
      {text}
    </Text>
  );
}
