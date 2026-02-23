'use client';
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { MapViewerProps, MapLocation } from '../Viewfinder.types';
import { MapMarkerTooltip } from './MapMarkerTooltip';
import {
  useGlobePalette,
  useLandMaskTexture,
  useMapRenderConfig,
  type GlobePalette,
} from './map-globe-hooks';
import {
  buildMarkerLayout,
  latLngToPosition,
  type MarkerLayoutItem,
} from './map-marker-layout';

const GLOBE_RADIUS = 1.7;
const LAND_DOT_RADIUS = GLOBE_RADIUS + 0.004;
const MARKER_OFFSET = 0.018;
const LONGITUDE_OFFSET = 0.25;
const MARKER_LONGITUDE_OFFSET_DEG = -LONGITUDE_OFFSET * 360;

function createSinglePointGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  return geometry;
}

function createSphereDotGeometry(count: number, radius: number): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const radial = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * i;
    positions.push(
      Math.cos(theta) * radial * radius,
      y * radius,
      Math.sin(theta) * radial * radius
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

const MARKER_CORE_GEOMETRY = createSinglePointGeometry();
const MARKER_HALO_GEOMETRY = createSphereDotGeometry(12, 0.024);
const MARKER_SELECTED_HALO_GEOMETRY = createSphereDotGeometry(20, 0.052);
const MARKER_CLUSTER_HINT_GEOMETRY = new THREE.BufferGeometry().setAttribute(
  'position',
  new THREE.Float32BufferAttribute(
    [0.03, 0, 0, -0.03, 0, 0, 0, 0.03, 0, 0, -0.03, 0],
    3
  )
);

function useLandDotGeometry(texture: THREE.CanvasTexture | null, step: number) {
  const geometry = useMemo(() => {
    if (!texture) return null;

    const image = texture.image as HTMLCanvasElement;
    const context = image.getContext('2d', { willReadFrequently: true });
    if (!context) return null;

    const { width, height } = image;
    const imageData = context.getImageData(0, 0, width, height).data;
    const positions: number[] = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const alpha = imageData[idx + 3];
        if (alpha < 20) continue;

        const u = x / (width - 1);
        const v = y / (height - 1);
        const shiftedU = (u - LONGITUDE_OFFSET + 1) % 1;
        const lng = shiftedU * 360 - 180;
        const lat = 90 - v * 180;
        const [px, py, pz] = latLngToPosition(lat, lng, LAND_DOT_RADIUS);
        positions.push(px, py, pz);
      }
    }

    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    dotGeometry.computeBoundingSphere();
    return dotGeometry;
  }, [texture, step]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  return geometry;
}

interface GlobeMarkerProps {
  location: MapLocation;
  position: [number, number, number];
  stackIndex: number;
  stackSize: number;
  color: string;
  isSelected: boolean;
  dotSize: number;
  onSelect: (location: MapLocation) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  supportsHover: boolean;
}

