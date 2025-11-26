// ModelSelector - Full-screen modal for selecting and loading 3D models
// Extracted from Dimension.ui.tsx for better maintainability

import React, { useState, useRef, useEffect } from 'react';

import type { ModelSelectorProps } from '../../Dimension.types';
import { formatFileSize } from '../shared';

export function ModelSelector({ models, selectedModel, onModelSelect, isMobile, onClose }: ModelSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isInitialRender, setIsInitialRender] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialRender(false), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const categories = ['All', ...Array.from(new Set(models.map((model: any) => model.category)))];
  
  const filteredModels = models.filter((model: any) => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          model.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || model.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleModelClick = (model: any) => {
    onModelSelect(model);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="model-selector-title" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden ${isInitialRender ? '' : 'transition-all duration-200 ease-out'} ${isMobile ? 'w-full max-w-sm' : 'w-full max-w-4xl max-h-[85vh]'}`}>
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 id="model-selector-title" className="text-xl font-bold text-gray-900">Select 3D Model</h2>
            <button 
              onClick={onClose} 
              className={`text-gray-400 hover:text-gray-600 ${isInitialRender ? '' : 'transition-colors duration-150'} p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50`} 
              aria-label="Close model selector"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Search and filter */}
          <div className="space-y-4">
            <div className="relative">
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search models..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isInitialRender ? '' : 'transition-all duration-150'}`} 
                aria-label="Search models by name or description" 
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category: string) => (
                <button 
                  key={category} 
                  onClick={() => setSelectedCategory(category)} 
                  className={`px-4 py-2 rounded-full text-sm font-medium ${isInitialRender ? '' : 'transition-all duration-150 transform hover:scale-105'} focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${selectedCategory === category ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} 
                  aria-pressed={selectedCategory === category}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Model grid */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {filteredModels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m10 0h2M4 8h2m11 4h.01M4 12h.01M9 16h.01" />
              </svg>
              <p className="text-lg font-medium mb-2">No models found</p>
              <p className="text-sm">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredModels.map((model: any) => (
                <div 
                  key={model.id} 
                  onClick={() => handleModelClick(model)} 
                  className={`border-2 rounded-xl p-4 cursor-pointer ${isInitialRender ? '' : 'transition-all duration-200 transform hover:scale-105 hover:shadow-lg'} ${selectedModel.id === model.id ? 'border-blue-500 bg-blue-50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'} focus:outline-none focus:ring-2 focus:ring-blue-500/50`} 
                  tabIndex={0} 
                  role="button" 
                  aria-label={`Select ${model.name} model`} 
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleModelClick(model); }}}
                >
                  <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center border border-gray-200">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 leading-tight">{model.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{model.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{model.category}</span>
                    <span className="text-xs text-gray-500 font-mono">{formatFileSize(model.fileSize)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}