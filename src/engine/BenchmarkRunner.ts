import { BenchmarkRunResult, BenchmarkScenario } from '../types/simulation';
import { SimulationEngine } from './SimulationEngine';

export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  {
    id: 'exp-hotspot-dex',
    title: 'Hotspot DEX / Heavy Zipfian Skew',
    description: 'Simulates a high-volume DeFi liquidity pool or NFT mint creating an 80/20 power-law workload skew focused on a single shard.',
    shardCount: 4,
    targetTPS: 750,
    workload: 'zipfian',
    durationTicks: 40,
  },
  {
    id: 'exp-flash-burst',
    title: 'Flash Traffic Surge & Sudden Burst',
    description: 'Evaluates resilience against sudden 2000 TPS burst traffic spikes and rapid overload redistribution.',
    shardCount: 4,
    targetTPS: 1200,
    workload: 'burst',
    durationTicks: 35,
  },
  {
    id: 'exp-high-shards',
    title: 'High-Scale Multi-Shard Partitioning (8 Shards)',
    description: 'Measures load balancing fairness and cross-shard communication overhead across 8 distributed shard clusters.',
    shardCount: 8,
    targetTPS: 1400,
    workload: 'zipfian',
    durationTicks: 45,
  },
  {
    id: 'exp-uniform-baseline',
    title: 'Uniform Workload Control Baseline',
    description: 'Evaluates baseline routing overhead when traffic is already uniformly distributed across all accounts.',
    shardCount: 4,
    targetTPS: 600,
    workload: 'uniform',
    durationTicks: 30,
  },
];

