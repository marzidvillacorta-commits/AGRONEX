"use client";

import { createContext, useContext } from "react";
import { crews as initialCrews, workers as initialWorkers, type Crew, type Worker } from "@/data/agronexData";

const AgroSessionContext = createContext<{ crews: Crew[]; workers: Worker[] }>({ crews: initialCrews, workers: initialWorkers });

export function AgroSessionProvider({ crews, workers, children }: { crews: Crew[]; workers: Worker[]; children: React.ReactNode }) {
  return <AgroSessionContext.Provider value={{ crews, workers }}>{children}</AgroSessionContext.Provider>;
}

export function useAgroSession() {
  return useContext(AgroSessionContext);
}
