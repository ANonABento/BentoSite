import { Suspense } from 'react';
import { DEFAULT_MODEL_PATH } from '../Dimension.config';
import type { STLModelWrapperProps } from '../Dimension.types';
import { GLTFModel } from './GLTFModel';
import { LODModel } from './LODModel';
import { getModelFormat } from './model-format';
import { ProceduralCat } from './ProceduralCat';
import { SceneErrorBoundary } from './SceneErrorBoundary';
import { SkeletonLoader } from './SkeletonLoader';

function renderModel({
  modelPath,
  autoRotate,
  onClick,
  isWireframe,
  rotationSpeed,
}: {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed: number;
}) {
  const format = getModelFormat(modelPath);

  if (format === 'procedural') {
    // Currently the only procedural model. If we add more (e.g. dog, robot),
    // dispatch on the suffix after `procedural:` here.
    return (
      <ProceduralCat
        autoRotate={autoRotate}
        onClick={onClick}
        isWireframe={isWireframe}
        rotationSpeed={rotationSpeed}
      />
    );
  }

  if (format === 'gltf') {
    return (
      <GLTFModel
        modelPath={modelPath}
        autoRotate={autoRotate}
        onClick={onClick}
        isWireframe={isWireframe}
        rotationSpeed={rotationSpeed}
      />
    );
  }

  return (
    <LODModel
      modelPath={modelPath}
      autoRotate={autoRotate}
      onClick={onClick}
      isWireframe={isWireframe}
      rotationSpeed={rotationSpeed}
    />
  );
}

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
        {renderModel({
          modelPath,
          autoRotate,
          onClick,
          isWireframe,
          rotationSpeed,
        })}
      </SceneErrorBoundary>
    </Suspense>
  );
}
