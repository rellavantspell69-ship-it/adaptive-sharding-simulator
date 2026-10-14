import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Pause, 
  Play, 
  RotateCcw, 
  Settings2, 
  Sliders, 
  Zap 
} from 'lucide-react';
import { RoutingStrategy, SimulationConfig, WorkloadType } from '../../types/simulation';

interface ControlPanelProps {
  config: SimulationConfig;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onConfigChange: (updates: Partial<SimulationConfig>) => void;
  onTriggerBurst: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  isRunning,
  onTogglePlay,
  onReset,
  onConfigChange,
  onTriggerBurst,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const shardOptions = [2, 4, 6, 8];
  const speedOptions = [0.5, 1, 2, 5];

  const tpsPresets = [
    { label: 'Low', value: 250 },
    { label: 'Medium', value: 500 },
    { label: 'High', value: 1000 },
    { label: 'Stress', value: 1800 },
  ];

  return (
    <div className="glass-panel p-5 rounded-2xl border border-dark-700/80 space-y-5">
      {/* Top Header & Run Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dark-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wide">
            Simulation Control Matrix
          </h3>
        </div>

        {/* Play / Pause / Reset / Speed */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-md ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-dark-950 hover:bg-cyan-400 shadow-cyan-500/25'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START SIMULATION</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-2 text-slate-400 hover:text-cyan-300 bg-dark-900 hover:bg-dark-800 rounded-xl border border-dark-700 transition-colors"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-dark-900 border border-dark-700 rounded-xl p-0.5 text-xs font-mono">
            {speedOptions.map((speed) => (
              <button
                key={speed}
                onClick={() => onConfigChange({ simSpeed: speed })}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  config.simSpeed === speed
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Configuration Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Routing Strategy */}
        <div className="space-y-2 bg-dark-900/60 p-3.5 rounded-xl border border-dark-800">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>ROUTING STRATEGY</span>
            <span className={`text-[10px] font-bold uppercase ${
              config.routingStrategy === 'adaptive' ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {config.routingStrategy}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-dark-950 rounded-lg border border-dark-800">
            <button
              onClick={() => onConfigChange({ routingStrategy: 'static' })}
              className={`py-1.5 text-xs font-mono rounded transition-all text-center ${
                config.routingStrategy === 'static'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Static Modulo
            </button>
            <button
              onClick={() => onConfigChange({ routingStrategy: 'adaptive' })}
              className={`py-1.5 text-xs font-mono rounded transition-all text-center ${
                config.routingStrategy === 'adaptive'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Adaptive LB
            </button>
          </div>
        </div>

        {/* 2. Number of Active Shards */}
        <div className="space-y-2 bg-dark-900/60 p-3.5 rounded-xl border border-dark-800">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>ACTIVE SHARDS</span>
            <span className="text-cyan-400 font-bold">{config.shardCount} SHARDS</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-dark-950 rounded-lg border border-dark-800">
            {shardOptions.map((count) => (
              <button
                key={count}
                onClick={() => onConfigChange({ shardCount: count })}
                className={`py-1.5 text-xs font-mono rounded transition-all text-center ${
                  config.shardCount === count
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Transaction Rate (TPS) */}
        <div className="space-y-2 bg-dark-900/60 p-3.5 rounded-xl border border-dark-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">TRANSACTION RATE</span>
            <span className="text-cyan-300 font-bold">{config.targetTPS} TPS</span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={config.targetTPS}
            onChange={(e) => onConfigChange({ targetTPS: Number(e.target.value) })}
            className="w-full accent-cyan-400 h-1.5 bg-dark-950 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between pt-1">
            {tpsPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onConfigChange({ targetTPS: preset.value })}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  config.targetTPS === preset.value
                    ? 'bg-cyan-900/50 text-cyan-300 border border-cyan-700/60'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Workload Distribution */}
        <div className="space-y-2 bg-dark-900/60 p-3.5 rounded-xl border border-dark-800">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>TRAFFIC SKEW</span>
            <span className="text-purple-400 font-bold uppercase">{config.workloadDistribution}</span>
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 bg-dark-950 rounded-lg border border-dark-800 text-[11px] font-mono">
            <button
              onClick={() => onConfigChange({ workloadDistribution: 'uniform' })}
              className={`py-1 rounded transition-colors ${
                config.workloadDistribution === 'uniform'
                  ? 'bg-blue-500/20 text-blue-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Uniform
            </button>
            <button
              onClick={() => onConfigChange({ workloadDistribution: 'zipfian' })}
              className={`py-1 rounded transition-colors ${
                config.workloadDistribution === 'zipfian'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Hotspot
            </button>
            <button
              onClick={onTriggerBurst}
              className="py-1 rounded bg-red-950/60 text-red-400 hover:bg-red-900/60 font-semibold border border-red-800/40 flex items-center justify-center space-x-1"
              title="Inject Sudden 2000 TPS Traffic Surge"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>Burst</span>
            </button>
          </div>
        </div>

      </div>

      {/* Advanced Parameters Accordion */}
      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>ADVANCED ALGORITHM TUNING PARAMETERS</span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3 pt-3 border-t border-dark-800 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Overload Threshold ($\tau$):</span>
                <span className="text-cyan-400 font-bold">{config.overloadThreshold}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={90}
                value={config.overloadThreshold}
                onChange={(e) => onConfigChange({ overloadThreshold: Number(e.target.value) })}
                className="w-full accent-cyan-400 h-1 bg-dark-950 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>State Migration Lock Ticks:</span>
                <span className="text-purple-400 font-bold">{config.migrationCostTicks} ticks</span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                value={config.migrationCostTicks}
                onChange={(e) => onConfigChange({ migrationCostTicks: Number(e.target.value) })}
                className="w-full accent-purple-400 h-1 bg-dark-950 rounded cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Cross-Shard Latency Multiplier:</span>
                <span className="text-amber-400 font-bold">{config.crossShardLatencyMultiplier}x</span>
              </div>
              <input
                type="range"
                min={1.2}
                max={4.0}
                step={0.1}
                value={config.crossShardLatencyMultiplier}
                onChange={(e) => onConfigChange({ crossShardLatencyMultiplier: Number(e.target.value) })}
                className="w-full accent-amber-400 h-1 bg-dark-950 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
