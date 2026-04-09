/**
 * Sorting Visualizer - Hooks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { SortingAlgorithm, SortStatus, SortStep } from './SortingVisualizer.types';
import { DEFAULT_ARRAY_SIZE, DEFAULT_SPEED } from './SortingVisualizer.config';
import { ALGORITHM_GENERATORS } from './algorithms';

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
}

export function useSortingVisualizer() {
  const [array, setArray] = useState<number[]>(() => generateRandomArray(DEFAULT_ARRAY_SIZE));
  const [status, setStatus] = useState<SortStatus>('idle');
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>('bubble');
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);

  const [comparing, setComparing] = useState<number[]>([]);
  const [swapping, setSwapping] = useState<number[]>([]);
  const [sorted, setSorted] = useState<Set<number>>(new Set());
  const [pivot, setPivot] = useState<number | null>(null);

  const [comparisons, setComparisons] = useState(0);
  const [swaps, setSwaps] = useState(0);

  const generatorRef = useRef<Generator<SortStep> | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  // Generate new random array
  const generateArray = useCallback(() => {
    if (status === 'running') return;

    setArray(generateRandomArray(arraySize));
    setStatus('idle');
    setComparing([]);
    setSwapping([]);
    setSorted(new Set());
    setPivot(null);
    setComparisons(0);
    setSwaps(0);
    generatorRef.current = null;
  }, [arraySize, status]);

  // Handle array size change
  const handleArraySizeChange = useCallback((size: number) => {
    if (status === 'running') return;
    setArraySize(size);
    setArray(generateRandomArray(size));
    setStatus('idle');
    setSorted(new Set());
    setComparisons(0);
    setSwaps(0);
  }, [status]);

  // Process one step
  const processStep = useCallback((step: SortStep) => {
    setArray(step.array);

    switch (step.type) {
      case 'compare':
        setComparing(step.indices);
        setSwapping([]);
        setComparisons((c) => c + 1);
        break;
      case 'swap':
        setSwapping(step.indices);
        setComparing([]);
        setSwaps((s) => s + 1);
        break;
      case 'sorted':
        setSorted((prev) => {
          const next = new Set(prev);
          step.indices.forEach((i) => next.add(i));
          return next;
        });
        setComparing([]);
        setSwapping([]);
        break;
      case 'pivot':
        setPivot(step.indices[0]);
        break;
    }
  }, []);

  // Run the sorting animation
  const runSorting = useCallback(function runSortingStep() {
    if (!generatorRef.current || isPausedRef.current) return;

    const result = generatorRef.current.next();

    if (result.done) {
      setStatus('finished');
      setComparing([]);
      setSwapping([]);
      setPivot(null);
      // Mark all as sorted
      setSorted(new Set(Array.from({ length: array.length }, (_, i) => i)));
      return;
    }

    processStep(result.value);

    // Schedule next step
    timeoutRef.current = setTimeout(runSortingStep, Math.max(1, 201 - speed));
  }, [speed, processStep, array.length]);

  // Start sorting
  const start = useCallback(() => {
    if (status === 'running') return;

    // Reset state
    setComparing([]);
    setSwapping([]);
    setSorted(new Set());
    setPivot(null);
    setComparisons(0);
    setSwaps(0);
    isPausedRef.current = false;

    // Create generator
    const generator = ALGORITHM_GENERATORS[algorithm];
    if (generator) {
      generatorRef.current = generator([...array]);
      setStatus('running');
    }
  }, [status, algorithm, array]);

  // Effect to run sorting when status changes to running
  useEffect(() => {
    if (status === 'running' && !isPausedRef.current) {
      runSorting();
    }
  }, [status, runSorting]);

  // Pause sorting
  const pause = useCallback(() => {
    if (status !== 'running') return;
    isPausedRef.current = true;
    setStatus('paused');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [status]);

  // Resume sorting
  const resume = useCallback(() => {
    if (status !== 'paused') return;
    isPausedRef.current = false;
    setStatus('running');
    runSorting();
  }, [status, runSorting]);

  // Reset
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    isPausedRef.current = false;
    generatorRef.current = null;
    setStatus('idle');
    setComparing([]);
    setSwapping([]);
    setSorted(new Set());
    setPivot(null);
    setComparisons(0);
    setSwaps(0);
    setArray(generateRandomArray(arraySize));
  }, [arraySize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    array,
    status,
    algorithm,
    speed,
    arraySize,
    comparing,
    swapping,
    sorted,
    pivot,
    comparisons,
    swaps,
    setAlgorithm,
    setSpeed,
    setArraySize: handleArraySizeChange,
    generateArray,
    start,
    pause,
    resume,
    reset,
  };
}
