export type ShardStatus = 'optimal' | 'busy' | 'overloaded' | 'rebalancing';

export type RoutingStrategy = 'static' | 'adaptive';

export type WorkloadType = 'uniform' | 'zipfian' | 'burst';

export interface Account {
  address: string;
  shardId: number;
  txCount: number;
  isHotspot: boolean;
  isLocked: boolean;
  lockedUntilTick: number;
  balance: number;
  stateSizeBytes: number;
}

export interface Transaction {
  id: string;
  hash: string;
  sender: string;
  receiver: string;
  originShardId: number;
  assignedShardId: number;
  targetShardId: number;
  isCrossShard: boolean;
  isRedirected: boolean;
  isMigrated: boolean;
  status: 'queued' | 'processing' | 'confirmed' | 'delayed' | 'dropped';
  gas: number;
  sizeBytes: number;
  createdAtTick: number;
  confirmedAtTick?: number;
  latencyMs: number;
}

export interface StateMigrationEvent {
  id: string;
  accountAddress: string;
  fromShardId: number;
  toShardId: number;
  startedAtTick: number;
  durationTicks: number;
  completedAtTick: number;
  reason: string;
  stateSizeBytes: number;
  progress: number; // 0 to 1
}

export interface Shard {
  id: number;
  name: string;
  status: ShardStatus;
  utilization: number; // 0 - 100
  smoothedLoad: number; // EMA
  capacityTPS: number;
  currentTPS: number;
  mempoolQueue: Transaction[];
  mempoolSize: number;
  maxMempoolSize: number;
  processedCount: number;
  delayedCount: number;
  droppedCount: number;
  crossShardTxCount: number;
  avgLatencyMs: number;
  blockHeight: number;
  validatorCount: number;
  activeAccounts: number;
  color: string;
}

export interface SimulationConfig {
  shardCount: number;
  targetTPS: number;
  routingStrategy: RoutingStrategy;
  workloadDistribution: WorkloadType;
  overloadThreshold: number; // % e.g. 75
  underloadThreshold: number; // % e.g. 45
  migrationCostTicks: number; // ticks an account stays locked
  crossShardLatencyMultiplier: number;
  burstDurationRemaining: number;
  isPaused: boolean;
  simSpeed: number; // 1 = 1x, 2 = 2x, etc.
}

export interface GlobalMetrics {
  tick: number;
  globalTPS: number;
  effectiveThroughput: number;
  targetTPS: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  jainsFairnessIndex: number;
  giniCoefficient: number;
  totalConfirmedTxs: number;
  totalCrossShardTxs: number;
  crossShardPercentage: number;
  totalDroppedTxs: number;
  activeMigrationsCount: number;
  totalMigrationsCount: number;
  overloadedShardsCount: number;
  utilizationHistory: { tick: number; [shardKey: string]: number }[];
  throughputHistory: { tick: number; staticEstimated: number; current: number; target: number }[];
  latencyHistory: { tick: number; avgLatency: number; p99Latency: number }[];
}

export interface BenchmarkScenario {
  id: string;
  title: string;
  description: string;
  shardCount: number;
  targetTPS: number;
  workload: WorkloadType;
  durationTicks: number;
}

export interface BenchmarkRunResult {
  scenarioId: string;
  scenarioTitle: string;
  timestamp: string;
  staticResult: {
    tps: number;
    avgLatency: number;
    p99Latency: number;
    jainsFairness: number;
    droppedRate: number;
    crossShardRatio: number;
    maxShardLoad: number;
    minShardLoad: number;
  };
  adaptiveResult: {
    tps: number;
    avgLatency: number;
    p99Latency: number;
    jainsFairness: number;
    droppedRate: number;
    crossShardRatio: number;
    maxShardLoad: number;
    minShardLoad: number;
    migrationsCompleted: number;
    migrationOverheadPenaltyMs: number;
  };
  improvementPct: {
    tpsGain: number;
    latencyReduction: number;
    fairnessGain: number;
  };
}
