"use client";

import { ArrowLeft, ChevronRight, MapPin, UsersRound } from "lucide-react";
import { crewAssignments, type CrewAssignment } from "@/data/agronexData";
import { AgroLogo } from "./brand";
import { ProgressBar } from "./ui";

export function CrewSelector({ onBack, onSelect }: { onBack: () => void; onSelect: (crew: CrewAssignment) => void }) {
  return <main className="min-h-dvh bg-[#f3f6f3] px-5 py-7 sm:py-10"><div className="mx-auto w-full max-w-3xl"><div className="flex items-center justify-between"><AgroLogo /><button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-[#587066] hover:bg-white"><ArrowLeft size={16} />Volver</button></div><header className="mb-7 mt-10"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2d8a61]">Jornada de trabajo</p><h1 className="ag-page-title mt-2">Selecciona tu cuadrilla</h1><p className="mt-2 text-sm text-[#718078]">Elige la cuadrilla que vas a reportar hoy.</p></header><div className="grid gap-4 sm:grid-cols-2">{crewAssignments.map((crew) => <button key={crew.id} onClick={() => onSelect(crew)} className="ag-card group p-5 text-left transition hover:-translate-y-0.5 hover:border-[#bcd3c4] hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]"><UsersRound size={20} /></span><Status status={crew.status} /></div><h2 className="mt-4 text-base font-extrabold text-[#244637]">{crew.crew}</h2><p className="mt-1 text-sm font-semibold text-[#567064]">{crew.labor}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-[#7a8981]"><MapPin size={14} />{crew.sector}</p><div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#61736a]"><span>Avance actual</span><strong className="text-[#173c2d]">{crew.percent}%</strong></div><div className="mt-2"><ProgressBar value={crew.percent} color={crew.status === "Prioridad" ? "#d28a1b" : "#1f9d67"} /></div><span className="mt-5 flex items-center justify-end gap-1 text-xs font-bold text-[#25805a]">Seleccionar <ChevronRight size={15} className="transition group-hover:translate-x-0.5" /></span></button>)}</div></div></main>;
}

function Status({ status }: { status: CrewAssignment["status"] }) {
  const style = status === "Terminado" ? "bg-[#e8f6ee] text-[#18794e]" : status === "Prioridad" ? "bg-[#fff0ed] text-[#bd513c]" : status === "En proceso" ? "bg-[#fff5dd] text-[#9a6506]" : "bg-[#edf2f8] text-[#50708f]";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${style}`}>{status}</span>;
}
