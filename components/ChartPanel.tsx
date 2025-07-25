import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { KlineData } from '../types';

interface ChartPanelProps {
  klines: KlineData[];
  pair: string;
  ema200Line: number[];
  support: number;
  resistance: number;
}

const CandleShape = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close } = payload;
  const fill = close >= open ? '#00C48C' : '#FF4B4B';
  // Render a 1px high rect if height is 0 (for doji candles)
  return <rect x={x} y={y} width={width} height={Math.max(height, 1)} fill={fill} />;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the payload for the bar, not the line
    const barPayload = payload.find(p => p.dataKey === 'bodyRange');
    if (!barPayload || !barPayload.payload.open) return null;
    
    const data = barPayload.payload;

    return (
      <div className="bg-gray-700 p-3 border border-gray-600 rounded-lg shadow-lg text-sm">
        <p className="label text-white font-bold mb-2">{`${label}`}</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            <span className="text-gray-400">Open:</span><span className={`font-mono text-white text-right`}>{data.open.toFixed(4)}</span>
            <span className="text-gray-400">High:</span><span className={`font-mono text-white text-right`}>{data.high.toFixed(4)}</span>
            <span className="text-gray-400">Low:</span><span className={`font-mono text-white text-right`}>{data.low.toFixed(4)}</span>
            <span className="text-gray-400">Close:</span><span className={`font-mono text-right ${data.close >= data.open ? 'text-green-400' : 'text-red-400'}`}>{data.close.toFixed(4)}</span>
        </div>
      </div>
    );
  }
  return null;
};


const ChartPanel: React.FC<ChartPanelProps> = ({ klines, pair, ema200Line, support, resistance }) => {
    
  const formattedData = klines.map((d, i) => {
    const open = parseFloat(d.open);
    const close = parseFloat(d.close);
    const high = parseFloat(d.high);
    const low = parseFloat(d.low);
    const emaIndex = i - (klines.length - ema200Line.length);
    return {
        time: new Date(d.time).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
        bodyRange: open > close ? [close, open] : [open, close],
        wickRange: [low, high],
        open, close, high, low,
        ema200: emaIndex >= 0 ? ema200Line[emaIndex] : null,
    }
  });

  const lows = klines.map(k => parseFloat(k.low));
  const highs = klines.map(k => parseFloat(k.high));
  const yDomain = [Math.min(...lows) * 0.995, Math.max(...highs) * 1.005];

  return (
    <div className="bg-gray-800 p-6 rounded-lg h-96 flex flex-col">
       <h3 className="text-lg font-bold text-white mb-4">Gráfico de Preço: {pair} (4h)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A364E" />
          <XAxis dataKey="time" stroke="#D0D6E2" />
          <YAxis stroke="#D0D6E2" domain={yDomain} tickFormatter={(tick) => typeof tick === 'number' ? tick.toFixed(4) : tick} width={80} />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={<CustomTooltip />}
          />
          <Legend wrapperStyle={{color: '#D0D6E2'}}/>

          <ReferenceLine y={support} label={{ value: "Support", position: 'insideTopLeft', fill: '#00C48C', dy: -10, dx: 20 }} stroke="#00C48C" strokeDasharray="3 3" ifOverflow="extendDomain" />
          <ReferenceLine y={resistance} label={{ value: "Resistance", position: 'insideTopLeft', fill: '#FF4B4B', dy: 10, dx: 20 }} stroke="#FF4B4B" strokeDasharray="3 3" ifOverflow="extendDomain" />
          
          <Line type="monotone" dataKey="ema200" name="EMA 200" stroke="#FFAB00" strokeWidth={1.5} dot={false} connectNulls/>
          
          {/* Candlestick implementation: A bar for the wick and a custom shape bar for the body. */}
          <Bar dataKey="wickRange" fill="#9CA3AF" barSize={1.5} legendType="none" />
          <Bar dataKey="bodyRange" shape={<CandleShape />} barSize={10} legendType="none" />
          
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartPanel;