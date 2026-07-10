"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { AlertTriangle, ArrowRight, CalendarPlus, Check, CheckCircle2, Clock3, ClipboardList, Cloud, CloudOff, Download, FileText, LogOut, Map as MapIcon, MoreHorizontal, Plus, Printer, RefreshCw, Settings2, Sparkles, TrendingUp, UserCheck, UserMinus, UserPlus, Users, UsersRound } from "lucide-react";
import { DEFAULT_WORK_HOURS, getBaseGoal, type AppScreen, type Crew, type LeaderUser, type Worker } from "@/data/agronexData";
import { DonutProgress, InfoStat, MetricCard, ProgressBar, ScreenHeading, SectionTitle, StatusBadge } from "./ui";
import { useAgroSession } from "./session-context";
import { addDays, createLocalId, formatDateLabel, getFortnightRange, getFortnightRecords, getLocalDate, getPendingSyncCount, getRecordsForDate, getRecordsInRange, type LocalPlanningRecord, type LocalProgressRecord } from "@/lib/agronex-offline";
import { LeaderActionMenu, WorkerActionMenu } from "./management-actions";

export function SupervisorDashboard({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const { crews, leaders, currentOperation, operationalDate, operationalNotice } = useAgroSession();
  const present = crews.reduce((sum, crew) => sum + crew.presentWorkers, 0);
  const total = crews.reduce((sum, crew) => sum + crew.totalWorkers, 0);
  const hours = crews.reduce((sum, crew) => sum + crew.manHours, 0);
  const overall = crews.length ? Math.round(crews.reduce((sum, crew) => sum + crew.percentage, 0) / crews.length) : 0;
  const pendingTotal = crews.reduce((sum, crew) => sum + (crew.remaining > 0 ? 1 : 0), 0);
  return <div className="space-y-6"><ScreenHeading eyebrow="Panel supervisor" title={`Panel supervisor — ${currentOperation}`} description={`Fecha operativa: ${formatDateLabel(operationalDate)}.`} />{operationalNotice && <div className="rounded-2xl bg-[#fff8e7] px-4 py-3 text-sm font-bold text-[#8b650b]">{operationalNotice}</div>}<div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard label="Encargados activos" value={String(leaders.length)} icon={UserCheck} onClick={() => onNavigate("encargados")} /><MetricCard label="Cuadrillas activas" value={String(crews.length)} icon={UsersRound} tone="blue" onClick={() => onNavigate("cuadrillas")} /><MetricCard label="Trabajadores presentes" value={String(present)} icon={Users} onClick={() => onNavigate("trabajadores")} /><MetricCard label="Ausentes" value={String(total - present)} icon={UserMinus} tone="red" onClick={() => onNavigate("trabajadores")} /><MetricCard label="Horas hombre" value={String(hours)} icon={Clock3} tone="blue" onClick={() => onNavigate("trabajadores")} /><MetricCard label="Avance general" value={`${overall}%`} icon={TrendingUp} tone="gold" onClick={() => onNavigate("avances")} /><MetricCard label="Pendientes acumulados" value={String(pendingTotal)} icon={AlertTriangle} tone="red" onClick={() => onNavigate("pendientes")} /></div><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="ag-card p-5 sm:p-6"><SectionTitle title="Avance por encargado" action={<button onClick={() => onNavigate("avances")} className="ag-text-button">Ver avances <ArrowRight size={15} /></button>} /><div className="space-y-5">{crews.length === 0 ? <EmptyBlock text="Planifica una tarea para comenzar el registro del día." /> : crews.map((crew) => <ProgressRow key={crew.id} label={`${crew.leaderName} · ${crew.labor}`} value={crew.percentage} detail={crew.sector} color={crew.percentage < 70 ? "#c4634e" : crew.percentage === 100 ? "#1f9d67" : "#d79a29"} />)}</div></section><section className="ag-card flex items-center justify-between gap-4 p-5 sm:p-6 xl:flex-col xl:text-center"><div><p className="text-sm font-bold text-[#60736a]">Cumplimiento global</p><p className="mt-2 text-xs leading-5 text-[#819087]">Promedio de las labores activas</p></div><DonutProgress value={overall} size={106} /></section></div><div className="grid gap-5 lg:grid-cols-2"><section className="ag-card p-5 sm:p-6"><SectionTitle title="Avance por labor" /><div className="space-y-4">{crews.map((crew) => <ProgressRow key={crew.id} label={crew.labor} value={crew.percentage} detail={`${crew.progress} de ${crew.goal} ${crew.unit}`} />)}</div></section><section className="ag-card p-5 sm:p-6"><SectionTitle title="Productividad por cuadrilla" /><div className="space-y-4">{crews.map((crew) => <div key={crew.id} className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#247a56]"><UsersRound size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#355447]">{crew.name}</p><p className="mt-0.5 text-xs text-[#819087]">{crew.presentWorkers} presentes · {crew.manHours} h</p></div><strong className="whitespace-nowrap text-sm text-[#173c2d] tabular-nums">{formatNumber(crew.progress / Math.max(1, crew.presentWorkers))}</strong></div>)}</div></section></div><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><section className="ag-card p-5 sm:p-6"><SectionTitle title="Alertas de bajo rendimiento" action={<button onClick={() => onNavigate("pendientes")} className="ag-text-button">Ver pendientes <ArrowRight size={15} /></button>} /><div className="divide-y divide-[#edf1ee]">{crews.filter((crew) => crew.remaining > 0).length === 0 ? <EmptyBlock text="Sin pendientes acumulados." /> : crews.filter((crew) => crew.remaining > 0).map((crew) => <div key={crew.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0ed] text-[#bd513c]"><AlertTriangle size={17} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#294a3b]">{crew.leaderName} · {crew.labor}</p><p className="mt-0.5 text-xs text-[#7c8b83]">Faltan {crew.remaining} {crew.unit} en {crew.sector}</p></div><strong className="whitespace-nowrap text-xs text-[#bd513c] tabular-nums">{crew.percentage}%</strong></div>)}</div></section><section className="rounded-2xl bg-[linear-gradient(135deg,#1a5b40,#267852)] p-5 text-white shadow-lg shadow-[#164a35]/15"><span className="grid size-10 place-items-center rounded-xl bg-white/15"><Sparkles size={20} /></span><p className="mt-5 text-xs font-bold uppercase tracking-widest text-white/60">Planificación de mañana</p><p className="mt-2 text-sm font-semibold leading-6">Priorizar labores con pendientes y reforzar cuadrillas bajo meta.</p><button onClick={() => onNavigate("planificacion")} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-extrabold text-[#174c37]">Planificar tareas <ArrowRight size={15} /></button></section></div></div>;
}

export function PlanningScreen() {
  const { crews, currentOperation, operationCatalog, planningRecords, dailyRecords, operationalDate, isOnline, savePlanningRecord } = useAgroSession();
  const [date, setDate] = useState(operationalDate || getLocalDate());
  const [editingCrewId, setEditingCrewId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState("");
  const [usePending, setUsePending] = useState(false);
  const selectedCrew = crews.find((crew) => crew.id === editingCrewId) ?? null;
  const dayTasks = planningRecords.filter((record) => record.date === date);
  const pending = dailyRecords[date]?.pending ?? Object.values(dailyRecords).flatMap((record) => record.pending);
  const uniquePending = pending.filter((item, index, list) => list.findIndex((record) => record.crewId === item.crewId) === index);
  const highPriority = dayTasks.filter((task) => task.priority === "Alta").length;

  const copyPreviousDay = () => {
    const previousDate = addDays(date, -1);
    const previous = planningRecords.filter((record) => record.date === previousDate);
    previous.forEach((record) => savePlanningRecord({ ...record, id: createLocalId("task"), date, createdAt: new Date().toISOString(), observation: `Plan basado en ${formatDateLabel(previousDate)}.` }));
    setSavedMessage(previous.length ? "Tareas copiadas. Puedes ajustarlas desde cada tarjeta." : "No hay tareas del día anterior para copiar.");
    window.setTimeout(() => setSavedMessage(""), 4000);
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Asignación operativa" title="Planificación" description={`${currentOperation}: sector, labor, encargado, meta y fecha.`} />

      <section className="ag-card p-5">
        <label className="ag-label block">Fecha de planificación<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="ag-field" /></label>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          <QuickButton label="Hoy" onClick={() => setDate(operationalDate)} />
          <QuickButton label="Mañana" onClick={() => setDate(addDays(operationalDate, 1))} />
          <QuickButton label="Copiar día anterior" onClick={copyPreviousDay} />
          <QuickButton label="Usar pendientes" active={usePending} onClick={() => setUsePending((value) => !value)} />
        </div>
      </section>

      {savedMessage && <Success text={savedMessage} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Tareas programadas" value={String(dayTasks.length)} icon={ClipboardList} />
        <MetricCard label="Sectores planificados" value={String(new Set(dayTasks.map((task) => task.sector)).size)} icon={MapIcon} tone="green" />
        <MetricCard label="Pendientes incorporados" value={String(usePending ? uniquePending.length : 0)} icon={AlertTriangle} tone="red" />
        <MetricCard label="Prioridad alta" value={String(highPriority)} icon={Sparkles} tone="gold" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {crews.map((crew) => {
          const task = dayTasks.find((record) => record.crewId === crew.id);
          const pendingItem = uniquePending.find((record) => record.crewId === crew.id);
          const suggestedGoal = Number((crew.goal + (usePending ? pendingItem?.remaining ?? 0 : 0)).toFixed(2));
          return (
            <article key={crew.id} className="ag-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">{crew.leaderName}</p>
                  <h2 className="mt-2 truncate text-lg font-extrabold text-[#173c2d]">{task?.labor ?? crew.labor}</h2>
                  <p className="mt-1 text-xs text-[#718078]">{crew.sector} · {crew.name}</p>
                </div>
                <StatusBadge status={task ? "En proceso" : pendingItem ? "Pendiente" : "Pendiente"} />
              </div>
              <div className="my-5 grid grid-cols-2 gap-3 rounded-xl bg-[#f6f8f6] p-3">
                <InfoStat label="Estado" value={task ? "Programado" : "Sin planificar"} />
                <InfoStat label="Meta sugerida" value={`${suggestedGoal} ${crew.unit}`} />
                <InfoStat label="Pendiente" value={`${pendingItem?.remaining ?? crew.remaining} ${crew.unit}`} />
                <InfoStat label="Prioridad" value={crew.remaining > 0 ? "Alta" : "Media"} />
              </div>
              <button onClick={() => setEditingCrewId(crew.id)} className="ag-primary w-full"><CalendarPlus size={17} />Planificar</button>
            </article>
          );
        })}
      </div>

      {selectedCrew && <PlanTaskModal crew={selectedCrew} date={date} usePending={usePending} pending={uniquePending.find((record) => record.crewId === selectedCrew.id)?.remaining ?? selectedCrew.remaining} sectors={operationCatalog.sectors} labors={operationCatalog.labors} units={operationCatalog.units} onClose={() => setEditingCrewId(null)} onSave={(record) => { savePlanningRecord(record); setSavedMessage(isOnline ? "Tarea asignada correctamente." : "Tarea guardada sin conexión."); setEditingCrewId(null); window.setTimeout(() => setSavedMessage(""), 4000); }} />}
    </div>
  );
}

export function AdvancesScreen() { const { crews } = useAgroSession(); return <div><ScreenHeading eyebrow="Seguimiento global" title="Avances" description="Cumplimiento por encargado, labor, cuadrilla y sector." /><div className="grid gap-5 lg:grid-cols-2"><ProgressPanel title="Por encargado" items={crews.map((crew) => ({ label: crew.leaderName, detail: crew.labor, value: crew.percentage }))} /><ProgressPanel title="Por labor" items={crews.map((crew) => ({ label: crew.labor, detail: crew.sector, value: crew.percentage }))} /><ProgressPanel title="Por cuadrilla" items={crews.map((crew) => ({ label: crew.name, detail: `${crew.presentWorkers} presentes`, value: crew.percentage }))} /><ProgressPanel title="Por sector" items={crews.map((crew) => ({ label: crew.sector, detail: crew.crop, value: crew.percentage }))} /></div><section className="ag-card mt-5 p-5 sm:p-6"><SectionTitle title="Pendientes acumulados" /><div className="grid gap-3 sm:grid-cols-2">{crews.filter((crew) => crew.remaining > 0).map((crew) => <div key={crew.id} className="rounded-xl bg-[#fff6f3] p-4"><p className="text-sm font-bold text-[#5d443d]">{crew.leaderName} · {crew.sector}</p><p className="mt-1 text-xs text-[#8b6e66]">{crew.remaining} {crew.unit} por completar</p></div>)}</div></section></div>; }

export function SupervisorReports() {
  const { currentOperation, operationalDate, progressRecords } = useAgroSession();
  const [period, setPeriod] = useState<ReportPeriod>("Semana");
  const [customStart, setCustomStart] = useState(addDays(operationalDate, -6));
  const [customEnd, setCustomEnd] = useState(operationalDate);
  const range = getReportRange(period, operationalDate, customStart, customEnd);
  const records = getRecordsInRange(progressRecords, range.start, range.end);
  const report = buildProductivityReport(records);
  const unit = new Set(records.map((record) => record.unit)).size === 1 ? records[0]?.unit ?? "" : "unid.";

  return <div className="space-y-5"><ScreenHeading eyebrow="Análisis operativo" title="Productividad" description={`Reporte de ${currentOperation} para ${period.toLowerCase()}.`} /><section className="ag-card p-4"><div className="flex gap-2 overflow-x-auto pb-1">{(["Día", "Semana", "Quincena", "Mes", "Personalizado"] as ReportPeriod[]).map((item) => <button key={item} onClick={() => setPeriod(item)} className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-extrabold ${period === item ? "bg-[#1a5b40] text-white" : "border border-[#dfe7e1] bg-white text-[#587066]"}`}>{item}</button>)}</div>{period === "Personalizado" && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="ag-label">Inicio<input className="ag-field" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label><label className="ag-label">Fin<input className="ag-field" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label></div>}</section><section className="ag-card p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">Resumen ejecutivo</p><h2 className="mt-1 text-lg font-extrabold text-[#173c2d]">Reporte de productividad AgroNex</h2><p className="mt-1 text-xs font-semibold text-[#718078]">Operación: {currentOperation} · Periodo: {range.start} al {range.end}</p></div><div className="flex gap-2 overflow-x-auto"><button onClick={() => printProductivityReport(currentOperation, period, range, report)} className="ag-secondary min-h-10 px-3 text-xs"><Printer size={16} />PDF / Imprimir</button><button onClick={() => exportCsv(currentOperation, period, range, records)} className="ag-secondary min-h-10 px-3 text-xs"><Download size={16} />CSV</button><button onClick={() => exportDoc(currentOperation, period, range, report)} className="ag-secondary min-h-10 px-3 text-xs"><FileText size={16} />Informe</button></div></div><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"><InfoStat label="Meta acumulada" value={`${formatNumber(report.goal)} ${unit}`} /><InfoStat label="Avance acumulado" value={`${formatNumber(report.progress)} ${unit}`} /><InfoStat label="Faltante" value={`${formatNumber(report.remaining)} ${unit}`} /><InfoStat label="Cumplimiento" value={`${report.percentage}%`} /><InfoStat label="Horas hombre" value={`${formatNumber(report.hours)} h`} /><InfoStat label="Presentes acum." value={String(report.present)} /><InfoStat label="Ausencias acum." value={String(report.absent)} /><InfoStat label="Rend. trabajador" value={`${formatNumber(report.avgWorker)} ${unit}`} /><InfoStat label="Rend. hora hombre" value={`${formatNumber(report.avgHour)} ${unit}/hh`} /><InfoStat label="Registros" value={String(records.length)} /></div><div className="mt-4"><ProgressBar value={report.percentage} /></div></section><div className="grid gap-5 lg:grid-cols-2"><RankingPanel title="Ranking de encargados" rows={report.leaderRanking} /><RankingPanel title="Ranking de cuadrillas" rows={report.crewRanking} /><RankingPanel title="Avance por labor" rows={report.laborRanking} /><RankingPanel title="Ranking de trabajadores" rows={report.workerRanking.slice(0, 8)} /></div><section className="ag-card p-5 sm:p-6"><SectionTitle title="Informe" /><div className="grid gap-4 lg:grid-cols-3"><ReportList title="Top 5 mayor rendimiento" rows={report.workerRanking.slice(0, 5)} /><ReportList title="Top 5 menor rendimiento" rows={[...report.workerRanking].reverse().slice(0, 5)} /><ReportList title="Sectores pendientes" rows={report.pendingSectors} /></div><section className="mt-5 rounded-2xl border border-[#ead8af] bg-[#fff8e7] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#9a6506]">Recomendación</p><p className="mt-2 text-sm font-semibold leading-6 text-[#5d5134]">{report.recommendation}</p></section></section></div>;
}

export function LeadersScreen() {
  const { crews, currentOperation, operationCatalog, leaders: sessionLeaders, addLeader } = useAgroSession();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [labor, setLabor] = useState(operationCatalog.labors[0]);
  const [sector, setSector] = useState(operationCatalog.sectors[0]);
  const [crewName, setCrewName] = useState("");
  const [saved, setSaved] = useState(false);

  return <div><ScreenHeading eyebrow="Gestión operativa" title="Encargados" description={`Responsables activos en ${currentOperation}.`} action={<button onClick={() => setShowForm((value) => !value)} className="ag-primary px-4"><UserPlus size={17} /><span className="hidden sm:inline">Agregar encargado</span></button>} />{showForm && <form onSubmit={(event) => { event.preventDefault(); const cleanName = name.trim(); if (cleanName) { const id = `leader-${cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "-")}-${Date.now()}`; addLeader({ id, name: cleanName, role: "Encargado de labor", labor, crop: currentOperation, sector, crewId: `crew-${id}`, crewName: crewName.trim() || `Cuadrilla ${cleanName}`, status: "Pendiente", accessPassword: `${cleanName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replaceAll(" ", "")}123` }); } setName(""); setCrewName(""); setSaved(true); setShowForm(false); }} className="ag-card mb-5 grid gap-4 p-5 sm:grid-cols-2"><label className="ag-label">Nombre<input className="ag-field" value={name} onChange={(event) => setName(event.target.value)} required /></label><Select label="Labor" value={labor} onChange={setLabor} items={operationCatalog.labors.map((item) => ({ value: item, label: item }))} className="ag-field" /><label className="ag-label">Operación<input className="ag-field" value={currentOperation} readOnly /></label><Select label="Sector/Bloque" value={sector} onChange={setSector} items={operationCatalog.sectors.map((item) => ({ value: item, label: item }))} className="ag-field" /><label className="ag-label sm:col-span-2">Cuadrilla<input className="ag-field" value={crewName} onChange={(event) => setCrewName(event.target.value)} placeholder="Nombre de cuadrilla" /></label><button className="ag-primary sm:col-span-2" type="submit">Guardar encargado</button></form>}{saved && <Success text="Encargado agregado correctamente." />}<div className="grid gap-4 md:grid-cols-2">{sessionLeaders.length === 0 ? <EmptyBlock text="Sin encargados registrados en esta operación." /> : sessionLeaders.map((leader) => { const crew = crews.find((item) => item.leaderId === leader.id) ?? crews.find((item) => item.id === leader.crewId)!; return <LeaderCard key={leader.id} leader={leader} crew={crew} />; })}</div></div>;
}

export function CrewsScreen() { const { crews } = useAgroSession(); return <div><ScreenHeading eyebrow="Gestión operativa" title="Cuadrillas" description="Resumen de dotación, asistencia y productividad." /><div className="grid gap-4 md:grid-cols-2">{crews.map((crew) => <article key={crew.id} className="ag-card p-5"><div className="flex justify-between gap-3"><div><h2 className="font-extrabold text-[#173c2d]">{crew.name}</h2><p className="mt-1 text-xs text-[#718078]">{crew.leaderName} · {crew.labor} · {crew.sector}</p></div><StatusBadge status={crew.status} /></div><div className="my-5 grid grid-cols-3 gap-3 rounded-xl bg-[#f6f8f6] p-3"><InfoStat label="Trabajadores" value={String(crew.totalWorkers)} /><InfoStat label="Presentes" value={String(crew.presentWorkers)} /><InfoStat label="Horas hombre" value={String(crew.manHours)} /></div><ProgressRow label="Cumplimiento" value={crew.percentage} detail={`${crew.progress}/${crew.goal} ${crew.unit}`} /></article>)}</div></div>; }

export function GlobalWorkersScreen() {
  const { crews, workers, leaders: sessionLeaders } = useAgroSession();
  const present = workers.filter((worker) => worker.attendance === "Presente"); const hours = workers.reduce((sum, worker) => sum + worker.hoursWorked, 0); const average = present.reduce((sum, worker) => sum + worker.dailyOutput, 0) / Math.max(1, present.length);
  return <div><ScreenHeading eyebrow="Personal de campo" title="Trabajadores" description="Asistencia y rendimiento agrupado por encargado y cuadrilla." /><div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5"><MetricCard label="Total trabajadores" value={String(workers.length)} icon={Users} /><MetricCard label="Presentes" value={String(present.length)} icon={UserCheck} /><MetricCard label="Ausentes" value={String(workers.length - present.length)} icon={UserMinus} tone="red" /><MetricCard label="Promedio rendimiento" value={formatNumber(average)} icon={TrendingUp} tone="gold" /><MetricCard label="Horas hombre" value={String(hours)} icon={Clock3} tone="blue" /></div><div className="space-y-5">{sessionLeaders.map((leader) => { const crew = crews.find((item) => item.leaderId === leader.id) ?? crews.find((item) => item.id === leader.crewId)!; const crewWorkers = workers.filter((worker) => worker.assignedTo === leader.id); return <section key={leader.id} className="ag-card p-5"><SectionTitle title={`${leader.name} · ${crew.name}`} /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{crewWorkers.map((worker) => <WorkerSummary key={worker.id} worker={worker} />)}</div></section>; })}</div></div>;
}

export function SectorsScreen() {
  const { crews, currentOperation } = useAgroSession();
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const states: Crew["status"][] = ["Pendiente", "Programado", "En proceso", "Terminado"];

  return <div><ScreenHeading eyebrow="Supervisión de campo" title="Sectores" description={`Tablero operativo de ${currentOperation}.`} /><div className="grid gap-4 xl:grid-cols-4">{states.map((state) => { const items = crews.filter((crew) => crew.status === state || (state === "Pendiente" && crew.status === "Prioridad")); return <section key={state} className="rounded-2xl border border-[#dfe7e1] bg-white/70 p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold text-[#173c2d]">{state}</h2><span className="rounded-full bg-[#eef4f0] px-2 py-1 text-[10px] font-bold text-[#60736a]">{items.length}</span></div><div className="space-y-3">{items.length === 0 ? <p className="rounded-xl border border-dashed border-[#d7e2db] p-3 text-xs font-semibold text-[#718078]">Sin sectores en este estado.</p> : items.map((crew) => <button key={crew.id} onClick={() => setSelectedCrew(crew)} className="w-full rounded-xl border border-[#e1e8e3] bg-white p-4 text-left shadow-[0_2px_10px_rgba(25,66,47,.04)]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">{crew.sector}</p><h3 className="mt-1 truncate text-sm font-extrabold text-[#173c2d]">{crew.labor}</h3><p className="mt-1 truncate text-xs text-[#718078]">{crew.leaderName} · {crew.name}</p></div><StatusBadge status={crew.status} /></div><div className="mt-4"><ProgressRow label="Avance" value={crew.percentage} detail={`${crew.progress}/${crew.goal} ${crew.unit}`} /></div></button>)}</div></section>; })}</div>{selectedCrew && <div className="fixed inset-0 z-[70] grid place-items-end bg-[#123f2e]/45 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] backdrop-blur-sm sm:place-items-center"><section className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">{selectedCrew.crop}</p><h2 className="mt-1 text-xl font-extrabold text-[#173c2d]">{selectedCrew.sector} · {selectedCrew.labor}</h2><p className="mt-1 text-xs text-[#718078]">{selectedCrew.leaderName} · {selectedCrew.name}</p></div><button onClick={() => setSelectedCrew(null)} className="ag-secondary min-h-10 px-3 text-xs" type="button">Cerrar</button></div><div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-[#f6f8f6] p-4"><InfoStat label="Trabajadores" value={String(selectedCrew.totalWorkers)} /><InfoStat label="Presentes" value={String(selectedCrew.presentWorkers)} /><InfoStat label="Ausentes" value={String(selectedCrew.absentWorkers)} /><InfoStat label="Horas hombre" value={`${selectedCrew.manHours} h`} /><InfoStat label="Meta" value={`${selectedCrew.goal} ${selectedCrew.unit}`} /><InfoStat label="Avance" value={`${selectedCrew.progress} ${selectedCrew.unit}`} /><InfoStat label="Faltante" value={`${selectedCrew.remaining} ${selectedCrew.unit}`} /><InfoStat label="Estado" value={selectedCrew.status} /></div><div className="mt-5"><ProgressRow label="Cumplimiento" value={selectedCrew.percentage} /></div><section className="mt-5 rounded-2xl border border-[#ead8af] bg-[#fff8e7] p-4"><p className="text-xs font-bold uppercase tracking-wider text-[#9a6506]">Tarea para mañana</p><p className="mt-2 text-sm font-semibold leading-6 text-[#5d5134]">{selectedCrew.remaining > 0 ? `Sugerir ${selectedCrew.remaining} ${selectedCrew.unit} adicionales sobre la meta base.` : "Mantener monitoreo y asignar nueva labor si corresponde."}</p></section></section></div>}</div>;
}

export function SupervisorPending({ onPlan }: { onPlan: () => void }) { const { crews } = useAgroSession(); return <div><ScreenHeading eyebrow="Próxima jornada" title="Pendientes" description="Continuidad necesaria por encargado y sector." /><div className="grid gap-5 lg:grid-cols-[1fr_.8fr]"><div className="space-y-3">{crews.filter((crew) => crew.remaining > 0).map((crew) => <article key={crew.id} className="ag-card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-extrabold text-[#173c2d]">{crew.leaderName} · {crew.sector}</h2><p className="mt-1 text-sm text-[#718078]">{crew.labor} · faltan {crew.remaining} {crew.unit}</p></div><StatusBadge status={crew.percentage < 70 ? "Prioridad" : "Pendiente"} /></div><button onClick={onPlan} className="ag-secondary mt-4 w-full"><CalendarPlus size={17} />Crear tarea para mañana</button></article>)}</div><section className="rounded-2xl bg-[#173c2d] p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-white/55">Sugerencias</p><div className="mt-4 space-y-4">{crews.filter((crew) => crew.remaining > 0).map((crew) => <div key={crew.id} className="flex gap-3"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#9bdbb2]" /><p className="text-sm leading-6 text-white/80">Mantener a {crew.leaderName} en {crew.sector} hasta completar {crew.remaining} {crew.unit}.</p></div>)}</div></section></div></div>; }

export function SyncScreen() {
  const { isOnline, syncQueue, lastSyncAt, progressRecords, planningRecords, syncNow } = useAgroSession();
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [showPending, setShowPending] = useState(false);
  const pendingCount = getPendingSyncCount(syncQueue);
  const dayRecords = getRecordsForDate(progressRecords, selectedDate);
  const fortnightRecords = getFortnightRecords(progressRecords);
  const pendingRecords = syncQueue.filter((record) => record.status === "pending");

  return <div><ScreenHeading eyebrow="Trabajo offline" title="Sincronización" description="Estado local, registros pendientes e historial guardado en este equipo." /><div className="grid gap-5 lg:grid-cols-[.82fr_1.18fr]"><section className="ag-card p-5 sm:p-6"><div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${isOnline ? "bg-[#e9f6ef] text-[#18794e]" : "bg-[#fff8e7] text-[#9a6506]"}`}>{isOnline ? <Cloud size={21} /> : <CloudOff size={21} />}</span><div><p className="text-sm font-bold text-[#173c2d]">Estado de conexión</p><p className="mt-1 text-sm text-[#60736a]">{isOnline ? "En línea" : "Sin conexión. Los datos se guardarán en este equipo."}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><InfoStat label="Pendientes" value={String(pendingCount)} /><InfoStat label="Última sincronización" value={lastSyncAt ? formatDateTime(lastSyncAt) : "Sin registro"} /><InfoStat label="Avances locales" value={String(progressRecords.length)} /><InfoStat label="Tareas locales" value={String(planningRecords.length)} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={syncNow} className="ag-primary"><RefreshCw size={18} />Sincronizar ahora</button><button onClick={() => setShowPending((value) => !value)} className="ag-secondary">Ver pendientes</button></div><p className="mt-4 text-sm font-semibold text-[#60736a]">{pendingCount === 0 ? "Todos los registros están actualizados." : `Hay ${pendingCount} registros guardados en este equipo pendientes de sincronización.`}</p>{showPending && <div className="mt-4 space-y-2">{pendingRecords.length === 0 ? <p className="rounded-xl bg-[#f6f8f6] p-3 text-sm text-[#60736a]">Todos los registros están actualizados.</p> : pendingRecords.map((record) => <div key={record.id} className="rounded-xl bg-[#fff8e7] p-3 text-xs text-[#6f5a24]"><strong className="capitalize">{record.type}</strong><span className="ml-2">{formatDateTime(record.createdAt)}</span></div>)}</div>}</section><section className="ag-card p-5 sm:p-6"><SectionTitle title="Historial local" /><label className="ag-label mt-4 block">Ver registros del día<input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="ag-field" /></label><div className="mt-4 space-y-3">{dayRecords.length === 0 ? <p className="rounded-xl bg-[#f6f8f6] p-4 text-sm font-semibold text-[#60736a]">Sin registro en esta fecha.</p> : dayRecords.map((record) => <article key={record.id} className="rounded-xl border border-[#e4ebe6] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-extrabold text-[#173c2d]">{record.leaderName} · {record.labor}</p><p className="mt-1 text-xs text-[#718078]">{record.sector} · {record.progress} de {record.goal} {record.unit}</p></div><StatusBadge status={record.saveMode === "partial" ? "Pendiente" : "En proceso"} /></div></article>)}</div><SectionTitle title="Historial quincenal local" className="mt-6" /><div className="mt-4 grid gap-3 sm:grid-cols-2">{fortnightRecords.length === 0 ? <p className="rounded-xl bg-[#f6f8f6] p-4 text-sm font-semibold text-[#60736a] sm:col-span-2">Sin registros guardados en los últimos 15 días.</p> : fortnightRecords.slice(0, 8).map((record) => <div key={record.id} className="rounded-xl bg-[#f7f9f7] p-3"><p className="text-xs font-bold text-[#294a3b]">{record.date} · {record.leaderName}</p><p className="mt-1 text-xs text-[#718078]">{record.progress} {record.unit} · {record.percentage}%</p></div>)}</div></section></div></div>;
}

export function ConfigScreen() {
  const { currentOperation, operationCatalog, leaders, workers, crews } = useAgroSession();
  const initial = { operaciones: [currentOperation], encargados: leaders.map((item) => item.name), trabajadores: workers.map((item) => item.name), sectores: operationCatalog.sectors, labores: operationCatalog.labors, cuadrillas: crews.map((item) => item.name), unidades: operationCatalog.units };
  const [data, setData] = useState(initial); const [active, setActive] = useState<keyof typeof initial>("encargados"); const [input, setInput] = useState(""); const [menuIndex, setMenuIndex] = useState<number | null>(null); const [editing, setEditing] = useState<{ index: number; value: string } | null>(null); const [deleting, setDeleting] = useState<number | null>(null); const [message, setMessage] = useState("");
  const add = () => { const value = input.trim(); if (!value) return; setData((current) => ({ ...current, [active]: [...current[active], value] })); setInput(""); };
  const updateItem = () => { if (!editing) return; setData((current) => ({ ...current, [active]: current[active].map((item, index) => index === editing.index ? editing.value : item) })); setEditing(null); setMessage("Registro actualizado correctamente."); window.setTimeout(() => setMessage(""), 3000); };
  const deleteItem = () => { if (deleting === null) return; setData((current) => ({ ...current, [active]: current[active].filter((_, index) => index !== deleting) })); setDeleting(null); setMessage("Registro eliminado correctamente."); window.setTimeout(() => setMessage(""), 3000); };
  return <div><ScreenHeading eyebrow="Panel supervisor" title="Configuración" description={`Catálogos operativos de ${currentOperation}.`} />{message && <Success text={message} />}<div className="grid gap-5 lg:grid-cols-[240px_1fr]"><nav className="ag-card flex gap-2 overflow-x-auto p-2 lg:block lg:space-y-1">{(Object.keys(data) as (keyof typeof data)[]).map((key) => <button key={key} onClick={() => { setActive(key); setMenuIndex(null); }} className={`min-h-11 min-w-max rounded-xl px-4 text-left text-sm font-bold capitalize lg:flex lg:w-full lg:items-center lg:justify-between ${active === key ? "bg-[#e9f6ef] text-[#18794e]" : "text-[#61736a] hover:bg-[#f5f7f5]"}`}><span>{key}</span><span className="ml-3 text-xs opacity-60">{data[key].length}</span></button>)}</nav><section className="ag-card p-5 sm:p-6"><SectionTitle title={active.charAt(0).toUpperCase() + active.slice(1)} /><div className="mb-5 flex gap-2"><input className="ag-field flex-1" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && add()} placeholder={`Nuevo registro en ${active}`} /><button onClick={add} className="ag-primary px-4"><Plus size={18} /><span className="hidden sm:inline">Agregar</span></button></div><div className="max-h-[55dvh] divide-y divide-[#edf1ee] overflow-y-auto">{data[active].map((item, index) => <div key={`${item}-${index}`} className="relative flex min-h-12 items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eff4f0] text-[#4c6b5d]"><Check size={14} /></span><span className="truncate text-sm font-semibold text-[#355447]">{item}</span></div><button onClick={() => setMenuIndex(menuIndex === index ? null : index)} className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#dfe7e1] bg-white text-[#8c9991]"><MoreHorizontal size={18} /></button>{menuIndex === index && <div className="absolute right-0 top-11 z-10 w-40 overflow-hidden rounded-2xl border border-[#dfe7e1] bg-white p-1 shadow-xl"><button onClick={() => { setEditing({ index, value: item }); setMenuIndex(null); }} className="block min-h-10 w-full rounded-xl px-3 text-left text-sm font-bold text-[#315343] hover:bg-[#f5f7f5]">Editar</button><button onClick={() => { setDeleting(index); setMenuIndex(null); }} className="block min-h-10 w-full rounded-xl px-3 text-left text-sm font-bold text-[#bd513c] hover:bg-[#fff6f3]">Eliminar</button></div>}</div>)}</div></section></div>{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-[#123f2e]/45 px-5 backdrop-blur-sm"><form onSubmit={(event) => { event.preventDefault(); updateItem(); }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-[#173c2d]">Editar registro</h2><input className="ag-field mt-5" value={editing.value} onChange={(event) => setEditing({ ...editing, value: event.target.value })} required /><div className="mt-5 grid gap-3 sm:grid-cols-2"><button className="ag-primary" type="submit">Guardar</button><button onClick={() => setEditing(null)} className="ag-secondary" type="button">Cancelar</button></div></form></div>}{deleting !== null && <div className="fixed inset-0 z-50 grid place-items-center bg-[#123f2e]/45 px-5 backdrop-blur-sm"><section className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-[#173c2d]">¿Eliminar este registro?</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={() => setDeleting(null)} className="ag-secondary" type="button">Cancelar</button><button onClick={deleteItem} className="ag-primary bg-[#bd513c]" type="button">Eliminar</button></div></section></div>}</div>;
}

export function SupervisorMore({ onNavigate, onExit }: { onNavigate: (screen: AppScreen) => void; onExit: () => void }) { const items = [{ label: "Encargados", description: "Responsables de labor", icon: UserCheck, screen: "encargados" as const }, { label: "Cuadrillas", description: "Dotación y productividad", icon: UsersRound, screen: "cuadrillas" as const }, { label: "Trabajadores", description: "Personal y asistencia global", icon: Users, screen: "trabajadores" as const }, { label: "Avances", description: "Cumplimiento por sector y labor", icon: TrendingUp, screen: "avances" as const }, { label: "Pendientes", description: "Continuidad para mañana", icon: ClipboardList, screen: "pendientes" as const }, { label: "Sincronización", description: "Pendientes y estado offline", icon: RefreshCw, screen: "sincronizacion" as const }, { label: "Configuración", description: "Catálogos del sistema", icon: Settings2, screen: "configuracion" as const }]; return <div><ScreenHeading eyebrow="Panel supervisor" title="Más" description="Gestión completa de la operación." /><div className="ag-card divide-y divide-[#edf1ee]">{items.map(({ label, description, icon: Icon, screen }) => <button key={label} onClick={() => onNavigate(screen)} className="flex min-h-[72px] w-full items-center gap-4 px-5 text-left hover:bg-[#f7f9f7]"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#247a56]"><Icon size={19} /></span><span className="flex-1"><strong className="block text-sm text-[#294a3b]">{label}</strong><span className="mt-1 block text-xs text-[#7b8981]">{description}</span></span><ArrowRight size={17} className="text-[#8d9992]" /></button>)}<button onClick={onExit} className="flex min-h-[72px] w-full items-center gap-4 px-5 text-left hover:bg-[#fff6f3]"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0ed] text-[#bd513c]"><LogOut size={19} /></span><span><strong className="block text-sm text-[#6d3d34]">Salir</strong><span className="mt-1 block text-xs text-[#9a746c]">Volver a la bienvenida</span></span></button></div><p className="mt-8 text-center text-[10px] font-semibold tracking-[.14em] text-[#9aa69f]">by Zidnex Digital</p></div>; }

type ReportPeriod = "Día" | "Semana" | "Quincena" | "Mes" | "Personalizado";
type ReportRange = { start: string; end: string };
type RankingRow = { label: string; detail: string; value: number; unit: string };

function getReportRange(period: ReportPeriod, operationalDate: string, customStart: string, customEnd: string): ReportRange {
  if (period === "Día") return { start: operationalDate, end: operationalDate };
  if (period === "Semana") return { start: addDays(operationalDate, -6), end: operationalDate };
  if (period === "Quincena") return getFortnightRange(operationalDate);
  if (period === "Mes") return { start: operationalDate.slice(0, 8) + "01", end: operationalDate };
  return { start: customStart, end: customEnd };
}

function buildProductivityReport(records: LocalProgressRecord[]) {
  const goal = records.reduce((sum, record) => sum + record.goal, 0);
  const progress = records.reduce((sum, record) => sum + record.progress, 0);
  const remaining = records.reduce((sum, record) => sum + record.remaining, 0);
  const hours = records.reduce((sum, record) => sum + record.hours, 0);
  const present = records.reduce((sum, record) => sum + record.workers.filter((worker) => worker.attendance === "Presente").length, 0);
  const absent = records.reduce((sum, record) => sum + record.workers.filter((worker) => worker.attendance === "Ausente").length, 0);
  const percentage = goal > 0 ? Math.round((progress / goal) * 100) : 0;
  const leaderRanking = rank(records, (record) => record.leaderName, (record) => record.labor);
  const crewRanking = rank(records, (record) => record.crewName, (record) => record.leaderName);
  const laborRanking = rank(records, (record) => record.labor, (record) => record.sector);
  const pendingSectors = rank(records.filter((record) => record.remaining > 0), (record) => record.sector, (record) => record.labor, "remaining");
  const workerRanking = rankWorkers(records);
  const delayed = leaderRanking.filter((row) => row.value < 90).map((row) => row.label).slice(0, 3).join(", ");

  return {
    goal,
    progress,
    remaining,
    hours,
    present,
    absent,
    percentage,
    avgWorker: present ? progress / present : 0,
    avgHour: hours ? progress / hours : 0,
    leaderRanking,
    crewRanking,
    laborRanking,
    workerRanking,
    pendingSectors,
    recommendation: delayed ? `Reforzar seguimiento en ${delayed} por cumplimiento bajo la meta.` : "Mantener la distribución actual y revisar pendientes antes de la siguiente jornada.",
  };
}

function rank(records: LocalProgressRecord[], label: (record: LocalProgressRecord) => string, detail: (record: LocalProgressRecord) => string, mode: "percentage" | "remaining" = "percentage"): RankingRow[] {
  const grouped = new Map<string, { detail: string; goal: number; progress: number; remaining: number; unit: string }>();
  records.forEach((record) => {
    const key = label(record);
    const current = grouped.get(key) ?? { detail: detail(record), goal: 0, progress: 0, remaining: 0, unit: record.unit };
    grouped.set(key, { ...current, goal: current.goal + record.goal, progress: current.progress + record.progress, remaining: current.remaining + record.remaining });
  });
  return Array.from(grouped.entries()).map(([key, item]) => ({ label: key, detail: item.detail, value: mode === "remaining" ? item.remaining : item.goal > 0 ? Math.round((item.progress / item.goal) * 100) : 0, unit: mode === "remaining" ? item.unit : "%" })).sort((a, b) => b.value - a.value);
}

function rankWorkers(records: LocalProgressRecord[]): RankingRow[] {
  const grouped = new Map<string, { detail: string; output: number; hours: number; unit: string }>();
  records.flatMap((record) => record.workers.map((worker) => ({ ...worker, leader: record.leaderName }))).forEach((worker) => {
    if (worker.attendance !== "Presente") return;
    const current = grouped.get(worker.name) ?? { detail: worker.leader, output: 0, hours: 0, unit: worker.unit };
    grouped.set(worker.name, { ...current, output: current.output + worker.dailyOutput, hours: current.hours + DEFAULT_WORK_HOURS });
  });
  return Array.from(grouped.entries()).map(([label, item]) => ({ label, detail: item.detail, value: item.hours ? Number((item.output / item.hours).toFixed(2)) : 0, unit: `${item.unit}/h` })).sort((a, b) => b.value - a.value);
}

function RankingPanel({ title, rows }: { title: string; rows: RankingRow[] }) {
  return <section className="ag-card p-5 sm:p-6"><SectionTitle title={title} /><ReportList rows={rows.slice(0, 6)} /></section>;
}

function ReportList({ title, rows }: { title?: string; rows: RankingRow[] }) {
  return <div>{title && <h3 className="mb-3 text-sm font-extrabold text-[#173c2d]">{title}</h3>}<div className="space-y-3">{rows.length === 0 ? <EmptyBlock text="Sin registros para este periodo." /> : rows.map((row, index) => <div key={`${row.label}-${index}`} className="flex items-center gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eff4f0] text-xs font-bold text-[#597067]">{index + 1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#355447]">{row.label}</strong><span className="block truncate text-xs text-[#819087]">{row.detail}</span></span><strong className="whitespace-nowrap text-xs text-[#173c2d]">{formatNumber(row.value)} {row.unit}</strong></div>)}</div></div>;
}

function exportCsv(operation: string, period: string, range: ReportRange, records: LocalProgressRecord[]) {
  const rows = [["Operacion", "Periodo", "Fecha", "Encargado", "Cuadrilla", "Labor", "Sector", "Meta", "Avance", "Faltante", "Unidad", "Horas hombre", "Cumplimiento"]];
  records.forEach((record) => rows.push([operation, period, record.date, record.leaderName, record.crewName, record.labor, record.sector, String(record.goal), String(record.progress), String(record.remaining), record.unit, String(record.hours), `${record.percentage}%`]));
  downloadFile(`agronex-productividad-${range.start}-${range.end}.csv`, rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n"), "text/csv;charset=utf-8");
}

function exportDoc(operation: string, period: string, range: ReportRange, report: ReturnType<typeof buildProductivityReport>) {
  downloadFile(`agronex-informe-${range.start}-${range.end}.doc`, reportHtml(operation, period, range, report), "application/msword;charset=utf-8");
}

function printProductivityReport(operation: string, period: string, range: ReportRange, report: ReturnType<typeof buildProductivityReport>) {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(reportHtml(operation, period, range, report));
  win.document.close();
  win.focus();
  win.print();
}

function reportHtml(operation: string, period: string, range: ReportRange, report: ReturnType<typeof buildProductivityReport>) {
  const generatedAt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  return `<!doctype html><html><head><meta charset="utf-8"><title>Reporte de productividad AgroNex</title><style>body{font-family:Arial,sans-serif;color:#173c2d;margin:32px}h1{font-size:24px}h2{font-size:16px;margin-top:24px}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #dfe7e1;padding:8px;text-align:left;font-size:12px}.muted{color:#60736a}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.card{border:1px solid #dfe7e1;border-radius:8px;padding:12px}</style></head><body><h1>Reporte de productividad AgroNex</h1><p class="muted">Operación: ${operation} · Periodo: ${period} · ${range.start} al ${range.end}</p><p class="muted">Fecha de generación: ${generatedAt}</p><div class="grid"><div class="card"><strong>Meta acumulada</strong><br>${formatNumber(report.goal)}</div><div class="card"><strong>Avance acumulado</strong><br>${formatNumber(report.progress)}</div><div class="card"><strong>Cumplimiento</strong><br>${report.percentage}%</div><div class="card"><strong>Horas hombre</strong><br>${formatNumber(report.hours)} h</div><div class="card"><strong>Rendimiento promedio</strong><br>${formatNumber(report.avgWorker)}</div><div class="card"><strong>Pendientes</strong><br>${formatNumber(report.remaining)}</div></div><h2>Resumen ejecutivo</h2><p>${report.recommendation}</p><h2>Encargados destacados</h2>${rowsHtml(report.leaderRanking.slice(0, 5))}<h2>Encargados con retraso</h2>${rowsHtml([...report.leaderRanking].reverse().slice(0, 5))}<h2>Ranking de trabajadores</h2>${rowsHtml(report.workerRanking.slice(0, 10))}<h2>Sectores pendientes</h2>${rowsHtml(report.pendingSectors.slice(0, 10))}<h2>Observaciones</h2><p>Reporte generado con datos locales disponibles en AgroNex.</p></body></html>`;
}

function rowsHtml(rows: RankingRow[]) {
  return `<table><thead><tr><th>Nombre</th><th>Detalle</th><th>Valor</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.label}</td><td>${row.detail}</td><td>${formatNumber(row.value)} ${row.unit}</td></tr>`).join("")}</tbody></table>`;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function PlanTaskModal({ crew, date, pending, usePending, sectors, labors, units, onClose, onSave }: { crew: Crew; date: string; pending: number; usePending: boolean; sectors: string[]; labors: string[]; units: string[]; onClose: () => void; onSave: (record: LocalPlanningRecord) => void }) {
  const suggestedGoal = Number((crew.goal + (usePending ? pending : 0)).toFixed(2));
  const [labor, setLabor] = useState(crew.labor);
  const [crop, setCrop] = useState(crew.crop);
  const [sector, setSector] = useState(crew.sector);
  const [goal, setGoal] = useState(String(suggestedGoal));
  const [unit, setUnit] = useState(crew.unit);
  const [priority, setPriority] = useState(crew.remaining > 0 || pending > 0 ? "Alta" : "Media");
  const [observation, setObservation] = useState(pending > 0 ? `Recuperar ${pending} ${crew.unit} pendientes.` : "Tarea programada para la jornada.");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      id: createLocalId("task"),
      date,
      createdAt: new Date().toISOString(),
      leaderId: crew.leaderId,
      leaderName: crew.leaderName,
      crewId: crew.id,
      crewName: crew.name,
      labor,
      crop,
      sector,
      goal: Number(goal || 0),
      unit,
      priority,
      observation,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] grid place-items-end bg-[#123f2e]/45 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-[max(4rem,env(safe-area-inset-top))] backdrop-blur-sm sm:place-items-center">
      <form onSubmit={submit} className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#2d8a61]">Planificar tarea</p>
            <h2 className="mt-1 text-xl font-extrabold text-[#173c2d]">{crew.leaderName}</h2>
            <p className="mt-1 text-xs text-[#718078]">{formatDateLabel(date)} · {crew.name}</p>
          </div>
          <button type="button" onClick={onClose} className="ag-secondary min-h-10 px-3 text-xs">Cancelar</button>
        </div>

        <div className="mt-5 rounded-2xl bg-[#173c2d] p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/55">Meta sugerida</p>
          <p className="mt-2 text-2xl font-extrabold">{suggestedGoal} {unit}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <PlanLine label="Meta base" value={`${crew.goal} ${crew.unit}`} />
            <PlanLine label="Pendiente" value={`${pending} ${crew.unit}`} />
          </div>
          <button type="button" onClick={() => setGoal(String(suggestedGoal))} className="mt-4 min-h-10 rounded-xl bg-white px-4 text-xs font-extrabold text-[#174c37]">Usar meta sugerida</button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="ag-label">Fecha<input type="date" value={date} readOnly className="ag-field" /></label>
          <label className="ag-label">Cuadrilla<input value={crew.name} readOnly className="ag-field" /></label>
          <Select label="Labor" value={labor} onChange={(value) => { setLabor(value); const base = getBaseGoal(crew.crop, value); if (base) { setGoal(String(Number((base.goal + (usePending ? pending : 0)).toFixed(2)))); setUnit(base.unit); } }} items={labors.map((item) => ({ value: item, label: item }))} className="ag-field" />
          <label className="ag-label">Operación<input value={crop} onChange={(event) => setCrop(event.target.value as typeof crop)} className="ag-field" readOnly /></label>
          <Select label="Sector/Bloque" value={sector} onChange={setSector} items={sectors.map((item) => ({ value: item, label: item }))} className="ag-field" />
          <label className="ag-label">Meta<input type="number" min="0" step="0.01" value={goal} onChange={(event) => setGoal(event.target.value)} className="ag-field" /></label>
          <Select label="Unidad" value={unit} onChange={setUnit} items={units.map((item) => ({ value: item, label: item }))} className="ag-field" />
          <Select label="Prioridad" value={priority} onChange={setPriority} items={["Alta", "Media", "Normal"].map((item) => ({ value: item, label: item }))} className="ag-field" />
          <label className="ag-label sm:col-span-2">Observación<textarea value={observation} onChange={(event) => setObservation(event.target.value)} className="ag-field min-h-24 resize-none py-3" /></label>
        </div>

        <button className="ag-primary mt-6 w-full" type="submit"><CalendarPlus size={18} />Guardar tarea</button>
      </form>
    </div>
  );
}

function QuickButton({ label, onClick, active = false }: { label: string; onClick: () => void; active?: boolean }) {
  return <button onClick={onClick} className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-extrabold ${active ? "bg-[#1a5b40] text-white" : "border border-[#dfe7e1] bg-white text-[#587066]"}`}>{label}</button>;
}

function EmptyBlock({ text }: { text: string }) {
  return <p className="rounded-xl bg-[#f6f8f6] p-4 text-sm font-semibold leading-6 text-[#60736a]">{text}</p>;
}

function ProgressPanel({ title, items }: { title: string; items: { label: string; detail: string; value: number }[] }) { return <section className="ag-card p-5 sm:p-6"><SectionTitle title={title} /><div className="space-y-5">{items.map((item) => <ProgressRow key={`${item.label}-${item.detail}`} {...item} />)}</div></section>; }
function ProgressRow({ label, detail, value, color = "#1f9d67" }: { label: string; detail?: string; value: number; color?: string }) { return <div><div className="mb-2 flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-[#355447]">{label}</p>{detail && <p className="mt-0.5 text-[10px] text-[#87948d]">{detail}</p>}</div><strong className="text-xs text-[#173c2d]">{value}%</strong></div><ProgressBar value={value} color={color} /></div>; }
function LeaderCard({ leader, crew }: { leader: LeaderUser; crew: Crew }) { return <article className="ag-card p-5"><div className="flex justify-between gap-3"><div><h2 className="font-extrabold text-[#173c2d]">{leader.name}</h2><p className="mt-1 text-xs text-[#718078]">{leader.labor} · {leader.crop} · {leader.sector}</p></div><div className="flex items-start gap-2"><StatusBadge status={crew.status} /><LeaderActionMenu leader={leader} /></div></div><div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f6f8f6] p-3"><InfoStat label="Cuadrilla" value={leader.crewName} /><InfoStat label="Trabajadores" value={String(crew.totalWorkers)} /></div><ProgressRow label="Cumplimiento" value={crew.percentage} /></article>; }
function WorkerSummary({ worker }: { worker: Worker }) { return <article className="rounded-xl bg-[#f7f9f7] p-3"><div className="flex justify-between gap-2"><p className="truncate text-sm font-bold text-[#355447]">{worker.name}</p><div className="flex items-center gap-2"><StatusBadge status={worker.attendance} /><WorkerActionMenu worker={worker} /></div></div><p className="mt-2 text-xs text-[#718078]">{worker.dailyOutput} {worker.unit} · {worker.hoursWorked} h</p></article>; }
function Select({ label, items, value, className, onChange = () => {} }: { label: string; items: { value: string; label: string }[]; value: string; className: string; onChange?: (value: string) => void }) { return <label className="ag-label">{label}<select className={className} value={value} onChange={(event) => onChange(event.target.value)}>{items.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>; }
function PlanLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className="flex justify-between gap-3 text-xs"><span className="text-white/60">{label}</span><strong className={strong ? "text-[#bce8cb]" : "text-white"}>{value}</strong></div>; }
function Success({ text }: { text: string }) { return <div role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-[#e9f6ef] px-4 py-3 text-sm font-bold text-[#18794e]"><CheckCircle2 size={18} />{text}</div>; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
function formatNumber(value: number) { return Number((Number.isFinite(value) ? value : 0).toFixed(2)).toString(); }

