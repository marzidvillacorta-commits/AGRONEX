import type { Crew, LeaderUser, Worker } from "@/data/agronexData";
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

export type AgroLocalSnapshot = {
  leaders: LeaderUser[];
  crews: Crew[];
  workers: Worker[];
  progressRecords: LocalProgressRecord[];
  planningRecords: LocalPlanningRecord[];
  syncQueue: SyncQueueRecord[];
  lastSyncAt: string | null;
};

const STORAGE_KEY = "agronex-offline-state-v1";

export function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createLocalId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${Date.now()}-${random}`;
}

export function loadAgroLocalSnapshot(initialLeaders: LeaderUser[], initialCrews: Crew[], initialWorkers: Worker[]): AgroLocalSnapshot {
  if (typeof window === "undefined") return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);

    const parsed = JSON.parse(raw) as Partial<AgroLocalSnapshot>;
    return {
      leaders: parsed.leaders?.length ? parsed.leaders : initialLeaders,
      crews: parsed.crews?.length ? parsed.crews : initialCrews,
      workers: parsed.workers?.length ? parsed.workers : initialWorkers,
      progressRecords: parsed.progressRecords ?? [],
      planningRecords: parsed.planningRecords ?? [],
      syncQueue: parsed.syncQueue ?? [],
      lastSyncAt: parsed.lastSyncAt ?? null,
    };
  } catch {
    return createInitialSnapshot(initialLeaders, initialCrews, initialWorkers);
  }
}

export function saveAgroLocalSnapshot(snapshot: AgroLocalSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function buildProgressRecord(input: {
  submission: ProgressSubmission;
  leaderId: string;
  leaderName: string;
  crew: Crew;
}): LocalProgressRecord {
  const remaining = Math.max(0, Number((input.crew.goal - input.submission.progress).toFixed(2)));
  const percentage = input.crew.goal > 0 ? Math.min(100, Math.round((input.submission.progress / input.crew.goal) * 100)) : 0;

  return {
    id: createLocalId("progress"),
    date: getLocalDate(),
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

export function getFortnightRecords(records: LocalProgressRecord[]) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(now.getDate() - 14);
  return records.filter((record) => new Date(record.date) >= cutoff);
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
  return {
    leaders: initialLeaders,
    crews: initialCrews,
    workers: initialWorkers,
    progressRecords: [],
    planningRecords: [],
    syncQueue: [],
    lastSyncAt: null,
  };
}
