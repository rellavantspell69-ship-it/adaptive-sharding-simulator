import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  Database, 
  FileCode, 
  GitCommit, 
  Lock, 
  RefreshCw, 
  Scale, 
  ShieldCheck, 
  Sparkles, 
  Zap 
} from 'lucide-react';

export const AlgorithmExplainer: React.FC = () => {
  // Interactive Decision Tree States
  const [simTxType, setSimTxType] = useState<'stateless' | 'stateful'>('stateful');
  const [simOriginLoad, setSimOriginLoad] = useState<number>(85);
  const [simTargetLoad, setSimTargetLoad] = useState<number>(30);
  const [simAccountTxCount, setSimAccountTxCount] = useState<number>(24);

  // Evaluate algorithm decision
  const isOriginOverloaded = simOriginLoad >= 75;
  const loadDelta = simOriginLoad - simTargetLoad;
  const shouldRedirect = simTxType === 'stateless' && isOriginOverloaded && loadDelta > 20;
  const shouldMigrate = simTxType === 'stateful' && isOriginOverloaded && loadDelta > 25 && simAccountTxCount > 10;

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      
      {/* Title & Research Abstract Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700/80 bg-tech-radial relative overflow-hidden">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-2">
          <Cpu className="w-4 h-4" />
          <span>ROUTING ARCHITECTURE & MATHEMATICAL SPECIFICATION</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 mb-3">
          Adaptive Sharding with Dual-Tier Dynamic Load Balancing
        </h1>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Traditional blockchain sharding relies on static modulo hashing of account addresses to partitions. Under skewed workloads (such as a popular decentralized exchange or NFT mint), static hashing causes catastrophic shard bottlenecks. Our algorithm introduces a <strong>dual-tier load balancing protocol</strong> separating instant stateless transaction redirection from atomic state migration.
        </p>
      </div>

      {/* Dual Action Comparison Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tier 1 */}
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              TIER 1 — IMMEDIATE (O(1))
            </span>
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-mono font-bold text-slate-100">
            Stateless / Eligible Transaction Redirection
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            For transactions that do not mutate persistent shard-bound state (e.g., query verification, deposit minting, independent contract invocations), the router immediately intercepts and redirects the execution payload to the least-loaded shard:
          </p>
          <div className="p-3 bg-dark-950 rounded-xl font-mono text-xs text-cyan-300 border border-dark-800">
            {"S_target = argmin_j (L_j)  [if L_origin > \u03C4_overload]"}
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Zero lock overhead — instantaneous rerouting.</li>
            <li>Eliminates mempool queue congestion for read/deposit bursts.</li>
            <li>Preserves global transaction order.</li>
          </ul>
        </div>

        {/* Tier 2 */}
        <div className="glass-panel p-6 rounded-2xl border border-violet-500/30 space-y-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800">
              TIER 2 — CONSISTENT ATOMIC
            </span>
            <RefreshCw className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-lg font-mono font-bold text-slate-100">
            Stateful Account Migration Protocol
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            {"When a persistent account causes sustained hotspot congestion (L_k > \u03C4_overload), the engine computes a net migration utility and initiates a 2-Phase Commit state relocation:"}
          </p>
          <div className="p-3 bg-dark-950 rounded-xl font-mono text-xs text-violet-300 border border-dark-800">
            {"U(A, k \u2192 j) = \u0394L - \u03BB \u00B7 (StateSize(A) / Bandwidth) - Cost_lock > 0"}
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>2-Phase Commit lock guarantees double-spend prevention.</li>
            <li>In-flight transactions buffered in temporal quarantine queue.</li>
            <li>Permanent alleviation of hotspot state contention.</li>
          </ul>
        </div>

      </div>

      {/* 2-Phase Commit State Migration Sequence */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-700/80 space-y-6">
        <div className="flex items-center space-x-2">
          <Lock className="w-5 h-5 text-violet-400" />
          <h3 className="font-mono font-bold text-base text-slate-100">
            2-Phase State Migration Protocol (Atomic Consistency)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-dark-900/80 border border-dark-700 space-y-2">
            <div className="text-[10px] font-mono text-cyan-400 font-bold">PHASE 1: DETECT</div>
            <h4 className="font-mono text-xs font-semibold text-slate-200">Hotspot Profiling</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Continuous EMA profiling identifies account A contributing &gt;30% of source shard's queue pressure.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/80 border border-violet-800/80 space-y-2">
            <div className="text-[10px] font-mono text-violet-400 font-bold">PHASE 2: PREPARE & LOCK</div>
            <h4 className="font-mono text-xs font-semibold text-slate-200">Quarantine Lock</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Account A is marked locked on source shard. Concurrent incoming txs are held in epoch staging queue.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/80 border border-violet-800/80 space-y-2">
            <div className="text-[10px] font-mono text-violet-400 font-bold">PHASE 3: STATE TRANSFER</div>
            <h4 className="font-mono text-xs font-semibold text-slate-200">Merkle Proof Relay</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Account state trie slice and storage root are cryptographically relayed to destination shard via receipt.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-dark-900/80 border border-emerald-800/80 space-y-2">
            <div className="text-[10px] font-mono text-emerald-400 font-bold">PHASE 4: COMMIT & UNLOCK</div>
            <h4 className="font-mono text-xs font-semibold text-slate-200">Atomic Router Update</h4>
            <p className="text-[11px] text-slate-400 leading-normal">
              Destination shard incorporates state. Router routing table atomically flips. Account A unlocked.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Step-by-Step Decision Simulator */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-dark-700/80 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-base text-slate-100">
              Interactive Decision Tree Simulator
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Real-time branch evaluation
          </span>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-dark-950/70 rounded-xl border border-dark-800">
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">TX PAYLOAD TYPE</label>
            <select
              value={simTxType}
              onChange={(e) => setSimTxType(e.target.value as any)}
              className="w-full bg-dark-900 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value="stateful">Stateful Account Transfer</option>
              <option value="stateless">Stateless Call / Mint</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              SOURCE SHARD LOAD: <span className="text-cyan-400 font-bold">{simOriginLoad}%</span>
            </label>
            <input
              type="range"
              min={20}
              max={100}
              value={simOriginLoad}
              onChange={(e) => setSimOriginLoad(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-dark-900 rounded"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              TARGET SHARD LOAD: <span className="text-emerald-400 font-bold">{simTargetLoad}%</span>
            </label>
            <input
              type="range"
              min={10}
              max={90}
              value={simTargetLoad}
              onChange={(e) => setSimTargetLoad(Number(e.target.value))}
              className="w-full accent-emerald-400 h-1 bg-dark-900 rounded"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">
              ACCOUNT TX VOLUME: <span className="text-purple-400 font-bold">{simAccountTxCount} txs</span>
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={simAccountTxCount}
              onChange={(e) => setSimAccountTxCount(Number(e.target.value))}
              className="w-full accent-purple-400 h-1 bg-dark-900 rounded"
            />
          </div>
        </div>

        {/* Evaluated Outcome Path */}
        <div className="p-5 rounded-xl border border-dark-700 bg-dark-900/60 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span>EVALUATION LOGIC PATH:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className={`px-2 py-1 rounded border ${
              isOriginOverloaded ? 'bg-red-950 text-red-400 border-red-800' : 'bg-dark-800 text-slate-300 border-dark-700'
            }`}>
              {`1. Load_src = ${simOriginLoad}% (${isOriginOverloaded ? 'OVERLOAD \u2265 75%' : 'NORMAL'})`}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-600" />

            <span className={`px-2 py-1 rounded border ${
              loadDelta > 20 ? 'bg-cyan-950 text-cyan-400 border-cyan-800' : 'bg-dark-800 text-slate-300 border-dark-700'
            }`}>
              {`2. \u0394Load = ${loadDelta}% (${loadDelta > 20 ? 'SIGNIFICANT SKEW' : 'BALANCED'})`}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-600" />

            <span className={`px-2 py-1 rounded border ${
              shouldRedirect || shouldMigrate ? 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold' : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}>
              3. ACTION: {shouldRedirect ? 'INSTANT REDIRECT' : shouldMigrate ? '2PC STATE MIGRATION' : 'STANDARD EXECUTION'}
            </span>
          </div>

          {/* Outcome Description Box */}
          <div className="p-3.5 rounded-lg bg-dark-950 border border-dark-800 text-xs font-mono">
            {shouldRedirect && (
              <div className="text-emerald-400 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>DECISION: TIER 1 REDIRECTION</strong> — The transaction is stateless and source shard is congested ({simOriginLoad}%). Redirected directly to target shard ({simTargetLoad}%) with 0ms state lock penalty.
                </span>
              </div>
            )}
            {shouldMigrate && (
              <div className="text-violet-300 flex items-start space-x-2">
                <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 animate-spin" />
                <span>
                  <strong>DECISION: TIER 2 ACCOUNT MIGRATION</strong> — Account is a persistent hotspot ({simAccountTxCount} txs) on an overloaded shard ({simOriginLoad}%). Net migration utility $U &gt; 0$. Account is locked for 8 ticks and atomically transferred to target shard ({simTargetLoad}%).
                </span>
              </div>
            )}
            {!shouldRedirect && !shouldMigrate && (
              <div className="text-slate-300 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                <span>
                  <strong>DECISION: LOCAL SHARD EXECUTION</strong> — Workload disparity or absolute utilization does not cross the threshold. Transaction processed in standard FIFO mempool order.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
