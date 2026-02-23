import * as THREE from 'three';
import type { MapLocation } from '../Viewfinder.types';

export interface MarkerLayoutItem {
  location: MapLocation;
  position: [number, number, number];
  stackIndex: number;
  stackSize: number;
}

function normalizeLongitude(lng: number): number {
  if (lng > 180) return lng - 360;
  if (lng < -180) return lng + 360;
  return lng;
}

export function latLngToPosition(lat: number, lng: number, radius: number): [number, number, number] {
  const normalizedLng = normalizeLongitude(lng);
  const latRad = THREE.MathUtils.degToRad(lat);
  const lngRad = THREE.MathUtils.degToRad(normalizedLng);
  const x = radius * Math.cos(latRad) * Math.sin(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lngRad);
  return [x, y, z];
}

interface LayoutGroup {
  center: THREE.Vector3;
  entries: MapLocation[];
  vectors: THREE.Vector3[];
}

const GROUP_ANGLE_THRESHOLD = THREE.MathUtils.degToRad(3.2);

function latLngToUnitVector(lat: number, lng: number): THREE.Vector3 {
  const [x, y, z] = latLngToPosition(lat, lng, 1);
  return new THREE.Vector3(x, y, z).normalize();
}

function angularDistance(a: THREE.Vector3, b: THREE.Vector3): number {
  return Math.acos(THREE.MathUtils.clamp(a.dot(b), -1, 1));
}

function updateGroupCenter(group: LayoutGroup): void {
  const center = new THREE.Vector3();
  for (const vector of group.vectors) {
    center.add(vector);
  }
  group.center.copy(center.normalize());
}

function addToNearestGroup(
  groups: LayoutGroup[],
  location: MapLocation,
  longitudeOffsetDeg: number
): void {
  const locationVector = latLngToUnitVector(
    location.coordinates.lat,
    location.coordinates.lng + longitudeOffsetDeg
  );

  let bestGroup: LayoutGroup | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const group of groups) {
    const distance = angularDistance(locationVector, group.center);
    if (distance < minDistance) {
      minDistance = distance;
      bestGroup = group;
    }
  }

  if (bestGroup && minDistance <= GROUP_ANGLE_THRESHOLD) {
    bestGroup.entries.push(location);
    bestGroup.vectors.push(locationVector);
    updateGroupCenter(bestGroup);
    return;
  }

  groups.push({
    center: locationVector.clone(),
    entries: [location],
    vectors: [locationVector],
  });
}

function getSpread(index: number, total: number): { radiusScale: number; angle: number } {
  if (total <= 1) {
    return { radiusScale: 0, angle: 0 };
  }

  if (total <= 6) {
    return {
      radiusScale: 1,
      angle: (Math.PI * 2 * index) / total,
    };
  }

  const innerRingCount = 6;
  if (index < innerRingCount) {
    return {
      radiusScale: 1,
      angle: (Math.PI * 2 * index) / innerRingCount,
    };
  }

  const outerIndex = index - innerRingCount;
  const outerCount = Math.max(total - innerRingCount, 1);
  return {
    radiusScale: 1.72,
    angle: (Math.PI * 2 * outerIndex) / outerCount + Math.PI / innerRingCount,
  };
}

function withLocalOffset(
  source: MapLocation,
  longitudeOffsetDeg: number,
  radius: number,
  index: number,
  total: number
): [number, number, number] {
  const [x, y, z] = latLngToPosition(
    source.coordinates.lat,
    source.coordinates.lng + longitudeOffsetDeg,
    radius
  );
  const base = new THREE.Vector3(x, y, z);
  if (total <= 1) return [x, y, z];

  const normal = base.clone().normalize();
  const tangentA = new THREE.Vector3(0, 1, 0).cross(normal);
  if (tangentA.lengthSq() < 1e-4) tangentA.set(1, 0, 0).cross(normal);
  tangentA.normalize();
  const tangentB = normal.clone().cross(tangentA).normalize();

  const { radiusScale, angle } = getSpread(index, total);
  const spread = (0.02 + Math.min(total, 10) * 0.0026) * radiusScale;
  base
    .addScaledVector(tangentA, Math.cos(angle) * spread)
    .addScaledVector(tangentB, Math.sin(angle) * spread)
    .normalize()
    .multiplyScalar(radius);

  return [base.x, base.y, base.z];
}

export function buildMarkerLayout(
  locations: MapLocation[],
  radius: number,
  longitudeOffsetDeg = 0
): MarkerLayoutItem[] {
  const groups: LayoutGroup[] = [];
  const stableLocations = [...locations].sort((a, b) => a.id.localeCompare(b.id));
  for (const location of stableLocations) {
    addToNearestGroup(groups, location, longitudeOffsetDeg);
  }

  const output: MarkerLayoutItem[] = [];
  for (const group of groups) {
    group.entries.forEach((location, index) => {
      output.push({
        location,
        position: withLocalOffset(location, longitudeOffsetDeg, radius, index, group.entries.length),
        stackIndex: index,
        stackSize: group.entries.length,
      });
    });
  }

  return output;
}
