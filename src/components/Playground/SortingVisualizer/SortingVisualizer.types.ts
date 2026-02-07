/**
 * Sorting Visualizer - TypeScript interfaces
 */

export type SortingAlgorithm = 'bubble' | 'quick' | 'merge' | 'heap' | 'insertion' | 'selection';

export type SortStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface SortStep {
  type: 'compare' | 'swap' | 'sorted' | 'pivot';
  indices: number[];
  array: number[];
}

export interface AlgorithmInfo {
  id: SortingAlgorithm;
  name: string;
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
}

export interface SortingState {
  array: number[];
  status: SortStatus;
  algorithm: SortingAlgorithm;
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot: number | null;
  comparisons: number;
  swaps: number;
}
