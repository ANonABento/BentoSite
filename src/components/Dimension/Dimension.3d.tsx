// Dimension.tsx - 3D and Three.js Components

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Box, Grid, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

import type { 
  ResponsiveOrbitControlsProps,
  LODModelProps,
  BillboardTextProps,
  FallbackModelProps,
  STLModelWrapperProps,
  ModelFormat
} from './Dimension.types';

// Utility to detect model format from path
export function getModelFormat(path: string): ModelFormat {
  const extension = path.split('.').pop()?.toLowerCase();
  if (extension === 'gltf' || extension === 'glb') return 'gltf';
  return 'stl';
}

// Billboard Text Component (always faces camera)
export function BillboardText({ text, position, color = "#dc2626", size = 0.8 }: BillboardTextProps) {
  const textRef = useRef<any>(null);
  
  useFrame((state) => {
    if (textRef.current) {
      // Make text always face the camera
      textRef.current.lookAt(state.camera.position);
    }
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

// Fallback Geometry Component - Wireframe Red Box
export function FallbackModel({ error }: FallbackModelProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [clicked, setClicked] = React.useState(false);
  const [autoRotate, setAutoRotate] = React.useState(true);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   ('ontouchstart' in window);

  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      {/* Wireframe red cube */}
      <Box
        ref={meshRef}
        position={[0, 0, 0]}
        scale={clicked ? 1.5 : 1}
        onClick={() => setClicked(!clicked)}
        castShadow={!isMobile}
        receiveShadow={!isMobile}
        // Enable frustum culling
        frustumCulled={true}
      >
        <meshStandardMaterial 
          color={error ? "#dc2626" : "#666666"} 
          wireframe={true}
          transparent={false}
        />
      </Box>
      
      {/* Error indicator text (billboard - always faces camera) */}
      {error && (
        <BillboardText 
          text="MODEL ERROR" 
          position={[0, 2.5, 0]} 
          color="#ef4444" 
          size={0.6}
        />
      )}
      
      {/* Helper instruction text (billboard) */}
      <BillboardText 
        text="Click cube • Using fallback geometry" 
        position={[0, -2.5, 0]} 
        color="#9ca3af" 
        size={0.4}
      />
    </group>
  );
}

export function SkeletonLoader() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   ('ontouchstart' in window);
  const controlsRef = useRef<any>(null);
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[15, 15, 15]} intensity={isMobile ? 0.6 : 0.8} />
      <pointLight position={[-10, 10, -10]} intensity={isMobile ? 0.2 : 0.4} />
      
      <StationaryBackground />
      
      {/* Skeleton 3D model placeholder */}
      <Box
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
        frustumCulled={true}
      >
        <meshStandardMaterial color="#444444" wireframe />
      </Box>
      
      <ResponsiveOrbitControls ref={controlsRef} autoRotate={true} onResetView={() => {}} isMobile={isMobile} />
    </>
  );
}

