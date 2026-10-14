import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { GlobalMetrics, Shard } from '../../types/simulation';
import { Activity, BarChart2, TrendingUp } from 'lucide-react';

interface LivePerformanceChartsProps {
  metrics: GlobalMetrics;
  shards: Shard[];
  strategy: 'static' | 'adaptive';
}

export const LivePerformanceCharts: React.FC<LivePerformanceChartsProps> = ({
  metrics,
  shards,
  strategy,
}) => {
  const shardColors = ['#00f2fe', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316', '#14b8a6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* 1. Shard Load Distribution Over Time */}
      <div className="glass-panel p-4 rounded-2xl border border-dark-700/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <h4 className="font-mono font-semibold text-xs text-slate-200">
              SHARD LOAD EQUILIBRIUM (EMA %)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Fairness $\mathcal{'{J}'}$: <span className="text-cyan-400 font-bold">{metrics.jainsFairnessIndex}</span>
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.utilizationHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" />
              <XAxis dataKey="tick" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0d14',
                  borderColor: '#2b364e',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              {shards.map((s, idx) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={`Shard ${s.name.replace('Shard ', '')}`}
                  stroke={shardColors[idx % shardColors.length]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Throughput & Confirmation Latency */}
      <div className="glass-panel p-4 rounded-2xl border border-dark-700/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="font-mono font-semibold text-xs text-slate-200">
              EFFECTIVE TPS vs. TARGET INGRESS
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Strategy: <span className="text-emerald-400 font-bold uppercase">{strategy}</span>
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.throughputHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="currentTpsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="staticEstGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" />
              <XAxis dataKey="tick" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0a0d14',
                  borderColor: '#2b364e',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
              <Area
                type="monotone"
                name="Actual Throughput (TPS)"
                dataKey="current"
                stroke="#00f2fe"
                fillOpacity={1}
                fill="url(#currentTpsGrad)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                name="Target Ingress (TPS)"
                dataKey="target"
                stroke="#94a3b8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
