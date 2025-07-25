import React, { useState, useEffect, useCallback } from 'react';
import { CryptoPair, TechnicalAnalysis, AnalysisResult, KlineData, NewsItem, Sentiment, WhaleAlert } from '../types';
import { getCryptoAnalysis } from '../services/geminiService';
import { getMarketAnalysis } from '../services/binanceService';
import { fetchWhaleAlerts } from '../services/whaleAlertService';
import ChartPanel from './ChartPanel';
import SummaryPanel from './SummaryPanel';
import RecommendationPanel from './RecommendationPanel';
import WhaleTrackerPanel from './WhaleTrackerPanel';

interface DashboardProps {
  pair: CryptoPair;
}

interface NewsData {
    news: NewsItem[];
    overallSentiment: Sentiment;
}

// Helper to calculate EMA line for the chart
const calculateEmaLine = (data: number[], period: number) => {
    if(data.length < period) return [];
    
    const k = 2 / (period + 1);
    const ema: number[] = [];
    
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    ema.push(sum / period);

    for (let i = period; i < data.length; i++) {
        const newEma = (data[i] * k) + (ema[ema.length - 1] * (1 - k));
        ema.push(newEma);
    }
    return ema;
};

const Dashboard: React.FC<DashboardProps> = ({ pair }) => {
  // AI analysis & market data state
  const [loadingPairData, setLoadingPairData] = useState<boolean>(true);
  const [errorPairData, setErrorPairData] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [newsData, setNewsData] = useState<NewsData | null>(null);
  const [technicalData, setTechnicalData] = useState<TechnicalAnalysis | null>(null);
  const [klines, setKlines] = useState<KlineData[]>([]);
  const [ema200Line, setEma200Line] = useState<number[]>([]);

  // Whale tracker state
  const [loadingWhales, setLoadingWhales] = useState<boolean>(true);
  const [errorWhales, setErrorWhales] = useState<string | null>(null);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([]);

  const fetchPairData = useCallback(async () => {
    if (!pair) return;
    
    setLoadingPairData(true);
    setErrorPairData(null);
    setAnalysisResult(null);
    setNewsData(null);
    setTechnicalData(null);

    try {
        const { tech, klines: marketKlines } = await getMarketAnalysis(pair);
        setTechnicalData(tech);
        setKlines(marketKlines);
        
        const closePrices = marketKlines.map(k => parseFloat(k.close));
        setEma200Line(calculateEmaLine(closePrices, 200));

        const fullAnalysis = await getCryptoAnalysis(pair, tech);
        setAnalysisResult(fullAnalysis.analysis);
        setNewsData({
            news: fullAnalysis.news,
            overallSentiment: fullAnalysis.overallSentiment,
        });
    } catch (e) {
        if (e instanceof Error) {
            setErrorPairData(e.message);
        } else {
            setErrorPairData("Ocorreu um erro desconhecido na análise do par.");
        }
    } finally {
        setLoadingPairData(false);
    }
  }, [pair]);
  
  const fetchWhaleData = useCallback(async () => {
    setLoadingWhales(true);
    setErrorWhales(null);
    try {
        const alerts = await fetchWhaleAlerts();
        setWhaleAlerts(alerts);
    } catch(e) {
        if (e instanceof Error) {
            setErrorWhales(e.message);
        } else {
            setErrorWhales("Erro ao buscar dados de baleias.");
        }
    } finally {
        setLoadingWhales(false);
    }
  }, []);

  const handleReanalysis = () => {
      fetchPairData();
      fetchWhaleData();
  };

  useEffect(() => {
    fetchPairData();
    fetchWhaleData();
  }, [pair, fetchPairData, fetchWhaleData]);

  const overallLoading = loadingPairData && !technicalData;
  const overallError = errorPairData && !technicalData;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-white">Análise do Par: <span className="text-blue-500">{pair}</span></h2>
          <button onClick={handleReanalysis} disabled={loadingPairData || loadingWhales} className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2">
            {(loadingPairData || loadingWhales) ? 'Analisando...' : 'Re-analisar'}
          </button>
      </div>

      {overallError && (
         <div className="flex justify-center items-center h-64 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
           <p className="text-center font-semibold">Falha ao carregar dados do par. <br/> <span className="font-normal text-sm">{errorPairData}</span></p>
         </div>
      )}

      {overallLoading && !overallError && (
         <div className="flex justify-center items-center h-64">
           <p className="text-gray-400 text-lg animate-pulse">Carregando dados do mercado...</p>
         </div>
      )}
      
      {technicalData && (
          <div className="space-y-6">
              <RecommendationPanel analysis={analysisResult} loading={loadingPairData && !analysisResult} error={errorPairData && !analysisResult ? errorPairData : null}/>
              <SummaryPanel technical={technicalData} newsData={newsData} />
              {klines.length > 0 && <ChartPanel klines={klines} pair={pair} ema200Line={ema200Line} support={technicalData.support} resistance={technicalData.resistance}/>}
              <WhaleTrackerPanel alerts={whaleAlerts} loading={loadingWhales} error={errorWhales} />
          </div>
      )}
       
    </div>
  );
};

export default Dashboard;
