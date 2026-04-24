'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Broken CRT TV shader with all the glitch effects
const CRTShader = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
    uIntensity: 1.0,
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader - Broken CRT TV effect
  `
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uIntensity;
    varying vec2 vUv;

    #define PI 3.14159265359

    // Random hash function
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float hash1(float n) {
      return fract(sin(n) * 43758.5453123);
    }

    // Noise function for static
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }

    // Screen curvature (barrel distortion)
    vec2 curveScreen(vec2 uv) {
      vec2 cuv = uv * 2.0 - 1.0;
      vec2 offset = cuv.yx / 8.0;
      cuv += cuv * offset * offset;
      return cuv * 0.5 + 0.5;
    }

    // VHS tracking distortion
    float vhsTracking(vec2 uv, float time) {
      float trackingNoise = 0.0;

      // Occasional horizontal tracking lines
      float lineY = fract(time * 0.3);
      float lineThickness = 0.02;
      float dist = abs(uv.y - lineY);
      if (dist < lineThickness) {
        trackingNoise = (1.0 - dist / lineThickness) * 0.15;
      }

      // Random horizontal jitter bands
      float band = floor(uv.y * 30.0);
      float jitter = hash1(band + floor(time * 8.0)) * step(0.97, hash1(band * 0.1 + time));
      trackingNoise += jitter * 0.1;

      return trackingNoise;
    }

    // RGB chromatic aberration
    vec3 chromaticAberration(vec2 uv, float amount) {
      vec2 offset = vec2(amount, 0.0);
      float r = 0.0;
      float g = 0.0;
      float b = 0.0;

      // Sample the "screen" at offset positions
      // Since we're drawing a blank screen, we use noise-based colors
      vec2 uvR = uv + offset;
      vec2 uvB = uv - offset;

      return vec3(1.0); // Placeholder - actual colors set below
    }

    void main() {
      // Apply screen curvature
      vec2 uv = curveScreen(vUv);

      // Check if we're outside the curved screen
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }

      float time = uTime;

      // Base dark background with subtle gradient
      vec3 bgColor = vec3(0.04, 0.04, 0.06);

      // Add subtle synthwave gradient (pink to purple to cyan)
      float gradientY = uv.y;
      vec3 gradientTop = vec3(0.05, 0.0, 0.08);    // Dark purple
      vec3 gradientBot = vec3(0.02, 0.04, 0.06);   // Dark teal
      bgColor = mix(gradientBot, gradientTop, gradientY * 0.3);

      // VHS tracking distortion
      float tracking = vhsTracking(uv, time);
      uv.x += tracking * uIntensity;

      // Scanlines
      float scanline = sin(uv.y * uResolution.y * 1.5) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5) * 0.08 * uIntensity;

      // Horizontal scan beam (moving)
      float scanBeam = 1.0 - smoothstep(0.0, 0.15, abs(uv.y - fract(time * 0.1)));
      scanBeam *= 0.03 * uIntensity;

      // Static noise
      float staticNoise = noise(uv * 500.0 + time * 100.0);
      staticNoise *= 0.06 * uIntensity;

      // RGB chromatic aberration offset
      float aberrationAmount = 0.003 * uIntensity;
      aberrationAmount += tracking * 0.01; // More aberration during tracking errors

      // Random glitch moments
      float glitchTrigger = step(0.995, hash1(floor(time * 4.0)));
      float glitchIntensity = glitchTrigger * 0.5;
      aberrationAmount += glitchIntensity * 0.01;

      // Apply chromatic aberration to scanlines and noise
      vec2 offsetR = vec2(aberrationAmount, 0.0);
      vec2 offsetB = vec2(-aberrationAmount, 0.0);

      vec2 uvR = uv + offsetR;
      vec2 uvB = uv - offsetB;

      // Scanlines with RGB split
      float scanlineR = sin(uvR.y * uResolution.y * 1.5) * 0.5 + 0.5;
      float scanlineG = sin(uv.y * uResolution.y * 1.5) * 0.5 + 0.5;
      float scanlineB = sin(uvB.y * uResolution.y * 1.5) * 0.5 + 0.5;

      // Combine all effects
      vec3 color = bgColor;

      // Apply scanlines per channel
      color.r -= pow(scanlineR, 1.5) * 0.04 * uIntensity;
      color.g -= pow(scanlineG, 1.5) * 0.04 * uIntensity;
      color.b -= pow(scanlineB, 1.5) * 0.04 * uIntensity;

      // Add scan beam glow
      color += vec3(0.03, 0.01, 0.04) * scanBeam;

      // Add static noise
      color += staticNoise * vec3(0.8, 0.9, 1.0);

      // Add subtle neon glow at edges (synthwave vibe)
      float edgeGlow = smoothstep(0.5, 0.0, abs(uv.x - 0.5)) * smoothstep(0.5, 0.0, abs(uv.y - 0.5));
      edgeGlow = 1.0 - edgeGlow;
      edgeGlow = pow(edgeGlow, 3.0);

      // Pink glow at top, cyan at bottom
      vec3 pinkGlow = vec3(1.0, 0.0, 0.5) * edgeGlow * 0.03 * (1.0 - uv.y);
      vec3 cyanGlow = vec3(0.0, 1.0, 1.0) * edgeGlow * 0.02 * uv.y;
      color += pinkGlow + cyanGlow;

      // Flicker
      float flicker = 1.0 - sin(time * 60.0) * 0.01 * uIntensity;
      flicker -= glitchTrigger * 0.1; // Heavier flicker during glitch
      color *= flicker;

      // Vignette
      vec2 vignetteUv = vUv * (1.0 - vUv);
      float vignette = vignetteUv.x * vignetteUv.y * 15.0;
      vignette = pow(vignette, 0.25);
      color *= vignette;

      // Slight color fringing at screen edges
      float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
      if (edgeDist < 0.05) {
        float fringe = 1.0 - edgeDist / 0.05;
        color.r *= 1.0 + fringe * 0.1;
        color.b *= 1.0 - fringe * 0.05;
      }

      // Random horizontal glitch bars
      if (glitchTrigger > 0.0) {
        float barY = hash1(floor(time * 20.0));
        float barHeight = 0.03;
        if (abs(uv.y - barY) < barHeight) {
          // Shift and discolor the glitch bar
          color = mix(color, vec3(1.0, 0.0, 0.5), 0.3);
          color.rgb = color.brg; // Color channel swap
        }
      }

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

function CRTShaderMesh({ reducedMotion, isMobile }: { reducedMotion: boolean; isMobile: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, size } = useThree();

  const material = useMemo(() => new CRTShader(), []);

  useFrame((state) => {
    if (material && !reducedMotion) {
      // eslint-disable-next-line react-hooks/immutability
      material.uTime = state.clock.elapsedTime;
      material.uResolution.set(size.width, size.height);
      // eslint-disable-next-line react-hooks/immutability
      material.uIntensity = isMobile ? 0.6 : 1.0;
    }
  });

  useEffect(() => {
    if (material) {
      material.uResolution.set(size.width, size.height);
      // eslint-disable-next-line react-hooks/immutability
      material.uIntensity = isMobile ? 0.6 : 1.0;
    }
  }, [size, material, isMobile]);

  return (
    <mesh ref={meshRef} material={material} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

function Scene({ reducedMotion, isMobile }: { reducedMotion: boolean; isMobile: boolean }) {
  return <CRTShaderMesh reducedMotion={reducedMotion} isMobile={isMobile} />;
}

export function CRTBackground() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div
        className="w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #0a0a0a 0%, #0a0612 50%, #060a0a 100%)',
        }}
      />
    );
  }

  return (
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 10 }}
      dpr={isMobile ? 1 : 1.5}
      gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
      style={{
        background: '#0a0a0a',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Scene reducedMotion={reducedMotion} isMobile={isMobile} />
    </Canvas>
  );
}
