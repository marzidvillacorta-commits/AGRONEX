"use client";

import { createContext, useContext } from "react";
import { crews as initialCrews, workers as initialWorkers, type Crew, type Worker } from "@/data/agronexData";
import type { LocalPlanningRecord, LocalProgressRecord, SyncQueueRecord } from "@/lib/agronex-offline";

type AgroSessionContextValue = {
  crews: Crew[];
  workers: Worker[];
  progressRecords: LocalProgressRecord[];
  planningRecords: LocalPlanningRecord[];
  syncQueue: SyncQueueRecord[];
  lastSyncAt: string | null;
  isOnline: boolean;
  connectionNotice: string | null;
  savePlanningRecord: (record: LocalPlanningRecord) => void;
  syncNow: () => number;
};

const AgroSessionContext = createContext<AgroSessionContextValue>({
  crews: initialCrews,
  workers: initialWorkers,
  progressRecords: [],
  planningRecords: [],
  syncQueue: [],
  lastSyncAt: null,
  isOnline: true,
  connectionNotice: null,
  savePlanningRecord: () => {},
  syncNow: () => 0,
});

export function AgroSessionProvider({ value, children }: { value: AgroSessionContextValue; children: React.ReactNode }) {
  return <AgroSessionContext.Provider value={value}>{children}</AgroSessionContext.Provider>;
}

export function useAgroSession() {
  return useContext(AgroSessionContext);
}