// Stationary background components
export function StationaryBackground() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   ('ontouchstart' in window);
  
  return (
    <>
      {/* Floor grid */}
      <Grid
        args={[20, 20]}
        position={[0, -3, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="rgba(148, 148, 148, 1)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(138, 138, 138, 1)"
        fadeDistance={isMobile ? 20 : 30}
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
        cellColor="rgba(148, 148, 148, 1)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(138, 138, 138, 1)"
        fadeDistance={isMobile ? 20 : 30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[0, 7, 10]}
        rotation={[-Math.PI / 2, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="rgba(148, 148, 148, 1)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(138, 138, 138, 1)"
        fadeDistance={isMobile ? 20 : 30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[10, 7, 0]}
        rotation={[Math.PI / 2, 0, Math.PI / 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="rgba(148, 148, 148, 1)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(138, 138, 138, 1)"
        fadeDistance={isMobile ? 20 : 30}
        fadeStrength={3}
        followCamera={false}
      />
      <Grid
        args={[20, 20]}
        position={[-10, 7, 0]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="rgba(148, 148, 148, 1)"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="rgba(138, 138, 138, 1)"
        fadeDistance={isMobile ? 20 : 30}
        fadeStrength={3}
        followCamera={false}
      />
    </>
  );
}

// Level of Detail Component
export function LODModel({ modelPath = '/models/placeholder.stl', autoRotate, onClick, isWireframe }: LODModelProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [clicked, setClicked] = React.useState(false);
  const { camera } = useThree();
  const [fps, setFps] = React.useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   ('ontouchstart' in window);
  
  // FPS monitoring
  const updateFps = () => {
    frameCountRef.current++;
    const currentTime = performance.now();
    
    if (currentTime >= lastTimeRef.current + 1000) {
      setFps(Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)));
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
    }
  };
  
  // Calculate distance from camera
  const distanceFromCamera = camera.position.distanceTo(meshRef.current?.position || new THREE.Vector3(0, 0, 0));
  
  // Determine LOD level based on distance and device performance
  const getLODLevel = () => {
    if (isMobile || fps < 30) {
      // Lower LOD for mobile or low performance
      if (distanceFromCamera > 10) return 2; // Low detail
      if (distanceFromCamera > 5) return 1;  // Medium detail
      return 0; // High detail
    } else {
      // Higher LOD for desktop with good performance
      if (distanceFromCamera > 20) return 2; // Low detail
      if (distanceFromCamera > 10) return 1; // Medium detail
      return 0; // High detail
    }
  };
  
  const lodLevel = getLODLevel();
  
  // Use useLoader with error handling
  let geometry;
  try {
    geometry = useLoader(STLLoader, modelPath);
  } catch (error) {
    throw error; // Re-throw to be caught by error boundary
  }
  
  useFrame((state, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
    
    // Update performance monitor
    updateFps();
  });

  // Apply geometry simplification based on LOD level
  let scale = clicked ? 0.015 : 0.01;
  let materialProps: THREE.MeshStandardMaterialParameters = { color: "#666666" };

  if (lodLevel === 2) {
    // Low detail: smaller scale
    scale *= 0.8;
  } else if (lodLevel === 1) {
    // Medium detail: medium scale
    scale *= 0.9;
  }
  
  // Apply wireframe override
  if (isWireframe) {
    materialProps = { ...materialProps, wireframe: true };
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={scale}
      position={[0, 0, 0]}
      onClick={onClick}
      castShadow={!isMobile} // Disable shadows on mobile
      receiveShadow={!isMobile}
      // Enable frustum culling
      frustumCulled={true}
    >
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

// Responsive Orbit Controls with Ref
export const ResponsiveOrbitControls = forwardRef<any, ResponsiveOrbitControlsProps>(({ 
  autoRotate, 
  onResetView,
  isMobile 
}, ref) => {
  const controlsRef = useRef<any>(null);
  
  useImperativeHandle(ref, () => controlsRef.current);
  
  React.useEffect(() => {
    // Auto-disable auto-rotation on mobile to prevent battery drain
    if (isMobile && autoRotate) {
      // Optional: Add a small delay before disabling
      const timer = setTimeout(() => {
        // Could implement a notification that rotation is disabled on mobile
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [autoRotate, isMobile]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={true}
      enableRotate={true}
      minDistance={isMobile ? 4 : 3} // Slightly more zoomed out on mobile
      maxDistance={isMobile ? 40 : 30} // Allow more zoom range on mobile
      enableDamping={true}
      dampingFactor={isMobile ? 0.1 : 0.05} // More responsive damping on mobile
      screenSpacePanning={isMobile} // Enable screen space panning on mobile
      maxPolarAngle={Math.PI / 2}
      // Touch gestures for mobile
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: isMobile ? THREE.TOUCH.DOLLY_PAN : THREE.TOUCH.DOLLY_ROTATE
      }}
      onEnd={(event) => {
        // Reset view on double tap for mobile
        if (isMobile && event?.target) {
          // Handle double tap reset if needed
        }
      }}
    />
  );
});

ResponsiveOrbitControls.displayName = 'ResponsiveOrbitControls';

// GLTF Model Component
interface GLTFModelProps {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
}

export function GLTFModel({ modelPath, autoRotate, onClick, isWireframe }: GLTFModelProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(modelPath);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                   window.innerWidth < 768 ||
                   ('ontouchstart' in window);

  useFrame((state, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Apply wireframe to all meshes in the scene
  React.useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.wireframe = isWireframe;
            }
          });
        } else if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.wireframe = isWireframe;
        }
        child.castShadow = !isMobile;
        child.receiveShadow = !isMobile;
      }
    });
  }, [scene, isWireframe, isMobile]);

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

// Universal Model wrapper - handles both STL and GLTF/GLB formats
export function ModelWrapper({ modelPath = '/models/placeholder.stl', onError, autoRotate, onClick, isWireframe }: STLModelWrapperProps) {
  const format = getModelFormat(modelPath);
  
  return (
    <React.Suspense fallback={<SkeletonLoader />}>
      <ErrorBoundary onError={onError}>
        {format === 'gltf' ? (
          <GLTFModel modelPath={modelPath} autoRotate={autoRotate} onClick={onClick} isWireframe={isWireframe} />
        ) : (
          <LODModel modelPath={modelPath} autoRotate={autoRotate} onClick={onClick} isWireframe={isWireframe} />
        )}
      </ErrorBoundary>
    </React.Suspense>
  );
}

// STL Model wrapper with comprehensive error handling (kept for backwards compatibility)
export function STLModelWrapper({ modelPath = '/models/placeholder.stl', onError, autoRotate, onClick, isWireframe }: STLModelWrapperProps) {
  return (
    <React.Suspense fallback={<SkeletonLoader />}>
      <ErrorBoundary onError={onError}>
        <LODModel modelPath={modelPath} autoRotate={autoRotate} onClick={onClick} isWireframe={isWireframe} />
      </ErrorBoundary>
    </React.Suspense>
  );
}

// Custom Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: any) => void },
  { hasError: boolean; error?: any }
> {
  constructor(props: { children: React.ReactNode; onError: (error: any) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): { hasError: boolean; error?: any } {
    // Determine error type and create appropriate error object
    let modelError;
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      modelError = {
        message: 'Model file not found. Please check the file path or select a different model.',
        code: 'FILE_NOT_FOUND',
        retryable: true
      };
    } else if (error.message.includes('format') || error.message.includes('parse')) {
      modelError = {
        message: 'Invalid STL format. Please ensure the file is a valid STL model.',
        code: 'INVALID_FORMAT',
        retryable: true
      };
    } else {
      modelError = {
        message: 'Failed to load model. Please try again or contact support.',
        code: 'UNKNOWN_ERROR',
        retryable: true
      };
    }

    return { hasError: true, error: modelError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Model Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <FallbackModel error={this.state.error} />;
    }

    return this.props.children;
  }
}