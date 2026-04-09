'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth < 768;
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

// Grok/Interstellar-style black hole shader
const GrokBlackHoleShader = shaderMaterial(
  {
    uTime: 0,
    uResolution: new THREE.Vector2(1, 1),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    #define PI 3.14159265359
    #define MAX_STEPS 50
    #define SCHWARZSCHILD_RADIUS 1.0

    // Hash for stars
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }

    float hash3(vec3 p) {
      return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
    }

    // Noise for disk turbulence
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                 mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }

    // Sparse dim stars
    vec3 starField(vec3 dir) {
      vec3 col = vec3(0.0);
      for(float i = 0.0; i < 2.0; i++) {
        vec3 p = dir * (300.0 + i * 200.0);
        vec3 id = floor(p);
        vec3 f = fract(p) - 0.5;
        float rnd = hash3(id + i * 41.0);
        if(rnd > 0.992) {
          float brightness = smoothstep(0.03, 0.0, length(f));
          brightness *= 0.5 + 0.5 * sin(uTime * 0.3 + rnd * 6.28);
          col += vec3(0.8, 0.85, 0.9) * brightness * 0.06;
        }
      }
      return col;
    }

    // Gravitational ray bending
    vec3 bendRay(vec3 pos, vec3 dir, float stepSize) {
      float r = length(pos);
      if(r < 0.01) return dir;
      float rs = SCHWARZSCHILD_RADIUS;
      float factor = 1.5 * rs / (r * r * r);
      vec3 toCenter = -normalize(pos);
      vec3 perpForce = toCenter - dir * dot(toCenter, dir);
      return normalize(dir + perpForce * factor * stepSize);
    }

    // Accretion disk with sharp ring definition
    vec4 accretionDisk(vec3 pos, vec3 dir, float time) {
      float innerRadius = 1.8 * SCHWARZSCHILD_RADIUS;
      float outerRadius = 4.5 * SCHWARZSCHILD_RADIUS;
      float diskHeight = 0.02; // Much thinner disk

      if(abs(dir.y) < 0.0001) return vec4(0.0);

      float t = -pos.y / dir.y;
      if(t < 0.0) return vec4(0.0);

      vec3 hitPos = pos + dir * t;
      float r = length(hitPos.xz);

      if(r < innerRadius || r > outerRadius) return vec4(0.0);

      float yDist = abs(pos.y + dir.y * t);
      float diskProfile = exp(-yDist * yDist / (diskHeight * diskHeight));

      // Sharper ring structure with multiple bands
      float angle = atan(hitPos.z, hitPos.x);
      float rotAngle = angle + time * 0.06 - r * 2.0;

      // Primary ring concentration
      float ringCenter = 2.5 * SCHWARZSCHILD_RADIUS;
      float ringConcentration = exp(-pow((r - ringCenter) / 0.8, 2.0));

      // Subtle spiral arms
      float spiral = sin(rotAngle * 3.0) * 0.15 + 0.85;

      // Fine turbulence for texture (reduced)
      float turb = noise(vec2(angle * 3.0, r * 6.0) + time * 0.03) * 0.08;

      // Temperature gradient - hotter near center
      float temp = pow(innerRadius / r, 0.9);

      // Warm Interstellar colors with higher contrast
      vec3 diskColor;
      if(temp > 0.85) {
        // Hot inner - white/pale yellow
        diskColor = mix(vec3(1.0, 0.9, 0.6), vec3(1.0, 0.98, 0.92), (temp - 0.85) / 0.15);
      } else if(temp > 0.55) {
        // Mid - bright orange/yellow
        diskColor = mix(vec3(1.0, 0.55, 0.1), vec3(1.0, 0.9, 0.6), (temp - 0.55) / 0.3);
      } else {
        // Outer - deep red/orange
        diskColor = mix(vec3(0.5, 0.1, 0.02), vec3(1.0, 0.55, 0.1), temp / 0.55);
      }

      // Doppler beaming - approaching side brighter
      float orbitalVel = sqrt(SCHWARZSCHILD_RADIUS / r) * 0.5;
      float doppler = 1.0 + orbitalVel * sin(angle + time * 0.08);

      // Combine with ring concentration for sharper definition
      float brightness = (spiral + turb) * diskProfile * doppler * (0.4 + ringConcentration * 0.6);

      // Sharper radial edges
      float radialFade = smoothstep(innerRadius, innerRadius + 0.15, r) *
                         smoothstep(outerRadius, outerRadius - 0.4, r);

      // Increased brightness for visibility
      float alpha = brightness * radialFade * 0.35;

      return vec4(diskColor * brightness * radialFade * 0.55, alpha);
    }

    // Photon ring glow - bright thin ring at photon sphere
    vec3 photonRing(vec3 pos, float r) {
      float photonRadius = 1.5 * SCHWARZSCHILD_RADIUS;
      // Sharper, brighter photon ring
      float ring = smoothstep(0.06, 0.0, abs(r - photonRadius));
      ring *= smoothstep(0.15, 0.04, abs(pos.y));
      // Warm white glow
      return vec3(1.0, 0.95, 0.85) * ring * 0.15;
    }

    void main() {
      vec2 uv = vUv - 0.5;
      float aspect = uResolution.x / uResolution.y;
      uv.x *= aspect;

      // Camera - slightly above, looking at black hole
      vec3 camPos = vec3(0.0, 2.5, 12.0);
      vec3 lookAt = vec3(0.0, 0.0, 0.0);

      vec3 forward = normalize(lookAt - camPos);
      vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
      vec3 up = cross(forward, right);

      float fov = 0.45;
      vec3 rayDir = normalize(forward + right * uv.x * fov + up * uv.y * fov);

      // Ray march with gravity
      vec3 pos = camPos;
      vec3 dir = rayDir;
      vec3 color = vec3(0.0);
      float stepSize = 0.12;
      bool hitHorizon = false;
      vec4 diskAccum = vec4(0.0);

      for(int i = 0; i < MAX_STEPS; i++) {
        float r = length(pos);

        if(r < SCHWARZSCHILD_RADIUS * 0.5) {
          hitHorizon = true;
          break;
        }

        if(r > 40.0) break;

        // Sample accretion disk (both above and below due to lensing)
        vec4 diskSample = accretionDisk(pos, dir, uTime);
        if(diskSample.a > 0.001) {
          diskAccum.rgb += diskSample.rgb * diskSample.a * (1.0 - diskAccum.a);
          diskAccum.a += diskSample.a * (1.0 - diskAccum.a);
        }

        // Photon ring
        color += photonRing(pos, r) * (1.0 - diskAccum.a) * 0.015;

        // Bend ray
        dir = bendRay(pos, dir, stepSize);
        stepSize = 0.08 + 0.2 * smoothstep(2.0, 8.0, r);
        pos += dir * stepSize;
      }

      if(hitHorizon) {
        color = vec3(0.0);
      } else {
        // Lensed stars
        color += starField(dir) * (1.0 - diskAccum.a);
      }

      // Composite disk
      color += diskAccum.rgb;

      // Pure black background
      // (no ambient color added)

      // Vignette
      float vignette = 1.0 - smoothstep(0.4, 1.3, length(uv));
      color *= vignette;

      // Tone mapping - keep dark
      color = color / (color + vec3(0.8));

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

function BlackHoleShader({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<InstanceType<typeof GrokBlackHoleShader> | null>(null);
  const { viewport, size } = useThree();

  const [material] = useState(() => new GrokBlackHoleShader());

  useEffect(() => {
    materialRef.current = material;

    return () => {
      material.dispose();
      materialRef.current = null;
    };
  }, [material]);

  useFrame((state) => {
    const shader = materialRef.current;
    if (shader && !reducedMotion) {
      shader.uTime = state.clock.elapsedTime * 0.5;
      shader.uResolution.set(size.width, size.height);
    }
  });

  useEffect(() => {
    const shader = materialRef.current;
    if (shader) {
      shader.uResolution.set(size.width, size.height);
    }
  }, [size]);

  return (
    <mesh ref={meshRef} material={material} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}

function Scene({ reducedMotion, isMobile }: { reducedMotion: boolean; isMobile: boolean }) {
  return (
    <>
      <BlackHoleShader reducedMotion={reducedMotion} />
      <EffectComposer>
        <Bloom
          intensity={isMobile ? 0.6 : 0.9}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.7}
        />
      </EffectComposer>
    </>
  );
}

export function ParticleVoid() {
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className="w-full h-full" style={{ background: '#000000' }} />;
  }

  return (
    <Canvas
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1], near: 0.1, far: 10 }}
      dpr={isMobile ? 1 : 1.5}
      gl={{ antialias: false, alpha: false, powerPreference: 'default' }}
      style={{
        background: '#000000',
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
