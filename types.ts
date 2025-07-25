export type CryptoPair = string;

// Binance kline/candlestick data
export interface KlineData {
  time: number; // open time
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface TechnicalAnalysis {
  price: number;
  rsi: number;
  macdValue: number; // The histogram value (MACD - Signal)
  ema200: number;
  volume24h: number;
  priceChangePercent: number;
  support: number;
  resistance: number;
}

export enum Recommendation {
  COMPRA = 'COMPRA',
  VENDA = 'VENDA',
  NEUTRO = 'NEUTRO',
}

export enum RiskLevel {
    BAIXO = 'BAIXO',
    MEDIO = 'MÉDIO',
    ALTO = 'ALTO',
}

export interface AnalysisResult {
  suggestion: Recommendation;
  justification: string;
  entryPoint: number;
  stopLoss: number;
  takeProfit: number;
  risk: RiskLevel;
}

export type Sentiment = 'Positivo' | 'Negativo' | 'Neutro';

export interface NewsItem {
    headline: string;
    source: string;
    sentiment: Sentiment;
}

export interface FullAnalysis {
    analysis: AnalysisResult;
    news: NewsItem[];
    overallSentiment: Sentiment;
}

export interface WhaleAlert {
  id: string; // Unique ID from RSS feed
  title: string;
  date: string;
  coin: string;
  amountCoin: number;
  amountUSD: number;
  from: string;
  to: string;
}
