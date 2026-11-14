'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { Camera } from '../BentoGrid.types';

/*
 * The lacquer under the tray. Cards cover it; only the walls between them
 * show it. Three currents cross the whole board, meandering and drifting, so
 * every seam has a thread in it rather than a few bright pockets and a lot of
 * flat colour. Locked to the camera. The threads swell as they travel, lean
 * with a pan, and get shoved aside by the pointer. Reduced motion draws one still.
 */

const VERT = `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform vec2 uCss;
uniform float uDpr;
uniform vec2 uCam;
uniform float uZoom;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPoint;
uniform float uMotion;
uniform vec2 uVel;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float thread(float x) {
  return pow(max(x, 0.0), 2.0);
}

void main() {
  vec2 frag = vec2(gl_FragCoord.x, uCss.y * uDpr - gl_FragCoord.y);
  vec2 screen = frag / uDpr;
  vec2 world = (screen - uCss * 0.5) / max(uZoom, 0.001) - uCam;

  float t = uTime;
  // About one thread per card, so a seam anywhere on the board is in the current.
  vec2 p = world * 0.0042;
  p += uVel / max(uZoom, 0.001) * 0.00035;

  // A wide, shallow shove. Strength stays well below 1: at 1 the middle folds
  // inside out and the arcs read as a lens or a vortex.
  vec2 fromPtr = screen - uPointer;
  float push = uPoint * exp(-dot(fromPtr, fromPtr) / (520.0 * 520.0));
  p -= fromPtr / max(uZoom, 0.001) * 0.0042 * push * 0.58;

  vec2 drift = vec2(t * 0.055, t * 0.038);
  float wx = fbm(p * 0.72 + drift);
  float wy = fbm(p * 0.72 - drift.yx + vec2(4.2, 1.3));
  vec2 q = p + (vec2(wx, wy) - 0.5) * (1.7 + uMotion * 0.8);

  float s1 = sin(dot(q, vec2(5.2, 1.15)) - t * 0.62);
  float s2 = sin(dot(q, vec2(-1.25, 4.6)) + t * 0.48);
  float s3 = sin(dot(q, vec2(3.1, -3.4)) + t * 0.33 + (wx - 0.5) * 2.4);
  float veins = thread(s1) * 0.72 + thread(s2) * 0.62 + thread(s3) * 0.5;
  float breath = 0.78 + 0.22 * sin(t * 0.85 + q.x * 0.7 + q.y);

  vec3 wall = vec3(0.1647, 0.1412, 0.1294);
  vec3 quiet = vec3(0.30, 0.17, 0.46);
  vec3 seam = vec3(0.62, 0.45, 0.98);

  float tone = clamp(0.35 + 0.65 * wy, 0.0, 1.0);
  vec3 col = mix(wall, quiet, tone);
  col = mix(col, seam, clamp(veins, 0.0, 1.0) * breath);
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function BoardField({ cameraRef }: { cameraRef: RefObject<Camera> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uCss = gl.getUniformLocation(program, 'uCss');
    const uDpr = gl.getUniformLocation(program, 'uDpr');
    const uCam = gl.getUniformLocation(program, 'uCam');
    const uZoom = gl.getUniformLocation(program, 'uZoom');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uPointer = gl.getUniformLocation(program, 'uPointer');
    const uPoint = gl.getUniformLocation(program, 'uPoint');
    const uMotion = gl.getUniformLocation(program, 'uMotion');
    const uVel = gl.getUniformLocation(program, 'uVel');

    const pointer = { x: 0, y: 0, px: 0, py: 0, seen: false, target: 0, amt: 0 };
    const motion = { v: 0, vx: 0, vy: 0, cam: null as Camera | null, at: 0 };
    let raf = 0;
    let hold = 0;
    let lastDraw = 0;
    let stopped = false;

    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const bw = Math.max(1, Math.round(w * dpr));
      const bh = Math.max(1, Math.round(h * dpr));
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      resize();
      const cam = cameraRef.current;
      if (!cam || canvas.clientWidth < 1) return;
      const dt = motion.at ? Math.max(0.016, (now - motion.at) / 1000) : 0.016;
      motion.at = now;
      if (motion.cam) {
        const sx = ((cam.x - motion.cam.x) * cam.zoom) / dt;
        const sy = ((cam.y - motion.cam.y) * cam.zoom) / dt;
        const speed = Math.hypot(sx, sy) + (Math.abs(cam.zoom - motion.cam.zoom) * 700) / dt;
        const target = Math.min(1, Math.max(0, (speed - 40) / 700));
        motion.v += (target - motion.v) * 0.18;
        // At rest this falls back to zero, so the current isn't left shifted.
        const follow = speed > 30 ? 0.22 : 0.55;
        motion.vx += ((speed > 30 ? sx : 0) - motion.vx) * follow;
        motion.vy += ((speed > 30 ? sy : 0) - motion.vy) * follow;
      }
      motion.cam = { x: cam.x, y: cam.y, zoom: cam.zoom };
      pointer.amt += (pointer.target - pointer.amt) * 0.12;
      // The shove trails the cursor a little, so a flick carries the current with it.
      pointer.px += (pointer.x - pointer.px) * 0.22;
      pointer.py += (pointer.y - pointer.py) * 0.22;

      gl.useProgram(program);
      gl.uniform2f(uCss, canvas.clientWidth, canvas.clientHeight);
      gl.uniform1f(uDpr, canvas.width / canvas.clientWidth);
      gl.uniform2f(uCam, cam.x, cam.y);
      gl.uniform1f(uZoom, cam.zoom);
      gl.uniform1f(uTime, now / 1000);
      gl.uniform2f(uPointer, pointer.px, pointer.py);
      gl.uniform1f(uPoint, pointer.amt);
      gl.uniform1f(uMotion, motion.v);
      gl.uniform2f(uVel, motion.vx, motion.vy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const loop = (now: number) => {
      if (stopped) return;
      if (document.hidden) {
        hold = window.setTimeout(() => {
          raf = requestAnimationFrame(loop);
        }, 400);
        return;
      }
      if (now - lastDraw > 30) {
        draw(now);
        lastDraw = now;
      }
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (!pointer.seen) {
        pointer.px = pointer.x;
        pointer.py = pointer.y;
        pointer.seen = true;
      }
      pointer.target = rect.width > 0 && pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height ? 1 : 0;
    };
    const onLeave = () => {
      pointer.target = 0;
    };

    const stopLoop = () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(hold);
      raf = 0;
      hold = 0;
    };

    const start = () => {
      stopLoop();
      if (reducedQuery.matches) {
        pointer.target = 0;
        pointer.amt = 0;
        draw(8000);
        return;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    reducedQuery.addEventListener('change', start);
    const observer = new ResizeObserver(() => {
      if (reducedQuery.matches) draw(8000);
    });
    observer.observe(canvas);
    start();

    return () => {
      stopped = true;
      stopLoop();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      reducedQuery.removeEventListener('change', start);
      observer.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [cameraRef]);

  return <canvas ref={canvasRef} aria-hidden className="board-field pointer-events-none absolute inset-0 h-full w-full" />;
}
