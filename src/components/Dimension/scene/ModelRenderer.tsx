import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box, useGLTF } from '@react-three/drei';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type {
  LODModelProps,
  ModelError,
  ModelFormat,
  STLModelWrapperProps,
} from '../Dimension.types';
import { isMobileDevice } from '../Dimension.utils';
import { FallbackModel } from './FallbackModel';
import { ORIGIN, SCENE_COLORS } from './constants';
import { ResponsiveOrbitControls } from './ResponsiveOrbitControls';
import { StationaryBackground } from './StationaryBackground';

function getModelFormat(path: string): ModelFormat {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension === 'gltf' || extension === 'glb' ? 'gltf' : 'stl';
}

function SkeletonLoader() {
  const isMobile = useMemo(() => isMobileDevice(), []);
  const controlsRef = useRef(null);

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

function LODModel({
  modelPath = '/models/placeholder.stl',
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: LODModelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const fpsRef = useRef(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isMobile = useMemo(() => isMobileDevice(), []);
  const [lodLevel, setLodLevel] = useState(0);
  const geometry = useLoader(STLLoader, modelPath);

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += delta * 0.2 * rotationSpeed;
      meshRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }

    const currentTime = performance.now();
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime;
    }

    frameCountRef.current += 1;
    if (currentTime < lastTimeRef.current + 1000) {
      return;
    }

    fpsRef.current = Math.round(
      (frameCountRef.current * 1000) / (currentTime - lastTimeRef.current)
    );
    frameCountRef.current = 0;
    lastTimeRef.current = currentTime;

    const meshPosition = meshRef.current?.position || ORIGIN;
    const distanceFromCamera = camera.position.distanceTo(meshPosition);
    const fps = fpsRef.current;

    let nextLodLevel = 0;
    if (isMobile || fps < 30) {
      if (distanceFromCamera > 10) {
        nextLodLevel = 2;
      } else if (distanceFromCamera > 5) {
        nextLodLevel = 1;
      }
    } else if (distanceFromCamera > 20) {
      nextLodLevel = 2;
    } else if (distanceFromCamera > 10) {
      nextLodLevel = 1;
    }

    setLodLevel((previousLevel) =>
      previousLevel !== nextLodLevel ? nextLodLevel : previousLevel
    );
  });

  const scale =
    lodLevel === 2 ? 0.008 : lodLevel === 1 ? 0.009 : 0.01;

  const materialProps = useMemo(
    () => ({
      color: SCENE_COLORS.model,
      wireframe: isWireframe,
    }),
    [isWireframe]
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      scale={scale}
      position={[0, 0, 0]}
      onClick={onClick}
      castShadow={!isMobile}
      receiveShadow={!isMobile}
      frustumCulled
    >
      <meshStandardMaterial {...materialProps} />
    </mesh>
  );
}

function GLTFModel({
  modelPath,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const isMobile = useMemo(() => isMobileDevice(), []);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3 * rotationSpeed;
    }
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) {
        return;
      }

      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (material instanceof THREE.MeshStandardMaterial) {
            material.wireframe = isWireframe;
          }
        });
      } else if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.wireframe = isWireframe;
      }

      child.castShadow = !isMobile;
      child.receiveShadow = !isMobile;
    });
  }, [isMobile, isWireframe, scene]);

  return (
    <group ref={groupRef} onClick={onClick}>
      <primitive object={scene} scale={1} />
    </group>
  );
}

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: ModelError) => void;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  error?: ModelError;
}

class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { hasError: true, error: SceneErrorBoundary.classifyError(error) };
  }

  private static classifyError(error: Error): ModelError {
    const errorWithStatus = error as Error & { status?: number; statusCode?: number };
    const status = errorWithStatus.status ?? errorWithStatus.statusCode;

    if (status === 404) {
      return {
        message: 'Model file not found. Please check the file path or select a different model.',
        code: 'FILE_NOT_FOUND',
        retryable: true,
      };
    }
    if (status === 403) {
      return {
        message: 'Access denied. Please check file permissions.',
        code: 'ACCESS_DENIED',
        retryable: false,
      };
    }
    if (status && status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        retryable: true,
      };
    }
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }
    if (error.name === 'SyntaxError') {
      return {
        message: 'Invalid model format. Please ensure the file is a valid 3D model.',
        code: 'INVALID_FORMAT',
        retryable: false,
      };
    }

    const message = error.message.toLowerCase();

    if (message.includes('404') || message.includes('not found')) {
      return {
        message: 'Model file not found. Please check the file path or select a different model.',
        code: 'FILE_NOT_FOUND',
        retryable: true,
      };
    }
    if (message.includes('cors') || message.includes('cross-origin')) {
      return {
        message: 'Cross-origin request blocked. Please check server configuration.',
        code: 'CORS_ERROR',
        retryable: false,
      };
    }
    if (message.includes('format') || message.includes('parse') || message.includes('invalid')) {
      return {
        message: 'Invalid model format. Please ensure the file is a valid 3D model.',
        code: 'INVALID_FORMAT',
        retryable: false,
      };
    }
    if (message.includes('timeout')) {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }

    return {
      message: 'Failed to load model. Please try again or contact support.',
      code: 'UNKNOWN_ERROR',
      retryable: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('3D Model Error Boundary caught an error:', error, errorInfo);
    }

    if (this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <FallbackModel error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function ModelWrapper({
  modelPath = '/models/placeholder.stl',
  onError,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: STLModelWrapperProps) {
  return (
    <React.Suspense fallback={<SkeletonLoader />}>
      <SceneErrorBoundary onError={onError}>
        {getModelFormat(modelPath) === 'gltf' ? (
          <GLTFModel
            modelPath={modelPath}
            autoRotate={autoRotate}
            onClick={onClick}
            isWireframe={isWireframe}
            rotationSpeed={rotationSpeed}
          />
        ) : (
          <LODModel
            modelPath={modelPath}
            autoRotate={autoRotate}
            onClick={onClick}
            isWireframe={isWireframe}
            rotationSpeed={rotationSpeed}
          />
        )}
      </SceneErrorBoundary>
    </React.Suspense>
  );
}
