import React from 'react';
import { GlobalMetrics } from '../../types/simulation';
import { Activity, Clock, Flame, GitFork, RefreshCw, Scale, ShieldCheck } from 'lucide-react';

interface MetricsBarProps {
  metrics: GlobalMetrics;
  strategy: 'static' | 'adaptive';
}

export const MetricsBar: React.FC<MetricsBarProps> = ({ metrics, strategy }) => {
  const getFairnessColor = (jain: number) => {
    if (jain >= 0.85) return 'text-emerald-400';
    if (jain >= 0.65) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      
      {/* 1. Global Throughput */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>THROUGHPUT</span>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-slate-100">
            {metrics.globalTPS}
          </span>
          <span className="text-[11px] font-mono text-slate-400">TPS</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          Target: {metrics.targetTPS} TPS
        </div>
      </div>

      {/* 2. Latency (Avg & P99) */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>AVG LATENCY</span>
          <Clock className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-slate-100">
            {metrics.avgLatencyMs}
          </span>
          <span className="text-[11px] font-mono text-slate-400">ms</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          P99: <span className="text-amber-400 font-semibold">{metrics.p99LatencyMs} ms</span>
        </div>
      </div>

      {/* 3. Jain's Fairness Index */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>JAIN'S FAIRNESS</span>
          <Scale className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-xl font-bold font-mono ${getFairnessColor(metrics.jainsFairnessIndex)}`}>
            {metrics.jainsFairnessIndex}
          </span>
          <span className="text-[10px] font-mono text-slate-400">/ 1.0</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          Gini Coeff: <span className="text-slate-300 font-semibold">{metrics.giniCoefficient}</span>
        </div>
      </div>

      {/* 4. Cross-Shard Tx Ratio */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>CROSS-SHARD TX</span>
          <GitFork className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-amber-400">
            {metrics.crossShardPercentage}%
          </span>
          <span className="text-[10px] font-mono text-slate-400">ratio</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          2PC Atomic Locks
        </div>
      </div>

      {/* 5. Hotspot Overload Status */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>OVERLOADED SHARDS</span>
          <Flame className="w-3.5 h-3.5 text-red-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-xl font-bold font-mono ${metrics.overloadedShardsCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
            {metrics.overloadedShardsCount}
          </span>
          <span className="text-[10px] font-mono text-slate-400">nodes</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          {metrics.overloadedShardsCount > 0 ? (strategy === 'adaptive' ? 'Auto-rebalancing...' : 'Bottleneck!') : 'All shards normal'}
        </div>
      </div>

      {/* 6. State Migrations */}
      <div className="glass-panel p-3.5 rounded-xl border border-dark-700/80">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
          <span>MIGRATIONS</span>
          <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-violet-300">
            {metrics.totalMigrationsCount}
          </span>
          <span className="text-[10px] font-mono text-slate-400">total</span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 mt-1">
          Active: <span className="text-violet-400 font-semibold">{metrics.activeMigrationsCount}</span>
        </div>
      </div>

    </div>
  );
};
