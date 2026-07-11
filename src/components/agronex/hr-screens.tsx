"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Briefcase, Check, ChevronDown, ChevronUp,
  Eye, FileText, MoreHorizontal, Plus, Search, TrendingUp,
  UserCheck, UserMinus, UserPlus, UserX, Users,
} from "lucide-react";
import type { AppScreen, Worker } from "@/data/agronexData";
import type { LocalProgressRecord } from "@/lib/agronex-offline";
import { InfoStat, MetricCard, ProgressBar, ScreenHeading, SectionTitle } from "./ui";
import {
  type Applicant, type HREvaluation, type HRFollowUp,
  type JobOpening, type StaffingRequirement, type WorkerPerformanceStatus, type HRDecision,
  calculateStaffingNeeded, computeAllWorkerSummaries, createLocalHRId,
  getHRDashboardStats, loadHRLocalData, maskDNI, saveHRLocalData,
} from "@/lib/agronex-hr";

function loadPersonalFilters() {
  const fallback = { search: "", statusFilter: "Todas" as WorkerPerformanceStatus | "Todas", sortBy: "performance-desc" as const };
  if (typeof window === "undefined") return fallback;
  try {
    return { ...fallback, ...JSON.parse(sessionStorage.getItem("agronex-hr-personal-filters") ?? "{}") } as {
      search: string; statusFilter: WorkerPerformanceStatus | "Todas"; sortBy: "performance-desc" | "performance-asc" | "absences" | "name";
    };
  } catch { return fallback; }
}

