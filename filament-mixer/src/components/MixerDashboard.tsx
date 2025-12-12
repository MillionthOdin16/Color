import { useMemo, useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { generateMixes } from '../lib/ColorEngine';
import type { MixResult } from '../lib/ColorEngine';
import { Info, Search } from 'lucide-react';
import chroma from 'chroma-js';

export function MixerDashboard() {
  const { filaments } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize the expensive generation
  const allMixes = useMemo(() => {
    return generateMixes(filaments);
  }, [filaments]);

  const filteredMixes = useMemo(() => {
    if (!searchTerm) return allMixes;
    // Check if search term is hex
    if (searchTerm.startsWith('#') && searchTerm.length >= 4) {
       // Filter by color distance? Or exact?
       // Let's implement simple distance sorting instead of filtering if hex provided.
       // But here we are filtering.
       return allMixes;
    }
    return allMixes.filter(m =>
      m.recipeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.ingredients.some(i => i.filament.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [allMixes, searchTerm]);

  // Sort by color distance if search is a valid hex color
  const displayedMixes = useMemo(() => {
    if (chroma.valid(searchTerm)) {
      return [...filteredMixes].sort((a, b) => {
        const distA = chroma.deltaE(searchTerm, a.color);
        const distB = chroma.deltaE(searchTerm, b.color);
        return distA - distB;
      });
    }
    return filteredMixes;
  }, [filteredMixes, searchTerm]);

  const [selectedMix, setSelectedMix] = useState<MixResult | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Mix Explorer</h1>
           <p className="text-gray-500 mt-1">
             {allMixes.length} possible colors from your {filaments.length} filaments.
           </p>
        </div>

        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
            placeholder="Search name or Hex..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {displayedMixes.map((mix: MixResult) => (
          <button
            key={mix.id}
            onClick={() => setSelectedMix(mix)}
            className="group flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all text-left"
          >
            <div
              className="h-24 w-full relative"
              style={{ backgroundColor: mix.color }}
            >
               <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-black" />
            </div>
            <div className="p-3">
              <div className="text-xs font-mono text-gray-500 uppercase">{mix.color}</div>
              <div className="text-xs text-gray-400 truncate mt-1" title={mix.recipeName}>
                {mix.recipeName}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedMix && (
        <MixDetailModal mix={selectedMix} onClose={() => setSelectedMix(null)} />
      )}
    </div>
  );
}

function MixDetailModal({ mix, onClose }: { mix: MixResult; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        <div
            className="h-32 w-full flex items-end justify-between p-6"
            style={{ backgroundColor: mix.color }}
        >
            <h2 className="text-white text-3xl font-bold font-mono drop-shadow-md">{mix.color.toUpperCase()}</h2>
            <button
                onClick={onClose}
                className="bg-black/20 hover:bg-black/40 text-white rounded-full p-1 transition-colors"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4 text-gray-600">
             <span className="font-semibold text-gray-900">{mix.recipeName}</span>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Ingredients</h3>
            <div className="space-y-3">
              {mix.ingredients.map((ing: any, idx: number) => {
                 const percentage = (ing.part * 100).toFixed(0) + '%';
                 return (
                   <div key={idx} className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div
                         className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                         style={{ backgroundColor: ing.filament.color }}
                       />
                       <div>
                         <div className="font-medium text-gray-900">{ing.filament.name}</div>
                         <div className="text-xs text-gray-500">Strength: {ing.filament.strength}</div>
                       </div>
                     </div>
                     <div className="font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                       {percentage}
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 flex items-start gap-2">
             <Info size={14} className="mt-0.5 shrink-0" />
             <p>
               Colors are simulated using subtractive CMYK mixing. Actual results may vary based on filament opacity and printer settings.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
