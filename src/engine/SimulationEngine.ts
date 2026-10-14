import {
  Account,
  GlobalMetrics,
  RoutingStrategy,
  Shard,
  SimulationConfig,
  StateMigrationEvent,
  Transaction,
  WorkloadType,
} from '../types/simulation';
import { RoutingEngine } from './RoutingAlgorithm';
import { WorkloadGenerator } from './WorkloadGenerator';

export class SimulationEngine {
  private config: SimulationConfig;
  private shards: Shard[] = [];
  private accounts: Account[] = [];
  private accountsMap: Map<string, Account> = new Map();
  private activeMigrations: StateMigrationEvent[] = [];
  private completedMigrations: StateMigrationEvent[] = [];
  private recentTransactions: Transaction[] = [];

  private router: RoutingEngine;
  private workloadGen: WorkloadGenerator;

  private currentTick: number = 0;
  private isRunning: boolean = false;
  private timerId: any = null;

  private metricsHistoryLimit: number = 40;
  private latencySamples: number[] = [];

  // Metrics state
  private metrics: GlobalMetrics;

  // Listeners
  private onUpdateCallback?: (engine: SimulationEngine) => void;

  constructor(initialConfig?: Partial<SimulationConfig>) {
    this.router = new RoutingEngine();
    this.workloadGen = new WorkloadGenerator();

    this.config = {
      shardCount: initialConfig?.shardCount ?? 4,
      targetTPS: initialConfig?.targetTPS ?? 500,
      routingStrategy: initialConfig?.routingStrategy ?? 'adaptive',
      workloadDistribution: initialConfig?.workloadDistribution ?? 'zipfian',
      overloadThreshold: initialConfig?.overloadThreshold ?? 75,
      underloadThreshold: initialConfig?.underloadThreshold ?? 40,
      migrationCostTicks: initialConfig?.migrationCostTicks ?? 10,
      crossShardLatencyMultiplier: initialConfig?.crossShardLatencyMultiplier ?? 2.5,
      burstDurationRemaining: 0,
      isPaused: false,
      simSpeed: initialConfig?.simSpeed ?? 1,
    };

    this.metrics = this.getInitialMetrics();
    this.resetSimulation();
  }

  private getInitialMetrics(): GlobalMetrics {
    return {
      tick: 0,
      globalTPS: 0,
      effectiveThroughput: 0,
      targetTPS: this.config.targetTPS,
      avgLatencyMs: 42,
      p95LatencyMs: 65,
      p99LatencyMs: 95,
      jainsFairnessIndex: 1.0,
      giniCoefficient: 0,
      totalConfirmedTxs: 0,
      totalCrossShardTxs: 0,
      crossShardPercentage: 0,
      totalDroppedTxs: 0,
      activeMigrationsCount: 0,
      totalMigrationsCount: 0,
      overloadedShardsCount: 0,
      utilizationHistory: [],
      throughputHistory: [],
      latencyHistory: [],
    };
  }

  public resetSimulation(newConfig?: Partial<SimulationConfig>): void {
    if (newConfig) {
      this.config = { ...this.config, ...newConfig };
    }

    this.currentTick = 0;
    this.activeMigrations = [];
    this.completedMigrations = [];
    this.recentTransactions = [];
    this.latencySamples = [];

    // Initialize Shards
    const shardColors = [
      '#00f2fe', // Cyan
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#8b5cf6', // Violet
      '#ec4899', // Pink
      '#3b82f6', // Blue
      '#f97316', // Orange
      '#14b8a6', // Teal
    ];

    const shardNames = ['Shard Alpha', 'Shard Beta', 'Shard Gamma', 'Shard Delta', 'Shard Epsilon', 'Shard Zeta', 'Shard Eta', 'Shard Theta'];

    this.shards = [];
    const capacityPerShard = Math.round(1000 / this.config.shardCount) + 100;

    for (let i = 0; i < this.config.shardCount; i++) {
      this.shards.push({
        id: i,
        name: shardNames[i % shardNames.length],
        status: 'optimal',
        utilization: 20 + Math.floor(Math.random() * 15),
        smoothedLoad: 25,
        capacityTPS: capacityPerShard,
        currentTPS: 0,
        mempoolQueue: [],
        mempoolSize: 0,
        maxMempoolSize: capacityPerShard * 2,
        processedCount: 0,
        delayedCount: 0,
        droppedCount: 0,
        crossShardTxCount: 0,
        avgLatencyMs: 35,
        blockHeight: 1000 + Math.floor(Math.random() * 500),
        validatorCount: 16 + (i * 2),
        activeAccounts: 0,
        color: shardColors[i % shardColors.length],
      });
    }

    // Initialize Accounts (120 accounts distributed across shards)
    this.accounts = this.workloadGen.generateAccounts(120, this.config.shardCount);
    this.accountsMap.clear();
    for (const acc of this.accounts) {
      this.accountsMap.set(acc.address, acc);
      if (this.shards[acc.shardId]) {
        this.shards[acc.shardId].activeAccounts++;
      }
    }

    this.metrics = this.getInitialMetrics();
    this.metrics.targetTPS = this.config.targetTPS;
    this.notifyUpdate();
  }

