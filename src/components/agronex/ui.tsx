import type { LucideIcon } from "lucide-react";

export function ProgressBar({ value, color = "#1f9d67" }: { value: number; color?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[#e8eee9]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} /></div>;
}

export function MetricCard({ label, value, icon: Icon, tone = "green" }: { label: string; value: string; icon: LucideIcon; tone?: "green" | "gold" | "blue" | "red" }) {
  const tones = { green: "bg-[#e9f6ef] text-[#18794e]", gold: "bg-[#fff5dd] text-[#a66b00]", blue: "bg-[#edf5fc] text-[#3271a8]", red: "bg-[#fff0ed] text-[#bd513c]" };
  return <article className="ag-card p-4"><div className={`mb-4 grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={18} strokeWidth={2.2} /></div><p className="text-2xl font-extrabold tracking-tight text-[#173c2d]">{value}</p><p className="mt-1 text-xs font-medium text-[#718078]">{label}</p></article>;
}

export function DonutProgress({ value, size = 132 }: { value: number; size?: number }) {
  return <div className="relative grid place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(#1f9d67 ${value * 3.6}deg, #e8eee9 0)` }}><div className="grid size-[78%] place-items-center rounded-full bg-white text-center"><div><strong className="block text-3xl font-extrabold text-[#173c2d]">{value}%</strong><span className="text-[10px] font-semibold uppercase tracking-wider text-[#819087]">completado</span></div></div></div>;
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-lg font-bold tracking-tight text-[#173c2d]">{title}</h2>{action}</div>;
}
