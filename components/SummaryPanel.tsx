import React from 'react';
import { TechnicalAnalysis, NewsItem, Sentiment } from '../types';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import MinusIcon from './icons/MinusIcon';

interface SummaryPanelProps {
  technical: TechnicalAnalysis;
  newsData: {
      news: NewsItem[];
      overallSentiment: Sentiment;
  } | null;
}

const DataPoint: React.FC<{ label: string; value: string | number; unit?: string; color?: string }> = ({ label, value, unit, color }) => (
    <div className="flex justify-between items-baseline">
        <span className="text-sm text-gray-400">{label}</span>
        <span className={`font-semibold text-lg ${color || 'text-white'}`}>
            {value}
            {unit && <span className="text-sm ml-1">{unit}</span>}
        </span>
    </div>
);

const SentimentIcon: React.FC<{sentiment: Sentiment}> = ({ sentiment }) => {
    const styles = {
        'Positivo': 'text-green-500',
        'Negativo': 'text-red-500',
        'Neutro': 'text-gray-500',
    };
    const icons = {
        'Positivo': <ArrowUpIcon className="h-4 w-4" />,
        'Negativo': <ArrowDownIcon className="h-4 w-4" />,
        'Neutro': <MinusIcon className="h-4 w-4" />,
    };
    return <span className={styles[sentiment]}>{icons[sentiment]}</span>;
}


const NewsSentimentPanel: React.FC<{ newsData: SummaryPanelProps['newsData'] }> = ({ newsData }) => {
    if (!newsData || !newsData.news || newsData.news.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-lg font-bold text-white mb-4">Sentimento por Notícias</h3>
                <p className="text-gray-400">Nenhuma notícia recente encontrada pela IA.</p>
            </div>
        );
    }
    
    const sentimentColors: {[key in Sentiment]: string} = {
        'Positivo': 'text-green-500',
        'Negativo': 'text-red-500',
        'Neutro': 'text-yellow-500',
    }

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-bold text-white mb-3">Sentimento por Notícias</h3>
            <div className="mb-4 text-center">
                <span className="text-sm text-gray-400 uppercase">Sentimento Geral: </span>
                <span className={`font-bold text-lg ${sentimentColors[newsData.overallSentiment]}`}>{newsData.overallSentiment}</span>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2">
                {newsData.news.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className="pt-1">
                            <SentimentIcon sentiment={item.sentiment} />
                        </div>
                        <div>
                            <p className="text-sm text-white leading-tight">{item.headline}</p>
                            <p className="text-xs text-gray-500 font-medium">{item.source}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const SummaryPanel: React.FC<SummaryPanelProps> = ({ technical, newsData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-white">Resumo Técnico</h3>
        <DataPoint label="Preço Atual" value={technical.price.toFixed(4)} />
        <DataPoint label="Suporte" value={technical.support.toFixed(4)} color="text-green-400" />
        <DataPoint label="Resistência" value={technical.resistance.toFixed(4)} color="text-red-400" />
        <DataPoint label="Preço vs EMA(200)" value={technical.price > technical.ema200 ? 'Acima' : 'Abaixo'} color={technical.price > technical.ema200 ? 'text-green-500' : 'text-red-500'}/>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg space-y-4">
        <h3 className="text-lg font-bold text-white">Indicadores & Mercado</h3>
        <DataPoint label="RSI (14)" value={technical.rsi.toFixed(2)} color={technical.rsi > 70 ? 'text-red-500' : technical.rsi < 30 ? 'text-green-500' : 'text-white'}/>
        <DataPoint label="MACD Hist." value={technical.macdValue.toFixed(5)} color={technical.macdValue > 0 ? 'text-green-500' : 'text-red-500'}/>
        <DataPoint label="Variação (24h)" value={technical.priceChangePercent.toFixed(2)} unit="%" color={technical.priceChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}/>
        <DataPoint label="Volume (Quote)" value={(technical.volume24h / 1_000_000).toFixed(2)} unit="M"/>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg">
        <NewsSentimentPanel newsData={newsData} />
      </div>
    </div>
  );
};

export default SummaryPanel;