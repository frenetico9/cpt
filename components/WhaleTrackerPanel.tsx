import React from 'react';
import { WhaleAlert } from '../types';
import WhaleIcon from './icons/WhaleIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(2);
};

const EntityPill: React.FC<{name: string}> = ({ name }) => {
    const lowerCaseName = name.toLowerCase();
    const isWallet = lowerCaseName.includes('wallet');
    const isExchange = name.startsWith('#');
    let color = 'bg-gray-600';
    if(isWallet && !isExchange) color = 'bg-blue-800';
    if(isExchange) color = 'bg-yellow-800';

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full text-white whitespace-nowrap ${color}`}>
            {name.replace(/#/g, '')}
        </span>
    );
};

const WhaleAlertItem: React.FC<{ alert: WhaleAlert }> = ({ alert }) => {
    return (
        <div className="bg-gray-700/50 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-grow">
                <div className="text-blue-400 flex-shrink-0">
                    <WhaleIcon className="h-6 w-6" />
                </div>
                <div>
                    <p className="font-bold text-white text-md">
                        {formatValue(alert.amountCoin)} {alert.coin}
                    </p>
                    <p className="text-gray-400 text-sm">
                        (${formatValue(alert.amountUSD)} USD)
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm flex-wrap my-2 sm:my-0 sm:justify-center">
                <EntityPill name={alert.from} />
                <ArrowRightIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <EntityPill name={alert.to} />
            </div>
             <p className="text-xs text-gray-500 text-right sm:text-center flex-shrink-0">
                {new Date(alert.date).toLocaleString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
            </p>
        </div>
    );
};


const WhaleTrackerPanel: React.FC<{ alerts: WhaleAlert[], loading: boolean, error: string | null }> = ({ alerts, loading, error }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
             <WhaleIcon className="h-8 w-8 text-blue-500" />
             <h3 className="text-xl font-bold text-white">Radar de Criptos Novas: Grandes Movimentações</h3>
        </div>
        
        {loading && (
             <div className="flex justify-center items-center h-48">
                <p className="text-gray-400 animate-pulse">Buscando transações em novas criptos...</p>
             </div>
        )}

        {error && (
            <div className="flex justify-center items-center h-48 bg-red-900/20 rounded-md p-4">
                <p className="text-red-400 text-center font-semibold">{error}</p>
            </div>
        )}

        {!loading && !error && alerts.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {alerts.map(alert => (
                    <WhaleAlertItem key={alert.id} alert={alert} />
                ))}
            </div>
        )}
        
        {!loading && !error && alerts.length === 0 && (
             <div className="flex justify-center items-center h-48">
                <p className="text-gray-500">Nenhuma grande transação em criptos novas foi detectada.</p>
             </div>
        )}
    </div>
  );
};

export default WhaleTrackerPanel;
