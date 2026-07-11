import { roundProductivity } from "@/lib/agronex-productivity";
import type { LocalProgressRecord } from "@/lib/agronex-offline";
import type { Worker } from "@/data/agronexData";

export type WorkerPerformanceStatus =
  | "Destacado" | "Adecuado" | "En seguimiento"
  | "Requiere evaluación" | "No evaluable" | "Descanso temporal" | "Inactivo";

export type WorkerPerformanceSummary = {
  workerId: string;
  workerName: string;
  dni: string;
  crop: string;
  sector: string;
  crewId: string;
  crewName: string;
  labor: string;
  evaluableDays: number;
  averagePerformance: number;
  attendance: number;
  trend: "up" | "down" | "stable";
  status: WorkerPerformanceStatus;
  lastEvaluationDate: string | null;
  statusReason: string;
  daysBelowThreshold: number;
};

export type HRFollowUp = {
  id: string;
  workerId: string;
  workerName: string;
  crewId: string;
  crewName: string;
  labor: string;
  sector: string;
  period: string;
  averagePerformance: number;
  daysBelowGoal: number;
  trend: string;
  reason: string;
  supervisorObservation: string;
  hrResponsible: string;
  reviewDate: string;
  status: "Pendiente" | "En proceso" | "Recuperado" | "Requiere evaluación" | "Cerrado";
  createdAt: string;
  updatedAt: string;
};

export type HREvaluation = {
  id: string;
  workerId: string;
  workerName: string;
  responsibleId: string;
  responsibleName: string;
  period: string;
  performance: number;
  attendance: number;
  supervisorObservation: string;
  hrObservation: string;
  externalFactors: string;
  decision: HRDecision;
  decisionDetail: string;
  reviewDate: string;
  createdAt: string;
  updatedAt: string;
};

export type HRDecision =
  | "Continuar sin cambios"
  | "Capacitación"
  | "Acompañamiento"
  | "Cambio de labor"
  | "Cambio de sector"
  | "Cambio de cuadrilla"
  | "Seguimiento adicional"
  | "Descanso temporal"
  | "Cierre laboral";

export type StaffingRequirement = {
  id: string;
  crop: string;
  sector: string;
  labor: string;
  startDate: string;
  endDate: string;
  totalGoal: number;
  unit: string;
  expectedPerformance: number;
  availableWorkers: number;
  expectedAbsences: number;
  temporaryRest: number;
  availableDays: number;
  neededWorkers: number;
  estimatedVacancies: number;
  explanation: string;
  createdAt: string;
};

export type JobOpening = {
  id: string;
  title: string;
  crop: string;
  sector: string;
  labor: string;
  vacancies: number;
  startDate: string;
  endDate: string;
  schedule: string;
  requirements: string;
  experience: string;
  referencePayment: string;
  responsibleId: string;
  responsibleName: string;
  status: "Borrador" | "Publicada" | "En selección" | "Cubierta" | "Cerrada" | "Cancelada";
  createdAt: string;
  updatedAt: string;
};

export type Applicant = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  district: string;
  agriculturalExperience: string;
  crops: string[];
  labors: string[];
  availability: string;
  reference: string;
  observations: string;
  jobOpeningId: string;
  status: "Nuevo" | "Contactado" | "Preseleccionado" | "Seleccionado" | "Contratado" | "No seleccionado" | "Disponible" | "Bloqueado";
  createdAt: string;
  updatedAt: string;
};

export type WorkerAdminHistory = {
  id: string;
  workerId: string;
  workerName: string;
  actionType: "Capacitación" | "Cambio de labor" | "Cambio de sector" | "Cambio de cuadrilla" | "Descanso temporal" | "Cierre laboral" | "Reactivación" | "Otra acción";
  previousValue: string;
  newValue: string;
  reason: string;
  responsibleId: string;
  responsibleName: string;
  effectiveDate: string;
  createdAt: string;
};

export type HRSettings = {
  destacadoThreshold: number;
  adecuadoMin: number;
  seguimientoThreshold: number;
  evaluacionThreshold: number;
  minEvaluableDays: number;
  consecutiveDaysBelowThreshold: number;
  analysisPeriod: number;
  fullWorkDayHours: number;
  partialDayTolerance: number;
};

