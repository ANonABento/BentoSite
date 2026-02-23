import * as THREE from 'three';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const TEXTURE_WIDTH = 2048;
const TEXTURE_HEIGHT = 1024;
const LONGITUDE_OFFSET = 0.25;

let cachedLandMask: THREE.CanvasTexture | null = null;

type TopologyData = {
  objects?: {
    land?: unknown;
    countries?: unknown;
  };
};

export async function loadLandMaskTexture(signal?: AbortSignal): Promise<THREE.CanvasTexture | null> {
  if (cachedLandMask) return cachedLandMask;

  const response = await fetch('/data/world-50m.json', { signal });
  if (!response.ok) return null;

  const topology = (await response.json()) as TopologyData;
  const targetObject = topology.objects?.land ?? topology.objects?.countries;
  if (!targetObject) return null;

  const geoData = feature(topology as never, targetObject as never);
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_WIDTH;
  canvas.height = TEXTURE_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) return null;

  const projection = geoEquirectangular().fitSize([TEXTURE_WIDTH, TEXTURE_HEIGHT], geoData as never);
  const drawPath = geoPath(projection, context);

  context.clearRect(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#ffffff';
  context.beginPath();
  drawPath(geoData as never);
  context.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 8;
  texture.offset.set(LONGITUDE_OFFSET, 0);
  texture.needsUpdate = true;

  cachedLandMask = texture;
  return texture;
}