export function HRPanel({
  workers, records, onNavigate, onOpenWorker,
}: {
  workers: Worker[]; records: LocalProgressRecord[];
  onNavigate: (screen: AppScreen) => void;
  onOpenWorker: (workerId: string) => void;
}) {
  const hrData = loadHRLocalData();
  const stats = useMemo(() => getHRDashboardStats(workers, records, hrData.followUps, hrData.evaluations, hrData.jobOpenings, hrData.applicants, hrData.settings), [workers, records, hrData]);

  return (
    <div className="space-y-6">
      <ScreenHeading eyebrow="Recursos Humanos" title="Panel de personal" description="Indicadores de rendimiento, seguimiento y planificación de trabajadores." />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Trabajadores activos" value={String(stats.activeWorkers)} icon={Users} />
        <MetricCard label="Destacados" value={String(stats.destacados)} icon={TrendingUp} tone="green" />
        <MetricCard label="Adecuados" value={String(stats.adecuados)} icon={UserCheck} tone="blue" />
        <MetricCard label="En seguimiento" value={String(stats.enSeguimiento)} icon={AlertTriangle} tone="gold" />
        <MetricCard label="Requieren evaluación" value={String(stats.requierenEval)} icon={UserX} tone="red" />
        <MetricCard label="No evaluables" value={String(stats.noEvaluables)} icon={Eye} tone="blue" />
        <MetricCard label="Ausencias (quincena)" value={String(stats.absenceCount)} icon={UserMinus} tone="red" />
        <MetricCard label="Convocatorias activas" value={String(stats.openJobs)} icon={Briefcase} tone="gold" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <section className="ag-card p-5 sm:p-6">
          <SectionTitle title="Distribución por estado" />
          {stats.summaries.length === 0 ? (
            <p className="text-sm text-[#718078]">No hay trabajadores para evaluar en este periodo.</p>
          ) : (
            <div className="space-y-4">
              {[
                { status: "Destacado" as WorkerPerformanceStatus, count: stats.destacados, color: "bg-[#18794e]" },
                { status: "Adecuado" as WorkerPerformanceStatus, count: stats.adecuados, color: "bg-[#3271a8]" },
                { status: "En seguimiento" as WorkerPerformanceStatus, count: stats.enSeguimiento, color: "bg-[#d79a29]" },
                { status: "Requiere evaluación" as WorkerPerformanceStatus, count: stats.requierenEval, color: "bg-[#bd513c]" },
                { status: "No evaluable" as WorkerPerformanceStatus, count: stats.noEvaluables, color: "bg-[#8a978f]" },
              ].filter((s) => s.count > 0).map((s) => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="w-36 text-xs font-bold text-[#355447]">{s.status}</span>
                  <div className="flex-1">
                    <ProgressBar value={stats.summaries.length > 0 ? (s.count / stats.summaries.length) * 100 : 0} color={s.color} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-[#173c2d]">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="ag-card p-5 sm:p-6">
          <SectionTitle title="Acciones rápidas" />
          <div className="space-y-3">
            <button onClick={() => onNavigate("hr-personal")} className="ag-primary w-full justify-start"><Users size={17} />Listado de personal</button>
            <button onClick={() => onNavigate("hr-seguimiento")} className="ag-secondary w-full justify-start"><Eye size={17} />Seguimientos ({stats.pendingFollowUps})</button>
            <button onClick={() => onNavigate("hr-evaluaciones")} className="ag-secondary w-full justify-start"><FileText size={17} />Evaluaciones ({stats.pendingEvals})</button>
            <button onClick={() => onNavigate("hr-necesidad")} className="ag-secondary w-full justify-start"><BarChart3 size={17} />Necesidad de personal</button>
            <button onClick={() => onNavigate("hr-convocatorias")} className="ag-secondary w-full justify-start"><Briefcase size={17} />Convocatorias ({stats.openJobs})</button>
            <button onClick={() => onNavigate("hr-postulantes")} className="ag-secondary w-full justify-start"><UserPlus size={17} />Postulantes ({stats.totalApplicants})</button>
          </div>
        </section>
      </div>

      <section className="ag-card p-5 sm:p-6">
        <SectionTitle title="Resumen de rendimiento" action={
          <button onClick={() => onNavigate("hr-personal")} className="ag-text-button">Ver todo <ArrowRight size={15} /></button>
        } />
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-[#edf1ee]">
                <th className="p-3 text-left font-bold text-[#60736a]">Trabajador</th>
                <th className="p-3 text-left font-bold text-[#60736a]">Labor</th>
                <th className="p-3 text-left font-bold text-[#60736a]">Rendimiento</th>
                <th className="p-3 text-left font-bold text-[#60736a]">Asistencia</th>
                <th className="p-3 text-left font-bold text-[#60736a]">Estado</th>
                <th className="p-3 text-left font-bold text-[#60736a]">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {stats.summaries.slice(0, 20).map((s) => (
                <tr key={s.workerId} className="cursor-pointer border-b border-[#edf1ee] last:border-0 hover:bg-[#f8faf8]" onClick={() => onOpenWorker(s.workerId)}>
                  <td className="p-3 font-bold text-[#294a3b]">{s.workerName}</td>
                  <td className="p-3 text-[#4b6358]">{s.labor}</td>
                  <td className="p-3 text-[#4b6358]">{s.averagePerformance}%</td>
                  <td className="p-3 text-[#4b6358]">{s.attendance}%</td>
                  <td className="p-3"><WorkerStatusBadge status={s.status} /></td>
                  <td className="p-3"><TrendIcon trend={s.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function HRPersonal({
  workers, records, onOpenWorker,
}: {
  workers: Worker[]; records: LocalProgressRecord[];
  onOpenWorker: (workerId: string) => void;
}) {
  const hrData = loadHRLocalData();
  const [initialFilters] = useState(loadPersonalFilters);
  const [search, setSearch] = useState(initialFilters.search);
  const [statusFilter, setStatusFilter] = useState<WorkerPerformanceStatus | "Todas">(initialFilters.statusFilter);
  const [sortBy, setSortBy] = useState<"performance-desc" | "performance-asc" | "absences" | "name">(initialFilters.sortBy);

  useEffect(() => {
    sessionStorage.setItem("agronex-hr-personal-filters", JSON.stringify({ search, statusFilter, sortBy }));
  }, [search, statusFilter, sortBy]);

  const summaries = useMemo(() => {
    let list = computeAllWorkerSummaries(workers, records, hrData.settings);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.workerName.toLowerCase().includes(q) || s.labor.toLowerCase().includes(q) || s.crewName.toLowerCase().includes(q));
    }
    if (statusFilter !== "Todas") list = list.filter((s) => s.status === statusFilter);
    if (sortBy === "performance-asc") list.sort((a, b) => a.averagePerformance - b.averagePerformance);
    if (sortBy === "performance-desc") list.sort((a, b) => b.averagePerformance - a.averagePerformance);
    if (sortBy === "absences") list.sort((a, b) => a.attendance - b.attendance);
    if (sortBy === "name") list.sort((a, b) => a.workerName.localeCompare(b.workerName));
    return list;
  }, [workers, records, hrData.settings, search, statusFilter, sortBy]);

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Listado de personal" description="Rendimiento, asistencia y estado de cada trabajador." />
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a978f]" />
          <input className="ag-field pl-9" placeholder="Buscar trabajador, labor, cuadrilla..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ag-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="Todas">Todos los estados</option>
          <option value="Destacado">Destacado</option>
          <option value="Adecuado">Adecuado</option>
          <option value="En seguimiento">En seguimiento</option>
          <option value="Requiere evaluación">Requiere evaluación</option>
          <option value="No evaluable">No evaluable</option>
          <option value="Descanso temporal">Descanso temporal</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <select className="ag-field w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
          <option value="performance-desc">Mayor rendimiento</option>
          <option value="performance-asc">Menor rendimiento</option>
          <option value="absences">Más ausencias</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-[#dfe7e1]">
              <th className="p-3 text-left font-bold text-[#60736a]">Trabajador</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Cultivo</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Sector</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Labor</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Días eval.</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Rendimiento</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Asistencia</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Estado</th>
              <th className="p-3 text-left font-bold text-[#60736a]">Tendencia</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.workerId} className="border-b border-[#edf1ee] last:border-0 hover:bg-[#f8faf8] cursor-pointer" onClick={() => onOpenWorker(s.workerId)}>
                <td className="p-3 font-bold text-[#294a3b]">{s.workerName}</td>
                <td className="p-3 text-[#4b6358]">{s.crop || "—"}</td>
                <td className="p-3 text-[#4b6358]">{s.sector || "—"}</td>
                <td className="p-3 text-[#4b6358]">{s.labor}</td>
                <td className="p-3 text-[#4b6358]">{s.evaluableDays}</td>
                <td className="p-3 text-[#4b6358]">{s.averagePerformance}%</td>
                <td className="p-3 text-[#4b6358]">{s.attendance}%</td>
                <td className="p-3"><WorkerStatusBadge status={s.status} /></td>
                <td className="p-3"><TrendIcon trend={s.trend} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {summaries.length === 0 && <p className="p-6 text-center text-sm text-[#718078]">No se encontraron trabajadores.</p>}
      </div>

      <div className="space-y-3 md:hidden">
        {summaries.slice(0, 50).map((s) => (
          <button key={s.workerId} onClick={() => onOpenWorker(s.workerId)} className="ag-card w-full p-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-[#294a3b]">{s.workerName}</p>
                <p className="mt-0.5 text-xs text-[#718078]">{s.labor} · {s.sector || "—"}</p>
              </div>
              <WorkerStatusBadge status={s.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <InfoStat label="Rendimiento" value={`${s.averagePerformance}%`} />
              <InfoStat label="Asistencia" value={`${s.attendance}%`} />
              <InfoStat label="Días" value={String(s.evaluableDays)} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HRSeguimiento({
  workers, records, onOpenWorker,
}: {
  workers: Worker[]; records: LocalProgressRecord[];
  onOpenWorker: (workerId: string) => void;
}) {
  const hrData = loadHRLocalData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("Todas");

  const followUps = useMemo(() => {
    const list = [...hrData.followUps].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter !== "Todas") return list.filter((f) => f.status === filter);
    return list;
  }, [hrData.followUps, filter]);

  const summaries = useMemo(() => {
    const all = computeAllWorkerSummaries(workers, records, hrData.settings);
    return all.filter((s) => s.status === "En seguimiento" || s.status === "Requiere evaluación");
  }, [workers, records, hrData.settings]);

  const createFollowUp = (data: Partial<HRFollowUp>) => {
    const existing = hrData.followUps.find((f) => f.workerId === data.workerId && f.status !== "Cerrado");
    if (existing) return;
    const followUp: HRFollowUp = {
      id: createLocalHRId("fu"),
      workerId: data.workerId ?? "",
      workerName: data.workerName ?? "",
      crewId: data.crewId ?? "",
      crewName: data.crewName ?? "",
      labor: data.labor ?? "",
      sector: data.sector ?? "",
      period: data.period ?? new Date().toISOString().slice(0, 7),
      averagePerformance: data.averagePerformance ?? 0,
      daysBelowGoal: data.daysBelowGoal ?? 0,
      trend: data.trend ?? "stable",
      reason: data.reason ?? "",
      supervisorObservation: data.supervisorObservation ?? "",
      hrResponsible: data.hrResponsible ?? "RR. HH.",
      reviewDate: data.reviewDate ?? new Date().toISOString().slice(0, 10),
      status: "Pendiente",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    hrData.followUps.push(followUp);
    saveHRLocalData();
  };

  const updateFollowUpStatus = (id: string, status: HRFollowUp["status"]) => {
    const item = hrData.followUps.find((f) => f.id === id);
    if (!item) return;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    saveHRLocalData();
    setEditingId(null);
  };

  const createFollowUpsFromSummaries = () => {
    summaries.forEach((s) => {
      createFollowUp({
        workerId: s.workerId, workerName: s.workerName,
        crewId: s.crewId, crewName: s.crewName,
        labor: s.labor, sector: s.sector,
        period: new Date().toISOString().slice(0, 7),
        averagePerformance: s.averagePerformance,
        daysBelowGoal: s.daysBelowThreshold,
        trend: s.trend,
        reason: s.status === "Requiere evaluación" ? "Requiere evaluación según rendimiento" : "Rendimiento bajo la meta",
      });
    });
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Seguimiento" description="Trabajadores con rendimiento por debajo de la meta." action={
        <div className="flex gap-2">
          {summaries.filter((s) => !hrData.followUps.some((f) => f.workerId === s.workerId && f.status !== "Cerrado")).length > 0 && (
            <button onClick={createFollowUpsFromSummaries} className="ag-primary px-4"><Plus size={17} />Crear seguimientos</button>
          )}
        </div>
      } />

      <div className="flex flex-wrap gap-2">
        <select className="ag-field w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Todas">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En proceso">En proceso</option>
          <option value="Recuperado">Recuperado</option>
          <option value="Requiere evaluación">Requiere evaluación</option>
          <option value="Cerrado">Cerrado</option>
        </select>
      </div>

      {summaries.filter((s) => !hrData.followUps.some((f) => f.workerId === s.workerId && f.status !== "Cerrado")).length > 0 && (
        <section className="ag-card p-4">
          <p className="text-sm font-bold text-[#8b650b]">{summaries.filter((s) => !hrData.followUps.some((f) => f.workerId === s.workerId && f.status !== "Cerrado")).length} trabajador(es) requieren seguimiento</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {summaries.filter((s) => !hrData.followUps.some((f) => f.workerId === s.workerId && f.status !== "Cerrado")).slice(0, 5).map((s) => (
              <span key={s.workerId} className="rounded-full bg-[#fff5dd] px-3 py-1 text-xs font-bold text-[#9a6506]">{s.workerName}</span>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {followUps.length === 0 ? (
          <p className="ag-card p-6 text-center text-sm text-[#718078]">No hay seguimientos registrados.</p>
        ) : followUps.map((f) => (
          <article key={f.id} className="ag-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <button onClick={() => onOpenWorker(f.workerId)} className="font-bold text-[#173c2d] hover:underline">{f.workerName}</button>
                  <FollowUpStatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-xs text-[#718078]">{f.labor} · {f.sector} · {f.crewName}</p>
              </div>
              {editingId === f.id ? (
                <div className="flex gap-1">
                  <button onClick={() => updateFollowUpStatus(f.id, "Cerrado")} className="ag-text-button text-xs">Cerrar</button>
                  <button onClick={() => setEditingId(null)} className="ag-text-button text-xs">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setEditingId(editingId === f.id ? null : f.id)} className="grid size-8 place-items-center rounded-xl hover:bg-[#f5f7f5]"><MoreHorizontal size={16} /></button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <InfoStat label="Periodo" value={f.period} />
              <InfoStat label="Rendimiento" value={`${f.averagePerformance}%`} />
              <InfoStat label="Días bajo meta" value={String(f.daysBelowGoal)} />
            </div>
            {f.reason && <p className="mt-3 text-xs text-[#60736a]">{f.reason}</p>}
            {editingId === f.id && (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf1ee] pt-4">
                <button onClick={() => updateFollowUpStatus(f.id, "En proceso")} className="ag-secondary text-xs">En proceso</button>
                <button onClick={() => updateFollowUpStatus(f.id, "Recuperado")} className="ag-secondary text-xs">Recuperado</button>
                <button onClick={() => updateFollowUpStatus(f.id, "Requiere evaluación")} className="ag-secondary text-xs">Requiere evaluación</button>
                <button onClick={() => updateFollowUpStatus(f.id, "Cerrado")} className="ag-secondary text-xs">Cerrar</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function HREvaluaciones({
  workers, records, onOpenWorker,
}: {
  workers: Worker[]; records: LocalProgressRecord[];
  onOpenWorker: (workerId: string) => void;
}) {
  const hrData = loadHRLocalData();
  const [showForm, setShowForm] = useState(false);
  const [formWorker, setFormWorker] = useState("");
  const [formDecision, setFormDecision] = useState<HRDecision>("Continuar sin cambios");
  const [formObservation, setFormObservation] = useState("");
  const [formFactors, setFormFactors] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [confirmCloseDate, setConfirmCloseDate] = useState(new Date().toISOString().slice(0, 10));

  const evaluations = useMemo(() => [...hrData.evaluations].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [hrData.evaluations]);
  const workerList = useMemo(() => workers.filter((w) => w.status === "Activo"), [workers]);
  const summaries = useMemo(() => computeAllWorkerSummaries(workers, records, hrData.settings), [workers, records, hrData.settings]);

  const submitEvaluation = () => {
    const worker = workerList.find((w) => w.id === formWorker);
    if (!worker) return;
    const perf = summaries.find((s) => s.workerId === formWorker);
    const evalRecord: HREvaluation = {
      id: createLocalHRId("eval"),
      workerId: formWorker,
      workerName: worker.name,
      responsibleId: "rrhh-system",
      responsibleName: "RR. HH.",
      period: new Date().toISOString().slice(0, 7),
      performance: perf?.averagePerformance ?? 0,
      attendance: perf?.attendance ?? 0,
      supervisorObservation: "",
      hrObservation: formObservation,
      externalFactors: formFactors,
      decision: formDecision,
      decisionDetail: formDetail,
      reviewDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    hrData.evaluations.push(evalRecord);

    if (formDecision === "Cierre laboral") {
      hrData.adminHistory.push({
        id: createLocalHRId("hist"),
        workerId: formWorker,
        workerName: worker.name,
        actionType: "Cierre laboral",
        previousValue: "Activo",
        newValue: "Inactivo",
        reason: formDetail || "Decisión administrativa",
        responsibleId: "rrhh-system",
        responsibleName: "RR. HH.",
        effectiveDate: confirmCloseDate,
        createdAt: new Date().toISOString(),
      });
    }
    saveHRLocalData();
    setShowForm(false);
    setFormWorker("");
    setFormObservation("");
    setFormFactors("");
    setFormDetail("");
    setConfirmCloseDate(new Date().toISOString().slice(0, 10));
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Evaluaciones" description="Registro de evaluaciones de desempeño y decisiones administrativas." action={
        <button onClick={() => setShowForm((v) => !v)} className="ag-primary px-4"><Plus size={17} />Nueva evaluación</button>
      } />

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); submitEvaluation(); }} className="ag-card space-y-4 p-5">
          <h3 className="font-bold text-[#173c2d]">Nueva evaluación</h3>
          <select className="ag-field" value={formWorker} onChange={(e) => setFormWorker(e.target.value)} required>
            <option value="">Seleccionar trabajador</option>
            {workerList.map((w) => (
              <option key={w.id} value={w.id}>{w.name} · {w.labor} · {w.crewName}</option>
            ))}
          </select>
          <select className="ag-field" value={formDecision} onChange={(e) => setFormDecision(e.target.value as HRDecision)}>
            <option value="Continuar sin cambios">Continuar sin cambios</option>
            <option value="Capacitación">Capacitación</option>
            <option value="Acompañamiento">Acompañamiento</option>
            <option value="Cambio de labor">Cambio de labor</option>
            <option value="Cambio de sector">Cambio de sector</option>
            <option value="Cambio de cuadrilla">Cambio de cuadrilla</option>
            <option value="Seguimiento adicional">Seguimiento adicional</option>
            <option value="Descanso temporal">Descanso temporal</option>
            <option value="Cierre laboral">Cierre laboral</option>
          </select>
          {formDecision === "Cierre laboral" && (
            <div className="rounded-2xl border border-[#bd513c] bg-[#fff0ed] p-4 space-y-3">
              <p className="text-sm font-bold text-[#bd513c]">Confirmación de cierre laboral</p>
              <label className="ag-label">Motivo<textarea className="ag-field" value={formDetail} onChange={(e) => setFormDetail(e.target.value)} required /></label>
              <label className="ag-label">Fecha efectiva<input type="date" className="ag-field" value={confirmCloseDate} onChange={(e) => setConfirmCloseDate(e.target.value)} required /></label>
            </div>
          )}
          <label className="ag-label">Observación de RR. HH.<textarea className="ag-field" value={formObservation} onChange={(e) => setFormObservation(e.target.value)} rows={3} /></label>
          <label className="ag-label">Factores externos<textarea className="ag-field" value={formFactors} onChange={(e) => setFormFactors(e.target.value)} rows={2} placeholder="Clima, disponibilidad, herramientas..." /></label>
          <div className="flex gap-2">
            <button type="submit" className="ag-primary">Guardar evaluación</button>
            <button type="button" onClick={() => setShowForm(false)} className="ag-secondary">Cancelar</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {evaluations.length === 0 ? (
          <p className="ag-card p-6 text-center text-sm text-[#718078]">No hay evaluaciones registradas.</p>
        ) : evaluations.map((e) => (
          <article key={e.id} className="ag-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <button onClick={() => onOpenWorker(e.workerId)} className="font-bold text-[#173c2d] hover:underline">{e.workerName}</button>
                <p className="mt-1 text-xs text-[#718078]">{e.period} · {e.decision}</p>
              </div>
              <EvalDecisionBadge decision={e.decision} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
              <InfoStat label="Rendimiento" value={`${e.performance}%`} />
              <InfoStat label="Asistencia" value={`${e.attendance}%`} />
              <InfoStat label="Revisión" value={e.reviewDate} />
            </div>
            {e.hrObservation && <p className="mt-3 text-xs text-[#60736a]">{e.hrObservation}</p>}
            {e.externalFactors && <p className="mt-1 text-xs text-[#8a978f]">Factores: {e.externalFactors}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

export function HRNecesidad({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const hrData = loadHRLocalData();
  const [crop, setCrop] = useState("Palto");
  const [sector, setSector] = useState("B2");
  const [labor, setLabor] = useState("Poda");
  const [totalGoal, setTotalGoal] = useState("1000");
  const [unit, setUnit] = useState("plantas");
  const [expectedPerformance, setExpectedPerformance] = useState("60");
  const [availableWorkers, setAvailableWorkers] = useState("10");
  const [expectedAbsences, setExpectedAbsences] = useState("1");
  const [temporaryRest, setTemporaryRest] = useState("0");
  const [availableDays, setAvailableDays] = useState("5");
  const [result, setResult] = useState<{ neededWorkers: number; estimatedVacancies: number; explanation: string } | null>(null);

  const calculate = () => {
    const r = calculateStaffingNeeded(
      Number(totalGoal) || 0, unit,
      Number(expectedPerformance) || 0,
      Number(availableWorkers) || 0,
      Number(expectedAbsences) || 0,
      Number(temporaryRest) || 0,
      Number(availableDays) || 1,
      hrData.settings.fullWorkDayHours,
    );
    setResult(r);
  };

  const createRequirement = () => {
    if (!result) return;
    const req: StaffingRequirement = {
      id: createLocalHRId("sr"),
      crop, sector, labor,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + (Number(availableDays) || 5) * 86400000).toISOString().slice(0, 10),
      totalGoal: Number(totalGoal) || 0, unit,
      expectedPerformance: Number(expectedPerformance) || 0,
      availableWorkers: Number(availableWorkers) || 0,
      expectedAbsences: Number(expectedAbsences) || 0,
      temporaryRest: Number(temporaryRest) || 0,
      availableDays: Number(availableDays) || 1,
      neededWorkers: result.neededWorkers,
      estimatedVacancies: result.estimatedVacancies,
      explanation: result.explanation,
      createdAt: new Date().toISOString(),
    };
    hrData.staffingRequirements.push(req);
    saveHRLocalData();
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Necesidad de personal" description="Calcula la cantidad de trabajadores requeridos para una labor específica." />
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="ag-card space-y-4 p-5">
          <h3 className="font-bold text-[#173c2d]">Parámetros</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="ag-label">Cultivo<input className="ag-field" value={crop} onChange={(e) => setCrop(e.target.value)} /></label>
            <label className="ag-label">Sector<input className="ag-field" value={sector} onChange={(e) => setSector(e.target.value)} /></label>
            <label className="ag-label">Labor<input className="ag-field" value={labor} onChange={(e) => setLabor(e.target.value)} /></label>
            <label className="ag-label">Unidad<input className="ag-field" value={unit} onChange={(e) => setUnit(e.target.value)} /></label>
            <label className="ag-label">Meta total<input type="number" className="ag-field" value={totalGoal} onChange={(e) => setTotalGoal(e.target.value)} /></label>
            <label className="ag-label">Rendimiento esperado/día<input type="number" className="ag-field" value={expectedPerformance} onChange={(e) => setExpectedPerformance(e.target.value)} /></label>
            <label className="ag-label">Trabajadores disponibles<input type="number" className="ag-field" value={availableWorkers} onChange={(e) => setAvailableWorkers(e.target.value)} /></label>
            <label className="ag-label">Ausencias previstas<input type="number" className="ag-field" value={expectedAbsences} onChange={(e) => setExpectedAbsences(e.target.value)} /></label>
            <label className="ag-label">Descansos temporales<input type="number" className="ag-field" value={temporaryRest} onChange={(e) => setTemporaryRest(e.target.value)} /></label>
            <label className="ag-label">Jornadas disponibles<input type="number" className="ag-field" value={availableDays} onChange={(e) => setAvailableDays(e.target.value)} /></label>
          </div>
          <button onClick={calculate} className="ag-primary w-full"><BarChart3 size={17} />Calcular necesidad</button>
        </section>

        <section className="ag-card p-5">
          <h3 className="font-bold text-[#173c2d]">Resultado</h3>
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#e9f6ef] p-4 text-center">
                  <p className="text-xs font-bold text-[#18794e] uppercase">Necesarios</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#173c2d]">{result.neededWorkers}</p>
                </div>
                <div className={`rounded-2xl p-4 text-center ${result.estimatedVacancies > 0 ? "bg-[#fff0ed]" : "bg-[#e9f6ef]"}`}>
                  <p className={`text-xs font-bold uppercase ${result.estimatedVacancies > 0 ? "text-[#bd513c]" : "text-[#18794e]"}`}>{result.estimatedVacancies > 0 ? "Déficit" : "Excedente"}</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#173c2d]">{result.estimatedVacancies > 0 ? result.estimatedVacancies : Math.max(0, Number(availableWorkers) - result.neededWorkers)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-[#f6f8f6] p-4">
                <p className="text-sm leading-6 text-[#60736a]">{result.explanation}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={createRequirement} className="ag-primary"><Save size={16} />Guardar requerimiento</button>
                <button onClick={() => onNavigate("hr-convocatorias")} className="ag-secondary"><Briefcase size={16} />Crear convocatoria</button>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-[#f6f8f6] p-4 text-sm text-[#718078]">Completa los parámetros y haz clic en &ldquo;Calcular necesidad&rdquo; para ver el resultado.</p>
          )}
        </section>
      </div>

      {hrData.staffingRequirements.length > 0 && (
        <section className="ag-card p-5">
          <SectionTitle title="Requerimientos guardados" />
          <div className="space-y-3">
            {hrData.staffingRequirements.slice(-5).reverse().map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#f6f8f6] p-3 text-xs">
                <div><span className="font-bold text-[#173c2d]">{r.labor}</span><span className="ml-2 text-[#718078]">{r.sector} · {r.crop}</span></div>
                <div className="text-right"><span className="font-bold text-[#173c2d]">{r.neededWorkers} trab.</span><span className="ml-2 text-[#718078]">{r.estimatedVacancies} vacantes</span></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Save({ size }: { size: number }) {
  return <Check size={size} />;
}

export function HRConvocatorias({ onNavigate }: { onNavigate: (screen: AppScreen) => void }) {
  const hrData = loadHRLocalData();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [requirements, setRequirements] = useState("");
  const [openingStatus, setOpeningStatus] = useState<JobOpening["status"]>("Borrador");

  const createOpening = () => {
    if (!title.trim()) return;
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 86400000);
    const opening: JobOpening = {
      id: createLocalHRId("job"),
      title: title.trim(),
      crop: "Palto", sector: "", labor: "",
      vacancies: Number(vacancies) || 1,
      startDate: now.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      schedule: "Lun-Sáb, 6:00am-2:00pm",
      requirements: requirements.trim(),
      experience: "No requerida",
      referencePayment: "",
      responsibleId: "rrhh-system",
      responsibleName: "RR. HH.",
      status: openingStatus,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    hrData.jobOpenings.push(opening);
    saveHRLocalData();
    setShowForm(false);
    setTitle("");
    setVacancies("1");
    setRequirements("");
    setOpeningStatus("Borrador");
  };

  const updateStatus = (id: string, status: JobOpening["status"]) => {
    const item = hrData.jobOpenings.find((j) => j.id === id);
    if (!item) return;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    saveHRLocalData();
  };

  const applicantsForOpening = (id: string) => hrData.applicants.filter((a) => a.jobOpeningId === id);

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Convocatorias" description="Gestión de procesos de selección de personal." action={
        <button onClick={() => setShowForm((v) => !v)} className="ag-primary px-4"><Plus size={17} />Nueva convocatoria</button>
      } />

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createOpening(); }} className="ag-card space-y-4 p-5">
          <h3 className="font-bold text-[#173c2d]">Nueva convocatoria</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="ag-label sm:col-span-2">Título<input className="ag-field" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Personal para poda de palto" /></label>
            <label className="ag-label">Vacantes<input type="number" min="1" className="ag-field" value={vacancies} onChange={(e) => setVacancies(e.target.value)} /></label>
            <select className="ag-field" value={openingStatus} onChange={(e) => setOpeningStatus(e.target.value as JobOpening["status"])}>
              <option value="Borrador">Borrador</option>
              <option value="Publicada">Publicada</option>
            </select>
            <label className="ag-label sm:col-span-2">Requisitos<textarea className="ag-field" value={requirements} onChange={(e) => setRequirements(e.target.value)} rows={3} /></label>
          </div>
          <button type="submit" className="ag-primary">Guardar convocatoria</button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hrData.jobOpenings.length === 0 ? (
          <p className="ag-card col-span-full p-6 text-center text-sm text-[#718078]">No hay convocatorias registradas.</p>
        ) : hrData.jobOpenings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((j) => {
          const applicants = applicantsForOpening(j.id);
          const selected = applicants.filter((a) => a.status === "Seleccionado" || a.status === "Contratado").length;
          const preseleccionados = applicants.filter((a) => a.status === "Preseleccionado").length;
          return (
            <article key={j.id} className="ag-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-[#173c2d]">{j.title}</h3>
                <JobStatusBadge status={j.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <InfoStat label="Vacantes" value={String(j.vacancies)} />
                <InfoStat label="Postulantes" value={String(applicants.length)} />
                <InfoStat label="Preseleccionados" value={String(preseleccionados)} />
                <InfoStat label="Seleccionados" value={String(selected)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(j.status === "Borrador" || j.status === "Publicada") && (
                  <button onClick={() => updateStatus(j.id, j.status === "Borrador" ? "Publicada" : "En selección")} className="ag-secondary text-xs">
                    {j.status === "Borrador" ? "Publicar" : "Iniciar selección"}
                  </button>
                )}
                {j.status === "En selección" && (
                  <button onClick={() => updateStatus(j.id, "Cubierta")} className="ag-secondary text-xs">Cubierta</button>
                )}
                {(j.status === "Cubierta" || j.status === "Publicada") && (
                  <button onClick={() => updateStatus(j.id, "Cerrada")} className="ag-secondary text-xs">Cerrar</button>
                )}
                {j.status !== "Cancelada" && j.status !== "Cerrada" && (
                  <button onClick={() => updateStatus(j.id, "Cancelada")} className="ag-secondary text-xs">Cancelar</button>
                )}
                <button onClick={() => onNavigate("hr-postulantes")} className="ag-text-button text-xs">Ver postulantes</button>
              </div>
              {j.requirements && <p className="mt-3 text-xs text-[#60736a]">{j.requirements}</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function HRPostulantes() {
  const hrData = loadHRLocalData();
  const [showForm, setShowForm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");
  const [filter, setFilter] = useState<string>("Todas");
  const [editingId, setEditingId] = useState<string | null>(null);

  const applicants = useMemo(() => {
    const list = [...hrData.applicants].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter !== "Todas") return list.filter((a) => a.status === filter);
    return list;
  }, [hrData.applicants, filter]);

  const createApplicant = () => {
    if (!firstName.trim() || !dni.trim()) return;
    const dup = hrData.applicants.find((a) => a.dni === dni.trim());
    if (dup) return;
    const applicant: Applicant = {
      id: createLocalHRId("app"),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dni: dni.trim(),
      phone: phone.trim(),
      district: district.trim(),
      agriculturalExperience: experience.trim(),
      crops: [],
      labors: [],
      availability: availability.trim(),
      reference: "",
      observations: "",
      jobOpeningId: hrData.jobOpenings.length > 0 ? hrData.jobOpenings[0].id : "",
      status: "Nuevo",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    hrData.applicants.push(applicant);
    saveHRLocalData();
    setShowForm(false);
    setFirstName(""); setLastName(""); setDni(""); setPhone(""); setDistrict(""); setExperience(""); setAvailability("");
  };

  const updateStatus = (id: string, status: Applicant["status"]) => {
    const item = hrData.applicants.find((a) => a.id === id);
    if (!item) return;
    item.status = status;
    item.updatedAt = new Date().toISOString();
    saveHRLocalData();
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Postulantes" description="Banco de postulantes para convocatorias laborales." action={
        <button onClick={() => setShowForm((v) => !v)} className="ag-primary px-4"><UserPlus size={17} />Nuevo postulante</button>
      } />

      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); createApplicant(); }} className="ag-card space-y-4 p-5">
          <h3 className="font-bold text-[#173c2d]">Registrar postulante</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="ag-label">Nombres<input className="ag-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></label>
            <label className="ag-label">Apellidos<input className="ag-field" value={lastName} onChange={(e) => setLastName(e.target.value)} /></label>
            <label className="ag-label">DNI<input className="ag-field" value={dni} onChange={(e) => setDni(e.target.value)} required maxLength={8} /></label>
            <label className="ag-label">Teléfono<input type="tel" className="ag-field" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
            <label className="ag-label">Distrito<input className="ag-field" value={district} onChange={(e) => setDistrict(e.target.value)} /></label>
            <label className="ag-label">Disponibilidad<input className="ag-field" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Inmediata, 1 semana..." /></label>
            <label className="ag-label sm:col-span-2">Experiencia agrícola<textarea className="ag-field" value={experience} onChange={(e) => setExperience(e.target.value)} rows={2} /></label>
          </div>
          <button type="submit" className="ag-primary">Guardar postulante</button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <select className="ag-field w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="Todas">Todos</option>
          <option value="Nuevo">Nuevo</option>
          <option value="Contactado">Contactado</option>
          <option value="Preseleccionado">Preseleccionado</option>
          <option value="Seleccionado">Seleccionado</option>
          <option value="Contratado">Contratado</option>
          <option value="No seleccionado">No seleccionado</option>
          <option value="Disponible">Disponible</option>
          <option value="Bloqueado">Bloqueado</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {applicants.length === 0 ? (
          <p className="ag-card col-span-full p-6 text-center text-sm text-[#718078]">No hay postulantes registrados.</p>
        ) : applicants.map((a) => (
          <article key={a.id} className="ag-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-[#173c2d]">{a.firstName} {a.lastName}</h3>
                <p className="mt-1 text-xs text-[#718078]">{maskDNI(a.dni)} {a.phone && `· ${a.phone}`}</p>
              </div>
              <ApplicantStatusBadge status={a.status} />
            </div>
            {a.district && <p className="mt-2 text-xs text-[#8a978f]">{a.district}</p>}
            {a.agriculturalExperience && <p className="mt-1 text-xs text-[#60736a]">{a.agriculturalExperience}</p>}
            {editingId === a.id ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf1ee] pt-4">
                <button onClick={() => updateStatus(a.id, "Contactado")} className="ag-secondary text-xs">Contactado</button>
                <button onClick={() => updateStatus(a.id, "Preseleccionado")} className="ag-secondary text-xs">Preseleccionado</button>
                <button onClick={() => updateStatus(a.id, "Seleccionado")} className="ag-secondary text-xs">Seleccionado</button>
                <button onClick={() => updateStatus(a.id, "No seleccionado")} className="ag-secondary text-xs">No seleccionado</button>
                <button onClick={() => updateStatus(a.id, "Bloqueado")} className="ag-secondary text-xs">Bloquear</button>
              </div>
            ) : (
              <button onClick={() => setEditingId(editingId === a.id ? null : a.id)} className="mt-4 ag-text-button text-xs">Cambiar estado</button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

export function HRWorker({ worker, records, onBack }: { worker: Worker; records: LocalProgressRecord[]; onBack: () => void }) {
  const hrData = loadHRLocalData();
  const [, setRevision] = useState(0);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [followReason, setFollowReason] = useState("");
  const [followObservation, setFollowObservation] = useState("");
  const [followReviewDate, setFollowReviewDate] = useState(new Date().toISOString().slice(0, 10));
  const [evaluationDecision, setEvaluationDecision] = useState<HRDecision>("Continuar sin cambios");
  const [evaluationObservation, setEvaluationObservation] = useState("");

  const workerRecords = useMemo(() => records
    .filter((record) => record.workers.some((item) => item.id === worker.id))
    .sort((a, b) => b.date.localeCompare(a.date)), [records, worker.id]);
  const summary = computeAllWorkerSummaries([worker], records, hrData.settings)[0];
  const followUps = hrData.followUps.filter((item) => item.workerId === worker.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const evaluations = hrData.evaluations.filter((item) => item.workerId === worker.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const history = hrData.adminHistory.filter((item) => item.workerId === worker.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6);
  const startOfFortnight = new Date(now); startOfFortnight.setDate(now.getDate() - 14);
  const startOfMonth = new Date(now); startOfMonth.setDate(now.getDate() - 29);
  const averageSince = (start: Date) => {
    const values = workerRecords.filter((record) => record.date >= start.toISOString().slice(0, 10)).map((record) => record.percentage);
    return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  };
  const attendance = workerRecords.reduce((acc, record) => {
    const entry = record.workers.find((item) => item.id === worker.id);
    if (entry?.attendance === "Presente") acc.presentes += 1;
    if (entry?.attendance === "Ausente") acc.faltas += 1;
    return acc;
  }, { presentes: 0, faltas: 0 });
  const chartRecords = [...workerRecords].slice(0, 10).reverse();
  const chartPoints = chartRecords.map((record, index) => {
    const x = chartRecords.length === 1 ? 50 : (index / (chartRecords.length - 1)) * 100;
    const y = 100 - Math.min(120, Math.max(0, record.percentage)) / 1.2;
    return `${x},${y}`;
  }).join(" ");
  const latest = workerRecords[0];
  const lastEvaluation = evaluations[0];

  const createFollowUp = () => {
    const nowIso = new Date().toISOString();
    hrData.followUps.push({
      id: createLocalHRId("fu"), workerId: worker.id, workerName: worker.name,
      crewId: worker.crewId, crewName: worker.crewName, labor: worker.labor ?? "", sector: worker.sector ?? "",
      period: nowIso.slice(0, 7), averagePerformance: summary?.averagePerformance ?? 0,
      daysBelowGoal: summary?.daysBelowThreshold ?? 0, trend: summary?.trend ?? "stable",
      reason: followReason.trim() || summary?.statusReason || "Seguimiento de rendimiento",
      supervisorObservation: followObservation.trim(), hrResponsible: "RR. HH.", reviewDate: followReviewDate,
      status: "Pendiente", createdAt: nowIso, updatedAt: nowIso,
    });
    saveHRLocalData();
    setShowFollowUp(false); setFollowReason(""); setFollowObservation(""); setRevision((value) => value + 1);
  };

  const createEvaluation = () => {
    const nowIso = new Date().toISOString();
    hrData.evaluations.push({
      id: createLocalHRId("eval"), workerId: worker.id, workerName: worker.name,
      responsibleId: "rrhh-system", responsibleName: "RR. HH.", period: nowIso.slice(0, 7),
      performance: summary?.averagePerformance ?? 0, attendance: summary?.attendance ?? 0,
      supervisorObservation: "", hrObservation: evaluationObservation.trim(), externalFactors: "",
      decision: evaluationDecision, decisionDetail: "", reviewDate: nowIso.slice(0, 10), createdAt: nowIso, updatedAt: nowIso,
    });
    if (["Capacitación", "Descanso temporal", "Cierre laboral"].includes(evaluationDecision)) {
      hrData.adminHistory.push({
        id: createLocalHRId("hist"), workerId: worker.id, workerName: worker.name,
        actionType: evaluationDecision as "Capacitación" | "Descanso temporal" | "Cierre laboral",
        previousValue: worker.status, newValue: evaluationDecision, reason: evaluationObservation.trim() || "Decisión de evaluación",
        responsibleId: "rrhh-system", responsibleName: "RR. HH.", effectiveDate: nowIso.slice(0, 10), createdAt: nowIso,
      });
    }
    saveHRLocalData();
    setShowEvaluation(false); setEvaluationObservation(""); setRevision((value) => value + 1);
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="ag-secondary"><ArrowLeft size={17} />Volver al personal</button>
      <section className="ag-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#247a56]">Ficha del trabajador</p>
            <h1 className="mt-2 text-2xl font-black text-[#173c2d]">{worker.name}</h1>
            <p className="mt-1 text-sm text-[#60736a]">Código {worker.id} · DNI no registrado</p>
          </div>
          {summary && <div className="flex items-center gap-3"><WorkerStatusBadge status={summary.status} /><TrendIcon trend={summary.trend} /></div>}
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
          <InfoStat label="Cuadrilla" value={worker.crewName || "—"} />
          <InfoStat label="Líder / supervisor" value={worker.assignedName || latest?.leaderName || "—"} />
          <InfoStat label="Cultivo" value={worker.crop || latest?.crop || "—"} />
          <InfoStat label="Sector" value={worker.sector || latest?.sector || "—"} />
          <InfoStat label="Labor actual" value={worker.labor || latest?.labor || "—"} />
        </dl>
      </section>

      <section>
        <SectionTitle title="Resumen" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Promedio semanal" value={`${averageSince(startOfWeek)}%`} icon={TrendingUp} />
          <MetricCard label="Promedio quincena" value={`${averageSince(startOfFortnight)}%`} icon={BarChart3} tone="blue" />
          <MetricCard label="Promedio mensual" value={`${averageSince(startOfMonth)}%`} icon={BarChart3} tone="green" />
          <MetricCard label="Asistencia" value={`${summary?.attendance ?? 0}%`} icon={UserCheck} tone="blue" />
          <MetricCard label="Días evaluables" value={String(summary?.evaluableDays ?? 0)} icon={Check} />
          <MetricCard label="Días bajo meta" value={String(summary?.daysBelowThreshold ?? 0)} icon={AlertTriangle} tone="gold" />
          <MetricCard label="Seguimientos activos" value={String(followUps.filter((item) => item.status !== "Cerrado").length)} icon={Eye} tone="gold" />
          <MetricCard label="Última evaluación" value={lastEvaluation?.reviewDate ?? "Sin registro"} icon={FileText} />
        </div>
      </section>

      <section className="ag-card p-5 sm:p-6">
        <SectionTitle title="Explicación del estado" />
        <p className="text-sm leading-6 text-[#4b6358]">{summary?.statusReason ?? "No existen registros suficientes para clasificar al trabajador."}</p>
      </section>

      <section className="ag-card p-5 sm:p-6">
        <SectionTitle title="Evolución del cumplimiento" />
        {chartRecords.length ? (
          <div className="overflow-hidden rounded-xl bg-[#f7faf8] p-3">
            <svg viewBox="0 0 100 105" role="img" aria-label="Porcentaje de cumplimiento de los últimos registros" className="h-48 w-full" preserveAspectRatio="none">
              <line x1="0" y1="16.7" x2="100" y2="16.7" stroke="#d79a29" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
              <polyline points={chartPoints} fill="none" stroke="#247a56" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              {chartRecords.map((record, index) => {
                const [x, y] = chartPoints.split(" ")[index].split(",");
                return <circle key={record.id} cx={x} cy={y} r="2" fill="#164c37"><title>{record.date}: {record.percentage}%</title></circle>;
              })}
            </svg>
            <div className="flex justify-between text-[10px] text-[#718078]"><span>{chartRecords[0]?.date}</span><span>Meta 100%</span><span>{chartRecords.at(-1)?.date}</span></div>
          </div>
        ) : <p className="text-sm text-[#718078]">Sin registros de rendimiento.</p>}
      </section>

      <section className="ag-card p-5 sm:p-6">
        <SectionTitle title="Rendimiento histórico" />
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[1000px] text-xs"><thead><tr className="border-b border-[#dfe7e1]">{["Fecha", "Labor", "Sector", "Meta", "Avance", "%", "Horas", "Horas-hombre", "Estado", "Observación"].map((label) => <th key={label} className="p-3 text-left text-[#60736a]">{label}</th>)}</tr></thead>
            <tbody>{workerRecords.map((record) => { const entry = record.workers.find((item) => item.id === worker.id); return <tr key={record.id} className="border-b border-[#edf1ee]"><td className="p-3">{record.date}</td><td className="p-3">{record.labor}</td><td className="p-3">{record.sector}</td><td className="p-3">{record.goal} {record.unit}</td><td className="p-3">{record.progress} {record.unit}</td><td className="p-3 font-bold">{record.percentage}%</td><td className="p-3">{entry?.hoursWorked ?? 0}</td><td className="p-3">{record.hours}</td><td className="p-3">{record.saveMode === "complete" ? "Completo" : "Parcial"}</td><td className="p-3">{entry?.observation || record.observation || "—"}</td></tr>; })}</tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">{workerRecords.map((record) => { const entry = record.workers.find((item) => item.id === worker.id); return <article key={record.id} className="rounded-xl border border-[#e4ebe6] p-4"><div className="flex justify-between gap-3"><strong className="text-sm text-[#173c2d]">{record.date} · {record.labor}</strong><span className="font-bold text-[#247a56]">{record.percentage}%</span></div><p className="mt-1 text-xs text-[#718078]">{record.sector} · {record.progress}/{record.goal} {record.unit}</p><p className="mt-2 text-xs text-[#60736a]">{entry?.hoursWorked ?? 0} h · {record.hours} horas-hombre · {record.saveMode === "complete" ? "Completo" : "Parcial"}</p>{(entry?.observation || record.observation) && <p className="mt-2 text-xs text-[#60736a]">{entry?.observation || record.observation}</p>}</article>; })}</div>
      </section>

      <section className="ag-card p-5 sm:p-6"><SectionTitle title="Asistencia del periodo" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"><InfoStat label="Presentes" value={String(attendance.presentes)} /><InfoStat label="Faltas" value={String(attendance.faltas)} /><InfoStat label="Permisos" value="0" /><InfoStat label="Descansos médicos" value="0" /><InfoStat label="Justificadas" value="0" /><InfoStat label="Tardanzas" value="0" /></div><p className="mt-3 text-xs text-[#718078]">Los permisos y las ausencias justificadas no se contabilizan como faltas. Los datos actuales solo registran presente o ausente.</p></section>

      <section className="ag-card p-5 sm:p-6"><SectionTitle title="Seguimientos" action={<button onClick={() => setShowFollowUp((value) => !value)} className="ag-primary"><Plus size={16} />Nuevo seguimiento</button>} />
        {showFollowUp && <form onSubmit={(event) => { event.preventDefault(); createFollowUp(); }} className="mb-4 grid gap-3 rounded-xl bg-[#f7faf8] p-4 sm:grid-cols-2"><label className="ag-label">Motivo<input value={followReason} onChange={(event) => setFollowReason(event.target.value)} className="ag-field" required /></label><label className="ag-label">Fecha de revisión<input type="date" value={followReviewDate} onChange={(event) => setFollowReviewDate(event.target.value)} className="ag-field" required /></label><label className="ag-label sm:col-span-2">Observación<textarea value={followObservation} onChange={(event) => setFollowObservation(event.target.value)} className="ag-field" /></label><button className="ag-primary" type="submit">Guardar seguimiento</button></form>}
        <div className="space-y-3">{followUps.length ? followUps.map((item) => <article key={item.id} className="rounded-xl border border-[#e4ebe6] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-[#173c2d]">{item.reason}</strong><FollowUpStatusBadge status={item.status} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4"><InfoStat label="Inicio" value={item.createdAt.slice(0, 10)} /><InfoStat label="Revisión" value={item.reviewDate} /><InfoStat label="Responsable" value={item.hrResponsible} /><InfoStat label="Acción tomada" value={item.status} /></div>{item.supervisorObservation && <p className="mt-3 text-xs text-[#60736a]">{item.supervisorObservation}</p>}</article>) : <p className="text-sm text-[#718078]">Sin seguimientos.</p>}</div>
      </section>

      <section className="ag-card p-5 sm:p-6"><SectionTitle title="Evaluaciones" action={<button onClick={() => setShowEvaluation((value) => !value)} className="ag-primary"><Plus size={16} />Nueva evaluación</button>} />
        {showEvaluation && <form onSubmit={(event) => { event.preventDefault(); createEvaluation(); }} className="mb-4 grid gap-3 rounded-xl bg-[#f7faf8] p-4"><select value={evaluationDecision} onChange={(event) => setEvaluationDecision(event.target.value as HRDecision)} className="ag-field"><option>Continuar sin cambios</option><option>Capacitación</option><option>Acompañamiento</option><option>Cambio de labor</option><option>Cambio de sector</option><option>Cambio de cuadrilla</option><option>Seguimiento adicional</option><option>Descanso temporal</option><option>Cierre laboral</option></select><label className="ag-label">Observaciones<textarea value={evaluationObservation} onChange={(event) => setEvaluationObservation(event.target.value)} className="ag-field" /></label>{evaluationDecision === "Cierre laboral" && <p className="rounded-xl bg-[#fff0ed] p-3 text-xs font-bold text-[#bd513c]">Confirma manualmente la decisión al guardar. Se registrará en el historial administrativo.</p>}<button className="ag-primary" type="submit">Confirmar y guardar</button></form>}
        <div className="space-y-3">{evaluations.length ? evaluations.map((item) => <article key={item.id} className="rounded-xl border border-[#e4ebe6] p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-[#173c2d]">{item.period}</strong><EvalDecisionBadge decision={item.decision} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4"><InfoStat label="Rendimiento" value={`${item.performance}%`} /><InfoStat label="Asistencia" value={`${item.attendance}%`} /><InfoStat label="Responsable" value={item.responsibleName} /><InfoStat label="Revisión" value={item.reviewDate} /></div>{item.hrObservation && <p className="mt-3 text-xs text-[#60736a]">{item.hrObservation}</p>}</article>) : <p className="text-sm text-[#718078]">Sin evaluaciones.</p>}</div>
      </section>

      <section className="ag-card p-5 sm:p-6"><SectionTitle title="Historial administrativo" /><div className="space-y-3">{history.length ? history.map((item) => <article key={item.id} className="rounded-xl border border-[#e4ebe6] p-4"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm text-[#173c2d]">{item.actionType}</strong><AdminActionBadge action={item.actionType} /></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4"><InfoStat label="Fecha" value={item.effectiveDate} /><InfoStat label="Responsable" value={item.responsibleName} /><InfoStat label="Anterior" value={item.previousValue} /><InfoStat label="Nuevo" value={item.newValue} /></div>{item.reason && <p className="mt-3 text-xs text-[#60736a]">{item.reason}</p>}</article>) : <p className="text-sm text-[#718078]">Sin acciones administrativas.</p>}</div></section>
    </div>
  );
}

export function HRHistorial() {
  const hrData = loadHRLocalData();
  const history = useMemo(() => [...hrData.adminHistory].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [hrData.adminHistory]);

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Historial administrativo" description="Cambios de labor, sector, cuadrilla, descansos y cierres laborales." />
      {history.length === 0 ? (
        <p className="ag-card p-6 text-center text-sm text-[#718078]">No hay registros administrativos.</p>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="ag-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[#173c2d]">{h.workerName}</p>
                  <p className="mt-1 text-xs text-[#718078]">{h.actionType} · {h.effectiveDate}</p>
                </div>
                <AdminActionBadge action={h.actionType} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <InfoStat label="Anterior" value={h.previousValue} />
                <InfoStat label="Nuevo" value={h.newValue} />
              </div>
              {h.reason && <p className="mt-2 text-xs text-[#60736a]">{h.reason}</p>}
              <p className="mt-1 text-[10px] text-[#8a978f]">Por: {h.responsibleName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HRConfig() {
  const hrData = loadHRLocalData();
  const [settings, setSettings] = useState({ ...hrData.settings });

  const save = () => {
    Object.assign(hrData.settings, settings);
    saveHRLocalData();
  };

  return (
    <div className="space-y-5">
      <ScreenHeading eyebrow="Recursos Humanos" title="Configuración" description="Parámetros de rendimiento y evaluación de personal." />
      <section className="ag-card space-y-4 p-5 sm:p-6">
        <SectionTitle title="Umbrales de rendimiento" />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="ag-label">Destacado (≥ %) <input type="number" className="ag-field" value={settings.destacadoThreshold} onChange={(e) => setSettings((s) => ({ ...s, destacadoThreshold: Number(e.target.value) }))} /></label>
          <label className="ag-label">Adecuado mínimo (%) <input type="number" className="ag-field" value={settings.adecuadoMin} onChange={(e) => setSettings((s) => ({ ...s, adecuadoMin: Number(e.target.value) }))} /></label>
          <label className="ag-label">Seguimiento umbral (%) <input type="number" className="ag-field" value={settings.seguimientoThreshold} onChange={(e) => setSettings((s) => ({ ...s, seguimientoThreshold: Number(e.target.value) }))} /></label>
          <label className="ag-label">Evaluación umbral (%) <input type="number" className="ag-field" value={settings.evaluacionThreshold} onChange={(e) => setSettings((s) => ({ ...s, evaluacionThreshold: Number(e.target.value) }))} /></label>
          <label className="ag-label">Días mínimos evaluables <input type="number" className="ag-field" value={settings.minEvaluableDays} onChange={(e) => setSettings((s) => ({ ...s, minEvaluableDays: Number(e.target.value) }))} /></label>
          <label className="ag-label">Días consecutivos bajo meta <input type="number" className="ag-field" value={settings.consecutiveDaysBelowThreshold} onChange={(e) => setSettings((s) => ({ ...s, consecutiveDaysBelowThreshold: Number(e.target.value) }))} /></label>
          <label className="ag-label">Horas jornada completa <input type="number" className="ag-field" value={settings.fullWorkDayHours} onChange={(e) => setSettings((s) => ({ ...s, fullWorkDayHours: Number(e.target.value) }))} /></label>
          <label className="ag-label">Tolerancia jornada parcial (h) <input type="number" className="ag-field" value={settings.partialDayTolerance} onChange={(e) => setSettings((s) => ({ ...s, partialDayTolerance: Number(e.target.value) }))} /></label>
        </div>
        <button onClick={save} className="ag-primary"><Check size={17} />Guardar configuración</button>
      </section>
    </div>
  );
}

function WorkerStatusBadge({ status }: { status: WorkerPerformanceStatus }) {
  const styles: Record<string, string> = {
    "Destacado": "bg-[#e8f6ee] text-[#18794e]",
    "Adecuado": "bg-[#edf5fc] text-[#3271a8]",
    "En seguimiento": "bg-[#fff5dd] text-[#9a6506]",
    "Requiere evaluación": "bg-[#fff0ed] text-[#bd513c]",
    "No evaluable": "bg-[#edf2f8] text-[#50708f]",
    "Descanso temporal": "bg-[#edf2f8] text-[#50708f]",
    "Inactivo": "bg-[#edf2f8] text-[#50708f]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles["No evaluable"]}`}>{status}</span>;
}

function FollowUpStatusBadge({ status }: { status: HRFollowUp["status"] }) {
  const styles: Record<string, string> = {
    "Pendiente": "bg-[#fff5dd] text-[#9a6506]",
    "En proceso": "bg-[#edf5fc] text-[#3271a8]",
    "Recuperado": "bg-[#e8f6ee] text-[#18794e]",
    "Requiere evaluación": "bg-[#fff0ed] text-[#bd513c]",
    "Cerrado": "bg-[#edf2f8] text-[#50708f]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

function EvalDecisionBadge({ decision }: { decision: string }) {
  const styles: Record<string, string> = {
    "Continuar sin cambios": "bg-[#e8f6ee] text-[#18794e]",
    "Capacitación": "bg-[#edf5fc] text-[#3271a8]",
    "Acompañamiento": "bg-[#edf5fc] text-[#3271a8]",
    "Cambio de labor": "bg-[#fff5dd] text-[#9a6506]",
    "Cambio de sector": "bg-[#fff5dd] text-[#9a6506]",
    "Cambio de cuadrilla": "bg-[#fff5dd] text-[#9a6506]",
    "Seguimiento adicional": "bg-[#fff5dd] text-[#9a6506]",
    "Descanso temporal": "bg-[#edf2f8] text-[#50708f]",
    "Cierre laboral": "bg-[#fff0ed] text-[#bd513c]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[decision] || styles["Continuar sin cambios"]}`}>{decision}</span>;
}

function JobStatusBadge({ status }: { status: JobOpening["status"] }) {
  const styles: Record<string, string> = {
    "Borrador": "bg-[#edf2f8] text-[#50708f]",
    "Publicada": "bg-[#e8f6ee] text-[#18794e]",
    "En selección": "bg-[#fff5dd] text-[#9a6506]",
    "Cubierta": "bg-[#e8f6ee] text-[#18794e]",
    "Cerrada": "bg-[#edf2f8] text-[#50708f]",
    "Cancelada": "bg-[#fff0ed] text-[#bd513c]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

function ApplicantStatusBadge({ status }: { status: Applicant["status"] }) {
  const styles: Record<string, string> = {
    "Nuevo": "bg-[#edf5fc] text-[#3271a8]",
    "Contactado": "bg-[#fff5dd] text-[#9a6506]",
    "Preseleccionado": "bg-[#fff5dd] text-[#9a6506]",
    "Seleccionado": "bg-[#e8f6ee] text-[#18794e]",
    "Contratado": "bg-[#e8f6ee] text-[#18794e]",
    "No seleccionado": "bg-[#edf2f8] text-[#50708f]",
    "Disponible": "bg-[#edf5fc] text-[#3271a8]",
    "Bloqueado": "bg-[#fff0ed] text-[#bd513c]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>;
}

function AdminActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    "Capacitación": "bg-[#edf5fc] text-[#3271a8]",
    "Cambio de labor": "bg-[#fff5dd] text-[#9a6506]",
    "Cambio de sector": "bg-[#fff5dd] text-[#9a6506]",
    "Cambio de cuadrilla": "bg-[#fff5dd] text-[#9a6506]",
    "Descanso temporal": "bg-[#edf2f8] text-[#50708f]",
    "Cierre laboral": "bg-[#fff0ed] text-[#bd513c]",
    "Reactivación": "bg-[#e8f6ee] text-[#18794e]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[action] || "bg-[#edf2f8] text-[#50708f]"}`}>{action}</span>;
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ChevronUp size={16} className="text-[#18794e]" />;
  if (trend === "down") return <ChevronDown size={16} className="text-[#bd513c]" />;
  return <span className="text-[#8a978f]">—</span>;
}
