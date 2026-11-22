import React, { useState } from 'react';
import { formatINR, formatINRCompact } from '../utils/formatters';

export interface PieSliceItem {
  id: string;
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export const PieDonutChart: React.FC<{
  items: PieSliceItem[];
  donut?: boolean;
}> = ({ items, donut = true }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const nonZero = items.filter((i) => i.value > 0);
  const total = nonZero.reduce((s, i) => s + i.value, 0);

  if (total <= 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No expense data available for this chart period.
      </div>
    );
  }

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 100;
  const innerR = donut ? 60 : 0;

  let cumulativeAngle = -Math.PI / 2;
  const slices = nonZero.map((item) => {
    const angle = (item.value / total) * Math.PI * 2;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Handle full 360 single-slice case cleanly
    const isFullCircle = nonZero.length === 1;
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    let d = '';
    if (isFullCircle) {
      d = `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} Z`;
    } else if (innerR > 0) {
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);
      d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
    } else {
      d = `M ${cx} ${cy} L ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    }

    return { item, d, isFullCircle };
  });

  const activeItem = nonZero.find((i) => i.id === activeId) ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="relative flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-56 h-56 overflow-visible"
          role="img"
          aria-label="Category expense distribution chart"
        >
          {slices.map(({ item, d, isFullCircle }) => {
            const isActive = activeId === item.id;
            return (
              <path
                key={item.id}
                d={d}
                fill={item.color}
                stroke="currentColor"
                strokeWidth={isFullCircle ? 0 : 1.5}
                className={`text-white dark:text-slate-900 transition-transform duration-150 cursor-pointer ${
                  isActive ? 'scale-[1.04]' : 'hover:opacity-90'
                }`}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
                onMouseEnter={() => setActiveId(item.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => setActiveId((prev) => (prev === item.id ? null : item.id))}
              />
            );
          })}
          {donut && nonZero.length === 1 && (
            <circle cx={cx} cy={cy} r={innerR} className="fill-white dark:fill-slate-900" />
          )}
        </svg>

        {donut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
              {activeItem ? activeItem.label : 'Total Spent'}
            </span>
            <span className="text-base font-bold font-mono-nums text-slate-900 dark:text-slate-100 mt-0.5">
              {formatINRCompact(activeItem ? activeItem.value : total)}
            </span>
            {activeItem && (
              <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400 tabular-nums">
                {activeItem.percentage.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {nonZero.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setActiveId(item.id)}
              onMouseLeave={() => setActiveId(null)}
              onClick={() => setActiveId((prev) => (prev === item.id ? null : item.id))}
              className={`w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                isActive
                  ? 'bg-slate-100 dark:bg-slate-800'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-3 h-3 rounded-xs shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 font-mono-nums text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {item.percentage.toFixed(1)}%
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatINR(item.value)}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

export const SimpleBarChart: React.FC<{
  data: BarChartDatum[];
  defaultColor?: string;
}> = ({ data, defaultColor = '#0F766E' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No data available to plot bar chart.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const width = 640;
  const height = 240;
  const padL = 58;
  const padR = 16;
  const padT = 20;
  const padB = 42;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const step = plotW / data.length;
  const barW = Math.min(38, Math.max(10, step * 0.62));

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <div className="h-6 flex items-center justify-end text-xs font-mono-nums text-slate-600 dark:text-slate-300 mb-1">
        {hoveredIdx !== null && data[hoveredIdx] ? (
          <span>
            {data[hoveredIdx].label}: <strong>{formatINR(data[hoveredIdx].value)}</strong>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Hover or tap any bar for exact ₹</span>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[440px] h-60">
          {ticks.map((t) => {
            const y = padT + plotH * (1 - t);
            const val = maxVal * t;
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono-nums"
                >
                  {formatINRCompact(val)}
                </text>
              </g>
            );
          })}

          {data.map((d, idx) => {
            const barH = (d.value / maxVal) * plotH;
            const x = padL + idx * step + (step - barW) / 2;
            const y = padT + plotH - barH;
            const active = hoveredIdx === idx;
            return (
              <g
                key={`${d.label}_${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(barH, d.value > 0 ? 3 : 0)}
                  rx={4}
                  fill={d.color ?? defaultColor}
                  opacity={hoveredIdx === null || active ? 1 : 0.55}
                />
                <text
                  x={x + barW / 2}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-400 text-[10px]"
                >
                  {d.label.length > 9 ? `${d.label.slice(0, 8)}…` : d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const TrendLineChart: React.FC<{
  data: Array<{ label: string; value: number }>;
}> = ({ data }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        No trend points recorded for the selected period.
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const padL = 58;
  const padR = 20;
  const padT = 20;
  const padB = 38;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const coords = data.map((d, idx) => {
    const x = data.length === 1 ? padL + plotW / 2 : padL + (idx / (data.length - 1)) * plotW;
    const y = padT + plotH - (d.value / maxVal) * plotH;
    return { x, y, ...d };
  });

  const linePath = coords.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    coords.length > 1
      ? `${linePath} L ${coords[coords.length - 1].x} ${padT + plotH} L ${coords[0].x} ${padT + plotH} Z`
      : '';

  const labelStep = Math.max(1, Math.ceil(coords.length / 8));

  return (
    <div className="w-full">
      <div className="h-6 flex items-center justify-end text-xs font-mono-nums text-slate-600 dark:text-slate-300 mb-1">
        {activeIdx !== null && coords[activeIdx] ? (
          <span>
            {coords[activeIdx].label}: <strong>{formatINR(coords[activeIdx].value)}</strong>
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Hover or tap points for daily spend</span>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[440px] h-60">
          <defs>
            <linearGradient id="shyamLineArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono-nums"
                >
                  {formatINRCompact(maxVal * t)}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#shyamLineArea)" />}
          {coords.length > 1 && (
            <path d={linePath} fill="none" stroke="#0F766E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          )}

          {coords.map((p, idx) => (
            <g
              key={`${p.label}_${idx}`}
              className="cursor-pointer"
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onClick={() => setActiveIdx(idx)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={activeIdx === idx ? 6 : 4}
                fill="#0F766E"
                stroke="#FFFFFF"
                strokeWidth={2}
              />
              {(idx % labelStep === 0 || idx === coords.length - 1) && (
                <text
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px]"
                >
                  {p.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export const DualComparisonChart: React.FC<{
  data: Array<{ label: string; expense: number; income: number }>;
}> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(...data.flatMap((d) => [d.expense, d.income]), 1);

  if (data.length === 0 || data.every((d) => d.expense === 0 && d.income === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Record expenses or income to view comparison.
      </div>
    );
  }

  const width = 660;
  const height = 250;
  const padL = 58;
  const padR = 16;
  const padT = 20;
  const padB = 40;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const groupW = plotW / data.length;
  const barW = Math.min(20, Math.max(7, groupW * 0.32));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block" />
            Expense
          </span>
        </div>
        <div className="font-mono-nums text-slate-600 dark:text-slate-300">
          {hoveredIdx !== null && data[hoveredIdx] ? (
            <span>
              {data[hoveredIdx].label} — Income:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatINR(data[hoveredIdx].income)}
              </strong>{' '}
              · Expense:{' '}
              <strong className="text-rose-700 dark:text-rose-400">
                {formatINR(data[hoveredIdx].expense)}
              </strong>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">Hover or tap columns to compare</span>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[460px] h-64">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = padT + plotH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={padL}
                  y1={y}
                  x2={width - padR}
                  y2={y}
                  className="stroke-slate-200 dark:stroke-slate-800"
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono-nums"
                >
                  {formatINRCompact(maxVal * t)}
                </text>
              </g>
            );
          })}

          {data.map((d, idx) => {
            const centerX = padL + idx * groupW + groupW / 2;
            const incH = (d.income / maxVal) * plotH;
            const expH = (d.expense / maxVal) * plotH;
            const isActive = hoveredIdx === idx;
            return (
              <g
                key={`${d.label}_${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
              >
                <rect
                  x={centerX - barW - 2}
                  y={padT + plotH - incH}
                  width={barW}
                  height={Math.max(incH, d.income > 0 ? 3 : 0)}
                  rx={3}
                  fill="#059669"
                  opacity={hoveredIdx === null || isActive ? 1 : 0.5}
                />
                <rect
                  x={centerX + 2}
                  y={padT + plotH - expH}
                  width={barW}
                  height={Math.max(expH, d.expense > 0 ? 3 : 0)}
                  rx={3}
                  fill="#E11D48"
                  opacity={hoveredIdx === null || isActive ? 1 : 0.5}
                />
                <text
                  x={centerX}
                  y={height - 14}
                  textAnchor="middle"
                  className="fill-slate-600 dark:fill-slate-400 text-[10px]"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
