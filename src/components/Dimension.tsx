'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Grid, useGLTF, Line, Text } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

// Stationary background components
function StationaryBackground() {
  return (
    <>
      {/* Floor grid */}
      <Grid
        args={[20, 20]}
        position={[0, -3, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#ff0000ff"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0066ffff"
        fadeDistance={30}
        fadeStrength={3}
        followCamera={false}
      />
      
      {/* Grid cube/room*/}
      <Grid
        args={[20, 20]}
        position={[0, 7, -10]}
        rotation={[Math.PI / 2, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2d3748"
        fadeDistance={30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[0, 7, 10]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2d3748"
        fadeDistance={30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[10, 7, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2d3748"
        fadeDistance={30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[-10, 7, 0]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#4a5568"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2d3748"
        fadeDistance={30}
        fadeStrength={3}
        followCamera={false}
      />
    </>
  );
}

// Animated main model component
function AnimatedModel() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <Box
      args={[2, 2, 2]}
      position={[0, 0, 0]}
      ref={meshRef}
      scale={clicked ? 1.5 : 1}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <meshStandardMaterial
        color={hovered ? "#4299e1" : (clicked ? "#48bb78" : "#666666")}
      />
    </Box>
  );
}

export default function DimensionViewer() {
  return (
    <div className="w-full h-full bg-zinc-700">
      <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[15, 15, 15]} intensity={0.8} />
        <pointLight position={[-10, 10, -10]} intensity={0.4} />
        
        {/* Stationary background elements */}
        <StationaryBackground />
        
        {/* Main animated model */}
        <AnimatedModel />

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          enableDamping={true}
          dampingFactor={0.05}
          screenSpacePanning={false}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}