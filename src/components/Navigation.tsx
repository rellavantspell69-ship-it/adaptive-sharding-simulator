import React from 'react';
import { 
  Activity, 
  BarChart3, 
  Cpu, 
  FileText, 
  Layers, 
  Network, 
  RotateCcw, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';
import { RoutingStrategy } from '../types/simulation';

interface NavigationProps {
  activeTab: 'overview' | 'simulator' | 'algorithm' | 'benchmarks' | 'research';
  setActiveTab: (tab: 'overview' | 'simulator' | 'algorithm' | 'benchmarks' | 'research') => void;
  strategy: RoutingStrategy;
  globalTPS: number;
  activeShards: number;
  activeMigrations: number;
  onReset: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  strategy,
  globalTPS,
  activeShards,
  activeMigrations,
  onReset,
}) => {
  const tabs = [
    { id: 'overview', label: '1. Overview', icon: Layers, desc: 'Problem & Solution' },
    { id: 'simulator', label: '2. Live Simulator', icon: Network, desc: 'Live Network & Shards' },
    { id: 'algorithm', label: '3. Algorithm', icon: Cpu, desc: 'Overload & Migration Math' },
    { id: 'benchmarks', label: '4. Benchmarks', icon: BarChart3, desc: 'Repeatable Experiments' },
    { id: 'research', label: '5. Research Paper', icon: FileText, desc: 'Formal Model & Theorems' },
  ] as const;

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-dark-700 bg-dark-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('simulator')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-base tracking-wider text-slate-100">
                  SHARD<span className="text-cyan-400">FLOW</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 uppercase">
                  v2.4 Research
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block">
                Adaptive Sharding & Intelligent Load Balancing
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Real-time Status Badges */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-xs font-mono bg-dark-900 border border-dark-700/80 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400">STRATEGY:</span>
              <span className={`px-1.5 py-0.5 rounded font-semibold ${
                strategy === 'adaptive' 
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                  : 'bg-amber-950 text-amber-400 border border-amber-800/60'
              }`}>
                {strategy.toUpperCase()}
              </span>
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-xs font-mono bg-dark-900 border border-dark-700/80 rounded-lg px-2.5 py-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-300">{globalTPS} TPS</span>
            </div>

            {activeMigrations > 0 && (
              <div className="flex items-center space-x-1.5 text-xs font-mono bg-violet-950/80 border border-violet-800/80 text-violet-300 rounded-lg px-2 py-1 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                <span>{activeMigrations} MIGRATING</span>
              </div>
            )}

            <button
              onClick={onReset}
              title="Reset Simulation"
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-dark-800 rounded-lg border border-dark-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-dark-800 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-dark-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
