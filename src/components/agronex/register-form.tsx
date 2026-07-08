"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Save, UserCheck, Users } from "lucide-react";
import type { Crew, LeaderUser, Worker } from "@/data/agronexData";
import { InfoStat, StatusBadge } from "./ui";

export type ProgressSubmission = {
  progress: number;
  hours: number;
  observation: string;
  workers: Worker[];
};

export function RegisterProgressForm({ leader, crew, initialWorkers, onSave }: { leader: LeaderUser; crew: Crew; initialWorkers: Worker[]; onSave: (submission: ProgressSubmission) => void }) {
  const [progress, setProgress] = useState(String(crew.progress));
  const [hours, setHours] = useState(String(crew.hoursPerWorker));
  const [observation, setObservation] = useState("");
  const [workerDrafts, setWorkerDrafts] = useState(initialWorkers);
  const [saved, setSaved] = useState(false);
  const field = "mt-2 min-h-12 w-full rounded-xl border border-[#dbe5de] bg-white px-3.5 text-base font-medium text-[#244637] outline-none transition focus:border-[#238358] focus:ring-4 focus:ring-[#238358]/10";
  const updateWorker = (id: string, patch: Partial<Worker>) => setWorkerDrafts((current) => current.map((worker) => worker.id === id ? { ...worker, ...patch } : worker));
  const submit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSave({ progress: Number(progress), hours: Number(hours), observation, workers: workerDrafts });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  };
  return <form onSubmit={submit} className="space-y-5">
    <section className="ag-card p-5 sm:p-6"><SectionLabel number="1" title="Tarea asignada" /><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5"><InfoStat label="Encargado" value={leader.name} /><InfoStat label="Labor" value={crew.labor} /><InfoStat label="Sector" value={crew.sector} /><InfoStat label="Meta" value={`${crew.goal} ${crew.unit}`} /><InfoStat label="Cuadrilla" value={crew.name} /></div></section>
    <section className="ag-card p-5 sm:p-6"><SectionLabel number="2" title="Avance del día" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="ag-label">Avance realizado ({crew.unit})<input className={field} type="number" min="0" step="0.01" value={progress} onChange={(event) => setProgress(event.target.value)} required /></label><label className="ag-label">Horas trabajadas<input className={field} type="number" min="0" max="24" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} required /></label><label className="ag-label sm:col-span-2">Observación general<textarea className={`${field} min-h-24 resize-none py-3`} value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Registra incidencias, condiciones o información importante..." /></label></div></section>
    <section className="ag-card p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><SectionLabel number="3" title="Detalle por trabajador" /><span className="rounded-full bg-[#eef4f0] px-3 py-1.5 text-xs font-bold text-[#587066]">{workerDrafts.length} trabajadores</span></div><p className="mt-3 text-xs leading-5 text-[#7b8981]">Abre cada trabajador para actualizar asistencia, avance, horas y observación.</p><div className="mt-5 space-y-3">{workerDrafts.map((worker) => <details key={worker.id} className="group rounded-2xl border border-[#e2e9e4] bg-[#fafcfa]"><summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3"><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${worker.attendance === "Presente" ? "bg-[#e8f6ee] text-[#18794e]" : "bg-[#fff0ed] text-[#bd513c]"}`}><UserCheck size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#294a3b]">{worker.name}</strong><span className="mt-0.5 block text-xs text-[#7b8981]">{worker.dailyOutput} {worker.unit} · {worker.hoursWorked} h</span></span><StatusBadge status={worker.attendance} /><ChevronDown size={17} className="text-[#819087] transition group-open:rotate-180" /></summary><div className="border-t border-[#e2e9e4] p-4"><div className="mb-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => updateWorker(worker.id, { attendance: "Presente", hoursWorked: worker.hoursWorked || Number(hours) })} className={`min-h-11 rounded-xl text-xs font-bold ${worker.attendance === "Presente" ? "bg-[#1a5b40] text-white" : "border border-[#dbe5de] bg-white text-[#61736a]"}`}>Presente</button><button type="button" onClick={() => updateWorker(worker.id, { attendance: "Ausente", dailyOutput: 0, hoursWorked: 0 })} className={`min-h-11 rounded-xl text-xs font-bold ${worker.attendance === "Ausente" ? "bg-[#bd513c] text-white" : "border border-[#dbe5de] bg-white text-[#61736a]"}`}>Ausente</button></div><div className="grid gap-4 sm:grid-cols-2"><label className="ag-label">Avance ({worker.unit})<input className={field} type="number" min="0" step="0.01" value={worker.dailyOutput} disabled={worker.attendance === "Ausente"} onChange={(event) => updateWorker(worker.id, { dailyOutput: Number(event.target.value) })} /></label><label className="ag-label">Horas trabajadas<input className={field} type="number" min="0" max="24" step="0.5" value={worker.hoursWorked} disabled={worker.attendance === "Ausente"} onChange={(event) => updateWorker(worker.id, { hoursWorked: Number(event.target.value) })} /></label><label className="ag-label sm:col-span-2">Observación<input className={field} value={worker.observation} onChange={(event) => updateWorker(worker.id, { observation: event.target.value })} /></label></div></div></details>)}</div></section>
    {saved && <div role="status" className="flex items-center gap-2 rounded-xl bg-[#e9f6ef] px-4 py-3 text-sm font-bold text-[#18794e]"><CheckCircle2 size={19} />Avance registrado correctamente.</div>}
    <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 grid gap-3 rounded-2xl bg-[#f3f6f3]/95 py-3 backdrop-blur sm:static sm:grid-cols-2 sm:bg-transparent sm:p-0"><button className="ag-secondary" type="button" onClick={submit}><Users size={18} />Guardar parcial</button><button className="ag-primary" type="submit"><Save size={18} />Guardar avance</button></div>
  </form>;
}

function SectionLabel({ number, title }: { number: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-xl bg-[#e9f6ef] text-xs font-extrabold text-[#18794e]">{number}</span><h2 className="font-extrabold text-[#173c2d]">{title}</h2></div>;
}
