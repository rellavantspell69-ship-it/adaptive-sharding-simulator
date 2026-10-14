import React from 'react';
import { Shard } from '../../types/simulation';
import { AlertTriangle, CheckCircle2, Cpu, Database, Flame, RefreshCw } from 'lucide-react';

interface ShardCardProps {
  shard: Shard;
  isSelected: boolean;
  onSelect: () => void;
}

export const ShardCard: React.FC<ShardCardProps> = ({ shard, isSelected, onSelect }) => {
  const getStatusBadge = () => {
    switch (shard.status) {
      case 'overloaded':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/80 text-red-400 border border-red-800/80 animate-pulse">
            <Flame className="w-3 h-3 text-red-400" />
            <span>OVERLOADED</span>
          </span>
        );
      case 'busy':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>BUSY</span>
          </span>
        );
      case 'rebalancing':
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-violet-950/80 text-violet-300 border border-violet-800/80 animate-pulse">
            <RefreshCw className="w-3 h-3 text-violet-300 animate-spin" />
            <span>REBALANCING</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>OPTIMAL</span>
          </span>
        );
    }
  };

  const getBarColor = () => {
    if (shard.smoothedLoad >= 80) return 'bg-red-500 shadow-red-500/50';
    if (shard.smoothedLoad >= 60) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  };

  const mempoolPercent = Math.min(100, Math.round((shard.mempoolSize / shard.maxMempoolSize) * 100));

  return (
    <div
      onClick={onSelect}
      className={`glass-panel p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
        isSelected
          ? 'border-cyan-400/80 ring-1 ring-cyan-400/40 shadow-lg shadow-cyan-500/10'
          : 'border-dark-700/80 hover:border-dark-600'
      } ${shard.status === 'overloaded' ? 'bg-red-950/10' : ''}`}
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: shard.color }}
          />
          <h4 className="font-mono font-semibold text-sm text-slate-100">
            {shard.name}
          </h4>
        </div>
        {getStatusBadge()}
      </div>

      {/* Utilization & Smoothed Load */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">UTILIZATION:</span>
          <span className={`font-bold ${
            shard.smoothedLoad >= 80 ? 'text-red-400' : shard.smoothedLoad >= 60 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {Math.round(shard.utilization)}% <span className="text-[10px] text-slate-400">(EMA: {Math.round(shard.smoothedLoad)}%)</span>
          </span>
        </div>
        <div className="w-full h-2 bg-dark-900 rounded-full overflow-hidden border border-dark-700/60">
          <div
            className={`h-full rounded-full transition-all duration-300 shadow-sm ${getBarColor()}`}
            style={{ width: `${Math.min(100, Math.max(4, shard.smoothedLoad))}%` }}
          />
        </div>
      </div>

      {/* Mempool Queue Pressure */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">MEMPOOL QUEUE:</span>
          <span className="text-slate-300">
            {shard.mempoolSize} / {shard.maxMempoolSize} txs ({mempoolPercent}%)
          </span>
        </div>
        <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden border border-dark-700/40">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              mempoolPercent > 75 ? 'bg-red-400' : mempoolPercent > 40 ? 'bg-amber-400' : 'bg-cyan-500'
            }`}
            style={{ width: `${mempoolPercent}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-dark-800 text-[11px] font-mono">
        <div>
          <span className="text-slate-500 block text-[10px]">THROUGHPUT</span>
          <span className="text-slate-200 font-semibold">{shard.currentTPS} TPS</span>
          <span className="text-slate-500 text-[10px]"> / cap {shard.capacityTPS}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">CONFIRM LATENCY</span>
          <span className="text-slate-200 font-semibold">{shard.avgLatencyMs} ms</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">BLOCK HEIGHT</span>
          <span className="text-slate-300 font-semibold">#{shard.blockHeight}</span>
        </div>
        <div>
          <span className="text-slate-500 block text-[10px]">VALIDATORS</span>
          <span className="text-slate-300 font-semibold">{shard.validatorCount} Nodes</span>
        </div>
      </div>

      {/* Dropped / Delayed indicators if overloaded */}
      {(shard.delayedCount > 0 || shard.droppedCount > 0) && (
        <div className="mt-2.5 pt-2 border-t border-dark-800/80 flex items-center justify-between text-[10px] font-mono">
          <span className="text-amber-400/90">Delayed (Lock): {shard.delayedCount}</span>
          <span className="text-red-400/90">Dropped: {shard.droppedCount}</span>
        </div>
      )}
    </div>
  );
};
