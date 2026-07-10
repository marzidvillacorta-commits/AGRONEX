import { DEFAULT_WORK_HOURS, type Crew, type LeaderUser, type Worker } from "@/data/agronexData";
import type { ProgressSubmission } from "@/components/agronex/register-form";

export type SyncRecordType = "avance" | "asistencia" | "trabajador" | "tarea" | "encargado";
export type SyncRecordAction = "create" | "update" | "delete";
export type SyncRecordStatus = "pending" | "synced" | "error";

export type SyncQueueRecord = {
  id: string;
  type: SyncRecordType;
  action: SyncRecordAction;
  payload: unknown;
  createdAt: string;
  status: SyncRecordStatus;
};

export type LocalProgressRecord = {
  id: string;
  date: string;
  createdAt: string;
  leaderId: string;
  leaderName: string;
  crewId: string;
  crewName: string;
  labor: string;
  crop: string;
  sector: string;
  goal: number;
  progress: number;
  remaining: number;
  unit: string;
  percentage: number;
  hours: number;
  observation: string;
  saveMode: "partial" | "complete";
  workers: Worker[];
};

export type LocalPlanningRecord = {
  id: string;
  date: string;
  createdAt: string;
  leaderId: string;
  leaderName: string;
  crewId: string;
  crewName: string;
  labor: string;
  crop: string;
  sector: string;
  goal: number;
  unit: string;
  priority: string;
  observation: string;
};

export type PendingRecord = {
  crewId: string;
  leaderId: string;
  leaderName: string;
  labor: string;
  sector: string;
  remaining: number;
  unit: string;
  date: string;
};

export type DailyRecord = {
  tasks: LocalPlanningRecord[];
  progress: LocalProgressRecord[];
  attendance: Worker[];
  workerOutputs: Worker[];
  pending: PendingRecord[];
  closedAt?: string;
};

export type AgroLocalSnapshot = {
  leaders: LeaderUser[];
  crews: Crew[];
  workers: Worker[];
  progressRecords: LocalProgressRecord[];
  planningRecords: LocalPlanningRecord[];
  dailyRecords: Record<string, DailyRecord>;
  operationalDate: string;
  operationalNotice: string | null;
  syncQueue: SyncQueueRecord[];
  lastSyncAt: string | null;
};

const STORAGE_KEY = "agronex-offline-state-v4";

export function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return toLocalDateString(next);
}

export function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(new Date(`${date}T00:00:00`));
}

