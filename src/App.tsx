import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from './components/Navigation';
import { OverviewView } from './components/overview/OverviewView';
import { NetworkCanvas } from './components/simulator/NetworkCanvas';
import { MetricsBar } from './components/simulator/MetricsBar';
import { ControlPanel } from './components/simulator/ControlPanel';
import { ShardCard } from './components/simulator/ShardCard';
import { LivePerformanceCharts } from './components/simulator/LivePerformanceCharts';
import { TransactionLog } from './components/simulator/TransactionLog';
import { AlgorithmExplainer } from './components/algorithm/AlgorithmExplainer';
import { BenchmarkSuite } from './components/benchmarks/BenchmarkSuite';
import { ResearchPaperView } from './components/research/ResearchPaperView';
import { SimulationEngine } from './engine/SimulationEngine';
import { GlobalMetrics, Shard, SimulationConfig, StateMigrationEvent, Transaction } from './types/simulation';
import { ShieldCheck, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator' | 'algorithm' | 'benchmarks' | 'research'>('simulator');
  
  // Simulation Engine Reference
  const engineRef = useRef<SimulationEngine | null>(null);

  // Reactive state mirroring engine
  const [config, setConfig] = useState<SimulationConfig>({
    shardCount: 4,
    targetTPS: 500,
    routingStrategy: 'adaptive',
    workloadDistribution: 'zipfian',
    overloadThreshold: 75,
    underloadThreshold: 40,
    migrationCostTicks: 8,
    crossShardLatencyMultiplier: 2.5,
    burstDurationRemaining: 0,
    isPaused: false,
    simSpeed: 1,
  });

  const [shards, setShards] = useState<Shard[]>([]);
  const [metrics, setMetrics] = useState<GlobalMetrics | null>(null);
  const [activeMigrations, setActiveMigrations] = useState<StateMigrationEvent[]>([]);
  const [completedMigrations, setCompletedMigrations] = useState<StateMigrationEvent[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [selectedShardId, setSelectedShardId] = useState<number | null>(null);

  // Initialize engine on mount
  useEffect(() => {
    const engine = new SimulationEngine({
      shardCount: 4,
      targetTPS: 500,
      routingStrategy: 'adaptive',
      workloadDistribution: 'zipfian',
    });

    engineRef.current = engine;

    const unsubscribe = engine.subscribe((eng) => {
      setShards([...eng.getShards()]);
      setMetrics({ ...eng.getMetrics() });
      setConfig({ ...eng.getConfig() });
      setActiveMigrations([...eng.getActiveMigrations()]);
      setCompletedMigrations([...eng.getCompletedMigrations()]);
      setRecentTransactions([...eng.getRecentTransactions()]);
      setIsRunning(eng.getIsRunning());
    });

    engine.start();

    return () => {
      engine.pause();
      unsubscribe();
    };
  }, []);

  const handleTogglePlay = () => {
    if (!engineRef.current) return;
    if (isRunning) {
      engineRef.current.pause();
    } else {
      engineRef.current.start();
    }
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.resetSimulation();
  };

  const handleConfigChange = (updates: Partial<SimulationConfig>) => {
    if (!engineRef.current) return;
    engineRef.current.setConfig(updates);
  };

  const handleTriggerBurst = () => {
    if (!engineRef.current) return;
    engineRef.current.triggerBurst();
  };

  const selectedShard = shards.find((s) => s.id === selectedShardId);

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Top Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        strategy={config.routingStrategy}
        globalTPS={metrics?.globalTPS || 0}
        activeShards={config.shardCount}
        activeMigrations={activeMigrations.length}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <OverviewView onLaunchSimulator={() => setActiveTab('simulator')} />
        )}

        {/* TAB 2: LIVE SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            
            {/* Top KPI Metrics Bar */}
            {metrics && (
              <MetricsBar metrics={metrics} strategy={config.routingStrategy} />
            )}

            {/* Live 60fps Network Canvas */}
            <NetworkCanvas
              shards={shards}
              activeMigrations={activeMigrations}
              strategy={config.routingStrategy}
              globalTPS={metrics?.globalTPS || 0}
              recentTransactions={recentTransactions}
              selectedShardId={selectedShardId}
              onSelectShard={(id) => setSelectedShardId(id)}
            />

            {/* Simulation Control Matrix */}
            <ControlPanel
              config={config}
              isRunning={isRunning}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onConfigChange={handleConfigChange}
              onTriggerBurst={handleTriggerBurst}
            />

            {/* Shard Nodes Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-mono font-bold text-sm text-slate-200 uppercase tracking-wide">
                  Active Shard Node Clusters ({shards.length})
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  Click any shard to inspect mempool queue
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {shards.map((shard) => (
                  <ShardCard
                    key={shard.id}
                    shard={shard}
                    isSelected={selectedShardId === shard.id}
                    onSelect={() => setSelectedShardId(selectedShardId === shard.id ? null : shard.id)}
                  />
                ))}
              </div>
            </div>

            {/* Real-time Performance Charts */}
            {metrics && (
              <LivePerformanceCharts
                metrics={metrics}
                shards={shards}
                strategy={config.routingStrategy}
              />
            )}

            {/* Live Transaction & Migration Stream */}
            <TransactionLog
              transactions={recentTransactions}
              activeMigrations={activeMigrations}
              completedMigrations={completedMigrations}
            />

          </div>
        )}

        {/* TAB 3: ALGORITHM DEEP DIVE */}
        {activeTab === 'algorithm' && <AlgorithmExplainer />}

        {/* TAB 4: BENCHMARKS */}
        {activeTab === 'benchmarks' && <BenchmarkSuite />}

        {/* TAB 5: RESEARCH PAPER */}
        {activeTab === 'research' && <ResearchPaperView />}

      </main>

      {/* Selected Shard Inspector Drawer Modal */}
      {selectedShard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-cyan-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dark-800">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedShard.color }}
                />
                <h3 className="font-mono font-bold text-base text-slate-100">
                  {selectedShard.name} Node Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedShardId(null)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-dark-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
                <span className="text-slate-400 block text-[10px]">CURRENT LOAD</span>
                <span className="text-lg font-bold text-cyan-400">
                  {Math.round(selectedShard.utilization)}%
                </span>
                <span className="text-[10px] text-slate-500 block">EMA: {Math.round(selectedShard.smoothedLoad)}%</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
                <span className="text-slate-400 block text-[10px]">MEMPOOL DEPTH</span>
                <span className="text-lg font-bold text-amber-400">
                  {selectedShard.mempoolSize} txs
                </span>
                <span className="text-[10px] text-slate-500 block">Capacity: {selectedShard.maxMempoolSize}</span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
                <span className="text-slate-400 block text-[10px]">THROUGHPUT</span>
                <span className="text-sm font-bold text-slate-200">
                  {selectedShard.currentTPS} TPS
                </span>
              </div>
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-800">
                <span className="text-slate-400 block text-[10px]">AVG LATENCY</span>
                <span className="text-sm font-bold text-slate-200">
                  {selectedShard.avgLatencyMs} ms
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-mono text-slate-400 uppercase">Mempool Transaction Queue</h4>
              <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[11px] bg-dark-950 p-2 rounded-xl border border-dark-800">
                {selectedShard.mempoolQueue.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">Mempool queue is empty</div>
                ) : (
                  selectedShard.mempoolQueue.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-1.5 rounded bg-dark-900/60 border border-dark-800/60">
                      <span className="text-cyan-400">{tx.hash}</span>
                      <span className="text-slate-400">{tx.sender.slice(0, 6)}...</span>
                      <span className="text-amber-400">{tx.isCrossShard ? '2PC Cross' : 'Intra'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedShardId(null)}
                className="px-4 py-2 bg-dark-800 hover:bg-dark-700 text-slate-200 text-xs font-mono rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-dark-800 bg-dark-950/80 py-6 mt-12 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">SHARDFLOW RESEARCH SIMULATION PLATFORM</span>
            <span className="text-slate-600">|</span>
            <span>Adaptive Sharding & Dynamic Load Balancing</span>
          </div>
          <div>
            Built with React, TypeScript, HTML5 Canvas, Tailwind CSS & Recharts
          </div>
        </div>
      </footer>

    </div>
  );
};
