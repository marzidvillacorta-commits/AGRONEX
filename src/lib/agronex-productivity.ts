import { DEFAULT_WORK_HOURS, type Attendance, type Crew, type Worker } from "@/data/agronexData";

export type CrewProductivitySummary = {
  totalWorkers: number;
  presentWorkers: number;
  absentWorkers: number;
  manHours: number;
  progress: number;
  remaining: number;
  percentage: number;
  averagePerWorker: number;
  outputPerManHour: number;
};

export function normalizeWorkerAttendance(worker: Worker, attendance: Attendance): Worker {
  if (attendance === "Ausente") {
    return {
      ...worker,
      attendance,
      dailyOutput: 0,
      hoursWorked: 0,
    };
  }

  const wasAbsent = worker.attendance !== "Presente";

  return {
    ...worker,
    attendance,
    dailyOutput: wasAbsent ? 0 : worker.dailyOutput,
    hoursWorked: DEFAULT_WORK_HOURS,
  };
}

export function quickStepsForUnit(unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized.includes("kg")) return [-5, 5, 20];
  if (normalized.includes("planta")) return [-10, 10, 50];
  if (normalized === "ha" || normalized.includes("hect")) return [-0.25, 0.25, 1];
  if (normalized.includes("jaba")) return [-1, 1, 5];
  if (normalized.includes("bin")) return [-1, 1, 2];
  return [-1, 1, 5];
}

export function applyWorkerOutput(worker: Worker, deltaOrValue: number, mode: "delta" | "value" = "delta"): Worker {
  if (worker.attendance === "Ausente") return { ...worker, dailyOutput: 0, hoursWorked: 0 };
  const nextValue = mode === "delta" ? worker.dailyOutput + deltaOrValue : deltaOrValue;
  return {
    ...worker,
    dailyOutput: roundProductivity(Math.max(0, nextValue)),
    hoursWorked: DEFAULT_WORK_HOURS,
  };
}

export function calculateCrewProductivity(crew: Pick<Crew, "goal">, workers: Worker[]): CrewProductivitySummary {
  const activeWorkers = workers.filter((worker) => worker.status !== "Sin cuadrilla");
  const present = activeWorkers.filter((worker) => worker.attendance === "Presente");
  const progress = roundProductivity(present.reduce((sum, worker) => sum + Number(worker.dailyOutput || 0), 0));
  const goal = Number(crew.goal || 0);
  const manHours = present.length * DEFAULT_WORK_HOURS;
  const remaining = roundProductivity(Math.max(0, goal - progress));
  const percentage = goal > 0 ? Math.round((progress / goal) * 100) : 0;

  return {
    totalWorkers: activeWorkers.length,
    presentWorkers: present.length,
    absentWorkers: activeWorkers.length - present.length,
    manHours,
    progress,
    remaining,
    percentage,
    averagePerWorker: present.length ? roundProductivity(progress / present.length) : 0,
    outputPerManHour: manHours ? roundProductivity(progress / manHours) : 0,
  };
}

export function applyProductivityToCrew(crew: Crew, workers: Worker[]): Crew {
  const summary = calculateCrewProductivity(crew, workers);
  return {
    ...crew,
    totalWorkers: summary.totalWorkers,
    presentWorkers: summary.presentWorkers,
    absentWorkers: summary.absentWorkers,
    progress: summary.progress,
    remaining: summary.remaining,
    percentage: summary.percentage,
    hoursPerWorker: summary.presentWorkers ? DEFAULT_WORK_HOURS : 0,
    manHours: summary.manHours,
    status: summary.percentage >= 100 ? "Terminado" : summary.progress > 0 ? "En proceso" : crew.status === "Programado" ? "Programado" : "Pendiente",
  };
}

export function roundProductivity(value: number) {
  return Number((Number.isFinite(value) ? value : 0).toFixed(2));
}
