import type { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  accent?: string;
}

export function KpiCard({ title, value, subtitle, icon, accent = 'from-orange-500 to-amber-400' }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <div className={`rounded-xl bg-gradient-to-br ${accent} p-2 text-white`}>{icon}</div>
      </div>
      <div className="text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
