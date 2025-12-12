import { useState } from 'react';
import { InventoryProvider } from './context/InventoryContext';
import { InventoryPanel } from './components/InventoryPanel';
import { MixerDashboard } from './components/MixerDashboard';
import { TargetMatcher } from './components/TargetMatcher';
import { Layers, Palette, Droplets } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'explore' | 'match'>('explore');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-lg text-white">
                <Layers size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                  Filament Mixer
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Custom Color Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
               {/* Nav Links */}
               <nav className="flex space-x-2">
                 <button
                   onClick={() => setActiveTab('explore')}
                   className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                     activeTab === 'explore'
                       ? 'bg-blue-50 text-blue-700'
                       : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                   }`}
                 >
                   <Palette size={18} />
                   Explorer
                 </button>
                 <button
                   onClick={() => setActiveTab('match')}
                   className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                     activeTab === 'match'
                       ? 'bg-blue-50 text-blue-700'
                       : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                   }`}
                 >
                   <Droplets size={18} />
                   Match Target
                 </button>
               </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar: Inventory */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <InventoryPanel />

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
               <h4 className="font-bold mb-1 flex items-center gap-2">
                 <InfoIcon size={16} /> How it works
               </h4>
               <p className="opacity-90">
                 Add your filaments to the inventory. The app generates all possible color combinations based on standard mixing ratios (1:1, 3:1, etc.).
               </p>
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1 min-w-0">
             {activeTab === 'explore' ? (
               <MixerDashboard />
             ) : (
               <TargetMatcher />
             )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoIcon({ size }: { size: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
    )
}

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
