/**
 * Sorting Visualizer - Configuration
 */

import { AlgorithmInfo } from './SortingVisualizer.types';

// Array configuration
export const DEFAULT_ARRAY_SIZE = 50;
export const MIN_ARRAY_SIZE = 10;
export const MAX_ARRAY_SIZE = 150;

// Speed configuration (delay in ms)
export const MIN_SPEED = 1;
export const MAX_SPEED = 200;
export const DEFAULT_SPEED = 50;

// Bar colors
export const COLORS = {
  default: 'var(--purple)',
  comparing: 'var(--pg-accent-gold)',
  swapping: 'var(--pg-game-error)',
  sorted: 'var(--pg-game-success)',
  pivot: 'var(--pg-accent-gold)',
};

// Algorithm information
export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: 'bubble',
    name: 'Bubble Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Repeatedly swaps adjacent elements if they are in wrong order.',
  },
  {
    id: 'selection',
    name: 'Selection Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Finds minimum element and places it at the beginning.',
  },
  {
    id: 'insertion',
    name: 'Insertion Sort',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Builds sorted array one element at a time.',
  },
  {
    id: 'merge',
    name: 'Merge Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    description: 'Divides array in half, sorts, then merges.',
  },
  {
    id: 'quick',
    name: 'Quick Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    description: 'Picks a pivot and partitions around it.',
  },
  {
    id: 'heap',
    name: 'Heap Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(1)',
    description: 'Builds a max heap then extracts elements.',
  },
];
