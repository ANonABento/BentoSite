import { Suspense } from 'react';
import { DEFAULT_MODEL_PATH } from '../Dimension.config';
import type { STLModelWrapperProps } from '../Dimension.types';
import { GLTFModel } from './GLTFModel';
import { LODModel } from './LODModel';
import { getModelFormat } from './model-format';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';

export function ModelWrapper({
  modelPath = DEFAULT_MODEL_PATH,
  onError,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed = 1,
}: STLModelWrapperProps) {
  return (
    <Suspense fallback={<SkeletonLoader />}>
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
    </Suspense>
  );
}
