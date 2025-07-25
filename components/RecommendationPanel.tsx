
import React from 'react';
import { AnalysisResult, Recommendation, RiskLevel } from '../types';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import MinusIcon from './icons/MinusIcon';

interface RecommendationPanelProps {
  analysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500" style={{animationDelay: '0.2s'}}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-blue-500" style={{animationDelay: '0.4s'}}></div>
        <span className="text-lg text-gray-400 ml-2">Analisando dados com IA...</span>
    </div>
);

const RecommendationPill: React.FC<{ recommendation: Recommendation }> = ({ recommendation }) => {
    const styles = {
        [Recommendation.COMPRA]: 'bg-green-500 text-white',
        [Recommendation.VENDA]: 'bg-red-500 text-white',
        [Recommendation.NEUTRO]: 'bg-gray-600 text-white',
    };
    const icons = {
        [Recommendation.COMPRA]: <ArrowUpIcon className="h-5 w-5" />,
        [Recommendation.VENDA]: <ArrowDownIcon className="h-5 w-5" />,
        [Recommendation.NEUTRO]: <MinusIcon className="h-5 w-5" />,
    }

    return (
        <div className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xl font-bold uppercase tracking-wider ${styles[recommendation]}`}>
            {icons[recommendation]}
            <span>{recommendation}</span>
        </div>
    );
};

const RiskPill: React.FC<{ risk: RiskLevel }> = ({ risk }) => {
    const styles = {
        [RiskLevel.BAIXO]: 'border-green-500 text-green-500',
        [RiskLevel.MEDIO]: 'border-yellow-500 text-yellow-500',
        [RiskLevel.ALTO]: 'border-red-500 text-red-500',
    };
    return (
         <span className={`px-3 py-1 text-xs font-semibold border rounded-full ${styles[risk]}`}>{risk}</span>
    );
};


const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ analysis, loading, error }) => {
  if (loading) {
    return <div className="bg-gray-800 p-6 rounded-lg flex items-center justify-center min-h-[200px]"><LoadingSpinner /></div>;
  }
  if (error) {
    return <div className="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-lg text-center">{error}</div>;
  }
  if (!analysis) {
    return <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">Selecione um par para iniciar a análise.</div>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center justify-center lg:col-span-1 space-y-4">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider">Recomendação da IA</h3>
            <RecommendationPill recommendation={analysis.suggestion} />
            <RiskPill risk={analysis.risk}/>
        </div>
        <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-2">Justificativa:</h4>
            <p className="text-gray-300 text-sm mb-6">{analysis.justification}</p>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <h5 className="text-xs text-gray-400 uppercase">Entrada</h5>
                    <p className="text-lg font-mono font-bold text-blue-500">{analysis.entryPoint.toFixed(5)}</p>
                </div>
                <div>
                    <h5 className="text-xs text-green-500 uppercase">Take Profit</h5>
                    <p className="text-lg font-mono font-bold text-green-500">{analysis.takeProfit.toFixed(5)}</p>
                </div>
                <div>
                    <h5 className="text-xs text-red-500 uppercase">Stop Loss</h5>
                    <p className="text-lg font-mono font-bold text-red-500">{analysis.stopLoss.toFixed(5)}</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationPanel;
