/**
 * Sorting algorithms as generators for step-by-step visualization
 */

import { SortStep } from './SortingVisualizer.types';

// Bubble Sort
export function* bubbleSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      yield { type: 'compare', indices: [j, j + 1], array: [...array] };

      if (array[j] > array[j + 1]) {
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        yield { type: 'swap', indices: [j, j + 1], array: [...array] };
      }
    }
    yield { type: 'sorted', indices: [n - i - 1], array: [...array] };
  }
  yield { type: 'sorted', indices: [0], array: [...array] };
}

// Selection Sort
export function* selectionSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];
  const n = array.length;

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;

    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [minIdx, j], array: [...array] };
      if (array[j] < array[minIdx]) {
        minIdx = j;
      }
    }

    if (minIdx !== i) {
      [array[i], array[minIdx]] = [array[minIdx], array[i]];
      yield { type: 'swap', indices: [i, minIdx], array: [...array] };
    }
    yield { type: 'sorted', indices: [i], array: [...array] };
  }
  yield { type: 'sorted', indices: [n - 1], array: [...array] };
}

// Insertion Sort
export function* insertionSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];
  const n = array.length;

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;

    yield { type: 'compare', indices: [i], array: [...array] };

    while (j >= 0 && array[j] > key) {
      yield { type: 'compare', indices: [j, j + 1], array: [...array] };
      array[j + 1] = array[j];
      yield { type: 'swap', indices: [j, j + 1], array: [...array] };
      j--;
    }
    array[j + 1] = key;
  }

  for (let i = 0; i < n; i++) {
    yield { type: 'sorted', indices: [i], array: [...array] };
  }
}

// Merge Sort
export function* mergeSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];

  function* mergeSortHelper(start: number, end: number): Generator<SortStep> {
    if (start >= end) return;

    const mid = Math.floor((start + end) / 2);

    yield* mergeSortHelper(start, mid);
    yield* mergeSortHelper(mid + 1, end);

    // Merge
    const left = array.slice(start, mid + 1);
    const right = array.slice(mid + 1, end + 1);

    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      yield { type: 'compare', indices: [start + i, mid + 1 + j], array: [...array] };

      if (left[i] <= right[j]) {
        array[k] = left[i];
        i++;
      } else {
        array[k] = right[j];
        j++;
      }
      yield { type: 'swap', indices: [k], array: [...array] };
      k++;
    }

    while (i < left.length) {
      array[k] = left[i];
      yield { type: 'swap', indices: [k], array: [...array] };
      i++;
      k++;
    }

    while (j < right.length) {
      array[k] = right[j];
      yield { type: 'swap', indices: [k], array: [...array] };
      j++;
      k++;
    }
  }

  yield* mergeSortHelper(0, array.length - 1);

  for (let i = 0; i < array.length; i++) {
    yield { type: 'sorted', indices: [i], array: [...array] };
  }
}

// Quick Sort
export function* quickSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];

  function* partition(low: number, high: number): Generator<SortStep, number, void> {
    const pivot = array[high];
    yield { type: 'pivot', indices: [high], array: [...array] };

    let i = low - 1;

    for (let j = low; j < high; j++) {
      yield { type: 'compare', indices: [j, high], array: [...array] };

      if (array[j] < pivot) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
        yield { type: 'swap', indices: [i, j], array: [...array] };
      }
    }

    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    yield { type: 'swap', indices: [i + 1, high], array: [...array] };

    return i + 1;
  }

  function* quickSortHelper(low: number, high: number): Generator<SortStep> {
    if (low < high) {
      const pi: number = yield* partition(low, high);
      yield { type: 'sorted', indices: [pi], array: [...array] };

      yield* quickSortHelper(low, pi - 1);
      yield* quickSortHelper(pi + 1, high);
    } else if (low === high) {
      yield { type: 'sorted', indices: [low], array: [...array] };
    }
  }

  yield* quickSortHelper(0, array.length - 1);
}

// Heap Sort
export function* heapSort(arr: number[]): Generator<SortStep> {
  const array = [...arr];
  const n = array.length;

  function* heapify(size: number, root: number): Generator<SortStep> {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;

    if (left < size) {
      yield { type: 'compare', indices: [left, largest], array: [...array] };
      if (array[left] > array[largest]) {
        largest = left;
      }
    }

    if (right < size) {
      yield { type: 'compare', indices: [right, largest], array: [...array] };
      if (array[right] > array[largest]) {
        largest = right;
      }
    }

    if (largest !== root) {
      [array[root], array[largest]] = [array[largest], array[root]];
      yield { type: 'swap', indices: [root, largest], array: [...array] };
      yield* heapify(size, largest);
    }
  }

  // Build max heap
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(n, i);
  }

  // Extract elements
  for (let i = n - 1; i > 0; i--) {
    [array[0], array[i]] = [array[i], array[0]];
    yield { type: 'swap', indices: [0, i], array: [...array] };
    yield { type: 'sorted', indices: [i], array: [...array] };
    yield* heapify(i, 0);
  }
  yield { type: 'sorted', indices: [0], array: [...array] };
}

// Algorithm map
export const ALGORITHM_GENERATORS: Record<string, (arr: number[]) => Generator<SortStep>> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
  heap: heapSort,
};
