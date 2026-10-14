#!/usr/bin/env node
/**
 * Headless CLI Benchmark Runner for Adaptive Sharding
 * Executes repeatable multi-scenario simulations and prints formatted tables.
 */

function calculateJainsFairness(loads) {
  const adjusted = loads.map(l => Math.max(l, 1.0));
  const sum = adjusted.reduce((a, b) => a + b, 0);
  const sumSq = adjusted.reduce((a, b) => a + (b * b), 0);
  const n = adjusted.length;
  return Number(((sum * sum) / (n * sumSq)).toFixed(3));
}

function runSimulation({ shardCount = 4, targetTPS = 600, strategy = 'adaptive', workload = 'zipfian', durationTicks = 45 }) {
  const alpha = 0.25;
  const capacityPerShard = Math.round(1000 / shardCount) + 100;
  const maxQueue = capacityPerShard * 2;
  const ticksPerSec = 10;
  const overloadThreshold = 75;

  const shards = Array.from({ length: shardCount }, (_, i) => ({
    id: i,
    capacity: capacityPerShard,
    mempool: [],
    processed: 0,
    dropped: 0,
    utilization: 20,
    smoothedLoad: 25,
  }));

  const numAccounts = 100;
  const accounts = Array.from({ length: numAccounts }, (_, i) => ({
    address: `0x${i.toString(16).padStart(4, '0')}`,
    shardId: i % shardCount,
    txCount: 0,
  }));

  const latencySamples = [];
  const tpsHistory = [];
  let migrationsCount = 0;
  let totalDropped = 0;

  for (let tick = 0; tick < durationTicks; tick++) {
    const batchSize = Math.round(targetTPS / ticksPerSec);

    // Generate incoming txs
    for (let i = 0; i < batchSize; i++) {
      let sIdx, rIdx;
      if (workload === 'uniform') {
        sIdx = Math.floor(Math.random() * numAccounts);
        rIdx = Math.floor(Math.random() * numAccounts);
      } else if (workload === 'zipfian') {
        sIdx = Math.random() < 0.4 ? Math.floor(Math.pow(Math.random(), 1.5) * (numAccounts * 0.1)) : Math.floor(Math.random() * numAccounts);
        rIdx = Math.random() < 0.75 ? Math.floor(Math.pow(Math.random(), 1.5) * (numAccounts * 0.05)) : Math.floor(Math.random() * numAccounts);
      } else {
        sIdx = Math.floor(Math.random() * numAccounts);
        rIdx = Math.random() < 0.85 ? 0 : Math.floor(Math.random() * numAccounts);
      }

      const sender = accounts[sIdx];
      const receiver = accounts[rIdx];
      sender.txCount++;

      let targetShardId = sender.shardId;
      if (strategy === 'adaptive') {
        const srcShard = shards[sender.shardId];
        if (srcShard.smoothedLoad >= overloadThreshold) {
          const leastLoaded = shards.reduce((min, s) => (s.smoothedLoad < min.smoothedLoad ? s : min), shards[0]);
          if ((srcShard.smoothedLoad - leastLoaded.smoothedLoad) > 20) {
            targetShardId = leastLoaded.id;
          }
        }
      }

      const assigned = shards[targetShardId];
      if (assigned.mempool.length >= maxQueue) {
        assigned.dropped++;
        totalDropped++;
      } else {
        assigned.mempool.push({
          createdTick: tick,
          isCross: sender.shardId !== receiver.shardId,
        });
      }
    }

    // Process blocks
    let tickConfirmed = 0;
    for (const s of shards) {
      const processRate = Math.round(s.capacity / ticksPerSec);
      const batch = s.mempool.splice(0, processRate);

      for (const tx of batch) {
        const dwell = (tick - tx.createdTick) * 35;
        const crossPen = tx.isCross ? 50 : 0;
        latencySamples.push(30 + dwell + crossPen);
        s.processed++;
        tickConfirmed++;
      }

      const qPressure = (s.mempool.length / maxQueue) * 50;
      const thPressure = (batch.length / processRate) * 50;
      s.utilization = Math.min(100, Math.round(qPressure + thPressure));
      s.smoothedLoad = (alpha * s.utilization) + ((1 - alpha) * s.smoothedLoad);
    }

    tpsHistory.push(tickConfirmed * ticksPerSec);

    // Adaptive state migration
    if (strategy === 'adaptive') {
      const sorted = [...shards].sort((a, b) => b.smoothedLoad - a.smoothedLoad);
      const over = sorted[0];
      const under = sorted[sorted.length - 1];

      if (over.smoothedLoad >= overloadThreshold && (over.smoothedLoad - under.smoothedLoad) >= 30) {
        const cands = accounts.filter(a => a.shardId === over.id);
        if (cands.length > 0) {
          const top = cands.reduce((max, a) => (a.txCount > max.txCount ? a : max), cands[0]);
          top.shardId = under.id;
          migrationsCount++;
        }
      }
    }
  }

  const avgTPS = Math.round(tpsHistory.reduce((a, b) => a + b, 0) / tpsHistory.length);
  const avgLat = Math.round(latencySamples.reduce((a, b) => a + b, 0) / Math.max(1, latencySamples.length));
  const sortedLat = [...latencySamples].sort((a, b) => a - b);
  const p99Lat = sortedLat[Math.floor(sortedLat.length * 0.99)] || avgLat;
  const fairness = calculateJainsFairness(shards.map(s => s.smoothedLoad));

  return {
    strategy,
    tps: avgTPS,
    avgLatency: avgLat,
    p99Latency: p99Lat,
    fairness,
    dropped: totalDropped,
    migrations: migrationsCount,
  };
}

