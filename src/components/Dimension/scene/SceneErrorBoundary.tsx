import React from 'react';
import type { ModelError } from '../Dimension.types';
import { FallbackModel } from './FallbackModel';

interface SceneErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: ModelError) => void;
}

interface SceneErrorBoundaryState {
  hasError: boolean;
  error?: ModelError;
}

export class SceneErrorBoundary extends React.Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: SceneErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { hasError: true, error: SceneErrorBoundary.classifyError(error) };
  }

  private static classifyError(error: Error): ModelError {
    const errorWithStatus = error as Error & { status?: number; statusCode?: number };
    const status = errorWithStatus.status ?? errorWithStatus.statusCode;

    if (status === 404) {
      return {
        message: 'Model file not found. Please check the file path or select a different model.',
        code: 'FILE_NOT_FOUND',
        retryable: true,
      };
    }
    if (status === 403) {
      return {
        message: 'Access denied. Please check file permissions.',
        code: 'ACCESS_DENIED',
        retryable: false,
      };
    }
    if (status && status >= 500) {
      return {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        retryable: true,
      };
    }
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR',
        retryable: true,
      };
    }
    if (error.name === 'SyntaxError') {
      return {
        message: 'Invalid model format. Please ensure the file is a valid 3D model.',
        code: 'INVALID_FORMAT',
        retryable: false,
      };
    }

    const message = error.message.toLowerCase();

    if (message.includes('404') || message.includes('not found')) {
      return {
        message: 'Model file not found. Please check the file path or select a different model.',
        code: 'FILE_NOT_FOUND',
        retryable: true,
      };
    }
    if (message.includes('cors') || message.includes('cross-origin')) {
      return {
        message: 'Cross-origin request blocked. Please check server configuration.',
        code: 'CORS_ERROR',
        retryable: false,
      };
    }
    if (message.includes('format') || message.includes('parse') || message.includes('invalid')) {
      return {
        message: 'Invalid model format. Please ensure the file is a valid 3D model.',
        code: 'INVALID_FORMAT',
        retryable: false,
      };
    }
    if (message.includes('timeout')) {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        code: 'TIMEOUT',
        retryable: true,
      };
    }

    return {
      message: 'Failed to load model. Please try again or contact support.',
      code: 'UNKNOWN_ERROR',
      retryable: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('3D Model Error Boundary caught an error:', error, errorInfo);
    }

    if (this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <FallbackModel error={this.state.error} />;
    }

    return this.props.children;
  }
}
