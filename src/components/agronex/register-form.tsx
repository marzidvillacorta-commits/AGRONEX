"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Save, UserCheck, Users } from "lucide-react";
import { DEFAULT_WORK_HOURS, type Crew, type LeaderUser, type Worker } from "@/data/agronexData";
import { applyWorkerOutput, calculateCrewProductivity, normalizeWorkerAttendance, quickStepsForUnit } from "@/lib/agronex-productivity";
import { InfoStat, ProgressBar, StatusBadge } from "./ui";
import { useAgroSession } from "./session-context";

export type ProgressSubmission = {
  progress: number;
  hours: number;
  observation: string;
  workers: Worker[];
  saveMode: "partial" | "complete";
};

export function RegisterProgressForm({ leader, crew, initialWorkers, onSave }: { leader: LeaderUser; crew: Crew; initialWorkers: Worker[]; onSave: (submission: ProgressSubmission) => void }) {
  const { isOnline } = useAgroSession();
  const [observation, setObservation] = useState("");
  const [workerDrafts, setWorkerDrafts] = useState(() => initialWorkers.map((worker) => normalizeWorkerAttendance(worker, worker.attendance)));
  const [savedMessage, setSavedMessage] = useState("");
  const summary = useMemo(() => calculateCrewProductivity(crew, workerDrafts), [crew, workerDrafts]);

  const updateWorker = (id: string, updater: (worker: Worker) => Worker) => {
    setWorkerDrafts((current) => current.map((worker) => worker.id === id ? updater(worker) : worker));
  };

  const markAllPresent = () => {
    setWorkerDrafts((current) => current.map((worker) => normalizeWorkerAttendance(worker, "Presente")));
  };

  const submit = (event: React.SyntheticEvent, saveMode: "partial" | "complete" = "complete") => {
    event.preventDefault();
    onSave({ progress: summary.progress, hours: summary.manHours, observation, workers: workerDrafts, saveMode });
    setSavedMessage(isOnline ? "Avance guardado correctamente." : "Avance guardado sin conexión. Se sincronizará cuando vuelva la conexión.");
    window.setTimeout(() => setSavedMessage(""), 4500);
  };

  return <form onSubmit={submit} className="space-y-5">
    <section className="ag-card p-5 sm:p-6"><SectionLabel number="1" title="Tarea asignada" /><div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5"><InfoStat label="Encargado" value={leader.name} /><InfoStat label="Labor" value={crew.labor} /><InfoStat label="Sector" value={crew.sector} /><InfoStat label="Meta" value={`${crew.goal} ${crew.unit}`} /><InfoStat label="Cuadrilla" value={crew.name} /></div></section>
    <CrewSummary summary={summary} crew={crew} />

    <section className="ag-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <SectionLabel number="2" title="Avance por trabajador" />
        <button type="button" onClick={markAllPresent} className="ag-secondary min-h-10 px-3 text-xs"><UserCheck size={16} />Todos presentes</button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#7b8981]">Marca asistencia y suma avance. Las horas se calculan automáticamente con {DEFAULT_WORK_HOURS} h por trabajador presente.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">{workerDrafts.map((worker) => <WorkerQuickEditor key={worker.id} worker={worker} onChange={(next) => updateWorker(worker.id, () => next)} />)}</div>
    </section>

    <section className="ag-card p-5 sm:p-6">
      <SectionLabel number="3" title="Observación" />
      <textarea className="ag-field min-h-24 resize-none py-3" value={observation} onChange={(event) => setObservation(event.target.value)} placeholder="Registra incidencias, condiciones o información importante..." />
    </section>

    {savedMessage && <div role="status" className="flex items-center gap-2 rounded-xl bg-[#e9f6ef] px-4 py-3 text-sm font-bold text-[#18794e]"><CheckCircle2 size={19} />{savedMessage}</div>}
    <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-20 grid gap-3 rounded-2xl bg-[#f3f6f3]/95 py-3 backdrop-blur sm:static sm:grid-cols-2 sm:bg-transparent sm:p-0"><button className="ag-secondary" type="button" onClick={(event) => submit(event, "partial")}><Users size={18} />Guardar parcial</button><button className="ag-primary" type="submit"><Save size={18} />Guardar avance</button></div>
  </form>;
}

export function CrewSummary({ summary, crew }: { summary: ReturnType<typeof calculateCrewProductivity>; crew: Crew }) {
  return <section className="ag-card p-5 sm:p-6">
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-extrabold text-[#173c2d]">Resumen de cuadrilla</h2>
      <span className="rounded-full bg-[#eef4f0] px-3 py-1.5 text-xs font-bold text-[#587066] tabular-nums">{summary.percentage}%</span>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <InfoStat label="Meta del día" value={`${crew.goal} ${crew.unit}`} />
      <InfoStat label="Avance registrado" value={`${summary.progress} ${crew.unit}`} />
      <InfoStat label="Falta por completar" value={`${summary.remaining} ${crew.unit}`} />
      <InfoStat label="Presentes" value={String(summary.presentWorkers)} />
      <InfoStat label="Ausentes" value={String(summary.absentWorkers)} />
      <InfoStat label="Horas hombre" value={`${summary.manHours} h`} />
      <InfoStat label="Rend. trabajador" value={`${summary.averagePerWorker} ${crew.unit}`} />
      <InfoStat label="Rend. hora hombre" value={`${summary.outputPerManHour} ${crew.unit}/hh`} />
      <InfoStat label="Trabajadores" value={String(summary.totalWorkers)} />
      <InfoStat label="Cumplimiento" value={crew.goal > 0 ? `${summary.percentage}%` : "Sin meta"} />
    </div>
    <div className="mt-4"><ProgressBar value={summary.percentage} /></div>
  </section>;
}

export function WorkerQuickEditor({ worker, onChange, action }: { worker: Worker; onChange: (worker: Worker) => void; action?: React.ReactNode }) {
  const steps = quickStepsForUnit(worker.unit);
  const isAbsent = worker.attendance === "Ausente";
  const performance = isAbsent ? "Sin registro" : worker.hoursWorked > 0 ? `${Number((worker.dailyOutput / worker.hoursWorked).toFixed(2))} ${worker.unit}/h` : "0";

  return <article className="rounded-2xl border border-[#e2e9e4] bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-extrabold text-[#294a3b]">{worker.name}</h3>
        <p className="mt-1 text-xs text-[#7b8981]">{worker.dailyOutput} {worker.unit} · {worker.hoursWorked} h · {performance}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge status={worker.attendance} />
        {action}
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange(normalizeWorkerAttendance(worker, "Presente"))} className={`min-h-11 rounded-xl text-xs font-bold ${worker.attendance === "Presente" ? "bg-[#1a5b40] text-white" : "border border-[#dbe5de] bg-white text-[#61736a]"}`}>Presente</button>
      <button type="button" onClick={() => onChange(normalizeWorkerAttendance(worker, "Ausente"))} className={`min-h-11 rounded-xl text-xs font-bold ${isAbsent ? "bg-[#bd513c] text-white" : "border border-[#dbe5de] bg-white text-[#61736a]"}`}>Ausente</button>
    </div>

    <div className="mt-4">
      <label className="ag-label">Avance actual ({worker.unit})<input className="ag-field" type="number" min="0" step="0.01" value={worker.dailyOutput} disabled={isAbsent} onChange={(event) => onChange(applyWorkerOutput(worker, Number(event.target.value), "value"))} /></label>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {steps.map((step) => <button key={step} type="button" disabled={isAbsent} onClick={() => onChange(applyWorkerOutput(worker, step))} className="min-h-11 rounded-xl border border-[#dbe5de] bg-[#f8faf8] text-sm font-extrabold text-[#315343] disabled:cursor-not-allowed disabled:opacity-45">{step > 0 ? `+${step}` : step}</button>)}
      </div>
    </div>
  </article>;
}

function SectionLabel({ number, title }: { number: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-xl bg-[#e9f6ef] text-xs font-extrabold text-[#18794e]">{number}</span><h2 className="font-extrabold text-[#173c2d]">{title}</h2></div>;
}
