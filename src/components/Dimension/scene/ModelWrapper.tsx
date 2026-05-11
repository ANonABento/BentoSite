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
  isMobile,
}: {
  modelPath: string;
  autoRotate: boolean;
  onClick: () => void;
  isWireframe: boolean;
  rotationSpeed: number;
  isMobile: boolean;
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
        isMobile={isMobile}
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
        isMobile={isMobile}
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
      isMobile={isMobile}
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
  isMobile,
}: STLModelWrapperProps) {
  return (
    <Suspense fallback={<SkeletonLoader isMobile={isMobile} />}>
      <SceneErrorBoundary onError={onError}>
        {renderModel({
          modelPath,
          autoRotate,
          onClick,
          isWireframe,
          rotationSpeed,
          isMobile,
        })}
      </SceneErrorBoundary>
    </Suspense>
  );
}
