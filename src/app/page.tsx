'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Header from '../components/Header';

const ThreeViewer = dynamic(() => import('../components/Dimension/Dimension'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading 3D Viewer...</span>
      </div>
    </div>
  ),
});

const Chatbot = dynamic(() => import('../components/Chat'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Loading Chat...</span>
      </div>
    </div>
  ),
});

const ProjectsModal = dynamic(
  () => import('../components/Projects/ProjectsModal').then((mod) => mod.ProjectsModal),
  { ssr: false }
);

export default function Home() {
  const [activeSection, setActiveSection] = useState<'3d' | 'chat'>('3d');
  const [isExpanded3D, setIsExpanded3D] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] bg-grid overflow-hidden">
      {/* Header - compact on mobile */}
      <div className="flex-shrink-0 p-4 md:p-6">
        <Header
          name="Your Name"
          tagline="Hardware & Software Engineer"
          githubUrl="https://github.com"
          linkedinUrl="https://linkedin.com"
          email="hello@example.com"
          resumeUrl="/resume.pdf"
          compact
          onProjectsClick={() => setIsProjectsOpen(true)}
        />
      </div>

      {/* Mobile Toggle Tabs */}
      <div className="md:hidden flex-shrink-0 px-4 pb-4">
        <div className="glass rounded-xl p-1 flex">
          <button
            onClick={() => setActiveSection('3d')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === '3d'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            3D Viewer
          </button>
          <button
            onClick={() => setActiveSection('chat')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeSection === 'chat'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Chat with AI
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 px-4 pb-4 md:px-6 md:pb-6 min-h-0">
        {/* 3D Viewer Section */}
        <div
          className={`
            ${activeSection === '3d' ? 'flex' : 'hidden'} md:flex
            ${isExpanded3D ? 'flex-1' : 'md:w-1/2'}
            flex-col min-h-0
            transition-all duration-300
          `}
        >
          <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
            {/* 3D Viewer Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm text-gray-400">Interactive 3D Viewer</span>
              </div>
              <button
                onClick={() => setIsExpanded3D(!isExpanded3D)}
                className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
              >
                {isExpanded3D ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                    Collapse
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Expand
                  </>
                )}
              </button>
            </div>
            {/* 3D Canvas */}
            <div className="flex-1 min-h-0">
              <ThreeViewer />
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div
          className={`
            ${activeSection === 'chat' ? 'flex' : 'hidden'} md:flex
            ${isExpanded3D ? 'md:w-80' : 'md:w-1/2'}
            flex-col min-h-0 flex-1 md:flex-initial
            transition-all duration-300
          `}
        >
          <div className="glass rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-sm text-gray-400">AI Assistant</span>
              </div>
              <span className="text-xs text-indigo-400/60 hidden sm:inline">Powered by Gemini</span>
            </div>
            {/* Chat Content */}
            <div className="flex-1 min-h-0">
              <Chatbot />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Modal */}
      <ProjectsModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        onLoad3DModel={(modelPath) => {
          setIsProjectsOpen(false);
          // TODO: Pass modelPath to ThreeViewer when controlled prop is added
          console.log('Load 3D model:', modelPath);
        }}
      />
    </div>
  );
}
