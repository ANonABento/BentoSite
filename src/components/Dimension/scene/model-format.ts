import type { ModelFormat } from '../Dimension.types';

export function getModelFormat(path: string): ModelFormat {
  const extension = path.split('.').pop()?.toLowerCase();
  return extension === 'gltf' || extension === 'glb' ? 'gltf' : 'stl';
}
