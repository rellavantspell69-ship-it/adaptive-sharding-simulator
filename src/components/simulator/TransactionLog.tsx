import React, { useState } from 'react';
import { StateMigrationEvent, Transaction } from '../../types/simulation';
import { ArrowRight, CheckCircle, Clock, FileCode, Filter, GitFork, RefreshCw, Zap } from 'lucide-react';

interface TransactionLogProps {
  transactions: Transaction[];
  activeMigrations: StateMigrationEvent[];
  completedMigrations: StateMigrationEvent[];
}

export const TransactionLog: React.FC<TransactionLogProps> = ({
  transactions,
  activeMigrations,
  completedMigrations,
}) => {
  const [activeTab, setActiveTab] = useState<'txs' | 'migrations'>('txs');
  const [txFilter, setTxFilter] = useState<'all' | 'cross' | 'redirected' | 'delayed'>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'cross') return tx.isCrossShard;
    if (txFilter === 'redirected') return tx.isRedirected;
    if (txFilter === 'delayed') return tx.status === 'delayed';
    return true;
  });

  return (
    <div className="glass-panel rounded-2xl border border-dark-700/80 overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-dark-800 bg-dark-900/50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('txs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTab === 'txs'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>TRANSACTION STREAM ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('migrations')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
              activeTab === 'migrations'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>STATE MIGRATIONS ({activeMigrations.length + completedMigrations.length})</span>
          </button>
        </div>

        {/* Filter buttons if on TX tab */}
        {activeTab === 'txs' && (
          <div className="flex items-center space-x-1 text-[11px] font-mono">
            <Filter className="w-3 h-3 text-slate-500" />
            <button
              onClick={() => setTxFilter('all')}
              className={`px-2 py-0.5 rounded ${txFilter === 'all' ? 'bg-dark-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setTxFilter('cross')}
              className={`px-2 py-0.5 rounded ${txFilter === 'cross' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Cross-Shard
            </button>
            <button
              onClick={() => setTxFilter('redirected')}
              className={`px-2 py-0.5 rounded ${txFilter === 'redirected' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Redirected
            </button>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        {activeTab === 'txs' ? (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-dark-950/80 sticky top-0 text-[10px] text-slate-500 uppercase border-b border-dark-800">
              <tr>
                <th className="py-2.5 px-3">Tx Hash</th>
                <th className="py-2.5 px-3">Sender / Receiver</th>
                <th className="py-2.5 px-3">Shard Path</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800/60">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No transactions matching filter yet. Running network ticks...
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 25).map((tx) => (
                  <tr key={tx.id} className="hover:bg-dark-800/40 transition-colors">
                    <td className="py-2 px-3 text-cyan-400 font-semibold">{tx.hash}</td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">
                      <span>{tx.sender.slice(0, 6)}...</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span>{tx.receiver.slice(0, 6)}...</span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px]">
                      <span>S{tx.originShardId}</span>
                      <span className="text-slate-600 mx-1">→</span>
                      <span className={tx.isRedirected ? 'text-emerald-400 font-bold' : ''}>
                        S{tx.assignedShardId}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      {tx.isRedirected ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                          REDIRECTED
                        </span>
                      ) : tx.isCrossShard ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-800/80">
                          2PC CROSS
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-400 border border-blue-800/80">
                          INTRA-SHARD
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-300 text-[11px]">
                      {tx.latencyMs} ms
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] ${
                        tx.status === 'confirmed'
                          ? 'bg-emerald-950 text-emerald-400'
                          : tx.status === 'delayed'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-red-950 text-red-400'
                      }`}>
                        <span>{tx.status.toUpperCase()}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <div className="p-3 space-y-2">
            {activeMigrations.length === 0 && completedMigrations.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No account migrations recorded. Migrations trigger when a shard exceeds the overload threshold (&gt;75%).
              </div>
            ) : (
              <>
                {/* Active Migrations */}
                {activeMigrations.map((mig) => (
                  <div
                    key={mig.id}
                    className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-violet-300 font-semibold flex items-center space-x-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>MIGRATING ACCOUNT: {mig.accountAddress}</span>
                      </span>
                      <span className="text-purple-400 font-bold">
                        {Math.round(mig.progress * 100)}% (2PC Locking)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 flex items-center space-x-2">
                      <span>Shard {mig.fromShardId}</span>
                      <ArrowRight className="w-3 h-3 text-violet-400" />
                      <span className="text-emerald-400 font-bold">Shard {mig.toShardId}</span>
                      <span className="text-slate-500">|</span>
                      <span>{mig.reason}</span>
                    </div>
                    <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-200"
                        style={{ width: `${Math.round(mig.progress * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Completed Migrations */}
                {completedMigrations.slice(0, 10).map((mig) => (
                  <div
                    key={mig.id}
                    className="p-2.5 rounded-lg bg-dark-900/60 border border-dark-800 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-slate-200">
                          {mig.accountAddress.slice(0, 10)}... moved S{mig.fromShardId} → S{mig.toShardId}
                        </div>
                        <div className="text-[10px] text-slate-500">{mig.reason}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      COMMITTED
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
