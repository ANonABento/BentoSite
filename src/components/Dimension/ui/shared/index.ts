// Shared exports for the UI library
export { DESIGN_SYSTEM, COMMON_CLASSES } from './design-system';

// Re-export commonly used utilities from parent directory
export type { ModelInfo, ModelError } from '../../Dimension.types';
export { formatFileSize, formatVertexCount, formatPercentage } from '../../Dimension.utils';