export const DEFAULT_HR_SETTINGS: HRSettings = {
  destacadoThreshold: 110,
  adecuadoMin: 85,
  seguimientoThreshold: 85,
  evaluacionThreshold: 75,
  minEvaluableDays: 3,
  consecutiveDaysBelowThreshold: 3,
  analysisPeriod: 15,
  fullWorkDayHours: 8,
  partialDayTolerance: 4,
};

export type HRLocalData = {
  followUps: HRFollowUp[];
  evaluations: HREvaluation[];
  staffingRequirements: StaffingRequirement[];
  jobOpenings: JobOpening[];
  applicants: Applicant[];
  adminHistory: WorkerAdminHistory[];
  settings: HRSettings;
};

export function createEmptyHRData(): HRLocalData {
  return {
    followUps: [],
    evaluations: [],
    staffingRequirements: [],
    jobOpenings: [],
    applicants: [],
    adminHistory: [],
    settings: { ...DEFAULT_HR_SETTINGS },
  };
}

let hrLocalData: HRLocalData | null = null;

export function loadHRLocalData(): HRLocalData {
  if (hrLocalData) return hrLocalData;
  try {
    const raw = localStorage.getItem("agronex-hr-v1");
    if (raw) {
      hrLocalData = JSON.parse(raw) as HRLocalData;
      return hrLocalData;
    }
  } catch { }
  hrLocalData = createEmptyHRData();
  return hrLocalData;
}

export function saveHRLocalData(): void {
  if (!hrLocalData) return;
  localStorage.setItem("agronex-hr-v1", JSON.stringify(hrLocalData));
}

export function computeWorkerPerformanceSummary(
  worker: Worker,
  records: LocalProgressRecord[],
  settings: HRSettings = DEFAULT_HR_SETTINGS,
): WorkerPerformanceSummary {
  const workerRecords = records
    .filter((r) => r.workers.some((w) => w.id === worker.id))
    .sort((a, b) => a.date.localeCompare(b.date));

  const validDays = workerRecords.filter((r) => {
    const workerEntry = r.workers.find((w) => w.id === worker.id);
    if (!workerEntry) return false;
    if (workerEntry.attendance === "Ausente") return false;
    if (workerEntry.hoursWorked < settings.partialDayTolerance) return false;
    if (r.goal <= 0) return false;
    return true;
  });

  const evaluableDays = validDays.length;
  let averagePerformance = 0;
  let attendance = 0;
  let trend: "up" | "down" | "stable" = "stable";
  let daysBelowThreshold = 0;
  let status: WorkerPerformanceStatus = "No evaluable";
  let statusReason = "";

  if (worker.status === "Inactivo") {
    status = "Inactivo";
    statusReason = "Trabajador inactivo en el sistema.";
    return buildSummary(worker, evaluableDays, averagePerformance, attendance, trend, status, statusReason, daysBelowThreshold);
  }

  if (evaluableDays === 0) {
    status = "No evaluable";
    statusReason = `Menos de ${settings.minEvaluableDays} días evaluables en el periodo.`;
    return buildSummary(worker, evaluableDays, averagePerformance, attendance, trend, status, statusReason, daysBelowThreshold);
  }

  const totalDays = workerRecords.length;
  const presentDays = workerRecords.filter((r) => {
    const w = r.workers.find((e) => e.id === worker.id);
    return w?.attendance === "Presente";
  }).length;
  attendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const performances = validDays.map((r) => {
    const workerEntry = r.workers.find((entry) => entry.id === worker.id);
    const presentWorkers = r.workers.filter((entry) => entry.attendance === "Presente").length;
    const individualFullDayGoal = presentWorkers > 0 ? r.goal / presentWorkers : 0;
    const proportionalGoal = individualFullDayGoal * ((workerEntry?.hoursWorked ?? 0) / settings.fullWorkDayHours);
    return proportionalGoal > 0 ? ((workerEntry?.dailyOutput ?? 0) / proportionalGoal) * 100 : 0;
  });

  averagePerformance = performances.length > 0
    ? roundProductivity(performances.reduce((s, p) => s + p, 0) / performances.length)
    : 0;

  daysBelowThreshold = performances.filter((p) => p < settings.seguimientoThreshold).length;

  if (performances.length >= 3) {
    const half = Math.floor(performances.length / 2);
    const firstHalf = performances.slice(0, half).reduce((s, p) => s + p, 0) / half;
    const secondHalf = performances.slice(-half).reduce((s, p) => s + p, 0) / half;
    const diff = secondHalf - firstHalf;
    trend = diff > 5 ? "up" : diff < -5 ? "down" : "stable";
  }

  if (evaluableDays < settings.minEvaluableDays) {
    status = "No evaluable";
    statusReason = `Solo ${evaluableDays} día(s) evaluable(s) de ${settings.minEvaluableDays} requeridos.`;
  } else if (averagePerformance >= settings.destacadoThreshold) {
    status = "Destacado";
    statusReason = `Promedio de ${averagePerformance}% en ${evaluableDays} días evaluables.`;
  } else if (averagePerformance >= settings.adecuadoMin) {
    status = "Adecuado";
    statusReason = `Promedio de ${averagePerformance}% en ${evaluableDays} días evaluables.`;
  } else if (averagePerformance < settings.seguimientoThreshold && daysBelowThreshold >= settings.consecutiveDaysBelowThreshold) {
    if (averagePerformance < settings.evaluacionThreshold && daysBelowThreshold >= 5) {
      status = "Requiere evaluación";
      statusReason = `Promedio de ${averagePerformance}% en ${daysBelowThreshold} día(s) bajo la meta. Requiere evaluación.`;
    } else {
      status = "En seguimiento";
      statusReason = `Promedio de ${averagePerformance}% en ${daysBelowThreshold} día(s) evaluables de ${workerRecords[0]?.labor ?? "labor"}.`;
    }
  } else if (averagePerformance < settings.adecuadoMin) {
    status = "En seguimiento";
    statusReason = `Promedio de ${averagePerformance}% por debajo del umbral de ${settings.adecuadoMin}%.`;
  } else {
    status = "Adecuado";
    statusReason = `Promedio de ${averagePerformance}% en ${evaluableDays} días evaluables.`;
  }

  return buildSummary(worker, evaluableDays, averagePerformance, attendance, trend, status, statusReason, daysBelowThreshold);
}

