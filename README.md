# ShardFlow: Adaptive Sharding with Intelligent Load Balancing

An interactive blockchain research dashboard and discrete-event simulation platform demonstrating **Adaptive Sharding and Intelligent Load Balancing** under non-uniform (Zipfian) transaction workloads.

---

## 🚀 Key Features

1. **Interactive 60fps Network Canvas**:
   - Visualizes 2 to 8 shard clusters with rotating validator nodes and real-time mempool queues.
   - Dynamic load glow indicators: 🟢 Optimal (<60%), 🟡 Elevated (60-80%), 🔴 Overloaded / Hotspot (>80%), and 🟣 Active 2PC Migration.
   - Live transaction particle flows distinguishing Intra-shard, Cross-shard 2PC, and Redirected transactions.
   - Visual **State Migration Beams** showing real-time 2-Phase Commit quarantine state transfers.

2. **Dual-Tier Dynamic Load Balancer**:
   - **Tier 1 (Stateless Redirection)**: Immediate $O(1)$ routing of independent / read-heavy transactions to the least-loaded shard ($\arg\min_j(L_j)$).
   - **Tier 2 (Atomic State Migration)**: Automatic detection of persistent hotspot accounts ($L_k > 75\%$) and atomic 2-Phase Commit state relocation with zero double-spending risk.

3. **Empirical Benchmark Suite**:
   - Automated repeatable experiments (Hotspot DEX, Flash Bursts, Scalability to 8 Shards, Uniform Baseline).
   - Quantitative performance metrics: Effective Throughput (TPS), P95 & P99 Latency curves, Jain's Fairness Index ($\mathcal{J} \in [0, 1]$), Gini coefficient, and Dropped Rate.
   - Direct export to **CSV**, **JSON**, and publication-ready **LaTeX** tables.

4. **Academic Research Paper & Formulation**:
   - Complete preprint manuscript with problem formulation, safety theorems, proof sketches, and references to OmniLedger, RapidChain, Ethereum Danksharding, and NEAR Nightshade.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS (dark technical theme)
- **Visuals**: HTML5 Canvas (60fps particle dynamics), Recharts
- **Icons**: Lucide React
- **Simulation Engine**: Deterministic discrete-event simulation in TypeScript + standalone Python validation script

---

## 🏁 Quick Start

### 1. Run the Web Dashboard
```bash
# Navigate to the project directory
cd adaptive-sharding-simulator

# Install dependencies (if not already installed)
npm install

# Start the Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 2. Run the Standalone Python Benchmark
```bash
python scripts/simulation_benchmark.py
```

---

## 📊 Algorithmic Formulation

### 1. Smoothed Load Metric (EMA)
$$L_i(t) = \alpha \cdot L_i(t-1) + (1-\alpha) \cdot \left[ 0.5 \cdot \frac{Q_i(t)}{Q_{\max}} + 0.5 \cdot \frac{\text{Processed}_i(t)}{C_i} \right]$$

### 2. State Migration Utility
$$U(A, S_{\text{src}} \to S_{\text{dst}}) = (L_{\text{src}} - L_{\text{dst}}) - \lambda \cdot \frac{\text{StateSize}(A)}{\text{Bandwidth}} - C_{\text{lock}}$$

### 3. Workload Balance (Jain's Fairness Index)
$$\mathcal{J}(L_1, L_2, \dots, L_n) = \frac{\left(\sum_{i=1}^n L_i\right)^2}{n \sum_{i=1}^n L_i^2}$$
An index of $1.0$ indicates perfect load equilibrium across all shard clusters.

---

## 📜 Citation

```bibtex
@article{adaptive_sharding_2026,
  title={Adaptive Sharding with Dynamic State Migration for Hotspot-Resilient Blockchain Networks},
  author={Distributed Systems and Blockchain Research Group},
  journal={IEEE Transactions on Dependable and Secure Computing (Preprint)},
  year={2026}
}
```
