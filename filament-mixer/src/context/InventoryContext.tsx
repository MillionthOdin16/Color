import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Filament } from '../lib/ColorEngine';

interface InventoryContextType {
  filaments: Filament[];
  addFilament: (filament: Filament) => void;
  removeFilament: (id: string) => void;
  updateFilament: (filament: Filament) => void;
  resetToDefaults: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const DEFAULT_FILAMENTS: Filament[] = [
  { id: '1', name: 'Generic Black', color: '#000000', strength: 2, transmission: 1 },
  { id: '2', name: 'Generic White', color: '#ffffff', strength: 0.5, transmission: 1 },
  { id: '3', name: 'Generic Red', color: '#ff0000', strength: 1, transmission: 1 },
  { id: '4', name: 'Generic Green', color: '#00ff00', strength: 1, transmission: 1 },
  { id: '5', name: 'Generic Blue', color: '#0000ff', strength: 1, transmission: 1 },
  { id: '6', name: 'Generic Yellow', color: '#ffff00', strength: 0.8, transmission: 1 },
];

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [filaments, setFilaments] = useState<Filament[]>(() => {
    const saved = localStorage.getItem('filament-inventory');
    return saved ? JSON.parse(saved) : DEFAULT_FILAMENTS;
  });

  useEffect(() => {
    localStorage.setItem('filament-inventory', JSON.stringify(filaments));
  }, [filaments]);

  const addFilament = (filament: Filament) => {
    setFilaments([...filaments, filament]);
  };

  const removeFilament = (id: string) => {
    setFilaments(filaments.filter(f => f.id !== id));
  };

  const updateFilament = (filament: Filament) => {
    setFilaments(filaments.map(f => f.id === filament.id ? filament : f));
  };

  const resetToDefaults = () => {
    setFilaments(DEFAULT_FILAMENTS);
  };

  return (
    <InventoryContext.Provider value={{ filaments, addFilament, removeFilament, updateFilament, resetToDefaults }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
