"use client";

import { createContext, useContext } from "react";
import { crews as initialCrews, leaders as initialLeaders, workers as initialWorkers, type Crew, type LeaderUser, type Worker } from "@/data/agronexData";
import type { LocalPlanningRecord, LocalProgressRecord, SyncQueueRecord } from "@/lib/agronex-offline";

type AgroSessionContextValue = {
  leaders: LeaderUser[];
  crews: Crew[];
  workers: Worker[];
  progressRecords: LocalProgressRecord[];
  planningRecords: LocalPlanningRecord[];
  syncQueue: SyncQueueRecord[];
  lastSyncAt: string | null;
  isOnline: boolean;
  connectionNotice: string | null;
  savePlanningRecord: (record: LocalPlanningRecord) => void;
  addLeader: (leader: LeaderUser) => void;
  addWorker: (worker: Worker) => void;
  updateWorker: (worker: Worker) => void;
  deleteWorker: (workerId: string) => void;
  updateLeader: (leader: LeaderUser) => void;
  deleteLeader: (leaderId: string) => void;
  syncNow: () => number;
};

const AgroSessionContext = createContext<AgroSessionContextValue>({
  leaders: initialLeaders,
  crews: initialCrews,
  workers: initialWorkers,
  progressRecords: [],
  planningRecords: [],
  syncQueue: [],
  lastSyncAt: null,
  isOnline: true,
  connectionNotice: null,
  savePlanningRecord: () => {},
  addLeader: () => {},
  addWorker: () => {},
  updateWorker: () => {},
  deleteWorker: () => {},
  updateLeader: () => {},
  deleteLeader: () => {},
  syncNow: () => 0,
});

export function AgroSessionProvider({ value, children }: { value: AgroSessionContextValue; children: React.ReactNode }) {
  return <AgroSessionContext.Provider value={value}>{children}</AgroSessionContext.Provider>;
}

export function useAgroSession() {
  return useContext(AgroSessionContext);
}
