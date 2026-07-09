import type { LucideIcon } from "lucide-react";
import type { OperationStatus } from "@/data/agronexData";

export function ProgressBar({ value, color = "#1f9d67" }: { value: number; color?: string }) {
  return <div className="h-2 overflow-hidden rounded-full bg-[#e8eee9]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} /></div>;
}

export function MetricCard({ label, value, icon: Icon, tone = "green", onClick }: { label: string; value: string; icon: LucideIcon; tone?: "green" | "gold" | "blue" | "red"; onClick?: () => void }) {
  const tones = { green: "bg-[#e9f6ef] text-[#18794e]", gold: "bg-[#fff5dd] text-[#a66b00]", blue: "bg-[#edf5fc] text-[#3271a8]", red: "bg-[#fff0ed] text-[#bd513c]" };
  const content = <><div className={`mb-4 grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={18} strokeWidth={2.2} /></div><p className="min-w-0 whitespace-nowrap text-2xl font-extrabold tracking-tight text-[#173c2d] tabular-nums">{value}</p><p className="mt-1 text-xs font-medium text-[#718078]">{label}</p></>;
  if (onClick) return <button onClick={onClick} className="ag-card p-4 text-left transition active:scale-[.99]">{content}</button>;
  return <article className="ag-card p-4">{content}</article>;
}

export function DonutProgress({ value, size = 132 }: { value: number; size?: number }) {
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
  return <div className="relative grid shrink-0 place-items-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(#1f9d67 ${safeValue * 3.6}deg, #e8eee9 0)` }}><div className="grid size-[78%] place-items-center rounded-full bg-white text-center"><div className="grid min-w-0 place-items-center"><strong className="block whitespace-nowrap text-center text-2xl font-extrabold leading-none text-[#173c2d] tabular-nums sm:text-3xl">{safeValue}%</strong><span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-[#819087]">completado</span></div></div></div>;
}

export function SectionTitle({ title, action, className = "" }: { title: string; action?: React.ReactNode; className?: string }) {
  return <div className={`mb-4 flex items-center justify-between gap-4 ${className}`}><h2 className="text-lg font-bold tracking-tight text-[#173c2d]">{title}</h2>{action}</div>;
}

export function StatusBadge({ status }: { status: OperationStatus | "Presente" | "Ausente" | "Activo" | "Inactivo" | "Sin cuadrilla" }) {
  const styles: Record<string, string> = {
    "Terminado": "bg-[#e8f6ee] text-[#18794e]",
    "Presente": "bg-[#e8f6ee] text-[#18794e]",
    "Activo": "bg-[#e8f6ee] text-[#18794e]",
    "Inactivo": "bg-[#edf2f8] text-[#50708f]",
    "Sin cuadrilla": "bg-[#fff5dd] text-[#9a6506]",
    "Prioridad": "bg-[#fff0ed] text-[#bd513c]",
    "Ausente": "bg-[#fff0ed] text-[#bd513c]",
    "En proceso": "bg-[#fff5dd] text-[#9a6506]",
    "Pendiente": "bg-[#edf2f8] text-[#50708f]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

export function ScreenHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2d8a61]">{eyebrow}</p><h1 className="ag-page-title mt-2">{title}</h1><p className="mt-2 text-sm leading-6 text-[#718078]">{description}</p></div>{action}</header>;
}

export function InfoStat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a978f]">{label}</p><p className="mt-1 truncate text-xs font-bold text-[#355447]">{value}</p></div>;
}
