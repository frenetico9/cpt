
import React, { useState } from 'react';
import { CryptoPair } from '../types';

interface SidebarProps {
  pairs: CryptoPair[];
  selectedPair: CryptoPair;
  onSelectPair: (pair: CryptoPair) => void;
  onAddPair: (pair: CryptoPair) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ pairs, selectedPair, onSelectPair, onAddPair }) => {
  const [newPair, setNewPair] = useState('');

  const handleAddPair = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPair = newPair.toUpperCase().trim();
    if (formattedPair.match(/^[A-Z0-9]+\/[A-Z0-9]+$/)) {
      onAddPair(formattedPair);
      setNewPair('');
    } else {
      alert('Formato de par inválido. Use o formato "MOEDA/MOEDA", ex: "BTC/USDT".');
    }
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-700 flex flex-col p-4">
      <h1 className="text-2xl font-bold text-white mb-6">Crypto IA<span className="text-blue-500">.</span></h1>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pares Monitorados</h2>
      <div className="flex-grow space-y-2 overflow-y-auto">
        {pairs.map((pair) => (
          <button
            key={pair}
            onClick={() => onSelectPair(pair)}
            className={`w-full text-left px-4 py-2 rounded-md transition-all duration-200 ${
              selectedPair === pair ? 'bg-blue-500 text-white font-semibold' : 'hover:bg-gray-700 text-gray-300'
            }`}
          >
            {pair}
          </button>
        ))}
      </div>
      <form onSubmit={handleAddPair} className="mt-4 pt-4 border-t border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Adicionar Par</h3>
        <div className="flex gap-2">
            <input
            type="text"
            value={newPair}
            onChange={(e) => setNewPair(e.target.value)}
            placeholder="BTC/USDT"
            className="w-full bg-gray-700 text-white placeholder-gray-500 px-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
            type="submit"
            aria-label="Adicionar par"
            className="bg-blue-500 text-white font-bold p-2 rounded-md hover:bg-blue-600 transition-colors"
            >
            +
            </button>
        </div>
      </form>
    </div>
  );
};

export default Sidebar;
