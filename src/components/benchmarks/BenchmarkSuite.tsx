import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  BENCHMARK_SCENARIOS, 
  BenchmarkRunner 
} from '../../engine/BenchmarkRunner';
import { BenchmarkRunResult, BenchmarkScenario } from '../../types/simulation';
import { 
  Activity, 
  BarChart3, 
  Check, 
  Copy, 
  Download, 
  FileCode, 
  FileSpreadsheet, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  Zap 
} from 'lucide-react';

export const BenchmarkSuite: React.FC = () => {
  const [results, setResults] = useState<BenchmarkRunResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentScenarioName, setCurrentScenarioName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'table' | 'charts' | 'latex'>('table');
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);

  // Run full benchmark suite
  const handleRunAll = async () => {
    setIsRunning(true);
    setResults([]);

    const newResults: BenchmarkRunResult[] = [];
    for (const scenario of BENCHMARK_SCENARIOS) {
      setCurrentScenarioName(scenario.title);
      // Small tick delay to allow UI to render spinner
      await new Promise((resolve) => setTimeout(resolve, 80));
      const res = BenchmarkRunner.runScenario(scenario);
      newResults.push(res);
      setResults([...newResults]);
    }

    setIsRunning(false);
    setCurrentScenarioName('');
  };

  // Run single scenario
  const handleRunSingle = async (scenario: BenchmarkScenario) => {
    setIsRunning(true);
    setCurrentScenarioName(scenario.title);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const res = BenchmarkRunner.runScenario(scenario);
    setResults((prev) => {
      const filtered = prev.filter((r) => r.scenarioId !== scenario.id);
      return [...filtered, res];
    });
    setIsRunning(false);
    setCurrentScenarioName('');
  };

  // CSV download
  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(BenchmarkRunner.exportToCSV(results));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `adaptive_sharding_benchmark_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // LaTeX copy
  const handleCopyLatex = () => {
    if (results.length === 0) return;
    const latex = BenchmarkRunner.exportToLaTeX(results);
    navigator.clipboard.writeText(latex);
    setCopiedLatex(true);
    setTimeout(() => setCopiedLatex(false), 2000);
  };

  // Prepare chart comparison data
  const chartData = results.map((r) => ({
    name: r.scenarioTitle.split('/')[0].trim(),
    'Static TPS': r.staticResult.tps,
    'Adaptive TPS': r.adaptiveResult.tps,
    'Static Latency': r.staticResult.avgLatency,
    'Adaptive Latency': r.adaptiveResult.avgLatency,
    'Static Fairness': Math.round(r.staticResult.jainsFairness * 100),
    'Adaptive Fairness': Math.round(r.adaptiveResult.jainsFairness * 100),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-4">
      
      {/* Top Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-dark-700/80 bg-tech-radial">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-semibold mb-1">
              <BarChart3 className="w-4 h-4" />
              <span>EMPIRICAL VALIDATION SUITE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100">
              Comparative Benchmark Experiments
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Run deterministic, repeatable experiments comparing <strong>Static Modulo Partitioning</strong> against <strong>Adaptive Load Balancing</strong> across diverse traffic profiles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunAll}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg ${
                isRunning
                  ? 'bg-dark-800 text-slate-500 cursor-not-allowed border border-dark-700'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-cyan-500/20'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>RUNNING: {currentScenarioName}...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>EXECUTE ALL BENCHMARKS</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENCHMARK_SCENARIOS.map((scenario) => {
          const hasResult = results.some((r) => r.scenarioId === scenario.id);
          return (
            <div
              key={scenario.id}
              className={`glass-panel p-4 rounded-xl border flex flex-col justify-between transition-all ${
                hasResult ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-dark-700/80 hover:border-dark-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-900 text-slate-400 border border-dark-700">
                    {scenario.shardCount} SHARDS • {scenario.targetTPS} TPS
                  </span>
                  {hasResult && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                      <Check className="w-3 h-3" />
                      <span>COMPLETED</span>
                    </span>
                  )}
                </div>
                <h4 className="font-mono font-bold text-xs text-slate-100 mb-1">
                  {scenario.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal mb-3">
                  {scenario.description}
                </p>
              </div>

              <button
                onClick={() => handleRunSingle(scenario)}
                disabled={isRunning}
                className="w-full py-1.5 rounded-lg bg-dark-900 hover:bg-dark-800 border border-dark-700 text-slate-300 font-mono text-[11px] font-semibold transition-colors flex items-center justify-center space-x-1"
              >
                <Play className="w-3 h-3" />
                <span>Run Scenario</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Results View Section */}
      {results.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-dark-700/80 space-y-6">
          
          {/* Sub Navigation & Export Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dark-800">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'table' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Comparative Table
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'charts' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Comparative Graphs
              </button>
              <button
                onClick={() => setActiveTab('latex')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeTab === 'latex' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                LaTeX Research Table
              </button>
            </div>

            {/* Export Toolbar */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-dark-900 hover:bg-dark-800 text-slate-300 rounded-lg text-xs font-mono border border-dark-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleCopyLatex}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 rounded-lg text-xs font-mono border border-cyan-800/80 transition-colors"
              >
                {copiedLatex ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLatex ? 'Copied LaTeX!' : 'Copy LaTeX'}</span>
              </button>
            </div>
          </div>

          {/* 1. Results Table */}
          {activeTab === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-dark-950/90 text-[10px] text-slate-400 uppercase border-b border-dark-800">
                  <tr>
                    <th className="py-3 px-3">Scenario</th>
                    <th className="py-3 px-3">Strategy</th>
                    <th className="py-3 px-3">Throughput</th>
                    <th className="py-3 px-3">Avg Latency</th>
                    <th className="py-3 px-3">P99 Latency</th>
                    <th className="py-3 px-3">Jain's $\mathcal{'{J}'}$</th>
                    <th className="py-3 px-3">Drop Rate</th>
                    <th className="py-3 px-3 text-right">Net Improvement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {results.map((r) => (
                    <React.Fragment key={r.scenarioId}>
                      {/* Static Row */}
                      <tr className="bg-dark-900/30">
                        <td rowSpan={2} className="py-3 px-3 font-semibold text-slate-200 border-r border-dark-800">
                          {r.scenarioTitle}
                        </td>
                        <td className="py-2.5 px-3 text-amber-400 font-semibold">Static</td>
                        <td className="py-2.5 px-3 text-slate-300">{r.staticResult.tps} TPS</td>
                        <td className="py-2.5 px-3 text-slate-300">{r.staticResult.avgLatency} ms</td>
                        <td className="py-2.5 px-3 text-slate-300">{r.staticResult.p99Latency} ms</td>
                        <td className="py-2.5 px-3 text-slate-300">{r.staticResult.jainsFairness}</td>
                        <td className="py-2.5 px-3 text-red-400">{r.staticResult.droppedRate}%</td>
                        <td rowSpan={2} className="py-3 px-3 text-right border-l border-dark-800">
                          <div className="text-emerald-400 font-bold text-xs">
                            +{r.improvementPct.tpsGain}% TPS
                          </div>
                          <div className="text-cyan-400 text-[11px]">
                            -{r.improvementPct.latencyReduction}% Latency
                          </div>
                          <div className="text-purple-400 text-[10px]">
                            +{r.improvementPct.fairnessGain}% Balance
                          </div>
                        </td>
                      </tr>

                      {/* Adaptive Row */}
                      <tr className="bg-cyan-950/20">
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Adaptive LB</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.adaptiveResult.tps} TPS</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.adaptiveResult.avgLatency} ms</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.adaptiveResult.p99Latency} ms</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{r.adaptiveResult.jainsFairness}</td>
                        <td className="py-2.5 px-3 text-emerald-400">{r.adaptiveResult.droppedRate}%</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 2. Visual Comparative Charts */}
          {activeTab === 'charts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Throughput Bar Chart */}
              <div className="p-4 bg-dark-900/60 rounded-xl border border-dark-800">
                <h4 className="font-mono text-xs font-semibold text-slate-300 mb-3 flex items-center space-x-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>THROUGHPUT COMPARISON (TPS)</span>
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#2b364e', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Bar dataKey="Static TPS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Adaptive TPS" fill="#00f2fe" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Latency Bar Chart */}
              <div className="p-4 bg-dark-900/60 rounded-xl border border-dark-800">
                <h4 className="font-mono text-xs font-semibold text-slate-300 mb-3 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>AVERAGE CONFIRMATION LATENCY (MS - LOWER IS BETTER)</span>
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2638" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0d14', borderColor: '#2b364e', fontSize: '11px', fontFamily: 'monospace' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Bar dataKey="Static Latency" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Adaptive Latency" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* 3. LaTeX Table Export View */}
          {activeTab === 'latex' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>LaTeX Source for Research Paper:</span>
                <span className="text-cyan-400">Ready to copy into Overleaf / IEEE / ACM template</span>
              </div>
              <pre className="p-4 bg-dark-950 rounded-xl border border-dark-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {BenchmarkRunner.exportToLaTeX(results)}
              </pre>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