export function createLocalId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now()}-${random}`;
}

export function createTaskFromCrew(crew: Crew, date = getLocalDate()): LocalPlanningRecord {
  return {
    id: createLocalId("task"),
    date,
    createdAt: new Date().toISOString(),
    leaderId: crew.leaderId,
    leaderName: crew.leaderName,
    crewId: crew.id,
    crewName: crew.name,
    labor: crew.labor,
    crop: crew.crop,
    sector: crew.sector,
    goal: Number(crew.goal || 0),
    unit: crew.unit,
    priority: crew.remaining > 0 ? "Alta" : "Media",
    observation: crew.remaining > 0 ? `Recuperar ${crew.remaining} ${crew.unit} pendientes.` : "Jornada programada.",
  };
}

export function createEmptyDailyRecord(pending: PendingRecord[] = []): DailyRecord {
  return {
    tasks: [],
    progress: [],
    attendance: [],
    workerOutputs: [],
    pending,
  };
}

export function loadAgroLocalSnapshot(initialLeaders: LeaderUser[], initialCrews: Crew[], initialWorkers: Worker[]): AgroLocalSnapshot {
  if (typeof window === "undefined") return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);

    const parsed = JSON.parse(raw) as Partial<AgroLocalSnapshot>;
    const today = getLocalDate();
    const planningRecords = parsed.planningRecords ?? [];
    const progressRecords = parsed.progressRecords ?? [];
    const legacyState = !parsed.dailyRecords || !parsed.operationalDate;
    const baseWorkers = parsed.workers?.length ? parsed.workers : initialWorkers;
    const workers = legacyState ? resetWorkersForDay(baseWorkers) : baseWorkers;
    const baseCrews = parsed.crews?.length ? parsed.crews : initialCrews;
    const snapshot: AgroLocalSnapshot = {
      leaders: parsed.leaders?.length ? parsed.leaders : initialLeaders,
      crews: legacyState ? resetCrewsForDay(baseCrews, workers) : baseCrews,
      workers,
      progressRecords,
      planningRecords,
      dailyRecords: normalizeDailyRecords(parsed.dailyRecords, planningRecords, progressRecords),
      operationalDate: parsed.operationalDate ?? today,
      operationalNotice: null,
      syncQueue: parsed.syncQueue ?? [],
      lastSyncAt: parsed.lastSyncAt ?? null,
    };

    return snapshot.operationalDate === today ? ensureDateRecord(snapshot, today) : rollToNewOperationalDate(snapshot, today);
  } catch {
    return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);
  }
}

export function saveAgroLocalSnapshot(snapshot: AgroLocalSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...snapshot, operationalNotice: null }));
}

export function buildProgressRecord(input: {
  submission: ProgressSubmission;
  leaderId: string;
  leaderName: string;
  crew: Crew;
  date?: string;
}): LocalProgressRecord {
  const remaining = Math.max(0, Number((input.crew.goal - input.submission.progress).toFixed(2)));
  const percentage = input.crew.goal > 0 ? Math.min(100, Math.round((input.submission.progress / input.crew.goal) * 100)) : 0;

  return {
    id: createLocalId("progress"),
    date: input.date ?? getLocalDate(),
    createdAt: new Date().toISOString(),
    leaderId: input.leaderId,
    leaderName: input.leaderName,
    crewId: input.crew.id,
    crewName: input.crew.name,
    labor: input.crew.labor,
    crop: input.crew.crop,
    sector: input.crew.sector,
    goal: input.crew.goal,
    progress: input.submission.progress,
    remaining,
    unit: input.crew.unit,
    percentage,
    hours: input.submission.hours,
    observation: input.submission.observation,
    saveMode: input.submission.saveMode,
    workers: input.submission.workers,
  };
}

export function createSyncRecord(type: SyncRecordType, action: SyncRecordAction, payload: unknown): SyncQueueRecord {
  return {
    id: createLocalId("sync"),
    type,
    action,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
  };
}

export function getPendingSyncCount(syncQueue: SyncQueueRecord[]) {
  return syncQueue.filter((record) => record.status === "pending").length;
}

export function getRecordsForDate(records: LocalProgressRecord[], date: string) {
  return records.filter((record) => record.date === date);
}

export function getFortnightRange(date = getLocalDate()) {
  const base = new Date(`${date}T00:00:00`);
  const year = base.getFullYear();
  const month = base.getMonth();
  const day = base.getDate();
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15 ? 15 : new Date(year, month + 1, 0).getDate();
  return {
    start: toLocalDateString(new Date(year, month, startDay)),
    end: toLocalDateString(new Date(year, month, endDay)),
  };
}

export function getRecordsInRange(records: LocalProgressRecord[], start: string, end: string) {
  return records.filter((record) => record.date >= start && record.date <= end);
}

export function getFortnightRecords(records: LocalProgressRecord[], date = getLocalDate()) {
  const range = getFortnightRange(date);
  return getRecordsInRange(records, range.start, range.end);
}

export function getLatestTaskForLeaderDate(records: LocalPlanningRecord[], leaderId: string, date: string) {
  return records.find((record) => record.leaderId === leaderId && record.date === date) ?? null;
}

export function getLatestProgressForLeaderDate(records: LocalProgressRecord[], leaderId: string, date: string) {
  return records.find((record) => record.leaderId === leaderId && record.date === date) ?? null;
}

export function syncPendingRecords(syncQueue: SyncQueueRecord[]) {
  const pending = syncQueue.filter((record) => record.status === "pending").length;
  const syncedAt = new Date().toISOString();

  // En producción, esta función enviará la cola pendiente a Supabase.
  return {
    syncedCount: pending,
    lastSyncAt: pending > 0 ? syncedAt : null,
    syncQueue: syncQueue.map((record) => record.status === "pending" ? { ...record, status: "synced" as const } : record),
  };
}

function createInitialSnapshot(initialLeaders: LeaderUser[], initialCrews: Crew[], initialWorkers: Worker[]): AgroLocalSnapshot {
  const today = getLocalDate();
  const workers = resetWorkersForDay(initialWorkers);
  const crews = resetCrewsForDay(initialCrews, workers);
  const history = createInitialHistory(today, initialCrews, initialWorkers);

  return {
    leaders: initialLeaders,
    crews,
    workers,
    progressRecords: history.progressRecords,
    planningRecords: history.planningRecords,
    dailyRecords: { ...history.dailyRecords, [today]: createEmptyDailyRecord() },
    operationalDate: today,
    operationalNotice: null,
    syncQueue: [],
    lastSyncAt: null,
  };
}

function ensureDateRecord(snapshot: AgroLocalSnapshot, date: string): AgroLocalSnapshot {
  if (snapshot.dailyRecords[date]) return snapshot;
  return {
    ...snapshot,
    dailyRecords: {
      ...snapshot.dailyRecords,
      [date]: createEmptyDailyRecord(getAccumulatedPending(snapshot)),
    },
  };
}

function rollToNewOperationalDate(snapshot: AgroLocalSnapshot, today: string): AgroLocalSnapshot {
  const previousDate = snapshot.operationalDate;
  const previousDaily = snapshot.dailyRecords[previousDate] ?? createEmptyDailyRecord();
  const pending = getAccumulatedPending(snapshot);
  const workers = resetWorkersForDay(snapshot.workers);

  return {
    ...snapshot,
    crews: resetCrewsForDay(snapshot.crews, workers),
    workers,
    operationalDate: today,
    operationalNotice: "Nuevo día operativo. Revisa o confirma la planificación de hoy.",
    dailyRecords: {
      ...snapshot.dailyRecords,
      [previousDate]: { ...previousDaily, closedAt: previousDaily.closedAt ?? new Date().toISOString(), pending },
      [today]: snapshot.dailyRecords[today] ?? createEmptyDailyRecord(pending),
    },
  };
}

function normalizeDailyRecords(
  dailyRecords: AgroLocalSnapshot["dailyRecords"] | undefined,
  planningRecords: LocalPlanningRecord[],
  progressRecords: LocalProgressRecord[],
) {
  const normalized: Record<string, DailyRecord> = {};

  if (dailyRecords) {
    Object.entries(dailyRecords).forEach(([date, record]) => {
      normalized[date] = {
        tasks: record.tasks ?? planningRecords.filter((item) => item.date === date),
        progress: record.progress ?? progressRecords.filter((item) => item.date === date),
        attendance: record.attendance ?? [],
        workerOutputs: record.workerOutputs ?? [],
        pending: record.pending ?? [],
        closedAt: record.closedAt,
      };
    });
  }

  planningRecords.forEach((task) => {
    normalized[task.date] ??= createEmptyDailyRecord();
    if (!normalized[task.date].tasks.some((item) => item.id === task.id)) normalized[task.date].tasks.unshift(task);
  });
  progressRecords.forEach((progress) => {
    normalized[progress.date] ??= createEmptyDailyRecord();
    if (!normalized[progress.date].progress.some((item) => item.id === progress.id)) normalized[progress.date].progress.unshift(progress);
  });

  return normalized;
}

function createInitialHistory(today: string, crews: Crew[], workers: Worker[]) {
  const progressRecords: LocalProgressRecord[] = [];
  const planningRecords: LocalPlanningRecord[] = [];
  const dailyRecords: Record<string, DailyRecord> = {};
  const weeklyProgress: Record<string, number[]> = {
    "leader-marcos": [58, 62, 55, 60, 48, 65, 52],
    "leader-carlos": [3.8, 4.1, 3.5, 4, 3.2, 4.4, 3.7],
    "leader-pedro": [580, 610, 540, 620, 560, 630, 590],
    "leader-lopez": [5, 5, 4.5, 5, 5, 5, 4.8],
    "leader-susana": [1120, 1260, 1180, 1210, 1090, 1300, 1160],
  };

  Object.entries(weeklyProgress).forEach(([leaderId, values]) => {
    const crew = crews.find((item) => item.leaderId === leaderId);
    if (!crew) return;
    const crewWorkers = workers.filter((worker) => worker.crewId === crew.id && worker.status !== "Sin cuadrilla");

    values.forEach((progress, index) => {
      const date = addDays(today, index - 7);
      const presentCount = Math.max(1, Math.min(crewWorkers.length, crewWorkers.length - ((index + crew.id.length) % 3)));
      const presentWorkers = crewWorkers.slice(0, presentCount);
      const absentWorkers = crewWorkers.slice(presentCount);
      const average = progress / presentWorkers.length;
      const historicWorkers = [
        ...presentWorkers.map((worker, workerIndex) => ({
          ...worker,
          attendance: "Presente" as const,
          dailyOutput: Number((average * (0.86 + ((workerIndex * 5) % 7) * 0.045)).toFixed(2)),
          hoursWorked: DEFAULT_WORK_HOURS,
          observation: "Registro de campo consolidado.",
        })),
        ...absentWorkers.map((worker) => ({
          ...worker,
          attendance: "Ausente" as const,
          dailyOutput: 0,
          hoursWorked: 0,
          observation: "Ausencia registrada.",
        })),
      ];
      const normalizedProgress = Number(historicWorkers.filter((worker) => worker.attendance === "Presente").reduce((sum, worker) => sum + worker.dailyOutput, 0).toFixed(2));
      const remaining = Math.max(0, Number((crew.goal - normalizedProgress).toFixed(2)));
      const percentage = crew.goal > 0 ? Math.round((normalizedProgress / crew.goal) * 100) : 0;
      const task: LocalPlanningRecord = {
        id: `history-task-${crew.id}-${date}`,
        date,
        createdAt: `${date}T06:00:00.000Z`,
        leaderId: crew.leaderId,
        leaderName: crew.leaderName,
        crewId: crew.id,
        crewName: crew.name,
        labor: crew.labor,
        crop: crew.crop,
        sector: crew.sector,
        goal: crew.goal,
        unit: crew.unit,
        priority: remaining > 0 ? "Alta" : "Media",
        observation: remaining > 0 ? `Continuar ${remaining} ${crew.unit} pendientes.` : "Labor completada.",
      };
      const record: LocalProgressRecord = {
        id: `history-progress-${crew.id}-${date}`,
        date,
        createdAt: `${date}T17:00:00.000Z`,
        leaderId: crew.leaderId,
        leaderName: crew.leaderName,
        crewId: crew.id,
        crewName: crew.name,
        labor: crew.labor,
        crop: crew.crop,
        sector: crew.sector,
        goal: crew.goal,
        progress: normalizedProgress,
        remaining,
        unit: crew.unit,
        percentage,
        hours: presentCount * DEFAULT_WORK_HOURS,
        observation: remaining > 0 ? `Pendiente acumulado: ${remaining} ${crew.unit}.` : "Jornada completada.",
        saveMode: "complete",
        workers: historicWorkers,
      };

      planningRecords.push(task);
      progressRecords.push(record);
      dailyRecords[date] ??= createEmptyDailyRecord();
      dailyRecords[date] = {
        ...dailyRecords[date],
        tasks: [task, ...dailyRecords[date].tasks],
        progress: [record, ...dailyRecords[date].progress],
        attendance: [...historicWorkers, ...dailyRecords[date].attendance],
        workerOutputs: [...historicWorkers, ...dailyRecords[date].workerOutputs],
        pending: remaining > 0 ? [{
          crewId: crew.id,
          leaderId: crew.leaderId,
          leaderName: crew.leaderName,
          labor: crew.labor,
          sector: crew.sector,
          remaining,
          unit: crew.unit,
          date,
        }, ...dailyRecords[date].pending] : dailyRecords[date].pending,
        closedAt: `${date}T18:00:00.000Z`,
      };
    });
  });

  return { progressRecords, planningRecords, dailyRecords };
}

function getAccumulatedPending(snapshot: AgroLocalSnapshot) {
  const byCrew = new Map<string, PendingRecord>();

  snapshot.progressRecords.forEach((record) => {
    if (record.remaining <= 0) return;
    const current = byCrew.get(record.crewId);
    if (!current || record.date >= current.date) {
      byCrew.set(record.crewId, {
        crewId: record.crewId,
        leaderId: record.leaderId,
        leaderName: record.leaderName,
        labor: record.labor,
        sector: record.sector,
        remaining: record.remaining,
        unit: record.unit,
        date: record.date,
      });
    }
  });

  snapshot.crews.forEach((crew) => {
    if (crew.remaining <= 0) return;
    const current = byCrew.get(crew.id);
    if (!current) {
      byCrew.set(crew.id, {
        crewId: crew.id,
        leaderId: crew.leaderId,
        leaderName: crew.leaderName,
        labor: crew.labor,
        sector: crew.sector,
        remaining: crew.remaining,
        unit: crew.unit,
        date: snapshot.operationalDate,
      });
    }
  });

  return Array.from(byCrew.values());
}

function resetWorkersForDay(workers: Worker[]) {
  return workers.map((worker) => ({
    ...worker,
    attendance: "Ausente" as const,
    dailyOutput: 0,
    hoursWorked: 0,
    observation: "",
  }));
}

function resetCrewsForDay(crews: Crew[], workers: Worker[]) {
  return crews.map((crew) => {
    const crewWorkers = workers.filter((worker) => worker.crewId === crew.id && worker.status !== "Sin cuadrilla");
    return {
      ...crew,
      totalWorkers: crewWorkers.length,
      presentWorkers: 0,
      absentWorkers: crewWorkers.length,
      progress: 0,
      remaining: Number(crew.goal || 0),
      percentage: 0,
      hoursPerWorker: 0,
      manHours: 0,
      status: "Pendiente" as const,
    };
  });
}

function toLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
