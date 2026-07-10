import { DEFAULT_WORK_HOURS } from "@/data/agronexData";
import { roundProductivity } from "@/lib/agronex-productivity";
import type { LocalProgressRecord } from "@/lib/agronex-offline";

export type LeaderReportRow = {
  leaderName: string;
  labor: string;
  sector: string;
  goal: number;
  progress: number;
  remaining: number;
  percentage: number;
  manHours: number;
  status: string;
  unit: string;
};

export type LaborReportRow = {
  labor: string;
  goal: number;
  progress: number;
  percentage: number;
  unit: string;
};

export type WorkerReportRow = {
  workerName: string;
  leaderName: string;
  labor: string;
  output: number;
  hours: number;
  performance: number;
  attendanceDays: number;
  absences: number;
  unit: string;
  observation: string;
};

export type PendingSectorRow = {
  sector: string;
  labor: string;
  leaderName: string;
  goal: number;
  progress: number;
  remaining: number;
  priority: string;
  unit: string;
  recommendation: string;
};

export type ProductivityReport = {
  summary: {
    totalGoal: number;
    totalOutput: number;
    remaining: number;
    completion: number;
    totalManHours: number;
    presentCount: number;
    absentCount: number;
    avgOutputPerWorker: number;
    outputPerManHour: number;
    recordCount: number;
  };
  byLeader: LeaderReportRow[];
  byLabor: LaborReportRow[];
  topWorkers: WorkerReportRow[];
  lowWorkers: WorkerReportRow[];
  pendingSectors: PendingSectorRow[];
  executiveSummary: string;
  recommendation: string;
};

export type ReportRange = { start: string; end: string };
export type ReportPeriod = "Día" | "Semana" | "Quincena" | "Mes" | "Personalizado";

