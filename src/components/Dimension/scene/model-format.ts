import type { ModelFormat } from '../Dimension.types';

/** Sentinel path for the built-in procedural cat model. */
export const PROCEDURAL_CAT_PATH = 'procedural:cat';

export function getModelFormat(path: string): ModelFormat {
  if (path === PROCEDURAL_CAT_PATH) {
    return 'procedural';
  }
  const extension = path.split('.').pop()?.toLowerCase();
  return extension === 'gltf' || extension === 'glb' ? 'gltf' : 'stl';
}
