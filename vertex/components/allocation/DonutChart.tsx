"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface SliceData {
  ticker: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  price: number;
  shares: number;
  gainLoss: number;
  returnPct: number;
  dayChangePct: number;
}

interface DonutChartProps {
  data: SliceData[];
  totalLabel: string;
  size?: number;
}

function formatMoney(v: number): string {
  if (Math.abs(v) >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DonutChart({ data, totalLabel, size = 240 }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const hoveredIndexRef = useRef<number | null>(null);
  const progressRef = useRef<number[]>([]);
  const sliceAnglesRef = useRef<{ startAngle: number; endAngle: number }[]>([]);

  const [tooltip, setTooltip] = useState<{
    item: SliceData;
    x: number;
    y: number;
  } | null>(null);

  const drawChart = useCallback(
    (progresses: number[]) => {
      const canvas = canvasRef.current;
      if (!canvas || data.length === 0) return;

      const dpr = window.devicePixelRatio || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);

      const total = data.reduce((s, d) => s + d.value, 0);
      const cx = size / 2;
      const cy = size / 2;
      const outerR = size / 2 - 20;
      const innerR = outerR * 0.65;
      const popOutDist = 10;
      let startAngle = -Math.PI / 2;

      const angles: { startAngle: number; endAngle: number }[] = [];

      data.forEach((d, i) => {
        const pct = d.value / total;
        const endAngle = startAngle + pct * 2 * Math.PI;
        angles.push({ startAngle, endAngle });

        const progress = progresses[i] ?? 0;
        const midAngle = (startAngle + endAngle) / 2;
        const offsetX = Math.cos(midAngle) * popOutDist * progress;
        const offsetY = Math.sin(midAngle) * popOutDist * progress;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = d.color;

        if (progress > 0.01) {
          ctx.shadowColor = d.color;
          ctx.shadowBlur = 18 * progress;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        startAngle = endAngle;
      });

      sliceAnglesRef.current = angles;

      // Center text
      const textColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-primary")
        .trim();
      const subColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-tertiary")
        .trim();

      ctx.fillStyle = textColor;
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillText(formatMoney(total), cx, cy - 2);

      ctx.fillStyle = subColor;
      ctx.font = '500 11px "DM Sans", sans-serif';
      ctx.fillText(totalLabel, cx, cy + 16);

      ctx.restore();
    },
    [data, size, totalLabel]
  );

  // Init canvas on mount / data change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";

    if (progressRef.current.length !== data.length) {
      progressRef.current = new Array(data.length).fill(0);
    }

    drawChart(progressRef.current);
  }, [data, size, drawChart]);

  const startAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const animate = () => {
      let still = false;
      progressRef.current = progressRef.current.map((v, i) => {
        const target = hoveredIndexRef.current === i ? 1 : 0;
        const diff = target - v;
        if (Math.abs(diff) < 0.004) return target;
        still = true;
        return v + diff * 0.13;
      });

      drawChart(progressRef.current);
      if (still) animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
  }, [drawChart]);

  const getHoveredIndex = useCallback(
    (mouseX: number, mouseY: number): number | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const cx = size / 2;
      const cy = size / 2;
      const outerR = size / 2 - 20;
      const innerR = outerR * 0.65;

      const x = mouseX - rect.left - cx;
      const y = mouseY - rect.top - cy;
      const dist = Math.sqrt(x * x + y * y);

      if (dist < innerR || dist > outerR + 14) return null;

      // Normalize angle to [-PI/2, 3*PI/2] to match slice angles
      let angle = Math.atan2(y, x);
      if (angle < -Math.PI / 2) angle += 2 * Math.PI;

      const slices = sliceAnglesRef.current;
      for (let i = 0; i < slices.length; i++) {
        const { startAngle, endAngle } = slices[i];
        if (angle >= startAngle && angle < endAngle) return i;
      }
      return null;
    },
    [size]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const idx = getHoveredIndex(e.clientX, e.clientY);

      if (idx !== hoveredIndexRef.current) {
        hoveredIndexRef.current = idx;
        startAnimation();
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (idx !== null) {
        setTooltip({
          item: data[idx],
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      } else {
        setTooltip(null);
      }
    },
    [data, getHoveredIndex, startAnimation]
  );

  const handleMouseLeave = useCallback(() => {
    hoveredIndexRef.current = null;
    setTooltip(null);
    startAnimation();
  }, [startAnimation]);

  return (
    <div className="allocation-chart-wrap" style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: tooltip ? "pointer" : "default" }}
      />
      {tooltip && (
        <div
          className="donut-tooltip"
          style={{
            position: "absolute",
            left: tooltip.x > size / 2 ? tooltip.x - 172 : tooltip.x + 16,
            top: Math.min(tooltip.y - 10, size - 210),
            pointerEvents: "none",
          }}
        >
          <div className="donut-tooltip-header">
            <span
              className="donut-tooltip-dot"
              style={{ background: tooltip.item.color }}
            />
            <span className="donut-tooltip-ticker">{tooltip.item.ticker}</span>
            <span className="donut-tooltip-name">{tooltip.item.name}</span>
          </div>
          <div className="donut-tooltip-body">
            <div className="donut-tooltip-row">
              <span>Value</span>
              <span>{formatMoney(tooltip.item.value)}</span>
            </div>
            <div className="donut-tooltip-row">
              <span>Allocation</span>
              <span>{tooltip.item.percentage.toFixed(1)}%</span>
            </div>
            <div className="donut-tooltip-row">
              <span>Price</span>
              <span>{formatMoney(tooltip.item.price)}</span>
            </div>
            <div className="donut-tooltip-row">
              <span>Shares</span>
              <span>{tooltip.item.shares % 1 === 0 ? tooltip.item.shares.toLocaleString() : tooltip.item.shares.toFixed(4)}</span>
            </div>
            <div className="donut-tooltip-row">
              <span>Return</span>
              <span className={tooltip.item.returnPct >= 0 ? "donut-pos" : "donut-neg"}>
                {tooltip.item.returnPct >= 0 ? "+" : ""}
                {tooltip.item.returnPct.toFixed(2)}%
              </span>
            </div>
            <div className="donut-tooltip-row">
              <span>Today</span>
              <span className={tooltip.item.dayChangePct >= 0 ? "donut-pos" : "donut-neg"}>
                {tooltip.item.dayChangePct >= 0 ? "+" : ""}
                {tooltip.item.dayChangePct.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
