'use client';

import dynamic from 'next/dynamic';

const ThreeViewer = dynamic(() => import('../components/Dimension'), { ssr: false });
const Chatbot = dynamic(() => import('../components/Chat'), { ssr: false });

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Left Side: 3D Viewer */}
      <div className="w-1/2 h-full bg-gray-900 border-r border-gray-700">
        <ThreeViewer />
      </div>
      {/* Right Side: Menu/Chatbot */}
      <div className="w-1/2 h-full bg-gray-900 flex flex-col">
        <div className="p-4 border-gray-700">
          <h1 className="text-2xl">Portfolio</h1>
        </div>
        <div className="flex-1">
          <Chatbot />
        </div>
      </div>
    </div>
  );
}
