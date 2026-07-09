"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, BarChart3, CalendarClock, Clock3, LogOut, RefreshCw, Sparkles, Target, TrendingDown, TrendingUp, UserCheck, UserMinus, Users, UsersRound } from "lucide-react";
import type { AppScreen, Crew, LeaderUser, Worker } from "@/data/agronexData";
import { addDays, formatDateLabel, getFortnightRange, getLatestProgressForLeaderDate, getLatestTaskForLeaderDate, getRecordsInRange, type LocalPlanningRecord, type LocalProgressRecord } from "@/lib/agronex-offline";
import { DonutProgress, InfoStat, MetricCard, ProgressBar, ScreenHeading, SectionTitle, StatusBadge } from "./ui";
import { RegisterProgressForm, type ProgressSubmission } from "./register-form";
import { AddWorkerButton, WorkerActionMenu } from "./management-actions";
import { useAgroSession } from "./session-context";

type LeaderProps = { leader: LeaderUser; crew: Crew; workers: Worker[] };
type DateScope = "Hoy" | "Ayer" | "Quincena";

export function LeaderHome({ leader, crew, workers, onNavigate }: LeaderProps & { onNavigate: (screen: AppScreen) => void }) {
  const { operationalDate, planningRecords, progressRecords } = useAgroSession();
  const [scope, setScope] = useState<DateScope>("Hoy");
  const todayTask = getLatestTaskForLeaderDate(planningRecords, leader.id, operationalDate);
  const todayProgress = getLatestProgressForLeaderDate(progressRecords, leader.id, operationalDate);
  const taskCrew = todayTask ? mergeCrewWithDay(crew, todayTask, todayProgress) : crew;
  const dayWorkers = todayProgress?.workers ?? workers;
  const present = dayWorkers.filter((worker) => worker.attendance === "Presente").length;
  const absent = dayWorkers.length - present;
  const manHours = dayWorkers.reduce((sum, worker) => sum + worker.hoursWorked, 0);
  const average = present ? taskCrew.progress / present : 0;

  if (scope === "Quincena") {
    return (
      <div className="space-y-5">
        <ScreenHeading eyebrow="Mi jornada" title={`Buenos días, ${leader.name}`} description="Resumen de tu cuadrilla y rendimiento acumulado." />
        <ScopeChips value={scope} onChange={setScope} />
        <FortnightSummary leader={leader} />
      </div>
    );
  }

  if (scope === "Ayer") {
    const yesterday = addDays(operationalDate, -1);
    const record = getLatestProgressForLeaderDate(progressRecords, leader.id, yesterday);
    return (
      <div className="space-y-5">
        <ScreenHeading eyebrow="Registro histórico" title={`Jornada ${formatDateLabel(yesterday)}`} description="Consulta de solo lectura para días anteriores." />
        <ScopeChips value={scope} onChange={setScope} />
        {record ? <HistoricProgressCard record={record} /> : <EmptyState title="Sin registros para esta fecha." description="Cuando guardes avances, el historial aparecerá aquí." />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Mi jornada" title={`Buenos días, ${leader.name}`} description={todayTask ? "Tarea de hoy lista para registrar avance." : "Tu perfil y cuadrilla siguen disponibles."} />
      <ScopeChips value={scope} onChange={setScope} />

      {!todayTask ? (
        <>
          <EmptyState title="Sin tarea asignada para hoy" description="Cuando el supervisor planifique, aparecerá aquí." />
          <section className="ag-card p-5">
            <SectionTitle title="Mi cuadrilla" />
            <div className="grid grid-cols-2 gap-3">
              <InfoStat label="Cuadrilla" value={crew.name} />
              <InfoStat label="Trabajadores" value={String(workers.length)} />
              <InfoStat label="Labor base" value={leader.labor} />
              <InfoStat label="Sector" value={leader.sector} />
            </div>
          </section>
          <FortnightSummary leader={leader} compact />
        </>
      ) : (
        <>
          <section className="rounded-3xl bg-[linear-gradient(135deg,#174d38,#267852)] p-5 text-white shadow-lg shadow-[#164a35]/15">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/55">Tarea de hoy</p>
                <h2 className="mt-2 text-lg font-extrabold leading-snug">{taskCrew.labor} · {taskCrew.sector}</h2>
                <p className="mt-1 text-xs text-white/65">{taskCrew.crop} · {taskCrew.name}</p>
              </div>
              <StatusBadge status={taskCrew.status} />
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs font-bold text-white/75">
                <span>Avance</span>
                <span className="tabular-nums">{taskCrew.percentage}%</span>
              </div>
              <div className="mt-2"><ProgressBar value={taskCrew.percentage} color="#bce8cb" /></div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white/10 p-3">
              <HeroStat label="Meta" value={`${taskCrew.goal} ${taskCrew.unit}`} />
              <HeroStat label="Avance" value={`${taskCrew.progress} ${taskCrew.unit}`} />
              <HeroStat label="Falta" value={`${taskCrew.remaining} ${taskCrew.unit}`} />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <MetricCard label="Trabajadores" value={String(dayWorkers.length)} icon={Users} />
            <MetricCard label="Presentes" value={String(present)} icon={UserCheck} tone="green" />
            <MetricCard label="Ausentes" value={String(absent)} icon={UserMinus} tone="red" />
            <MetricCard label="Horas hombre" value={String(manHours)} icon={Clock3} tone="blue" />
            <MetricCard label="Promedio" value={`${formatNumber(average)} ${taskCrew.unit}/persona`} icon={TrendingUp} tone="gold" />
            <MetricCard label="Faltante" value={`${taskCrew.remaining} ${taskCrew.unit}`} icon={Target} tone="red" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="ag-card p-5">
              <SectionTitle title="Avance del día" />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <InfoStat label="Meta" value={`${taskCrew.goal} ${taskCrew.unit}`} />
                <InfoStat label="Realizado" value={`${taskCrew.progress} ${taskCrew.unit}`} />
                <InfoStat label="Pendiente" value={`${taskCrew.remaining} ${taskCrew.unit}`} />
              </div>
              <button onClick={() => onNavigate("registrar")} className="ag-primary mt-6 w-full">Registrar avance <ArrowRight size={17} /></button>
            </section>
            <section className="rounded-2xl border border-[#ead8af] bg-[#fff8e7] p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-white text-[#a66b00]"><Sparkles size={19} /></span>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#9a6506]">Pendiente para mañana</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#5d5134]">
                {taskCrew.remaining > 0 ? `Faltan ${taskCrew.remaining} ${taskCrew.unit}. El supervisor puede incorporarlo en la siguiente planificación.` : "La tarea de hoy quedó completada."}
              </p>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

export function LeaderRegister({ leader, crew, workers, onSave }: LeaderProps & { onSave: (submission: ProgressSubmission) => void }) {
  const { operationalDate, planningRecords, progressRecords } = useAgroSession();
  const task = getLatestTaskForLeaderDate(planningRecords, leader.id, operationalDate);
  const progress = getLatestProgressForLeaderDate(progressRecords, leader.id, operationalDate);

  if (!task) {
    return (
      <div>
        <ScreenHeading eyebrow="Registro de campo" title="Guardar avance" description="El registro se habilita cuando exista una tarea activa para hoy." />
        <EmptyState title="No hay tarea asignada para registrar avance." description="Para registrar avance, primero debe existir una tarea asignada." />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeading eyebrow="Registro de campo" title="Guardar avance" description="Actualiza el total de la cuadrilla y el detalle por trabajador." />
      <RegisterProgressForm leader={leader} crew={mergeCrewWithDay(crew, task, progress)} initialWorkers={progress?.workers ?? workers} onSave={onSave} />
    </div>
  );
}

export function MyCrewScreen({ leader, crew, workers }: LeaderProps) {
  const present = workers.filter((worker) => worker.attendance === "Presente").length;
  const manHours = workers.reduce((sum, worker) => sum + worker.hoursWorked, 0);
  const average = present ? crew.progress / present : 0;
  return <div><ScreenHeading eyebrow="Equipo asignado" title="Mi cuadrilla" description="Asistencia y productividad de tu equipo durante la jornada." action={<AddWorkerButton leader={leader} crew={crew} />} /><section className="ag-card p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-extrabold text-[#173c2d]">{crew.name}</h2><p className="mt-1 text-sm text-[#718078]">{leader.name} · {crew.labor} · {crew.sector}</p></div><StatusBadge status={crew.status} /></div><div className="my-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f6f8f6] p-4 sm:grid-cols-4"><InfoStat label="Trabajadores" value={String(workers.length)} /><InfoStat label="Presentes" value={String(present)} /><InfoStat label="Ausentes" value={String(workers.length - present)} /><InfoStat label="Horas hombre" value={String(manHours)} /><InfoStat label="Meta del día" value={`${crew.goal} ${crew.unit}`} /><InfoStat label="Avance" value={`${crew.progress} ${crew.unit}`} /><InfoStat label="Faltante" value={`${crew.remaining} ${crew.unit}`} /><InfoStat label="Promedio" value={`${formatNumber(average)} ${crew.unit}`} /></div><div className="flex justify-between text-xs font-semibold text-[#61736a]"><span>Cumplimiento</span><strong className="whitespace-nowrap tabular-nums">{crew.percentage}%</strong></div><div className="mt-2"><ProgressBar value={crew.percentage} /></div></section><section className="mt-5"><SectionTitle title="Trabajadores de la cuadrilla" /><WorkerList workers={workers} crew={crew} leader={leader} /></section></div>;
}

export function MyWorkersScreen({ leader, crew, workers }: { leader: LeaderUser; crew: Crew; workers: Worker[] }) {
  const [filter, setFilter] = useState("Todos");
  const present = workers.filter((item) => item.attendance === "Presente");
  const average = present.reduce((sum, item) => sum + item.dailyOutput, 0) / Math.max(1, present.length);
  const visible = workers.filter((worker) => filter === "Todos" || (filter === "Presentes" && worker.attendance === "Presente") || (filter === "Ausentes" && worker.attendance === "Ausente") || (filter === "Alto rendimiento" && worker.dailyOutput > average * 1.05) || (filter === "Bajo rendimiento" && worker.attendance === "Presente" && worker.dailyOutput < average * .9));
  return <div><ScreenHeading eyebrow="Mi equipo" title="Mis trabajadores" description={`Solo trabajadores de ${crew.name}.`} action={<AddWorkerButton leader={leader} crew={crew} />} /><div className="mb-5 flex gap-2 overflow-x-auto pb-1">{["Todos", "Presentes", "Ausentes", "Alto rendimiento", "Bajo rendimiento"].map((item) => <button key={item} onClick={() => setFilter(item)} className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-bold ${filter === item ? "bg-[#1a5b40] text-white" : "border border-[#dfe7e1] bg-white text-[#587066]"}`}>{item}</button>)}</div><WorkerList workers={visible} crew={crew} leader={leader} /></div>;
}

export function LeaderPerformance({ leader, crew, workers }: LeaderProps) {
  const { operationalDate } = useAgroSession();
  const present = workers.filter((worker) => worker.attendance === "Presente");
  const average = present.reduce((sum, worker) => sum + worker.dailyOutput, 0) / Math.max(1, present.length);
  const ranked = [...present].sort((a, b) => b.dailyOutput - a.dailyOutput);
  return <div><ScreenHeading eyebrow="Análisis personal" title="Rendimiento" description="Cumplimiento y productividad de tu cuadrilla." /><div className="grid gap-5 lg:grid-cols-2"><section className="ag-card p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#60736a]">Cumplimiento del día</p><p className="mt-2 text-2xl font-extrabold text-[#173c2d]">{crew.percentage}%</p></div><DonutProgress value={crew.percentage} size={96} /></div><div className="mt-5 grid grid-cols-3 gap-3"><InfoStat label="Meta" value={`${crew.goal} ${crew.unit}`} /><InfoStat label="Avance" value={`${crew.progress} ${crew.unit}`} /><InfoStat label="Promedio" value={`${formatNumber(average)} ${crew.unit}`} /></div></section><FortnightSummary leader={leader} date={operationalDate} /><RankingCard title="Mejores trabajadores" icon={TrendingUp} workers={ranked.slice(0, 4)} crew={crew} /><RankingCard title="Trabajadores con bajo avance" icon={TrendingDown} workers={ranked.slice(-4).reverse()} crew={crew} /></div><section className="mt-5 rounded-2xl bg-[#173c2d] p-5 text-white"><div className="flex gap-3"><AlertTriangle className="shrink-0 text-[#f2c76e]" size={20} /><p className="text-sm font-semibold leading-6">Revisar distribución de personal. La cuadrilla tiene {crew.totalWorkers} trabajadores asignados y {crew.presentWorkers} presentes. El avance está en {crew.percentage}%, por lo que mañana se sugiere recuperar {crew.remaining} {crew.unit} pendientes.</p></div></section></div>;
}

export function LeaderPending({ crew }: { crew: Crew }) {
  return <div><ScreenHeading eyebrow="Próxima jornada" title="Pendientes" description="Trabajo que requiere continuidad mañana." /><section className="ag-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">{crew.sector}</p><h2 className="mt-2 text-lg font-extrabold text-[#173c2d]">{crew.labor}</h2><p className="mt-1 text-sm text-[#718078]">{crew.name}</p></div><StatusBadge status={crew.remaining === 0 ? "Terminado" : "Pendiente"} /></div><div className="my-5 grid grid-cols-3 gap-3 rounded-xl bg-[#f6f8f6] p-4"><InfoStat label="Meta" value={`${crew.goal} ${crew.unit}`} /><InfoStat label="Avance" value={`${crew.progress} ${crew.unit}`} /><InfoStat label="Pendiente" value={`${crew.remaining} ${crew.unit}`} /></div><ProgressBar value={crew.percentage} /></section><section className="mt-5 rounded-2xl border border-[#ead8af] bg-[#fff8e7] p-5"><p className="text-xs font-bold uppercase tracking-wider text-[#9a6506]">Recomendación</p><p className="mt-2 text-sm font-semibold leading-6 text-[#5d5134]">{crew.remaining > 0 ? `Completar ${crew.remaining} ${crew.unit} pendientes antes de iniciar una nueva asignación.` : "La tarea quedó completada. Solicita la siguiente asignación al supervisor."}</p></section></div>;
}

export function LeaderMore({ onNavigate, onChangeUser, onExit }: { onNavigate: (screen: AppScreen) => void; onChangeUser: () => void; onExit: () => void }) {
  return <div><ScreenHeading eyebrow="Opciones" title="Más" description="Accesos de tu cuenta y jornada." /><div className="ag-card divide-y divide-[#edf1ee]">{[{ label: "Mis trabajadores", description: "Asistencia y rendimiento individual", icon: UsersRound, action: () => onNavigate("trabajadores") }, { label: "Pendientes", description: "Continuidad para la próxima jornada", icon: CalendarClock, action: () => onNavigate("pendientes") }, { label: "Cambiar usuario", description: "Seleccionar otro encargado", icon: RefreshCw, action: onChangeUser }, { label: "Salir", description: "Volver a la bienvenida", icon: LogOut, action: onExit }].map(({ label, description, icon: Icon, action }) => <button key={label} onClick={action} className="flex min-h-[72px] w-full items-center gap-4 px-5 text-left hover:bg-[#f7f9f7]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#247a56]"><Icon size={19} /></span><span className="flex-1"><strong className="block text-sm text-[#294a3b]">{label}</strong><span className="mt-1 block text-xs text-[#7b8981]">{description}</span></span><ArrowRight size={17} className="text-[#8d9992]" /></button>)}</div><p className="mt-8 text-center text-[10px] font-semibold tracking-[.14em] text-[#9aa69f]">by Zidnex Digital</p></div>;
}

function ScopeChips({ value, onChange }: { value: DateScope; onChange: (scope: DateScope) => void }) {
  return <div className="flex gap-2 overflow-x-auto pb-1">{(["Hoy", "Ayer", "Quincena"] as DateScope[]).map((item) => <button key={item} onClick={() => onChange(item)} className={`min-h-9 whitespace-nowrap rounded-full px-4 text-xs font-extrabold ${value === item ? "bg-[#1a5b40] text-white" : "border border-[#dfe7e1] bg-white text-[#587066]"}`}>{item}</button>)}</div>;
}

function FortnightSummary({ leader, date, compact = false }: { leader: LeaderUser; date?: string; compact?: boolean }) {
  const { operationalDate, progressRecords } = useAgroSession();
  const range = getFortnightRange(date ?? operationalDate);
  const records = getRecordsInRange(progressRecords, range.start, range.end).filter((record) => record.leaderId === leader.id);
  const goal = records.reduce((sum, record) => sum + record.goal, 0);
  const progress = records.reduce((sum, record) => sum + record.progress, 0);
  const hours = records.reduce((sum, record) => sum + record.hours, 0);
  const pending = records.reduce((sum, record) => sum + record.remaining, 0);
  const percentage = goal > 0 ? Math.round((progress / goal) * 100) : 0;
  const best = [...records].sort((a, b) => b.progress - a.progress)[0];
  const lowest = [...records].sort((a, b) => a.progress - b.progress)[0];

  return (
    <section className="ag-card p-5">
      <SectionTitle title="Mi rendimiento quincenal" />
      <p className="mt-1 text-xs font-semibold text-[#718078]">{range.start} al {range.end}</p>
      {records.length === 0 ? (
        <EmptyState title="Sin registros en esta quincena." description="Registra avances diarios para construir tu rendimiento acumulado." dense />
      ) : (
        <>
          <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
            <InfoStat label="Días registrados" value={String(new Set(records.map((record) => record.date)).size)} />
            <InfoStat label="Meta acumulada" value={`${formatNumber(goal)} ${records[0]?.unit ?? ""}`} />
            <InfoStat label="Avance acumulado" value={`${formatNumber(progress)} ${records[0]?.unit ?? ""}`} />
            <InfoStat label="Faltante" value={`${formatNumber(pending)} ${records[0]?.unit ?? ""}`} />
            <InfoStat label="Horas" value={`${formatNumber(hours)} h`} />
            <InfoStat label="Cumplimiento" value={`${percentage}%`} />
          </div>
          <div className="mt-4"><ProgressBar value={percentage} /></div>
          {!compact && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <InfoStat label="Mejor día" value={best ? `${best.date} · ${best.progress} ${best.unit}` : "Sin registro"} />
              <InfoStat label="Menor avance" value={lowest ? `${lowest.date} · ${lowest.progress} ${lowest.unit}` : "Sin registro"} />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function HistoricProgressCard({ record }: { record: LocalProgressRecord }) {
  return <section className="ag-card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">Registro histórico</p><h2 className="mt-2 text-lg font-extrabold text-[#173c2d]">{record.labor} · {record.sector}</h2><p className="mt-1 text-sm text-[#718078]">{record.crop} · {record.crewName}</p></div><StatusBadge status={record.remaining === 0 ? "Terminado" : "Pendiente"} /></div><div className="my-5 grid grid-cols-3 gap-3 rounded-xl bg-[#f6f8f6] p-4"><InfoStat label="Meta" value={`${record.goal} ${record.unit}`} /><InfoStat label="Avance" value={`${record.progress} ${record.unit}`} /><InfoStat label="Faltante" value={`${record.remaining} ${record.unit}`} /></div><ProgressBar value={record.percentage} /></section>;
}

function EmptyState({ title, description, dense = false }: { title: string; description: string; dense?: boolean }) {
  return <section className={`rounded-2xl border border-dashed border-[#cfdcd3] bg-white text-center ${dense ? "p-4" : "p-5"}`}><p className="text-sm font-extrabold text-[#294a3b]">{title}</p><p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#718078]">{description}</p></section>;
}

function WorkerList({ workers, crew, leader }: { workers: Worker[]; crew: Crew; leader: LeaderUser }) {
  const average = crew.presentWorkers ? crew.progress / crew.presentWorkers : 0;
  if (workers.length === 0) return <EmptyState title="Sin trabajadores en esta cuadrilla." description="Agrega trabajadores para comenzar el registro del día." />;
  return <div className="grid gap-3 md:grid-cols-2">{workers.map((worker) => <article key={worker.id} className="ag-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-[#294a3b]">{worker.name}</h3><p className="mt-1 text-xs text-[#7b8981]">{worker.hoursWorked} horas trabajadas</p></div><div className="flex shrink-0 items-center gap-2"><StatusBadge status={worker.attendance} /><WorkerActionMenu worker={worker} leaderScope={{ leader, crew }} /></div></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f9f7] p-3"><InfoStat label="Avance" value={`${worker.dailyOutput} ${worker.unit}`} /><InfoStat label="Rendimiento" value={worker.attendance === "Ausente" ? "Sin registro" : worker.dailyOutput >= average ? "Alto" : "En seguimiento"} /></div>{worker.observation && <p className="mt-3 text-xs leading-5 text-[#6c7d74]">{worker.observation}</p>}</article>)}</div>;
}

function RankingCard({ title, icon: Icon, workers, crew }: { title: string; icon: typeof BarChart3; workers: Worker[]; crew: Crew }) {
  return <section className="ag-card p-5"><div className="mb-4 flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#e9f6ef] text-[#18794e]"><Icon size={18} /></span><h2 className="font-bold text-[#173c2d]">{title}</h2></div><div className="space-y-3">{workers.length === 0 ? <p className="rounded-xl bg-[#f6f8f6] p-3 text-sm font-semibold text-[#60736a]">Sin registros para ordenar.</p> : workers.map((worker, index) => <div key={worker.id} className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-[#eff4f0] text-xs font-bold text-[#597067]">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#355447]">{worker.name}</span><strong className="text-xs text-[#173c2d]">{worker.dailyOutput} {crew.unit}</strong></div>)}</div></section>;
}

function mergeCrewWithDay(crew: Crew, task: LocalPlanningRecord, progress: LocalProgressRecord | null): Crew {
  const done = progress?.progress ?? 0;
  const remaining = Math.max(0, Number((task.goal - done).toFixed(2)));
  const percentage = task.goal > 0 ? Math.min(100, Math.round((done / task.goal) * 100)) : 0;
  const workers = progress?.workers ?? [];
  const present = workers.filter((worker) => worker.attendance === "Presente");

  return {
    ...crew,
    labor: task.labor,
    crop: task.crop,
    sector: task.sector,
    goal: task.goal,
    progress: done,
    remaining,
    unit: task.unit,
    percentage,
    presentWorkers: progress ? present.length : crew.presentWorkers,
    absentWorkers: progress ? workers.length - present.length : crew.absentWorkers,
    manHours: progress ? workers.reduce((sum, worker) => sum + worker.hoursWorked, 0) : crew.manHours,
    status: percentage >= 100 ? "Terminado" : done > 0 ? "En proceso" : "Pendiente",
  };
}

function HeroStat({ label, value }: { label: string; value: string }) { return <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wide text-white/50">{label}</p><p className="mt-1 truncate text-xs font-extrabold text-white">{value}</p></div>; }
function formatNumber(value: number) { return Number((Number.isFinite(value) ? value : 0).toFixed(2)).toString(); }
