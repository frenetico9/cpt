import { KlineData, TechnicalAnalysis, CryptoPair } from '../types';

// Simple EMA calculation for internal use
const calculateEMA = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const ema: number[] = [];
    if (data.length < period) return [];
    
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[i];
    }
    ema.push(sum / period);

    for (let i = period; i < data.length; i++) {
        const newEma = (data[i] * k) + (ema[ema.length - 1] * (1 - k));
        ema.push(newEma);
    }
    return ema;
};

// Simple RSI calculation for internal use
const calculateRSI = (data: number[], period: number = 14): number => {
    if (data.length <= period) return 50; // Not enough data
    const changes = data.slice(1).map((price, i) => price - data[i]);
    
    let initialGains = 0;
    let initialLosses = 0;
    for(let i = 0; i < period; i++) {
        if(changes[i] > 0) initialGains += changes[i];
        else initialLosses += Math.abs(changes[i]);
    }
    
    let avgGain = initialGains / period;
    let avgLoss = initialLosses / period;
    
    for(let i = period; i < changes.length; i++) {
        const change = changes[i];
        if(change > 0) {
            avgGain = (avgGain * (period - 1) + change) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
            avgGain = (avgGain * (period - 1)) / period;
        }
    }
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

// Simple MACD calculation for internal use
const calculateMACD = (data: number[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9): { macd: number, signal: number } => {
    if(data.length < longPeriod) return { macd: 0, signal: 0 };

    const emaLong = calculateEMA(data, longPeriod);
    const emaShort = calculateEMA(data, shortPeriod).slice(longPeriod - shortPeriod);
    
    const macdLine = emaShort.map((val, i) => val - emaLong[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    
    const macd = macdLine[macdLine.length - 1];
    
    return { macd, signal: signalLine[signalLine.length - 1] };
};


const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

// Fetches candlestick data
export const fetchKlines = async (symbol: string, interval: string = '4h', limit: number = 250): Promise<KlineData[]> => {
    const response = await fetch(`${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da Binance: ${errorData.msg || response.statusText}`);
    }
    const data = await response.json();
    // Binance returns an array of arrays. Map it to our KlineData object.
    return data.map((d: any[]): KlineData => ({
        time: d[0],
        open: d[1],
        high: d[2],
        low: d[3],
        close: d[4],
        volume: d[5],
    }));
};

// Fetches 24-hour ticker statistics
export const fetchTicker24hr = async (symbol: string): Promise<any> => {
    const response = await fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro da Binance: ${errorData.msg || response.statusText}`);
    }
    return await response.json();
};

export const getMarketAnalysis = async (pair: CryptoPair): Promise<{ tech: TechnicalAnalysis, klines: KlineData[] }> => {
    const symbol = pair.replace('/', '');
    
    // Fetch data in parallel
    const [klines, ticker] = await Promise.all([
        fetchKlines(symbol),
        fetchTicker24hr(symbol)
    ]);

    const closePrices = klines.map(k => parseFloat(k.close));
    if(closePrices.length < 200) { // Need enough data for long EMA
        throw new Error("Não há dados suficientes para calcular a EMA de 200 períodos. Tente um par com mais histórico.");
    }
    
    // Calculate technical indicators
    const rsi = calculateRSI(closePrices, 14);
    const ema200 = calculateEMA(closePrices, 200).pop() || 0;
    const macd = calculateMACD(closePrices);

    // Calculate Support and Resistance from the kline data period
    const lows = klines.map(k => parseFloat(k.low));
    const highs = klines.map(k => parseFloat(k.high));
    const support = Math.min(...lows);
    const resistance = Math.max(...highs);
    
    const tech: TechnicalAnalysis = {
        price: parseFloat(ticker.lastPrice),
        rsi: rsi,
        macdValue: macd.macd - macd.signal, // Using histogram value
        ema200: ema200,
        volume24h: parseFloat(ticker.quoteVolume),
        priceChangePercent: parseFloat(ticker.priceChangePercent),
        support,
        resistance,
    };

    return { tech, klines };
};