export function getReportRange(period: ReportPeriod, operationalDate: string, customStart: string, customEnd: string): ReportRange {
  if (period === "Día") return { start: operationalDate, end: operationalDate };
  if (period === "Semana") return { start: addDays(operationalDate, -6), end: operationalDate };
  if (period === "Quincena") return getFortnightRange(operationalDate);
  if (period === "Mes") return { start: operationalDate.slice(0, 8) + "01", end: operationalDate };
  return { start: customStart, end: customEnd };
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function getFortnightRange(date: string): ReportRange {
  const d = new Date(`${date}T00:00:00`);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15 ? 15 : new Date(y, m + 1, 0).getDate();
  return {
    start: `${y}-${String(m + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`,
    end: `${y}-${String(m + 1).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`,
  };
}

export function buildProductivityReport(
  records: LocalProgressRecord[],
  operation: string,
  period: ReportPeriod,
  range: ReportRange,
): ProductivityReport {
  const safe = (v: number) => Number.isFinite(v) ? v : 0;

  const totalGoal = safe(records.reduce((s, r) => s + r.goal, 0));
  const totalOutput = safe(records.reduce((s, r) => s + r.progress, 0));
  const remaining = safe(Math.max(0, totalGoal - totalOutput));
  const totalManHours = safe(records.reduce((s, r) => s + r.hours, 0));
  const presentCount = records.reduce((s, r) => s + r.workers.filter((w) => w.attendance === "Presente").length, 0);
  const absentCount = records.reduce((s, r) => s + r.workers.filter((w) => w.attendance === "Ausente").length, 0);
  const completion = totalGoal > 0 ? Math.round((totalOutput / totalGoal) * 100) : 0;

  const byLeader = buildByLeader(records);
  const byLabor = buildByLabor(records);
  const topWorkers = buildTopWorkers(records);
  const lowWorkers = buildLowWorkers(records);
  const pendingSectors = buildPendingSectors(records);
  const executiveSummary = buildExecutiveSummary(operation, period, range, completion, totalGoal, totalOutput, byLeader, byLabor, topWorkers, pendingSectors);
  const recommendation = buildRecommendation(byLeader, pendingSectors);

  return {
    summary: {
      totalGoal,
      totalOutput,
      remaining,
      completion,
      totalManHours,
      presentCount,
      absentCount,
      avgOutputPerWorker: presentCount > 0 ? safe(totalOutput / presentCount) : 0,
      outputPerManHour: totalManHours > 0 ? safe(totalOutput / totalManHours) : 0,
      recordCount: records.length,
    },
    byLeader,
    byLabor,
    topWorkers,
    lowWorkers,
    pendingSectors,
    executiveSummary,
    recommendation,
  };
}

function buildByLeader(records: LocalProgressRecord[]): LeaderReportRow[] {
  const map = new Map<string, { labor: string; sector: string; goal: number; progress: number; hours: number; unit: string }>();

  records.forEach((r) => {
    const key = r.leaderId;
    const current = map.get(key) ?? { labor: r.labor, sector: r.sector, goal: 0, progress: 0, hours: 0, unit: r.unit };
    current.goal += r.goal;
    current.progress += r.progress;
    current.hours += r.hours;
    map.set(key, current);
  });

  return Array.from(map.entries()).map(([_, data]) => {
    const remaining = Math.max(0, data.goal - data.progress);
    const percentage = data.goal > 0 ? Math.round((data.progress / data.goal) * 100) : 0;
    const status = percentage >= 100 ? "Cumplido" : percentage >= 80 ? "En avance" : "Atrasado";
    return {
      leaderName: records.find((r) => r.leaderId === _.split("-").slice(1).join("-"))?.leaderName ?? _,
      labor: data.labor,
      sector: data.sector,
      goal: data.goal,
      progress: data.progress,
      remaining,
      percentage,
      manHours: data.hours,
      status,
      unit: data.unit,
    };
  }).sort((a, b) => b.percentage - a.percentage);
}

function buildByLabor(records: LocalProgressRecord[]): LaborReportRow[] {
  const map = new Map<string, { goal: number; progress: number; unit: string }>();

  records.forEach((r) => {
    const current = map.get(r.labor) ?? { goal: 0, progress: 0, unit: r.unit };
    current.goal += r.goal;
    current.progress += r.progress;
    map.set(r.labor, current);
  });

  return Array.from(map.entries()).map(([labor, data]) => ({
    labor,
    goal: data.goal,
    progress: data.progress,
    percentage: data.goal > 0 ? Math.round((data.progress / data.goal) * 100) : 0,
    unit: data.unit,
  })).sort((a, b) => b.percentage - a.percentage);
}

function aggregateWorkers(records: LocalProgressRecord[]) {
  const map = new Map<string, { leaderName: string; labor: string; output: number; hours: number; presentDays: number; absentDays: number; unit: string }>();

  records.forEach((record) => {
    record.workers.forEach((worker) => {
      if (worker.attendance !== "Presente" && worker.attendance !== "Ausente") return;
      const key = worker.id;
      const current = map.get(key) ?? {
        leaderName: record.leaderName,
        labor: record.labor,
        output: 0,
        hours: 0,
        presentDays: 0,
        absentDays: 0,
        unit: worker.unit,
      };
      if (worker.attendance === "Presente") {
        current.output += worker.dailyOutput;
        current.hours += DEFAULT_WORK_HOURS;
        current.presentDays += 1;
      } else {
        current.absentDays += 1;
      }
      map.set(key, current);
    });
  });

  return map;
}

function buildTopWorkers(records: LocalProgressRecord[]): WorkerReportRow[] {
  const map = aggregateWorkers(records);

  return Array.from(map.entries())
    .map(([workerId, data]) => ({
      workerName: records.flatMap((r) => r.workers).find((w) => w.id === workerId)?.name ?? workerId,
      leaderName: data.leaderName,
      labor: data.labor,
      output: data.output,
      hours: data.hours,
      performance: data.hours > 0 ? roundProductivity(data.output / data.hours) : 0,
      attendanceDays: data.presentDays,
      absences: data.absentDays,
      unit: data.unit,
      observation: "",
    }))
    .filter((w) => w.hours > 0)
    .sort((a, b) => b.performance - a.performance);
}

function buildLowWorkers(records: LocalProgressRecord[]): WorkerReportRow[] {
  const map = aggregateWorkers(records);
  const allWorkers = Array.from(map.entries())
    .map(([workerId, data]) => {
      const perf = data.hours > 0 ? roundProductivity(data.output / data.hours) : 0;
      const obs = data.absentDays > data.presentDays
        ? "Revisar asistencia"
        : perf === 0
          ? "Sin avance suficiente en el periodo"
          : "Rendimiento bajo frente al promedio";
      return {
        workerName: records.flatMap((r) => r.workers).find((w) => w.id === workerId)?.name ?? workerId,
        leaderName: data.leaderName,
        labor: data.labor,
        output: data.output,
        hours: data.hours,
        performance: perf,
        attendanceDays: data.presentDays,
        absences: data.absentDays,
        unit: data.unit,
        observation: obs,
      };
    })
    .filter((w) => w.hours > 0)
    .sort((a, b) => a.performance - b.performance);

  return allWorkers.filter((w) => w.performance <= (allWorkers.reduce((s, w) => s + w.performance, 0) / Math.max(1, allWorkers.length)));
}

function buildPendingSectors(records: LocalProgressRecord[]): PendingSectorRow[] {
  const map = new Map<string, { labor: string; leaderName: string; goal: number; progress: number; unit: string }>();

  records.filter((r) => r.remaining > 0).forEach((r) => {
    const key = `${r.sector}|${r.labor}`;
    const current = map.get(key) ?? { labor: r.labor, leaderName: r.leaderName, goal: 0, progress: 0, unit: r.unit };
    current.goal += r.goal;
    current.progress += r.progress;
    map.set(key, current);
  });

  return Array.from(map.entries()).map(([key, data]) => {
    const remaining = Math.max(0, data.goal - data.progress);
    const percentage = data.goal > 0 ? Math.round((data.progress / data.goal) * 100) : 0;
    const priority = percentage < 70 ? "Alta" : percentage < 90 ? "Media" : "Baja";
    const recommendation = priority === "Alta"
      ? "Reforzar cuadrilla o ajustar meta del siguiente día."
      : priority === "Media"
        ? "Dar seguimiento continuo para evitar retrasos."
        : "Mantener el ritmo actual.";
    return {
      sector: key.split("|")[0],
      labor: data.labor,
      leaderName: data.leaderName,
      goal: data.goal,
      progress: data.progress,
      remaining,
      priority,
      unit: data.unit,
      recommendation,
    };
  }).sort((a, b) => a.remaining - b.remaining);
}

function buildExecutiveSummary(
  operation: string,
  period: string,
  range: ReportRange,
  completion: number,
  totalGoal: number,
  totalOutput: number,
  byLeader: LeaderReportRow[],
  byLabor: LaborReportRow[],
  topWorkers: WorkerReportRow[],
  pendingSectors: PendingSectorRow[],
): string {
  const bestLabor = byLabor.length > 0 ? byLabor[0] : null;
  const worstLabor = byLabor.length > 0 ? byLabor[byLabor.length - 1] : null;
  const bestWorker = topWorkers.length > 0 ? topWorkers[0] : null;
  const topLeader = byLeader.length > 0 ? byLeader[0] : null;
  const pendingCount = pendingSectors.length;

  const parts: string[] = [];
  parts.push(`Durante el periodo seleccionado (${range.start} al ${range.end}), la operación ${operation} alcanzó un cumplimiento general de ${completion}%, con ${roundProductivity(totalOutput)} registrados de una meta acumulada de ${roundProductivity(totalGoal)}.`);

  if (bestLabor && worstLabor) {
    parts.push(`La labor con mejor desempeño fue ${bestLabor.labor} (${bestLabor.percentage}%), mientras que ${worstLabor.labor} presenta el menor avance (${worstLabor.percentage}%).`);
  }

  if (bestWorker) {
    parts.push(`El trabajador con mayor rendimiento fue ${bestWorker.workerName} con ${bestWorker.performance} ${bestWorker.unit}/h en ${bestWorker.attendanceDays} días registrados.`);
  }

  if (topLeader) {
    parts.push(`El encargado con mejor cumplimiento fue ${topLeader.leaderName} (${topLeader.percentage}%).`);
  }

  if (pendingCount > 0) {
    parts.push(`Actualmente hay ${pendingCount} sectores con avance pendiente que requieren atención.`);
  }

  if (completion < 80) {
    parts.push("Se recomienda revisar la distribución de personal y reforzar las labores con menor avance.");
  } else if (completion < 100) {
    parts.push("Mantener el ritmo actual y dar seguimiento a los sectores pendientes para completar la meta.");
  } else {
    parts.push("Se ha superado la meta del periodo. Mantener la estrategia actual.");
  }

  return parts.join(" ");
}

function buildRecommendation(byLeader: LeaderReportRow[], pendingSectors: PendingSectorRow[]): string {
  const delayed = byLeader.filter((l) => l.percentage < 80).map((l) => l.leaderName);
  const highPrioritySectors = pendingSectors.filter((s) => s.priority === "Alta");

  if (delayed.length > 0 && highPrioritySectors.length > 0) {
    return `Reforzar seguimiento en ${delayed.slice(0, 3).join(", ")} y priorizar ${highPrioritySectors.length} sector(es) con prioridad alta.`;
  }
  if (delayed.length > 0) {
    return `Dar seguimiento a ${delayed.slice(0, 3).join(", ")} por cumplimiento bajo la meta.`;
  }
  if (pendingSectors.length > 0) {
    return "Revisar sectores pendientes antes de la siguiente jornada.";
  }
  return "Mantener la distribución actual y continuar con el ritmo de trabajo.";
}
