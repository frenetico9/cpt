
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { DEFAULT_CRYPTO_PAIRS } from './constants';
import { CryptoPair } from './types';

const App: React.FC = () => {
  const [pairs, setPairs] = useState<CryptoPair[]>(DEFAULT_CRYPTO_PAIRS);
  const [selectedPair, setSelectedPair] = useState<CryptoPair>(DEFAULT_CRYPTO_PAIRS[0]);

  const handleAddPair = (pair: CryptoPair) => {
    if(!pairs.includes(pair)) {
      setPairs([...pairs, pair]);
    }
    setSelectedPair(pair);
  };

  const selectPair = (pair: CryptoPair) => {
    setSelectedPair(pair);
  };
  
  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white antialiased">
      <Sidebar
        pairs={pairs}
        selectedPair={selectedPair}
        onSelectPair={selectPair}
        onAddPair={handleAddPair}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {selectedPair ? (
          <Dashboard key={selectedPair} pair={selectedPair} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xl text-gray-500">Selecione um par de criptomoedas para começar.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
