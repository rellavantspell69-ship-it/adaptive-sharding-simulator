import React, { useEffect, useRef } from 'react';
import { Shard, StateMigrationEvent, Transaction } from '../../types/simulation';

interface NetworkCanvasProps {
  shards: Shard[];
  activeMigrations: StateMigrationEvent[];
  strategy: 'static' | 'adaptive';
  globalTPS: number;
  recentTransactions: Transaction[];
  selectedShardId: number | null;
  onSelectShard: (id: number | null) => void;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  startX: number;
  startY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  isCrossShard: boolean;
  isRedirected: boolean;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  shards,
  activeMigrations,
  strategy,
  globalTPS,
  recentTransactions,
  selectedShardId,
  onSelectShard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rotationAngleRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = Math.max(460, canvas.parentElement?.clientHeight || 460));

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = Math.max(460, canvas.parentElement.clientHeight || 460);
    };

    window.addEventListener('resize', handleResize);

    const centerX = width / 2;
    const centerY = height / 2;
    const orbitRadiusX = Math.min(width * 0.38, 330);
    const orbitRadiusY = Math.min(height * 0.36, 175);

    // Calculate Shard Coordinates
    const getShardCoords = (shardIndex: number, totalShards: number) => {
      const angle = (shardIndex / totalShards) * 2 * Math.PI - Math.PI / 2;
      return {
        x: centerX + Math.cos(angle) * orbitRadiusX,
        y: centerY + Math.sin(angle) * orbitRadiusY,
      };
    };

    // Main 60fps render loop
    const render = () => {
      rotationAngleRef.current += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle background coordinate grid
      ctx.strokeStyle = 'rgba(30, 38, 56, 0.4)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = step; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = step; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Orbit Ellipse
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, orbitRadiusX, orbitRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 3. Draw Channels from Center Router to Shards
      const shardPositions = shards.map((_, i) => getShardCoords(i, shards.length));

      shardPositions.forEach((pos, i) => {
        const shard = shards[i];
        let channelColor = 'rgba(43, 54, 78, 0.5)';
        if (shard.status === 'overloaded') channelColor = 'rgba(239, 68, 68, 0.35)';
        else if (shard.status === 'busy') channelColor = 'rgba(245, 158, 11, 0.3)';
        else if (shard.status === 'rebalancing') channelColor = 'rgba(139, 92, 246, 0.4)';

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = channelColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // 4. Draw Active State Migration Beams (Between Shards!)
      activeMigrations.forEach((mig) => {
        const fromPos = shardPositions[mig.fromShardId];
        const toPos = shardPositions[mig.toShardId];
        if (fromPos && toPos) {
          // Glowing beam
          ctx.beginPath();
          ctx.moveTo(fromPos.x, fromPos.y);
          // Curved arc between shards
          const midX = (fromPos.x + toPos.x) / 2 + (fromPos.y - toPos.y) * 0.2;
          const midY = (fromPos.y + toPos.y) / 2 + (toPos.x - fromPos.x) * 0.2;
          ctx.quadraticCurveTo(midX, midY, toPos.x, toPos.y);
          
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 15;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset

          // Draw migrating state packet
          const t = mig.progress;
          const px = (1 - t) * (1 - t) * fromPos.x + 2 * (1 - t) * t * midX + t * t * toPos.x;
          const py = (1 - t) * (1 - t) * fromPos.y + 2 * (1 - t) * t * midY + t * t * toPos.y;

          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px "JetBrains Mono"';
          ctx.textAlign = 'center';
          ctx.fillText(`STATE MIGRATION (${Math.round(t * 100)}%)`, midX, midY - 12);
        }
      });

      // 5. Spawn and update transaction flow particles
      if (Math.random() < 0.65 && shards.length > 0) {
        // Pick a shard proportional to utilization if hotspot, or random
        const targetIdx = Math.floor(Math.random() * shards.length);
        const targetPos = shardPositions[targetIdx];
        const targetShard = shards[targetIdx];

        if (targetPos) {
          const isRedirect = strategy === 'adaptive' && targetShard.status === 'optimal' && Math.random() < 0.3;
          const isCross = Math.random() < 0.35;

          particlesRef.current.push({
            startX: centerX,
            startY: centerY,
            x: centerX,
            y: centerY,
            targetX: targetPos.x,
            targetY: targetPos.y,
            progress: 0,
            speed: 0.025 + Math.random() * 0.025,
            color: isRedirect ? '#10b981' : isCross ? '#f59e0b' : '#00f2fe',
            size: isRedirect ? 3.5 : isCross ? 3 : 2.5,
            isCrossShard: isCross,
            isRedirected: isRedirect,
          });
        }
      }

      // Draw Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.progress += p.speed;

        if (p.progress >= 1) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        p.x = p.startX + (p.targetX - p.startX) * p.progress;
        p.y = p.startY + (p.targetY - p.startY) * p.progress;

        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 6. Draw Central Intelligent Load Balancer / Ingress Router
      const routerRadius = 40;
      ctx.save();
      ctx.translate(centerX, centerY);

      // Rotating dashed ring
      ctx.beginPath();
      ctx.arc(0, 0, routerRadius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = strategy === 'adaptive' ? 'rgba(0, 242, 254, 0.4)' : 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.rotate(rotationAngleRef.current * 0.8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Center Router Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, routerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0d14';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = strategy === 'adaptive' ? '#00f2fe' : '#f59e0b';
      ctx.shadowColor = strategy === 'adaptive' ? 'rgba(0, 242, 254, 0.5)' : 'rgba(245, 158, 11, 0.5)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center Router Text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 11px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(strategy === 'adaptive' ? 'ADAPTIVE' : 'STATIC', centerX, centerY - 8);
      ctx.font = '9px "Inter"';
      ctx.fillStyle = strategy === 'adaptive' ? '#38bdf8' : '#fbbf24';
      ctx.fillText('ROUTER / LB', centerX, centerY + 8);

      // 7. Draw Shard Clusters & Rotating Validator Nodes
      shardPositions.forEach((pos, i) => {
        const shard = shards[i];
        const isSelected = selectedShardId === shard.id;
        const shardRadius = 34;

        // Color theme based on load
        let statusColor = '#10b981'; // optimal
        let statusGlow = 'rgba(16, 185, 129, 0.4)';
        let statusLabel = 'HEALTHY';

        if (shard.status === 'overloaded') {
          statusColor = '#ef4444';
          statusGlow = 'rgba(239, 68, 68, 0.7)';
          statusLabel = 'HOTSPOT / OVERLOAD';
        } else if (shard.status === 'busy') {
          statusColor = '#f59e0b';
          statusGlow = 'rgba(245, 158, 11, 0.5)';
          statusLabel = 'ELEVATED';
        } else if (shard.status === 'rebalancing') {
          statusColor = '#8b5cf6';
          statusGlow = 'rgba(139, 92, 246, 0.7)';
          statusLabel = '2PC MIGRATION';
        }

        // Draw rotating validator nodes around this shard
        const numValidators = 5;
        const valOrbitRadius = shardRadius + 14;
        for (let v = 0; v < numValidators; v++) {
          const vAngle = rotationAngleRef.current * 1.5 + (v * 2 * Math.PI) / numValidators;
          const vx = pos.x + Math.cos(vAngle) * valOrbitRadius;
          const vy = pos.y + Math.sin(vAngle) * valOrbitRadius;

          ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
          ctx.beginPath();
          ctx.arc(vx, vy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Selected halo
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, shardRadius + 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#00f2fe';
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Shard Core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, shardRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#0f131c';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = statusColor;
        ctx.shadowColor = statusGlow;
        ctx.shadowBlur = shard.status === 'overloaded' ? 24 : 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Utilization indicator ring inside
        const utilAngle = (shard.utilization / 100) * 2 * Math.PI - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, shardRadius - 4, -Math.PI / 2, utilAngle);
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Shard Info Text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px "JetBrains Mono"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`S${shard.id}`, pos.x, pos.y - 7);

        ctx.font = 'bold 11px "JetBrains Mono"';
        ctx.fillStyle = statusColor;
        ctx.fillText(`${Math.round(shard.utilization)}%`, pos.x, pos.y + 8);

        // Name and Status tags below node
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(shard.name.toUpperCase(), pos.x, pos.y + shardRadius + 18);

        ctx.font = '8px "JetBrains Mono"';
        ctx.fillStyle = statusColor;
        ctx.fillText(`[${statusLabel}]`, pos.x, pos.y + shardRadius + 30);
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [shards, activeMigrations, strategy, globalTPS, selectedShardId]);

  // Click handler to select shard
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const orbitRadiusX = Math.min(width * 0.38, 330);
    const orbitRadiusY = Math.min(height * 0.36, 175);

    let foundId: number | null = null;
    shards.forEach((shard, i) => {
      const angle = (i / shards.length) * 2 * Math.PI - Math.PI / 2;
      const sx = centerX + Math.cos(angle) * orbitRadiusX;
      const sy = centerY + Math.sin(angle) * orbitRadiusY;
      const dist = Math.hypot(clickX - sx, clickY - sy);
      if (dist < 40) {
        foundId = shard.id;
      }
    });

    onSelectShard(foundId);
  };

  return (
    <div className="relative w-full rounded-2xl glass-panel border border-dark-700/80 overflow-hidden shadow-2xl">
      {/* Top Legend Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center space-x-3 text-[11px] font-mono bg-dark-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-dark-700 pointer-events-auto">
          <span className="text-slate-400">NETWORK TOPOLOGY:</span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>&lt;60% Optimal</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>60-80% Busy</span>
          </span>
          <span className="flex items-center space-x-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>&gt;80% Hotspot</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-mono bg-dark-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-dark-700 pointer-events-auto">
          <span className="text-slate-400">FLOW:</span>
          <span className="flex items-center space-x-1 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Intra</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>Cross-Shard</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Redirected</span>
          </span>
          <span className="flex items-center space-x-1 text-purple-400">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            <span>2PC Migration</span>
          </span>
        </div>
      </div>

      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-[480px] cursor-crosshair block"
      />

      {/* Bottom Hint */}
      <div className="absolute bottom-2.5 left-4 text-[10px] font-mono text-slate-500 pointer-events-none">
        Tip: Click any shard node to inspect validator quorum, queue depth & gas usage.
      </div>
    </div>
  );
};
