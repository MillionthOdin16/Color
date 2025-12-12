import { useState, useMemo } from 'react';
import chroma from 'chroma-js';
import { useInventory } from '../context/InventoryContext';
import { generateMixes } from '../lib/ColorEngine';
import { Target } from 'lucide-react';

export function TargetMatcher() {
  const { filaments } = useInventory();
  const [targetColor, setTargetColor] = useState('#6366f1'); // Default Indigo-ish

  const allMixes = useMemo(() => generateMixes(filaments), [filaments]);

  const bestMatches = useMemo(() => {
    if (!chroma.valid(targetColor)) return [];

    // Calculate distances
    const withDist = allMixes.map(mix => ({
      ...mix,
      distance: chroma.deltaE(targetColor, mix.color)
    }));

    // Sort and take top 5
    return withDist.sort((a: any, b: any) => a.distance - b.distance).slice(0, 5);
  }, [allMixes, targetColor]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Input */}
        <div className="w-full md:w-1/3 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Target className="text-blue-600" />
              Target Matcher
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pick a color you want to create, and we'll find the closest recipe from your inventory.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Target Color</label>
            <div className="flex gap-2">
                <input
                    type="color"
                    className="h-12 w-12 rounded cursor-pointer border-0 p-0 overflow-hidden shadow-sm"
                    value={targetColor}
                    onChange={e => setTargetColor(e.target.value)}
                />
                <input
                    type="text"
                    value={targetColor}
                    onChange={e => setTargetColor(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 border px-3 py-2 shadow-sm font-mono uppercase"
                    maxLength={7}
                />
            </div>
          </div>

          <div
            className="w-full h-32 rounded-lg shadow-inner border border-gray-200 mt-4 flex items-center justify-center"
            style={{ backgroundColor: targetColor }}
          >
            <span className="text-white/50 font-bold tracking-widest uppercase mix-blend-difference">Target</span>
          </div>
        </div>

        {/* Right: Results */}
        <div className="w-full md:w-2/3">
           <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Recipes</h3>
           <div className="space-y-3">
             {bestMatches.map((match: any, idx: number) => (
               <div key={match.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">

                  {/* Rank */}
                  <div className="w-8 font-bold text-gray-400 text-lg">#{idx + 1}</div>

                  {/* Visualization */}
                  <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col items-center gap-1">
                         <div className="w-12 h-12 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: match.color }} />
                         <span className="text-[10px] font-mono text-gray-500">{match.color}</span>
                      </div>

                      <div className="flex-1">
                          <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-900">{match.recipeName}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  match.distance < 2 ? 'bg-green-100 text-green-700' :
                                  match.distance < 5 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                                  Match: {(100 - Math.min(match.distance * 2, 100)).toFixed(0)}%
                              </span>
                          </div>

                          {/* Ingredients Mini Bar */}
                          <div className="flex mt-2 h-2 rounded-full overflow-hidden w-full">
                              {match.ingredients.map((ing: any, i: number) => (
                                  <div
                                    key={i}
                                    style={{ width: `${ing.part * 100}%`, backgroundColor: ing.filament.color }}
                                    title={`${ing.filament.name} (${(ing.part * 100).toFixed(0)}%)`}
                                  />
                              ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate">
                              {match.ingredients.map((i: any) => `${i.filament.name} (${(i.part * 100).toFixed(0)}%)`).join(', ')}
                          </div>
                      </div>
                  </div>
               </div>
             ))}

             {bestMatches.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    No matches found. Add more filaments!
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