  public setConfig(updated: Partial<SimulationConfig>): void {
    const oldShardCount = this.config.shardCount;
    this.config = { ...this.config, ...updated };

    if (updated.shardCount && updated.shardCount !== oldShardCount) {
      this.resetSimulation();
      return;
    }

    if (updated.targetTPS !== undefined) {
      this.metrics.targetTPS = updated.targetTPS;
    }

    this.notifyUpdate();
  }

  public setRoutingStrategy(strategy: RoutingStrategy): void {
    this.config.routingStrategy = strategy;
    this.notifyUpdate();
  }

  public setWorkload(workload: WorkloadType): void {
    this.config.workloadDistribution = workload;
    if (workload === 'burst') {
      this.config.burstDurationRemaining = 25; // 25 ticks of high burst
    }
    this.notifyUpdate();
  }

  public triggerBurst(): void {
    this.config.workloadDistribution = 'burst';
    this.config.burstDurationRemaining = 30;
    this.notifyUpdate();
  }

  public subscribe(callback: (engine: SimulationEngine) => void): () => void {
    this.onUpdateCallback = callback;
    return () => {
      this.onUpdateCallback = undefined;
    };
  }

  private notifyUpdate(): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this);
    }
  }

  /**
   * Main Simulation Step (Single Tick)
   */
  public tick(): void {
    this.currentTick++;
    const ticksPerSecond = 10;

    // 1. Calculate incoming tx batch size for this tick
    let currentTargetTPS = this.config.targetTPS;
    if (this.config.burstDurationRemaining > 0) {
      currentTargetTPS = Math.min(2200, this.config.targetTPS * 2.2);
      this.config.burstDurationRemaining--;
      if (this.config.burstDurationRemaining === 0) {
        this.config.workloadDistribution = 'zipfian';
      }
    }

    const txsToGenerate = Math.max(1, Math.round(currentTargetTPS / ticksPerSecond));

    // 2. Generate and Route Transactions
    const newTxs = this.workloadGen.generateBatch(
      txsToGenerate,
      this.accounts,
      this.config.workloadDistribution,
      this.currentTick,
      this.config.shardCount
    );

    let tickCrossShardCount = 0;

    for (const tx of newTxs) {
      let routeResult;
      if (this.config.routingStrategy === 'static') {
        routeResult = this.router.routeStatic(tx, this.accountsMap, this.config.shardCount);
      } else {
        routeResult = this.router.routeAdaptive(
          tx,
          this.accountsMap,
          this.shards,
          this.config.overloadThreshold
        );
      }

      tx.assignedShardId = routeResult.assignedShardId;
      tx.isCrossShard = routeResult.isCrossShard;
      tx.isRedirected = routeResult.isRedirected;

      if (tx.isCrossShard) {
        tickCrossShardCount++;
      }

      // Check if touched account is locked due to migration
      const senderAcc = this.accountsMap.get(tx.sender);
      const receiverAcc = this.accountsMap.get(tx.receiver);
      const isAccountLocked = (senderAcc && senderAcc.isLocked) || (receiverAcc && receiverAcc.isLocked);

      const targetShard = this.shards[tx.assignedShardId];
      if (targetShard) {
        if (isAccountLocked) {
          tx.status = 'delayed';
          targetShard.delayedCount++;
        } else if (targetShard.mempoolQueue.length >= targetShard.maxMempoolSize) {
          tx.status = 'dropped';
          targetShard.droppedCount++;
        } else {
          tx.status = 'queued';
          targetShard.mempoolQueue.push(tx);
        }
      }
    }

    // 3. Process Shard Queues & Produce Blocks
    let totalConfirmedThisTick = 0;

    for (const shard of this.shards) {
      // Shard processing rate per tick
      const shardCapacityThisTick = Math.max(5, Math.round(shard.capacityTPS / ticksPerSecond));
      let processedThisTick = 0;
      let latencySum = 0;

      // Extract batch to process
      const batchSize = Math.min(shard.mempoolQueue.length, shardCapacityThisTick);
      const processedTxs = shard.mempoolQueue.splice(0, batchSize);

      for (const tx of processedTxs) {
        tx.status = 'confirmed';
        tx.confirmedAtTick = this.currentTick;
        
        // Latency model: base network delay + queue dwell time + cross-shard 2PC penalty
        const queueDelay = (this.currentTick - tx.createdAtTick) * 35;
        const crossShardPenalty = tx.isCrossShard ? (45 * this.config.crossShardLatencyMultiplier) : 0;
        const congestionPenalty = Math.max(0, (shard.smoothedLoad - 70) * 2.5);

        tx.latencyMs = Math.round(30 + queueDelay + crossShardPenalty + congestionPenalty);
        latencySum += tx.latencyMs;
        this.latencySamples.push(tx.latencyMs);

        processedThisTick++;
        totalConfirmedThisTick++;
        shard.processedCount++;
        if (tx.isCrossShard) shard.crossShardTxCount++;

        // Keep transaction log
        this.recentTransactions.unshift(tx);
      }

      shard.currentTPS = processedThisTick * ticksPerSecond;
      shard.mempoolSize = shard.mempoolQueue.length;

      if (processedThisTick > 0) {
        shard.avgLatencyMs = Math.round(latencySum / processedThisTick);
        shard.blockHeight++;
      }

      // Compute raw instant utilization %
      const queuePressure = (shard.mempoolSize / shard.maxMempoolSize) * 50;
      const throughputPressure = (processedThisTick / shardCapacityThisTick) * 50;
      shard.utilization = Math.min(100, Math.round(queuePressure + throughputPressure));
    }

    // Trim recent transactions buffer
    if (this.recentTransactions.length > 50) {
      this.recentTransactions = this.recentTransactions.slice(0, 50);
    }
    if (this.latencySamples.length > 200) {
      this.latencySamples = this.latencySamples.slice(this.latencySamples.length - 200);
    }

    // 4. Update Smoothed Loads & Overload States
    this.router.updateSmoothedLoads(this.shards);

    // 5. State Migration Logic (Only active in Adaptive Mode)
    if (this.config.routingStrategy === 'adaptive') {
      // Progress active migrations
      for (let i = this.activeMigrations.length - 1; i >= 0; i--) {
        const mig = this.activeMigrations[i];
        const elapsed = this.currentTick - mig.startedAtTick;
        mig.progress = Math.min(1, elapsed / mig.durationTicks);

        if (this.currentTick >= mig.completedAtTick) {
          // Migration Finished!
          const acc = this.accountsMap.get(mig.accountAddress);
          if (acc) {
            const oldShard = this.shards[mig.fromShardId];
            const newShard = this.shards[mig.toShardId];

            if (oldShard) oldShard.activeAccounts = Math.max(0, oldShard.activeAccounts - 1);
            if (newShard) newShard.activeAccounts++;

            acc.shardId = mig.toShardId;
            acc.isLocked = false;
          }

          this.completedMigrations.unshift(mig);
          this.activeMigrations.splice(i, 1);
        }
      }

      // Check if a new migration should be triggered
      const newMigration = this.router.evaluateStateMigration(
        this.currentTick,
        this.shards,
        this.accounts,
        this.activeMigrations,
        this.config.overloadThreshold,
        this.config.migrationCostTicks
      );

      if (newMigration) {
        this.activeMigrations.push(newMigration);
      }
    } else {
      // In Static mode, any active migrations are canceled / not executed
      for (const mig of this.activeMigrations) {
        const acc = this.accountsMap.get(mig.accountAddress);
        if (acc) acc.isLocked = false;
      }
      this.activeMigrations = [];
    }

    // 6. Aggregate Global Metrics
    const shardLoads = this.shards.map(s => s.smoothedLoad);
    const jain = this.router.calculateJainsFairness(shardLoads);
    const gini = this.router.calculateGiniCoefficient(shardLoads);

    const sortedLatency = [...this.latencySamples].sort((a, b) => a - b);
    const avgLatency = sortedLatency.length > 0 
      ? Math.round(sortedLatency.reduce((a, b) => a + b, 0) / sortedLatency.length) 
      : 40;
    const p95Idx = Math.floor(sortedLatency.length * 0.95);
    const p99Idx = Math.floor(sortedLatency.length * 0.99);
    const p95Latency = sortedLatency[p95Idx] || avgLatency * 1.3;
    const p99Latency = sortedLatency[p99Idx] || avgLatency * 1.8;

    const overloadedCount = this.shards.filter(s => s.status === 'overloaded').length;
    const globalTPS = totalConfirmedThisTick * ticksPerSecond;

    this.metrics.tick = this.currentTick;
    this.metrics.globalTPS = globalTPS;
    this.metrics.effectiveThroughput = globalTPS;
    this.metrics.avgLatencyMs = avgLatency;
    this.metrics.p95LatencyMs = p95Latency;
    this.metrics.p99LatencyMs = p99Latency;
    this.metrics.jainsFairnessIndex = Number(jain.toFixed(3));
    this.metrics.giniCoefficient = Number(gini.toFixed(3));
    this.metrics.totalConfirmedTxs += totalConfirmedThisTick;
    this.metrics.totalCrossShardTxs += tickCrossShardCount;
    this.metrics.crossShardPercentage = this.metrics.totalConfirmedTxs > 0
      ? Math.round((this.metrics.totalCrossShardTxs / this.metrics.totalConfirmedTxs) * 100)
      : 0;
    this.metrics.activeMigrationsCount = this.activeMigrations.length;
    this.metrics.totalMigrationsCount = this.completedMigrations.length;
    this.metrics.overloadedShardsCount = overloadedCount;

    // Push chart histories
    const utilSnapshot: { tick: number; [shardKey: string]: number } = { tick: this.currentTick };
    for (const s of this.shards) {
      utilSnapshot[`Shard ${s.name.replace('Shard ', '')}`] = Math.round(s.smoothedLoad);
    }

    this.metrics.utilizationHistory.push(utilSnapshot);
    if (this.metrics.utilizationHistory.length > this.metricsHistoryLimit) {
      this.metrics.utilizationHistory.shift();
    }

    const estimatedStaticTPS = this.config.routingStrategy === 'static' 
      ? globalTPS 
      : Math.round(globalTPS * (1 - (gini * 0.4)));

    this.metrics.throughputHistory.push({
      tick: this.currentTick,
      current: globalTPS,
      target: currentTargetTPS,
      staticEstimated: estimatedStaticTPS,
    });
    if (this.metrics.throughputHistory.length > this.metricsHistoryLimit) {
      this.metrics.throughputHistory.shift();
    }

    this.metrics.latencyHistory.push({
      tick: this.currentTick,
      avgLatency,
      p99Latency,
    });
    if (this.metrics.latencyHistory.length > this.metricsHistoryLimit) {
      this.metrics.latencyHistory.shift();
    }

    this.notifyUpdate();
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.config.isPaused = false;

    const interval = Math.max(20, Math.round(100 / this.config.simSpeed));
    this.timerId = setInterval(() => {
      this.tick();
    }, interval);
    this.notifyUpdate();
  }

  public pause(): void {
    this.isRunning = false;
    this.config.isPaused = true;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.notifyUpdate();
  }

  public setSpeed(speed: number): void {
    this.config.simSpeed = speed;
    if (this.isRunning) {
      this.pause();
      this.start();
    } else {
      this.notifyUpdate();
    }
  }

  // Getters
  public getShards(): Shard[] { return this.shards; }
  public getAccounts(): Account[] { return this.accounts; }
  public getConfig(): SimulationConfig { return this.config; }
  public getMetrics(): GlobalMetrics { return this.metrics; }
  public getActiveMigrations(): StateMigrationEvent[] { return this.activeMigrations; }
  public getCompletedMigrations(): StateMigrationEvent[] { return this.completedMigrations; }
  public getRecentTransactions(): Transaction[] { return this.recentTransactions; }
  public getIsRunning(): boolean { return this.isRunning; }
}
