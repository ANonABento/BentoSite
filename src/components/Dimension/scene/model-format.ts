import type { ModelFormat } from '../Dimension.types';

export const PROCEDURAL_PREFIX = 'procedural:';

export function getModelFormat(path: string): ModelFormat {
  if (path.startsWith(PROCEDURAL_PREFIX)) {
    return 'procedural';
  }
  const extension = path.split('.').pop()?.toLowerCase();
  return extension === 'gltf' || extension === 'glb' ? 'gltf' : 'stl';
}