function buildSummary(
  worker: Worker,
  evaluableDays: number,
  averagePerformance: number,
  attendance: number,
  trend: "up" | "down" | "stable",
  status: WorkerPerformanceStatus,
  statusReason: string,
  daysBelowThreshold: number,
): WorkerPerformanceSummary {
  return {
    workerId: worker.id,
    workerName: worker.name,
    dni: "",
    crop: worker.crop ?? "",
    sector: worker.sector ?? "",
    crewId: worker.crewId,
    crewName: worker.crewName,
    labor: worker.labor ?? "",
    evaluableDays,
    averagePerformance,
    attendance,
    trend,
    status,
    lastEvaluationDate: null,
    statusReason,
    daysBelowThreshold,
  };
}

export function computeAllWorkerSummaries(
  workers: Worker[],
  records: LocalProgressRecord[],
  settings: HRSettings = DEFAULT_HR_SETTINGS,
): WorkerPerformanceSummary[] {
  return workers
    .filter((w) => w.status !== "Sin cuadrilla")
    .map((w) => computeWorkerPerformanceSummary(w, records, settings))
    .sort((a, b) => {
      const order: Record<string, number> = { "Destacado": 0, "Adecuado": 1, "En seguimiento": 2, "Requiere evaluación": 3, "No evaluable": 4, "Descanso temporal": 5, "Inactivo": 6 };
      return (order[a.status] ?? 99) - (order[b.status] ?? 99) || b.averagePerformance - a.averagePerformance;
    });
}

