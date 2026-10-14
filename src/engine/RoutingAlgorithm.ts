import { Account, Shard, Transaction, StateMigrationEvent } from '../types/simulation';

export class RoutingEngine {
  private alpha: number = 0.25; // Smoothing factor for EMA load

  /**
   * Deterministic DJB2 hash for account addresses to shard assignments
   */
  public hashAddress(address: string, shardCount: number): number {
    let hash = 5381;
    for (let i = 0; i < address.length; i++) {
      hash = ((hash << 5) + hash) + address.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % shardCount;
  }

  /**
   * Updates smoothed load (Exponential Moving Average) for each shard
   */
  public updateSmoothedLoads(shards: Shard[]): void {
    for (const shard of shards) {
      const instantLoad = shard.utilization;
      shard.smoothedLoad = (this.alpha * instantLoad) + ((1 - this.alpha) * shard.smoothedLoad);
      
      // Update status based on thresholds
      if (shard.smoothedLoad >= 80) {
        shard.status = 'overloaded';
      } else if (shard.smoothedLoad >= 60) {
        shard.status = 'busy';
      } else {
        shard.status = 'optimal';
      }
    }
  }

  /**
   * Static Routing: Classic hash-based partitioning
   */
  public routeStatic(
    tx: Transaction,
    accountsMap: Map<string, Account>,
    shardCount: number
  ): { assignedShardId: number; isCrossShard: boolean; isRedirected: boolean } {
    let senderAccount = accountsMap.get(tx.sender);
    let receiverAccount = accountsMap.get(tx.receiver);

    const originShardId = senderAccount ? senderAccount.shardId : this.hashAddress(tx.sender, shardCount);
    const targetShardId = receiverAccount ? receiverAccount.shardId : this.hashAddress(tx.receiver, shardCount);

    const isCrossShard = originShardId !== targetShardId;
    return {
      assignedShardId: originShardId,
      isCrossShard,
      isRedirected: false,
    };
  }

  /**
   * Adaptive Routing: Intelligent Load Balancing with dynamic redirection & migration
   */
  public routeAdaptive(
    tx: Transaction,
    accountsMap: Map<string, Account>,
    shards: Shard[],
    overloadThreshold: number = 75
  ): { assignedShardId: number; isCrossShard: boolean; isRedirected: boolean } {
    const shardCount = shards.length;
    let senderAccount = accountsMap.get(tx.sender);
    let receiverAccount = accountsMap.get(tx.receiver);

    const originShardId = senderAccount ? senderAccount.shardId : this.hashAddress(tx.sender, shardCount);
    const targetShardId = receiverAccount ? receiverAccount.shardId : this.hashAddress(tx.receiver, shardCount);

    const originShard = shards[originShardId];

    // Check if origin shard is overloaded
    if (originShard && originShard.smoothedLoad >= overloadThreshold) {
      // Find the least loaded shard
      let minLoadShard = shards[0];
      for (const s of shards) {
        if (s.smoothedLoad < minLoadShard.smoothedLoad) {
          minLoadShard = s;
        }
      }

      // If load disparity is significant (> 25% difference) and tx can be offloaded
      if ((originShard.smoothedLoad - minLoadShard.smoothedLoad) > 20) {
        const isCrossShard = minLoadShard.id !== targetShardId;
        return {
          assignedShardId: minLoadShard.id,
          isCrossShard,
          isRedirected: true,
        };
      }
    }

    const isCrossShard = originShardId !== targetShardId;
    return {
      assignedShardId: originShardId,
      isCrossShard,
      isRedirected: false,
    };
  }

  /**
   * Evaluates if any overloaded shard should trigger an Account State Migration
   */
  public evaluateStateMigration(
    currentTick: number,
    shards: Shard[],
    accounts: Account[],
    activeMigrations: StateMigrationEvent[],
    overloadThreshold: number = 75,
    migrationDurationTicks: number = 8
  ): StateMigrationEvent | null {
    // Only allow max 2 concurrent migrations to prevent network thrashing
    if (activeMigrations.length >= 2) return null;

    // Identify the most overloaded shard
    const sortedShards = [...shards].sort((a, b) => b.smoothedLoad - a.smoothedLoad);
    const overloadedShard = sortedShards[0];
    const underloadedShard = sortedShards[sortedShards.length - 1];

    if (!overloadedShard || !underloadedShard) return null;

    // Check if overload threshold is breached with a notable delta
    if (
      overloadedShard.smoothedLoad >= overloadThreshold &&
      (overloadedShard.smoothedLoad - underloadedShard.smoothedLoad) >= 30
    ) {
      // Find candidate accounts located in overloaded shard that are NOT locked
      const candidateAccounts = accounts
        .filter(a => a.shardId === overloadedShard.id && !a.isLocked && a.txCount > 5)
        .sort((a, b) => b.txCount - a.txCount);

      if (candidateAccounts.length === 0) return null;

      const targetAccount = candidateAccounts[0]; // Top hotspot account

      // Mark account as locked
      targetAccount.isLocked = true;
      targetAccount.lockedUntilTick = currentTick + migrationDurationTicks;

      const migrationEvent: StateMigrationEvent = {
        id: `mig-${currentTick}-${targetAccount.address.slice(0, 6)}`,
        accountAddress: targetAccount.address,
        fromShardId: overloadedShard.id,
        toShardId: underloadedShard.id,
        startedAtTick: currentTick,
        durationTicks: migrationDurationTicks,
        completedAtTick: currentTick + migrationDurationTicks,
        reason: `Overload on Shard ${overloadedShard.name} (${Math.round(overloadedShard.smoothedLoad)}%) -> Migrated to ${underloadedShard.name} (${Math.round(underloadedShard.smoothedLoad)}%)`,
        stateSizeBytes: targetAccount.stateSizeBytes,
        progress: 0,
      };

      overloadedShard.status = 'rebalancing';
      return migrationEvent;
    }

    return null;
  }

  /**
   * Calculates Jain's Fairness Index for load distribution (0 to 1)
   * 1.0 means perfectly even distribution across all shards
   */
  public calculateJainsFairness(loads: number[]): number {
    if (!loads || loads.length === 0) return 1;
    // Add small epsilon to prevent zero division
    const adjusted = loads.map(l => Math.max(l, 1));
    const sum = adjusted.reduce((acc, val) => acc + val, 0);
    const sumSquares = adjusted.reduce((acc, val) => acc + (val * val), 0);
    const n = adjusted.length;

    const jain = (sum * sum) / (n * sumSquares);
    return Math.min(1, Math.max(0, jain));
  }

  /**
   * Calculates Gini coefficient of loads (0 = perfect equality, 1 = maximum inequality)
   */
  public calculateGiniCoefficient(loads: number[]): number {
    const n = loads.length;
    if (n === 0) return 0;
    const sorted = [...loads].sort((a, b) => a - b);
    let cumulativeSum = 0;
    for (let i = 0; i < n; i++) {
      cumulativeSum += (2 * (i + 1) - n - 1) * sorted[i];
    }
    const mean = loads.reduce((a, b) => a + b, 0) / n;
    if (mean === 0) return 0;
    return Math.max(0, Math.min(1, cumulativeSum / (n * n * mean)));
  }
}