console.log('='.repeat(80));
console.log(' SHARDFLOW: ADAPTIVE SHARDING BENCHMARK EXECUTION ENGINE');
console.log('='.repeat(80));

const scenarios = [
  { name: 'Hotspot DEX / Zipfian Skew', workload: 'zipfian', shards: 4, tps: 750 },
  { name: 'Sudden Flash Burst Spike', workload: 'burst', shards: 4, tps: 1200 },
  { name: 'High-Scale Scaling (8 Shards)', workload: 'zipfian', shards: 8, tps: 1400 },
  { name: 'Uniform Control Baseline', workload: 'uniform', shards: 4, tps: 600 },
];

console.log(`${'Scenario'.padEnd(30)} | ${'Strategy'.padEnd(9)} | ${'TPS'.padEnd(6)} | ${'Avg Lat'.padEnd(9)} | ${'P99 Lat'.padEnd(9)} | ${'Jain J'.padEnd(7)} | Mig`);
console.log('-'.repeat(80));

for (const sc of scenarios) {
  const resStatic = runSimulation({ shardCount: sc.shards, targetTPS: sc.tps, strategy: 'static', workload: sc.workload });
  const resAdapt = runSimulation({ shardCount: sc.shards, targetTPS: sc.tps, strategy: 'adaptive', workload: sc.workload });

  console.log(`${sc.name.padEnd(30)} | Static    | ${String(resStatic.tps).padEnd(6)} | ${String(resStatic.avgLatency + 'ms').padEnd(9)} | ${String(resStatic.p99Latency + 'ms').padEnd(9)} | ${String(resStatic.fairness).padEnd(7)} | ---`);
  console.log(`${''.padEnd(30)} | Adaptive  | ${String(resAdapt.tps).padEnd(6)} | ${String(resAdapt.avgLatency + 'ms').padEnd(9)} | ${String(resAdapt.p99Latency + 'ms').padEnd(9)} | ${String(resAdapt.fairness).padEnd(7)} | ${resAdapt.migrations}`);
  console.log('-'.repeat(80));
}
