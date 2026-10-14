import { Account, Transaction, WorkloadType } from '../types/simulation';

export class WorkloadGenerator {
  private txCounter: number = 0;

  /**
   * Generates a deterministic pool of synthetic accounts
   */
  public generateAccounts(count: number, shardCount: number): Account[] {
    const accounts: Account[] = [];
    const shardNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];

    for (let i = 0; i < count; i++) {
      const hex = i.toString(16).padStart(4, '0');
      const address = `0x${hex}...${Math.random().toString(16).slice(2, 6)}`;
      const shardId = i % shardCount;
      const isHotspot = i < Math.max(3, Math.floor(count * 0.05)); // Top 5% accounts are hotspots

      accounts.push({
        address,
        shardId,
        txCount: 0,
        isHotspot,
        isLocked: false,
        lockedUntilTick: 0,
        balance: Math.floor(1000 + Math.random() * 50000),
        stateSizeBytes: Math.floor(256 + Math.random() * 2048),
      });
    }

    return accounts;
  }

  /**
   * Zipfian random index generator (skewed distribution)
   */
  private getZipfianIndex(n: number, skew: number = 1.15): number {
    const random = Math.random();
    // Approximate inverse CDF of Zipfian distribution
    const index = Math.floor(n * Math.pow(random, skew));
    return Math.min(Math.max(0, index), n - 1);
  }

  /**
   * Generates a batch of transactions for the current simulation tick
   */
  public generateBatch(
    count: number,
    accounts: Account[],
    workload: WorkloadType,
    currentTick: number,
    shardCount: number
  ): Transaction[] {
    const txs: Transaction[] = [];
    const numAccounts = accounts.length;

    for (let i = 0; i < count; i++) {
      this.txCounter++;
      let senderIdx: number;
      let receiverIdx: number;

      if (workload === 'uniform') {
        senderIdx = Math.floor(Math.random() * numAccounts);
        receiverIdx = Math.floor(Math.random() * numAccounts);
      } else if (workload === 'zipfian') {
        // High probability of targeting top hotspot accounts
        senderIdx = Math.random() < 0.35 
          ? this.getZipfianIndex(Math.floor(numAccounts * 0.1)) 
          : Math.floor(Math.random() * numAccounts);
        receiverIdx = Math.random() < 0.75 
          ? this.getZipfianIndex(Math.floor(numAccounts * 0.05)) 
          : Math.floor(Math.random() * numAccounts);
      } else {
        // Burst workload: 90% of traffic sent to account 0 and 1 (both initially on Shard 0)
        senderIdx = Math.floor(Math.random() * numAccounts);
        receiverIdx = Math.random() < 0.9 ? 0 : Math.floor(Math.random() * numAccounts);
      }

      if (senderIdx === receiverIdx) {
        receiverIdx = (receiverIdx + 1) % numAccounts;
      }

      const senderAcc = accounts[senderIdx];
      const receiverAcc = accounts[receiverIdx];

      if (senderAcc) senderAcc.txCount++;
      if (receiverAcc) receiverAcc.txCount++;

      const hash = '0x' + Math.random().toString(16).slice(2, 10) + '...';

      txs.push({
        id: `tx-${this.txCounter}`,
        hash,
        sender: senderAcc.address,
        receiver: receiverAcc.address,
        originShardId: senderAcc.shardId,
        assignedShardId: senderAcc.shardId,
        targetShardId: receiverAcc.shardId,
        isCrossShard: senderAcc.shardId !== receiverAcc.shardId,
        isRedirected: false,
        isMigrated: false,
        status: 'queued',
        gas: Math.floor(21000 + Math.random() * 65000),
        sizeBytes: Math.floor(180 + Math.random() * 120),
        createdAtTick: currentTick,
        latencyMs: 0,
      });
    }

    return txs;
  }
}