export function getHRDashboardStats(workers: Worker[], records: LocalProgressRecord[], followUps: HRFollowUp[], evaluations: HREvaluation[], jobOpenings: JobOpening[], applicants: Applicant[], settings: HRSettings) {
  const summaries = computeAllWorkerSummaries(workers, records, settings);
  const activeWorkers = workers.filter((w) => w.status === "Activo").length;
  const destacados = summaries.filter((s) => s.status === "Destacado").length;
  const adecuados = summaries.filter((s) => s.status === "Adecuado").length;
  const enSeguimiento = summaries.filter((s) => s.status === "En seguimiento").length;
  const requierenEval = summaries.filter((s) => s.status === "Requiere evaluación").length;
  const noEvaluables = summaries.filter((s) => s.status === "No evaluable").length;
  const descanso = summaries.filter((s) => s.status === "Descanso temporal").length;

  const today = new Date().toISOString().slice(0, 10);
  const fortnightAgo = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10);
  const recentAbsences = records
    .filter((r) => r.date >= fortnightAgo && r.date <= today)
    .flatMap((r) => r.workers.filter((w) => w.attendance === "Ausente"));
  const absenceCount = new Set(recentAbsences.map((w) => w.id)).size;

  const openJobs = jobOpenings.filter((j) => j.status === "Publicada" || j.status === "En selección").length;
  const totalVacancies = jobOpenings.filter((j) => j.status === "Publicada" || j.status === "En selección").reduce((s, j) => s + j.vacancies, 0);
  const totalApplicants = applicants.length;
  const pendingFollowUps = followUps.filter((f) => f.status === "Pendiente" || f.status === "En proceso").length;
  const pendingEvals = evaluations.length === 0 ? requierenEval : 0;

  return {
    activeWorkers,
    destacados,
    adecuados,
    enSeguimiento,
    requierenEval,
    noEvaluables,
    descanso,
    absenceCount,
    openJobs,
    totalVacancies,
    totalApplicants,
    pendingFollowUps,
    pendingEvals,
    summaries,
  };
}

export function calculateStaffingNeeded(
  totalGoal: number,
  unit: string,
  expectedPerformance: number,
  availableWorkers: number,
  expectedAbsences: number,
  temporaryRest: number,
  availableDays: number,
  fullWorkDayHours: number,
): { neededWorkers: number; estimatedVacancies: number; explanation: string } {
  const safeGoal = Math.max(0, totalGoal);
  const safeWorkers = Math.max(0, availableWorkers);
  const safeAbsences = Math.max(0, expectedAbsences);
  const safeRest = Math.max(0, temporaryRest);
  const safeDays = Math.max(1, availableDays);
  const safeHours = Math.max(1, fullWorkDayHours);
  const effectiveWorkers = Math.max(0, safeWorkers - safeAbsences - safeRest);
  const performancePerWorkerPerDay = Math.max(0, expectedPerformance) * (safeHours / DEFAULT_HR_SETTINGS.fullWorkDayHours);
  const totalCapacity = effectiveWorkers * performancePerWorkerPerDay * safeDays;

  if (safeGoal === 0 || performancePerWorkerPerDay === 0) {
    return {
      neededWorkers: 0,
      estimatedVacancies: 0,
      explanation: safeGoal === 0 ? "Ingresa una meta mayor que cero." : "Ingresa un rendimiento esperado mayor que cero.",
    };
  }

  let neededWorkers = 0;
  let estimatedVacancies = 0;
  let explanation = "";

  if (totalCapacity >= totalGoal) {
    neededWorkers = Math.ceil(safeGoal / (performancePerWorkerPerDay * safeDays));
    estimatedVacancies = Math.max(0, neededWorkers - safeWorkers);
    explanation = `Se requieren ${neededWorkers} trabajador(es) para cubrir ${safeGoal} ${unit} en ${safeDays} día(s). `
      + `Rendimiento esperado: ${performancePerWorkerPerDay} ${unit}/día. `
      + `Disponibles: ${safeWorkers}. Ausencias previstas: ${safeAbsences}. Descansos: ${safeRest}.`;
  } else {
    neededWorkers = Math.ceil(safeGoal / (performancePerWorkerPerDay * safeDays));
    estimatedVacancies = neededWorkers - effectiveWorkers;
    explanation = `Capacidad actual insuficiente. Se requieren ${neededWorkers} trabajadores, `
      + `pero solo hay ${effectiveWorkers} efectivos (${safeWorkers} disponibles - ${safeAbsences} ausencias - ${safeRest} descansos). `
      + `Déficit estimado: ${estimatedVacancies} trabajador(es).`;
  }

  return { neededWorkers, estimatedVacancies: Math.max(0, estimatedVacancies), explanation };
}

export function createLocalHRId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function maskDNI(dni: string): string {
  if (!dni || dni.length < 4) return dni;
  return `***${dni.slice(-3)}`;
}
