import { Fragment, useMemo, useState  } from "react";
import type {ReactNode} from "react";

export interface PwsChartProps {
  data: number[];
  labels: string[];
  renderTooltip?: (index: number) => ReactNode;
  scale?: number;
  max?: number;
}

const W = 860;
const H = 180;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 22;
const GRID = [0, 1000, 2000, 3000, 4000, 5000, 6000];

export function PwsChart({ data, labels, renderTooltip, scale = 25, max = 6000 }: PwsChartProps) {
  const [active, setActive] = useState<{ i: number; x: number; y: number } | null>(null);

  const { pts, areaD, lineD } = useMemo(() => {
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;
    const xStep = plotW / Math.max(1, data.length - 1);
    const yScale = (v: number) => PAD_T + plotH - (v / max) * plotH;
    const points = data.map((v, i) => [PAD_L + i * xStep, yScale(v * scale)] as const);
    const first = points[0];
    const last = points[points.length - 1];
    if (!first || !last) return { pts: points, areaD: "", lineD: "" };
    const area = `M ${first[0]} ${first[1]} L ${points
      .slice(1)
      .map((p) => `${p[0]} ${p[1]}`)
      .join(" L ")} L ${last[0]} ${H - PAD_B} L ${first[0]} ${H - PAD_B} Z`;
    const line = `M ${first[0]} ${first[1]} L ${points
      .slice(1)
      .map((p) => `${p[0]} ${p[1]}`)
      .join(" L ")}`;
    return { pts: points, areaD: area, lineD: line };
  }, [data, max, scale]);

  const yScale = (v: number) => PAD_T + (H - PAD_T - PAD_B) - (v / max) * (H - PAD_T - PAD_B);

  return (
    <div className="relative mt-3 rounded-lg border border-line-2 bg-surface p-3">
      <svg viewBox="0 0 860 220" preserveAspectRatio="none" className="block h-45 w-full" role="img" aria-label="Grafik tren kunjungan per bulan">
        <defs>
          <clipPath id="chart-plot">
            <rect x={PAD_L} y={PAD_T} width={W - PAD_L - PAD_R} height={H - PAD_T - PAD_B} />
          </clipPath>
        </defs>
        {GRID.map((val) => {
          const y = yScale(val);
          return (
            <Fragment key={val}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--color-line)" strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 3} textAnchor="end" fontSize={9} fill="var(--color-muted-soft)">
                {val}
              </text>
            </Fragment>
          );
        })}
        <path d={areaD} fill="var(--color-accent-light)" opacity={0.35} />
        <path d={lineD} fill="none" stroke="var(--color-chart)" strokeWidth={2} />
        {labels.map((label, i) => {
          const pt = pts[i];
          if (!pt) return null;
          return (
            <text key={label} x={pt[0]} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--color-muted-soft)">
              {label}
            </text>
          );
        })}
        {pts.map(([x, y], i) => (
          <Fragment key={i}>
            <circle
              cx={x}
              cy={y}
              r={10}
              fill="transparent"
              className="cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={`${labels[i] ?? `titik ${i + 1}`}: ${data[i] ?? 0} kunjungan`}
              onMouseEnter={() => setActive({ i, x, y })}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive({ i, x, y })}
              onBlur={() => setActive(null)}
            />
            <circle cx={x} cy={y} r={3} fill="var(--color-chart)" stroke="var(--color-surface)" strokeWidth={1.5} pointerEvents="none" />
          </Fragment>
        ))}
      </svg>
      {active && renderTooltip ? (
        <div
          className={`pointer-events-none absolute z-30 max-w-60 whitespace-nowrap -translate-y-full rounded-lg bg-ink-strong px-2.5 py-2 text-[11px] text-white shadow-lg ${
            active.x < 110 ? "" : active.x > W - 110 ? "-translate-x-full" : "-translate-x-1/2"
          }`}
          style={{ left: `${(active.x / W) * 100}%`, top: `${(active.y / 220) * 100}%` }}
        >
          {renderTooltip(active.i)}
        </div>
      ) : null}
    </div>
  );
}