function GlobeMarker({
  location,
  position,
  stackIndex,
  stackSize,
  color,
  isSelected,
  dotSize,
  onSelect,
  onHoverStart,
  onHoverEnd,
  supportsHover,
}: GlobeMarkerProps) {
  const markerRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!markerRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.1) * 0.03;
    markerRef.current.scale.setScalar(isSelected ? pulse * 1.16 : pulse);
  });

  const handlePointerOver = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation();
      document.body.style.cursor = 'pointer';
      if (supportsHover) onHoverStart(location.id);
    },
    [location.id, onHoverStart, supportsHover]
  );

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'default';
    if (supportsHover) onHoverEnd();
  }, [onHoverEnd, supportsHover]);

  const intensity = Math.min(1, 0.6 + stackSize * 0.08);
  const haloOpacity = isSelected ? 0.62 : 0.35;
  const coreSize = dotSize * (isSelected ? 5.1 : 4.2);
  const haloSize = dotSize * (isSelected ? 2.9 : 2.5);
  const clusterHintOpacity = Math.min(0.44, 0.16 + (stackSize - 1) * 0.06);

  return (
    <group ref={markerRef} position={position}>
      <points geometry={MARKER_HALO_GEOMETRY}>
        <pointsMaterial
          color={color}
          size={haloSize}
          sizeAttenuation
          transparent
          opacity={haloOpacity}
          depthWrite={false}
        />
      </points>

      <points geometry={MARKER_CORE_GEOMETRY}>
        <pointsMaterial
          color={color}
          size={coreSize}
          sizeAttenuation
          transparent
          opacity={0.94 * intensity}
          depthWrite={false}
        />
      </points>

      {(isSelected || stackSize > 1) && (
        <group rotation={[0, stackIndex * 1.3, 0]}>
          <points
            geometry={isSelected ? MARKER_SELECTED_HALO_GEOMETRY : MARKER_CLUSTER_HINT_GEOMETRY}
          >
            <pointsMaterial
              color={color}
              size={dotSize * (isSelected ? 2 : 1.7)}
              sizeAttenuation
              transparent
              opacity={isSelected ? 0.2 : clusterHintOpacity}
              depthWrite={false}
              depthTest={!isSelected}
            />
          </points>
        </group>
      )}

      <mesh
        scale={stackSize > 1 ? 1.15 : 1}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(location);
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[isSelected ? 0.1 : 0.085, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface GlobeSceneProps {
  markerLayout: MarkerLayoutItem[];
  selectedId: string | null;
  highlightedIds: string[];
  onLocationClick: (location: MapLocation) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
  supportsHover: boolean;
  palette: GlobePalette;
  landDotGeometry: THREE.BufferGeometry | null;
  dotSize: number;
}

function GlobeScene({
  markerLayout,
  selectedId,
  highlightedIds,
  onLocationClick,
  onHoverStart,
  onHoverEnd,
  supportsHover,
  palette,
  landDotGeometry,
  dotSize,
}: GlobeSceneProps) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[GLOBE_RADIUS, 56, 56]} />
        <meshBasicMaterial color={palette.surface} transparent opacity={0.12} />
      </mesh>
      {landDotGeometry && (
        <points geometry={landDotGeometry}>
          <pointsMaterial
            color={palette.land}
            size={dotSize}
            sizeAttenuation
            transparent
            opacity={0.92}
            depthWrite={false}
          />
        </points>
      )}
      {markerLayout.map(({ location, position, stackIndex, stackSize }) => {
        const markerColor = location.type === 'education' ? palette.interactive : palette.highlight;
        const isHighlighted = highlightedIds.includes(location.id);

        return (
          <GlobeMarker
            key={location.id}
            location={location}
            position={position}
            stackIndex={stackIndex}
            stackSize={stackSize}
            color={markerColor}
            isSelected={isHighlighted || selectedId === location.id}
            dotSize={dotSize}
            onSelect={onLocationClick}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
            supportsHover={supportsHover}
          />
        );
      })}
    </group>
  );
}

export function MapViewer({ locations, highlightedIds = [], onLocationClick }: MapViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const palette = useGlobePalette();
  const landMaskTexture = useLandMaskTexture();
  const { supportsHover, dotStep, dotSize } = useMapRenderConfig();
  const landDotGeometry = useLandDotGeometry(landMaskTexture, dotStep);
  const markerLayout = useMemo(
    () => buildMarkerLayout(locations, GLOBE_RADIUS + MARKER_OFFSET, MARKER_LONGITUDE_OFFSET_DEG),
    [locations]
  );

  const activeTooltipId = hoveredId ?? selectedId;
  const activeTooltipLocation = locations.find((location) => location.id === activeTooltipId) ?? null;

  const handleLocationClick = useCallback(
    (location: MapLocation) => {
      setSelectedId((prev) => (prev === location.id ? null : location.id));
      onLocationClick?.(location);
    },
    [onLocationClick]
  );

  if (!locations.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[var(--text-muted)]">
        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p>No locations available</p>
      </div>
    );
  }

  return (
    <div
      className="h-full w-full relative bg-[var(--surface-deep)] overflow-hidden"
      onClick={() => {
        setSelectedId(null);
        setHoveredId(null);
      }}
      onMouseLeave={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        style={{ background: 'transparent' }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[4, 3, 2]} intensity={0.7} />
        <pointLight position={[-3, -2, -2]} intensity={0.26} />
        <GlobeScene
          markerLayout={markerLayout}
          selectedId={selectedId}
          highlightedIds={highlightedIds}
          onLocationClick={handleLocationClick}
          onHoverStart={setHoveredId}
          onHoverEnd={() => setHoveredId(null)}
          supportsHover={supportsHover}
          palette={palette}
          landDotGeometry={landDotGeometry}
          dotSize={dotSize}
        />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.46}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.52}
        />
      </Canvas>

      {activeTooltipLocation && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <MapMarkerTooltip location={activeTooltipLocation} onClose={() => setSelectedId(null)} />
        </div>
      )}

      <div className="absolute bottom-4 right-4 text-[10px] text-[var(--text-muted)] bg-[var(--glass-bg)] border border-[var(--border)] px-2 py-1 rounded">
        Drag to rotate
      </div>
    </div>
  );
}
