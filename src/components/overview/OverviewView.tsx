import React from 'react';
import { 
  ArrowRight, 
  BarChart2, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Flame, 
  GitFork, 
  Layers, 
  Lock, 
  Network, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Zap 
} from 'lucide-react';

interface OverviewViewProps {
  onLaunchSimulator: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onLaunchSimulator }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 py-6">
      
      {/* Hero Section */}
      <div className="relative glass-panel p-8 sm:p-12 rounded-3xl border border-dark-700/80 bg-tech-radial overflow-hidden shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 font-mono text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RESEARCH WHITE-PAPER INTERACTIVE DEMONSTRATION</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-slate-100 tracking-tight leading-tight">
            Adaptive Sharding with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
              Intelligent Load Balancing
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminating the single-shard bottleneck in blockchain sharding. Discover how real-time telemetry, stateless transaction redirection, and atomic 2-Phase Commit account state migrations prevent catastrophic hotspot failures under real-world skewed workloads.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={onLaunchSimulator}
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono text-xs font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LAUNCH LIVE SIMULATOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* The Core Problem: Why Static Sharding Fails */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-red-400 font-mono text-xs font-semibold">
          <Flame className="w-4 h-4" />
          <span>THE CRITICAL ARCHITECTURAL BOTTLENECK</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
          The Hotspot Dilemma in Modern Blockchains
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          <div className="glass-panel p-6 rounded-2xl border border-red-500/25 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-base text-slate-100">
              Zipfian Workload Skew
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-world blockchain transaction activity is not uniform. Empirical Ethereum data shows that over <strong>80% of gas</strong> is consumed by the top 5% of smart contracts (Uniswap, OpenSea, Tether).
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-amber-500/25 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-base text-slate-100">
              Static Modulo Failure
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              When shards are assigned via static hashing ($hash(addr) \pmod N$), hotspot accounts permanently bottleneck their assigned shard. Mempools overflow and latency explodes, while neighboring shards sit idle at 10% load.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/25 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className="font-mono font-bold text-base text-slate-100">
              Cross-Shard Penalty
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Naive repartitioning increases cross-shard transactions, which require multi-phase coordination and asynchronous receipts, inflating latency and consuming validation bandwidth.
            </p>
          </div>

        </div>
      </div>

      {/* The Adaptive Solution Architecture */}
      <div className="glass-panel p-8 rounded-3xl border border-dark-700/80 space-y-6">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold">
          <Zap className="w-4 h-4" />
          <span>OUR PROPOSED SYSTEM ARCHITECTURE</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
          Dual-Tier Telemetry & Intelligent State Migration
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-xs font-mono text-slate-300 leading-relaxed">
            <p>
              Our framework resolves the hotspot dilemma by decoupling <strong>instant execution routing</strong> from <strong>persistent account state location</strong>:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-dark-900 border border-cyan-500/30 space-y-1">
                <span className="text-cyan-400 font-bold text-sm block">1. Exponential Moving Average Telemetry</span>
                <span className="text-slate-400 text-[11px] font-sans">
                  Each shard continuously reports compute utilization and mempool queue pressure. The router maintains a smoothed load metric $L_i(t)$ to filter transient micro-spikes from sustained congestion.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-900 border border-emerald-500/30 space-y-1">
                <span className="text-emerald-400 font-bold text-sm block">2. Tier 1: Stateless Redirection ($O(1)$)</span>
                <span className="text-slate-400 text-[11px] font-sans">
                  Independent calls and read/verification transactions are immediately routed to the shard with minimum queue depth, achieving instant zero-lock load shedding.
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-dark-900 border border-violet-500/30 space-y-1">
                <span className="text-violet-300 font-bold text-sm block">3. Tier 2: Atomic 2PC Account State Migration</span>
                <span className="text-slate-400 text-[11px] font-sans">
                  When an account creates chronic hotspot pressure, the system evaluates a net utility function and executes an atomic 2-Phase Commit migration, locking the state, relaying the Merkle state proof, and updating the global router table without risk of double-spend.
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Blueprint */}
          <div className="p-6 rounded-2xl bg-dark-950 border border-dark-800 space-y-4 font-mono text-xs">
            <div className="text-center font-bold text-slate-200 border-b border-dark-800 pb-2">
              DATA FLOW & INGRESS ROUTING PIPELINE
            </div>

            <div className="flex flex-col items-center space-y-2">
              <div className="w-full py-2.5 rounded-lg bg-blue-950/60 border border-blue-800 text-center text-blue-300 font-semibold">
                Incoming Client Transactions (500 - 2000 TPS)
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500 rotate-90" />

              <div className="w-full p-3 rounded-lg bg-cyan-950/80 border border-cyan-600 text-center text-cyan-300 font-bold shadow-lg shadow-cyan-500/10">
                ⚡ Intelligent Load Balancer (EMA Profiler)
                <div className="text-[10px] text-slate-400 font-normal mt-1">
                  Evaluates $L_i$, Tx Dependency & State Location
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-dark-900 border border-emerald-800/80 text-center text-[11px] text-emerald-400">
                  Tier 1: Redirect to Shard $min(L)$
                </div>
                <div className="p-2.5 rounded-lg bg-dark-900 border border-violet-800/80 text-center text-[11px] text-violet-300">
                  Tier 2: 2PC State Lock & Relocate
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500 rotate-90" />

              <div className="w-full grid grid-cols-4 gap-1.5 pt-1 text-center text-[10px]">
                <div className="p-2 rounded bg-dark-900 border border-dark-700 text-slate-300">
                  Shard 0 (Alpha)
                </div>
                <div className="p-2 rounded bg-dark-900 border border-dark-700 text-slate-300">
                  Shard 1 (Beta)
                </div>
                <div className="p-2 rounded bg-dark-900 border border-dark-700 text-slate-300">
                  Shard 2 (Gamma)
                </div>
                <div className="p-2 rounded bg-dark-900 border border-dark-700 text-slate-300">
                  Shard 3 (Delta)
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 text-center pt-2">
              Jain's Fairness Index $\mathcal{'{J}'} \to 0.98$ (Near-ideal load equilibrium)
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