export class BenchmarkRunner {
  public static runScenario(scenario: BenchmarkScenario): BenchmarkRunResult {
    // 1. Run Static Sharding Phase
    const staticEngine = new SimulationEngine({
      shardCount: scenario.shardCount,
      targetTPS: scenario.targetTPS,
      routingStrategy: 'static',
      workloadDistribution: scenario.workload,
    });

    const staticTpsSamples: number[] = [];
    const staticLatencySamples: number[] = [];
    const staticFairnessSamples: number[] = [];
    let staticDropped = 0;

    for (let t = 0; t < scenario.durationTicks; t++) {
      staticEngine.tick();
      const m = staticEngine.getMetrics();
      staticTpsSamples.push(m.globalTPS);
      staticLatencySamples.push(m.avgLatencyMs);
      staticFairnessSamples.push(m.jainsFairnessIndex);
      staticDropped += staticEngine.getShards().reduce((acc, s) => acc + s.droppedCount, 0);
    }

    const staticShards = staticEngine.getShards();
    const staticLoads = staticShards.map(s => s.smoothedLoad);

    const staticResult = {
      tps: Math.round(staticTpsSamples.reduce((a, b) => a + b, 0) / staticTpsSamples.length),
      avgLatency: Math.round(staticLatencySamples.reduce((a, b) => a + b, 0) / staticLatencySamples.length),
      p99Latency: Math.round(staticEngine.getMetrics().p99LatencyMs),
      jainsFairness: Number((staticFairnessSamples.reduce((a, b) => a + b, 0) / staticFairnessSamples.length).toFixed(3)),
      droppedRate: Number(((staticDropped / (scenario.targetTPS * (scenario.durationTicks / 10))) * 100).toFixed(1)),
      crossShardRatio: staticEngine.getMetrics().crossShardPercentage,
      maxShardLoad: Math.round(Math.max(...staticLoads)),
      minShardLoad: Math.round(Math.min(...staticLoads)),
    };

    // 2. Run Adaptive Sharding Phase
    const adaptiveEngine = new SimulationEngine({
      shardCount: scenario.shardCount,
      targetTPS: scenario.targetTPS,
      routingStrategy: 'adaptive',
      workloadDistribution: scenario.workload,
      overloadThreshold: 70,
    });

    const adaptiveTpsSamples: number[] = [];
    const adaptiveLatencySamples: number[] = [];
    const adaptiveFairnessSamples: number[] = [];
    let adaptiveDropped = 0;

    for (let t = 0; t < scenario.durationTicks; t++) {
      adaptiveEngine.tick();
      const m = adaptiveEngine.getMetrics();
      adaptiveTpsSamples.push(m.globalTPS);
      adaptiveLatencySamples.push(m.avgLatencyMs);
      adaptiveFairnessSamples.push(m.jainsFairnessIndex);
      adaptiveDropped += adaptiveEngine.getShards().reduce((acc, s) => acc + s.droppedCount, 0);
    }

    const adaptiveShards = adaptiveEngine.getShards();
    const adaptiveLoads = adaptiveShards.map(s => s.smoothedLoad);
    const completedMigrations = adaptiveEngine.getCompletedMigrations().length;

    const adaptiveResult = {
      tps: Math.round(adaptiveTpsSamples.reduce((a, b) => a + b, 0) / adaptiveTpsSamples.length),
      avgLatency: Math.round(adaptiveLatencySamples.reduce((a, b) => a + b, 0) / adaptiveLatencySamples.length),
      p99Latency: Math.round(adaptiveEngine.getMetrics().p99LatencyMs),
      jainsFairness: Number((adaptiveFairnessSamples.reduce((a, b) => a + b, 0) / adaptiveFairnessSamples.length).toFixed(3)),
      droppedRate: Number(((adaptiveDropped / (scenario.targetTPS * (scenario.durationTicks / 10))) * 100).toFixed(1)),
      crossShardRatio: adaptiveEngine.getMetrics().crossShardPercentage,
      maxShardLoad: Math.round(Math.max(...adaptiveLoads)),
      minShardLoad: Math.round(Math.min(...adaptiveLoads)),
      migrationsCompleted: completedMigrations,
      migrationOverheadPenaltyMs: Math.round(completedMigrations * 12.5),
    };

    // Compute improvements
    const tpsGain = Number((((adaptiveResult.tps - staticResult.tps) / Math.max(1, staticResult.tps)) * 100).toFixed(1));
    const latencyReduction = Number((((staticResult.avgLatency - adaptiveResult.avgLatency) / Math.max(1, staticResult.avgLatency)) * 100).toFixed(1));
    const fairnessGain = Number((((adaptiveResult.jainsFairness - staticResult.jainsFairness) / Math.max(0.01, staticResult.jainsFairness)) * 100).toFixed(1));

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      timestamp: new Date().toISOString(),
      staticResult,
      adaptiveResult,
      improvementPct: {
        tpsGain,
        latencyReduction,
        fairnessGain,
      },
    };
  }

  /**
   * Export results as CSV formatted string
   */
  public static exportToCSV(results: BenchmarkRunResult[]): string {
    const headers = [
      'Scenario',
      'Strategy',
      'Throughput (TPS)',
      'Avg Latency (ms)',
      'P99 Latency (ms)',
      'Jains Fairness (0-1)',
      'Dropped Rate (%)',
      'Max Shard Load (%)',
      'Min Shard Load (%)',
      'Cross-Shard Ratio (%)',
      'Migrations',
    ];

    const rows: string[] = [headers.join(',')];

    for (const r of results) {
      rows.push([
        `"${r.scenarioTitle}"`,
        'Static Sharding',
        r.staticResult.tps,
        r.staticResult.avgLatency,
        r.staticResult.p99Latency,
        r.staticResult.jainsFairness,
        r.staticResult.droppedRate,
        r.staticResult.maxShardLoad,
        r.staticResult.minShardLoad,
        r.staticResult.crossShardRatio,
        0,
      ].join(','));

      rows.push([
        `"${r.scenarioTitle}"`,
        'Adaptive Sharding',
        r.adaptiveResult.tps,
        r.adaptiveResult.avgLatency,
        r.adaptiveResult.p99Latency,
        r.adaptiveResult.jainsFairness,
        r.adaptiveResult.droppedRate,
        r.adaptiveResult.maxShardLoad,
        r.adaptiveResult.minShardLoad,
        r.adaptiveResult.crossShardRatio,
        r.adaptiveResult.migrationsCompleted,
      ].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Export results as LaTeX table for research paper
   */
  public static exportToLaTeX(results: BenchmarkRunResult[]): string {
    let latex = `\\begin{table*}[t]
\\centering
\\caption{Comparative Performance: Static Sharding vs. Adaptive Dynamic Balancing}
\\label{tab:adaptive_sharding_results}
\\begin{tabular}{llcccccc}
\\hline
\\textbf{Workload Scenario} & \\textbf{Routing} & \\textbf{Throughput (TPS)} & \\textbf{Avg Lat (ms)} & \\textbf{P99 Lat (ms)} & \\textbf{Jain's $\\mathcal{J}$} & \\textbf{Drop (\\%)} & \\textbf{Migrations} \\\\
\\hline\n`;

    for (const r of results) {
      latex += `\\multirow{2}{*}{${r.scenarioTitle}} 
  & Static   & ${r.staticResult.tps} & ${r.staticResult.avgLatency} & ${r.staticResult.p99Latency} & ${r.staticResult.jainsFairness} & ${r.staticResult.droppedRate}\\% & --- \\\\
  & Adaptive & \\textbf{${r.adaptiveResult.tps}} & \\textbf{${r.adaptiveResult.avgLatency}} & \\textbf{${r.adaptiveResult.p99Latency}} & \\textbf{${r.adaptiveResult.jainsFairness}} & \\textbf{${r.adaptiveResult.droppedRate}\\%} & ${r.adaptiveResult.migrationsCompleted} \\\\
\\hline\n`;
    }

    latex += `\\end{tabular}
\\end{table*}`;
    return latex;
  }
}
