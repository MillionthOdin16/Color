import { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { Plus, Trash2, RotateCcw } from 'lucide-react';
import type { Filament } from '../lib/ColorEngine';

// Simple minimal nanoid shim since we didn't install nanoid, or I can just use math.random
const generateId = () => Math.random().toString(36).substr(2, 9);

export function InventoryPanel() {
  const { filaments, addFilament, removeFilament, resetToDefaults } = useInventory();
  const [isAdding, setIsAdding] = useState(false);
  const [newFilament, setNewFilament] = useState<Partial<Filament>>({
    name: '',
    color: '#000000',
    strength: 1
  });

  const handleAdd = () => {
    if (!newFilament.name) return;
    addFilament({
      id: generateId(),
      name: newFilament.name,
      color: newFilament.color || '#000000',
      strength: newFilament.strength || 1,
      transmission: 1
    });
    setNewFilament({ name: '', color: '#000000', strength: 1 });
    setIsAdding(false);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">My Filaments</h2>
        <div className="flex gap-2">
            <button
                onClick={resetToDefaults}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Reset to defaults"
            >
                <RotateCcw size={18} />
            </button>
            <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            >
            <Plus size={16} /> Add New
            </button>
        </div>
      </div>

      {isAdding && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                placeholder="e.g. Matte Red"
                value={newFilament.name}
                onChange={e => setNewFilament({ ...newFilament, name: e.target.value })}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="color"
                    className="h-9 w-14 p-0 border-0 rounded overflow-hidden cursor-pointer"
                    value={newFilament.color}
                    onChange={e => setNewFilament({ ...newFilament, color: e.target.value })}
                  />
                  <input
                    type="text"
                    value={newFilament.color}
                    onChange={e => setNewFilament({ ...newFilament, color: e.target.value })}
                    className="flex-1 rounded-md border-gray-300 shadow-sm text-sm border p-2"
                  />
                </div>
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700" title="Higher strength means this color dominates mixes (e.g. Black)">Strength</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  value={newFilament.strength}
                  onChange={e => setNewFilament({ ...newFilament, strength: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newFilament.name}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save Filament
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {filaments.map(f => (
          <div key={f.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 group border border-transparent hover:border-gray-200 transition-all">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                style={{ backgroundColor: f.color }}
              />
              <div>
                <div className="font-medium text-sm text-gray-900">{f.name}</div>
                <div className="text-xs text-gray-500">Str: {f.strength}</div>
              </div>
            </div>
            <button
              onClick={() => removeFilament(f.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {filaments.length === 0 && (
          <div className="text-center text-gray-500 py-4 italic text-sm">
            No filaments. Add some to get started!
          </div>
        )}
      </div>
    </div>
  );
}
