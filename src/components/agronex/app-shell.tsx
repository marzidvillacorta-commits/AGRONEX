"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  ClipboardCheck,
  ClipboardPlus,
  CloudOff,
  Download,
  FileSearch,
  History,
  Home,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  LockKeyhole,
  LogOut,
  MoreHorizontal,
  Settings,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  crews,
  getBaseGoal,
  getCrewForLeader,
  getOperationCatalog,
  getWorkersForCrew,
  leaders,
  operations,
  type AppRole,
  type AppScreen,
  type Crew,
  type LeaderUser,
  type OperationName,
  type Worker,
} from "@/data/agronexData";
import {
  buildProgressRecord,
  createEmptyDailyRecord,
  createSyncRecord,
  loadAgroLocalSnapshot,
  saveAgroLocalSnapshot,
  syncPendingRecords,
  type DailyRecord,
  type LocalPlanningRecord,
  type LocalProgressRecord,
  type SyncQueueRecord,
} from "@/lib/agronex-offline";
import { applyProductivityToCrew, calculateCrewProductivity, normalizeWorkerAttendance } from "@/lib/agronex-productivity";
import { AgroLogo } from "./brand";
import { ScreenHeading } from "./ui";
import {
  LeaderHome,
  LeaderMore,
  LeaderPending,
  LeaderPerformance,
  LeaderRegister,
  MyCrewScreen,
  MyWorkersScreen,
} from "./leader-screens";
import type { ProgressSubmission } from "./register-form";
import { AgroSessionProvider, useAgroSession } from "./session-context";
import {
  AdvancesScreen,
  ConfigScreen,
  CrewsScreen,
  GlobalWorkersScreen,
  LeadersScreen,
  PlanningScreen,
  SectorsScreen,
  SyncScreen,
  SupervisorDashboard,
  SupervisorMore,
  SupervisorPending,
  SupervisorReports,
} from "./supervisor-screens";
import { UserSelector } from "./user-selector";
import {
  HRPanel, HRPersonal, HRSeguimiento, HREvaluaciones,
  HRNecesidad, HRConvocatorias, HRPostulantes, HRHistorial, HRConfig, HRWorker,
} from "./hr-screens";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// En producción, reemplazar este acceso temporal por Supabase Auth con usuarios, roles y permisos en base de datos.
const TEMP_SUPERVISOR_PASSWORD = "admin123";
const SUPERVISOR_SESSION_KEY = "agronex-supervisor-authenticated";
const HR_USER = "rrhh";
const HR_PASSWORD = "123";
const HR_SESSION_KEY = "agronex-hr-authenticated";

export function AgroNexApp() {
  const [localSnapshot] = useState(() => loadAgroLocalSnapshot(leaders, crews, crews.flatMap((crew) => getWorkersForCrew(crew.id))));
  const [stage, setStage] = useState<"welcome" | "user-select" | "supervisor-access" | "hr-access" | "app">("welcome");
  const [role, setRole] = useState<AppRole>("encargado");
  const [screen, setScreen] = useState<AppScreen>("inicio");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [selectedOperation, setSelectedOperation] = useState<OperationName>("Palto");
  const [selectedLeader, setSelectedLeader] = useState<LeaderUser | null>(null);
  const [sessionLeaders, setSessionLeaders] = useState<LeaderUser[]>(localSnapshot.leaders);
  const [sessionCrews, setSessionCrews] = useState<Crew[]>(localSnapshot.crews);
  const [sessionWorkers, setSessionWorkers] = useState<Worker[]>(localSnapshot.workers);
  const [progressRecords, setProgressRecords] = useState<LocalProgressRecord[]>(localSnapshot.progressRecords);
  const [planningRecords, setPlanningRecords] = useState<LocalPlanningRecord[]>(localSnapshot.planningRecords);
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(localSnapshot.dailyRecords);
  const [operationalDate] = useState(localSnapshot.operationalDate);
  const [operationalNotice] = useState<string | null>(localSnapshot.operationalNotice);
  const [syncQueue, setSyncQueue] = useState<SyncQueueRecord[]>(localSnapshot.syncQueue);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(localSnapshot.lastSyncAt);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(() => typeof navigator !== "undefined" && !navigator.onLine ? "Sin conexión. Los datos se guardarán en este equipo." : null);
  const operationCatalog = useMemo(() => getOperationCatalog(selectedOperation), [selectedOperation]);
  const filteredLeaders = useMemo(() => sessionLeaders.filter((leader) => leader.crop === selectedOperation), [selectedOperation, sessionLeaders]);
  const filteredCrews = useMemo(() => sessionCrews.filter((crew) => crew.crop === selectedOperation), [selectedOperation, sessionCrews]);
  const filteredCrewIds = useMemo(() => new Set(filteredCrews.map((crew) => crew.id)), [filteredCrews]);
  const filteredWorkers = useMemo(() => sessionWorkers.filter((worker) => filteredCrewIds.has(worker.crewId) || worker.crop === selectedOperation), [filteredCrewIds, selectedOperation, sessionWorkers]);
  const filteredProgressRecords = useMemo(() => progressRecords.filter((record) => record.crop === selectedOperation), [progressRecords, selectedOperation]);
  const filteredPlanningRecords = useMemo(() => planningRecords.filter((record) => record.crop === selectedOperation), [planningRecords, selectedOperation]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (sessionStorage.getItem(HR_SESSION_KEY) === "true") {
        setRole("rrhh");
        setScreen("hr-panel");
        setStage("app");
      } else if (sessionStorage.getItem(SUPERVISOR_SESSION_KEY) === "true") {
        setRole("supervisor");
        setScreen("inicio");
        setStage("app");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveAgroLocalSnapshot({
      leaders: sessionLeaders,
      crews: sessionCrews,
      workers: sessionWorkers,
      progressRecords,
      planningRecords,
      dailyRecords,
      operationalDate,
      operationalNotice,
      syncQueue,
      lastSyncAt,
    });
  }, [dailyRecords, lastSyncAt, operationalDate, operationalNotice, planningRecords, progressRecords, sessionCrews, sessionLeaders, sessionWorkers, syncQueue]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setConnectionNotice("Sin conexión. Los datos se guardarán en este equipo.");
    };

    const handleOnline = () => {
      setIsOnline(true);
      setConnectionNotice("Conexión recuperada. Registros listos para sincronizar.");
      window.setTimeout(() => runSync("auto"), 700);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !syncQueue.some((record) => record.status === "pending")) return;
    runSync("auto");
  }, [isOnline, syncQueue]);

  const changeOperation = (operation: OperationName) => {
    setSelectedOperation(operation);
    setSelectedLeader(null);
    setScreen("inicio");
  };

  const enterLeader = (leader: LeaderUser) => {
    setSelectedLeader(leader);
    setRole("encargado");
    setScreen("inicio");
    setStage("app");
  };

  const requestSupervisor = () => {
    if (sessionStorage.getItem(SUPERVISOR_SESSION_KEY) === "true") enterSupervisor();
    else setStage("supervisor-access");
  };

  const enterSupervisor = () => {
    setRole("supervisor");
    setScreen("inicio");
    setStage("app");
  };

  const authenticateSupervisor = () => {
    sessionStorage.setItem(SUPERVISOR_SESSION_KEY, "true");
    enterSupervisor();
  };

  const requestHRAccess = () => {
    if (sessionStorage.getItem(HR_SESSION_KEY) === "true") enterHR();
    else setStage("hr-access");
  };

  const enterHR = () => {
    setRole("rrhh");
    setScreen("hr-panel");
    setStage("app");
  };

  const authenticateHR = () => {
    sessionStorage.setItem(HR_SESSION_KEY, "true");
    enterHR();
  };

  const exit = () => {
    sessionStorage.removeItem(HR_SESSION_KEY);
    sessionStorage.removeItem(SUPERVISOR_SESSION_KEY);
    setScreen("inicio");
    setSelectedWorkerId(null);
    setStage("welcome");
  };

  const enqueueSync = (record: SyncQueueRecord) => {
    setSyncQueue((current) => {
      const next = [record, ...current];

      if (!isOnline) {
        setConnectionNotice("Guardado en este equipo. Se sincronizará cuando vuelva la conexión.");
        return next;
      }

      const result = syncPendingRecords(next);
      if (result.syncedCount > 0) {
        setLastSyncAt(result.lastSyncAt);
        setConnectionNotice("Registros sincronizados.");
      }
      return result.syncQueue;
    });
  };

  function runSync(mode: "auto" | "manual") {
    let synced = 0;

    setSyncQueue((current) => {
      const result = syncPendingRecords(current);
      synced = result.syncedCount;
      if (result.syncedCount > 0) setLastSyncAt(result.lastSyncAt);
      if (mode === "manual" || result.syncedCount > 0) {
        setConnectionNotice(result.syncedCount > 0 ? "Registros sincronizados." : "Todos los registros están actualizados.");
      }
      return result.syncQueue;
    });

    return synced;
  }

  const saveProgress = (submission: ProgressSubmission) => {
    if (!selectedLeader) return;

    const crew = sessionCrews.find((item) => item.leaderId === selectedLeader.id) ?? getCrewForLeader(selectedLeader.id);
    const normalizedWorkers = submission.workers.map((worker) => normalizeWorkerAttendance(worker, worker.attendance));
    const summary = calculateCrewProductivity(crew, normalizedWorkers);
    const record = buildProgressRecord({
      submission: { ...submission, progress: summary.progress, hours: summary.manHours, workers: normalizedWorkers },
      leaderId: selectedLeader.id,
      leaderName: selectedLeader.name,
      crew,
      date: operationalDate,
    });

    setSessionWorkers((current) => current.map((worker) => normalizedWorkers.find((item) => item.id === worker.id) ?? worker));
    setSessionCrews((current) => current.map((item) => item.leaderId !== selectedLeader.id ? item : {
      ...item,
      progress: summary.progress,
      remaining: summary.remaining,
      percentage: summary.percentage,
      hoursPerWorker: summary.presentWorkers ? 8 : 0,
      presentWorkers: summary.presentWorkers,
      absentWorkers: summary.absentWorkers,
      manHours: summary.manHours,
      status: summary.percentage >= 100 ? "Terminado" : summary.progress > 0 ? "En proceso" : "Pendiente",
    }));
    setProgressRecords((current) => [record, ...current]);
    setDailyRecords((current) => {
      const day = current[operationalDate] ?? createEmptyDailyRecord();
      return {
        ...current,
        [operationalDate]: {
          ...day,
          progress: [record, ...day.progress.filter((item) => item.leaderId !== selectedLeader.id)],
          attendance: [...normalizedWorkers],
          workerOutputs: [...normalizedWorkers],
          pending: record.remaining > 0
            ? [
                {
                  crewId: record.crewId,
                  leaderId: record.leaderId,
                  leaderName: record.leaderName,
                  labor: record.labor,
                  sector: record.sector,
                  remaining: record.remaining,
                  unit: record.unit,
                  date: record.date,
                },
                ...day.pending.filter((item) => item.crewId !== record.crewId),
              ]
            : day.pending.filter((item) => item.crewId !== record.crewId),
        },
      };
    });
    enqueueSync(createSyncRecord("avance", submission.saveMode === "partial" ? "update" : "create", record));
  };

  const savePlanningRecord = (record: LocalPlanningRecord) => {
    setPlanningRecords((current) => [record, ...current.filter((item) => !(item.date === record.date && item.leaderId === record.leaderId))]);
    setDailyRecords((current) => {
      const day = current[record.date] ?? createEmptyDailyRecord();
      return {
        ...current,
        [record.date]: {
          ...day,
          tasks: [record, ...day.tasks.filter((item) => item.leaderId !== record.leaderId)],
        },
      };
    });
    if (record.date === operationalDate) {
      const existingProgress = progressRecords.find((item) => item.date === record.date && item.leaderId === record.leaderId);
      const progress = existingProgress?.progress ?? 0;
      const remaining = Math.max(0, Number((record.goal - progress).toFixed(2)));
      if (!existingProgress) {
        setSessionWorkers((current) => current.map((worker) => worker.crewId === record.crewId ? {
          ...worker,
          attendance: "Ausente" as const,
          dailyOutput: 0,
          hoursWorked: 0,
          observation: "",
          unit: record.unit,
          crop: record.crop as OperationName,
          labor: record.labor,
          sector: record.sector,
        } : worker));
      }
      setSessionCrews((current) => current.map((crew) => crew.id !== record.crewId ? crew : {
        ...crew,
        labor: record.labor,
        crop: record.crop as OperationName,
        sector: record.sector,
        goal: record.goal,
        progress,
        remaining,
        unit: record.unit,
        percentage: record.goal > 0 ? Math.min(100, Math.round((progress / record.goal) * 100)) : 0,
        presentWorkers: existingProgress ? crew.presentWorkers : 0,
        absentWorkers: existingProgress ? crew.absentWorkers : crew.totalWorkers,
        hoursPerWorker: existingProgress ? crew.hoursPerWorker : 0,
        manHours: existingProgress ? crew.manHours : 0,
        status: progress >= record.goal && record.goal > 0 ? "Terminado" : progress > 0 ? "En proceso" : "Pendiente",
      }));
    }
    enqueueSync(createSyncRecord("tarea", "create", record));
  };

  const addLeader = (leader: LeaderUser) => {
    const scopedLeader = {
      ...leader,
      crop: selectedOperation,
      sector: operationCatalog.sectors.includes(leader.sector) ? leader.sector : operationCatalog.sectors[0],
      labor: operationCatalog.labors.includes(leader.labor) ? leader.labor : operationCatalog.labors[0],
    };
    const baseGoal = getBaseGoal(selectedOperation, scopedLeader.labor);
    const crew: Crew = {
      id: scopedLeader.crewId,
      name: scopedLeader.crewName,
      leaderId: scopedLeader.id,
      leaderName: scopedLeader.name,
      labor: scopedLeader.labor,
      crop: scopedLeader.crop,
      sector: scopedLeader.sector,
      totalWorkers: 0,
      presentWorkers: 0,
      absentWorkers: 0,
      goal: baseGoal?.goal ?? 0,
      progress: 0,
      remaining: baseGoal?.goal ?? 0,
      unit: baseGoal?.unit ?? "unidades",
      percentage: 0,
      hoursPerWorker: 0,
      manHours: 0,
      status: scopedLeader.status,
    };
    setSessionLeaders((current) => [scopedLeader, ...current]);
    setSessionCrews((current) => [crew, ...current]);
    enqueueSync(createSyncRecord("encargado", "create", scopedLeader));
  };

  const addWorker = (worker: Worker) => {
    const normalized = normalizeWorkerAttendance(worker, worker.attendance);
    setSessionWorkers((current) => {
      const next = [normalized, ...current];
      setSessionCrews((crews) => recalculateCrews(crews, next, sessionLeaders));
      return next;
    });
    setDailyRecords((current) => updateDailyWorkers(current, operationalDate, [normalized]));
    enqueueSync(createSyncRecord("trabajador", "create", normalized));
  };

  const updateWorker = (worker: Worker) => {
    const normalized = normalizeWorkerAttendance(worker, worker.attendance);
    setSessionWorkers((current) => {
      const next = current.map((item) => item.id === normalized.id ? normalized : item);
      setSessionCrews((crews) => recalculateCrews(crews, next, sessionLeaders));
      return next;
    });
    setDailyRecords((current) => updateDailyWorkers(current, operationalDate, [normalized]));
    enqueueSync(createSyncRecord("trabajador", "update", normalized));
  };

  const deleteWorker = (workerId: string) => {
    setSessionWorkers((current) => {
      const deleted = current.find((worker) => worker.id === workerId);
      const next = current.filter((worker) => worker.id !== workerId);
      setSessionCrews((crews) => recalculateCrews(crews, next, sessionLeaders));
      enqueueSync(createSyncRecord("trabajador", "delete", deleted ?? { id: workerId }));
      return next;
    });
  };

  const updateLeader = (leader: LeaderUser) => {
    setSessionLeaders((current) => current.map((item) => item.id === leader.id ? leader : item));
    setSessionCrews((current) => current.map((crew) => crew.leaderId === leader.id ? { ...crew, leaderName: leader.name, labor: leader.labor, crop: leader.crop, sector: leader.sector, name: leader.crewName, status: leader.status } : crew));
    setSessionWorkers((current) => current.map((worker) => worker.assignedTo === leader.id ? { ...worker, assignedName: leader.name, crewId: leader.crewId, crewName: leader.crewName, crop: leader.crop, labor: leader.labor, sector: leader.sector, unit: worker.unit } : worker));
    if (selectedLeader?.id === leader.id) setSelectedLeader(leader);
    enqueueSync(createSyncRecord("encargado", "update", leader));
  };

  const deleteLeader = (leaderId: string) => {
    const deleted = sessionLeaders.find((leader) => leader.id === leaderId);
    setSessionLeaders((current) => current.filter((leader) => leader.id !== leaderId));
    setSessionWorkers((current) => {
      const next = current.map((worker) => worker.assignedTo === leaderId ? { ...worker, assignedTo: "", assignedName: "Sin encargado", crewId: "", crewName: "Sin cuadrilla", status: "Sin cuadrilla" as const } : worker);
      setSessionCrews((crews) => recalculateCrews(crews.map((crew) => crew.leaderId === leaderId ? { ...crew, leaderName: "Sin encargado", presentWorkers: 0, absentWorkers: 0, totalWorkers: 0, progress: 0, remaining: crew.goal, percentage: 0, manHours: 0, status: "Pendiente" as const } : crew), next, sessionLeaders.filter((leader) => leader.id !== leaderId)));
      return next;
    });
    if (selectedLeader?.id === leaderId) exit();
    enqueueSync(createSyncRecord("encargado", "delete", deleted ?? { id: leaderId }));
  };

  if (stage === "welcome") return <Welcome selectedOperation={selectedOperation} onOperationChange={changeOperation} onLeader={() => setStage("user-select")} onSupervisor={requestSupervisor} onHR={requestHRAccess} />;
  if (stage === "user-select") return <UserSelector operation={selectedOperation} leaders={filteredLeaders} onBack={() => setStage("welcome")} onSelect={enterLeader} />;
  if (stage === "supervisor-access") return <SupervisorAccess onCancel={() => setStage("welcome")} onSuccess={authenticateSupervisor} />;
  if (stage === "hr-access") return <HRAccess onCancel={() => setStage("welcome")} onSuccess={authenticateHR} />;

  return (
    <AgroSessionProvider
      value={{
        crews: filteredCrews,
        leaders: filteredLeaders,
        workers: filteredWorkers,
        currentOperation: selectedOperation,
        operationCatalog,
        progressRecords: filteredProgressRecords,
        planningRecords: filteredPlanningRecords,
        dailyRecords,
        operationalDate,
        operationalNotice,
        syncQueue,
        lastSyncAt,
        isOnline,
        connectionNotice,
        savePlanningRecord,
        addLeader,
        addWorker,
        updateWorker,
        deleteWorker,
        updateLeader,
        deleteLeader,
        syncNow: () => runSync("manual"),
      }}
    >
      <AppShell
        role={role}
        screen={screen}
        leader={selectedLeader}
        currentOperation={selectedOperation}
        sessionCrews={filteredCrews}
        sessionWorkers={filteredWorkers}
        allWorkers={sessionWorkers}
        allRecords={progressRecords}
        onSaveProgress={saveProgress}
        onNavigate={setScreen}
        selectedWorkerId={selectedWorkerId}
        onOpenWorker={(workerId) => { setSelectedWorkerId(workerId); setScreen("hr-trabajador"); }}
        onChangeUser={() => setStage("user-select")}
        onExit={exit}
      />
    </AgroSessionProvider>
  );
}

function Welcome({
  selectedOperation,
  onOperationChange,
  onLeader,
  onSupervisor,
  onHR,
}: {
  selectedOperation: OperationName;
  onOperationChange: (operation: OperationName) => void;
  onLeader: () => void;
  onSupervisor: () => void;
  onHR: () => void;
}) {
  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-[#123f2e] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-white sm:place-items-center">
      <div className="ag-grid absolute inset-0 opacity-20" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-sm flex-col justify-between sm:min-h-0 sm:py-12">
        <button onClick={onSupervisor} aria-label="Acceso de supervisor" className="w-fit rounded-2xl text-left">
          <AgroLogo light />
        </button>

        <div className="my-auto py-12 sm:my-12 sm:py-0">
          <div className="mb-6 grid size-20 place-items-center rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
            <UsersRound size={40} className="text-[#bce8cb]" strokeWidth={1.8} />
          </div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-white/45">Operación agrícola</p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1.5">
            {operations.map((operation) => (
              <button
                key={operation.id}
                onClick={() => onOperationChange(operation.name)}
                className={`min-h-12 rounded-xl text-sm font-extrabold transition ${selectedOperation === operation.name ? "bg-white text-[#174c37]" : "text-white/70"}`}
                type="button"
              >
                {operation.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-white/65">Selecciona el cultivo antes de ingresar.</p>
        </div>

        <button onClick={onLeader} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-5 font-extrabold text-[#174c37] shadow-xl shadow-black/15 transition active:scale-[.98]">
          Ingresar como encargado
          <span className="grid size-9 place-items-center rounded-xl bg-[#e8f4ec]">
            <UserRound size={18} />
          </span>
        </button>
        <button onClick={onHR} className="mt-3 flex min-h-14 w-full items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-5 font-extrabold text-white shadow-lg shadow-black/10 transition active:scale-[.98]">
          Acceso de RR. HH.
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 text-white">
            <UsersRound size={18} />
          </span>
        </button>
        <p className="mt-5 text-center text-[10px] font-semibold tracking-[.14em] text-white/35">by Zidnex Digital</p>
      </div>
    </main>
  );
}

function SupervisorAccess({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === TEMP_SUPERVISOR_PASSWORD) {
      onSuccess();
      return;
    }
    setError(true);
    setPassword("");
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#123f2e] px-5 py-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="ag-grid absolute inset-0 opacity-20" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-black/20 sm:p-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]">
          <LockKeyhole size={22} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#173c2d]">Acceso de supervisor</h1>
        <p className="mt-2 text-sm text-[#718078]">Ingresa la contraseña para continuar.</p>
        <label className="ag-label mt-6 block">
          Contraseña
          <input
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(false);
            }}
            className={`ag-field ${error ? "border-[#c45b48]" : ""}`}
            type="password"
            required
          />
        </label>
        {error && <p role="alert" className="mt-3 text-xs font-bold text-[#b84d3a]">Contraseña incorrecta. Intenta nuevamente.</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="submit" className="ag-primary">Ingresar</button>
          <button type="button" onClick={onCancel} className="ag-secondary">Cancelar</button>
        </div>
      </form>
    </main>
  );
}

function HRAccess({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (username === HR_USER && password === HR_PASSWORD) {
      onSuccess();
      return;
    }
    setError(true);
    setPassword("");
  };

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#123f2e] px-5 py-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="ag-grid absolute inset-0 opacity-20" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl shadow-black/20 sm:p-7">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]">
          <UsersRound size={22} />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#173c2d]">Acceso de RR. HH.</h1>
        <p className="mt-2 text-sm text-[#718078]">Ingresa tus credenciales para continuar.</p>
        <label className="ag-label mt-6 block">
          Usuario
          <input autoFocus autoComplete="username" value={username} onChange={(e) => { setUsername(e.target.value); setError(false); }} className="ag-field" required />
        </label>
        <label className="ag-label mt-4 block">
          Contraseña
          <input autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} className={`ag-field ${error ? "border-[#c45b48]" : ""}`} type="password" required />
        </label>
        {error && <p role="alert" className="mt-3 text-xs font-bold text-[#b84d3a]">Credenciales incorrectas. Intenta nuevamente.</p>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="submit" className="ag-primary">Ingresar</button>
          <button type="button" onClick={onCancel} className="ag-secondary">Cancelar</button>
        </div>
      </form>
    </main>
  );
}

function AppShell({
  role,
  screen,
  leader,
  currentOperation,
  sessionCrews,
  sessionWorkers,
  allWorkers,
  allRecords,
  onSaveProgress,
  onNavigate,
  selectedWorkerId,
  onOpenWorker,
  onChangeUser,
  onExit,
}: {
  role: AppRole;
  screen: AppScreen;
  leader: LeaderUser | null;
  currentOperation: OperationName;
  sessionCrews: Crew[];
  sessionWorkers: Worker[];
  allWorkers?: Worker[];
  allRecords?: LocalProgressRecord[];
  onSaveProgress: (submission: ProgressSubmission) => void;
  onNavigate: (screen: AppScreen) => void;
  selectedWorkerId: string | null;
  onOpenWorker: (workerId: string) => void;
  onChangeUser: () => void;
  onExit: () => void;
}) {
  const { isOnline, connectionNotice, syncQueue } = useAgroSession();
  const title = screenTitles[screen];
  const isSubScreen = !primaryNav(role).some((item) => item.screen === screen);
  const crew = leader ? sessionCrews.find((item) => item.leaderId === leader.id) ?? getCrewForLeader(leader.id) : null;
  const leaderWorkers = crew ? sessionWorkers.filter((worker) => worker.crewId === crew.id) : [];
  const pendingCount = syncQueue.filter((record) => record.status === "pending").length;
  const goBack = () => onNavigate("mas");

  return (
    <div className="min-h-dvh bg-[#f3f6f3]">
      <header className="fixed inset-x-0 top-0 z-50 h-[calc(64px+env(safe-area-inset-top))] border-b border-white/10 bg-[#164c37]/98 pt-[env(safe-area-inset-top)] text-white shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="hidden md:block"><AgroLogo light /></div>
          {isSubScreen ? (
            <button onClick={goBack} aria-label="Volver" className="grid size-10 place-items-center rounded-xl bg-white/10 md:hidden">
              <ArrowLeft size={19} />
            </button>
          ) : (
            <div className="md:hidden"><AgroLogo compact light /></div>
          )}

          <div className="absolute left-1/2 -translate-x-1/2 text-center md:hidden">
            <p className="max-w-[150px] truncate text-sm font-bold">{title}</p>
          </div>

          <div className="flex items-center gap-2">
            <ConnectionPill isOnline={isOnline} pendingCount={pendingCount} />
            <InstallPrompt />
            <button aria-label="Notificaciones" className="relative grid size-10 place-items-center rounded-xl bg-white/10">
              <Bell size={18} />
              <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-[#f4ba50]" />
            </button>
            <button onClick={() => onNavigate("mas")} aria-label="Perfil y opciones" className="grid size-10 place-items-center rounded-xl bg-white/10 sm:hidden">
              <UserRound size={18} />
            </button>
            <button onClick={() => onNavigate("mas")} className="hidden min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold sm:flex">
              <UserRound size={16} />
              {role === "rrhh" ? "Recursos Humanos" : role === "supervisor" ? "Supervisor general" : leader?.name}
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[calc(64px+env(safe-area-inset-top))] z-40 hidden w-64 border-r border-[#dfe7e1] bg-white p-4 md:flex md:flex-col">
        <nav className="space-y-1">
          {primaryNav(role).map((item) => <NavButton key={item.screen} {...item} active={screen === item.screen} onClick={() => onNavigate(item.screen)} desktop />)}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f0f6f2] p-4">
          {role === "rrhh" ? (
            <>
              <p className="text-xs font-bold text-[#315343]">Recursos Humanos</p>
              <p className="mt-1 text-[11px] leading-5 text-[#75857c]">Gestión de personal</p>
            </>
          ) : role === "supervisor" ? (
            <>
              <p className="text-xs font-bold text-[#315343]">Operación {currentOperation}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#75857c]">{sessionCrews.length} labores activas</p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold text-[#315343]">{crew?.name}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#75857c]">{crew?.labor} · {crew?.sector}</p>
              {crew && <div className="mt-3"><ProgressBarMini value={crew.percentage} /></div>}
            </>
          )}
        </div>
      </aside>

      <main className="mx-auto max-w-[1440px] overflow-x-hidden px-4 pb-[calc(104px+env(safe-area-inset-bottom))] pt-[calc(88px+env(safe-area-inset-top))] sm:px-6 md:pb-10 md:pl-[280px] md:pr-8 md:pt-[calc(88px+env(safe-area-inset-top))] lg:px-10 lg:pl-[296px]">
        <ConnectionNotice text={connectionNotice} isOnline={isOnline} />
        {role === "rrhh" ? (
          <HRRoutes screen={screen} workers={allWorkers ?? sessionWorkers} records={allRecords ?? []} selectedWorkerId={selectedWorkerId} onOpenWorker={onOpenWorker} onNavigate={onNavigate} onExit={onExit} />
        ) : role === "encargado" && leader && crew ? (
          <LeaderRoutes screen={screen} leader={leader} crew={crew} workers={leaderWorkers} onSave={onSaveProgress} onNavigate={onNavigate} onChangeUser={onChangeUser} onExit={onExit} />
        ) : (
          <SupervisorRoutes screen={screen} onNavigate={onNavigate} onExit={onExit} />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe7e1] bg-white/95 px-1 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_25px_rgba(24,61,44,.06)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-around">
          {primaryNav(role).map((item) => <NavButton key={item.screen} {...item} active={screen === item.screen} onClick={() => onNavigate(item.screen)} />)}
        </div>
      </nav>
    </div>
  );
}

function LeaderRoutes({
  screen,
  leader,
  crew,
  workers,
  onSave,
  onNavigate,
  onChangeUser,
  onExit,
}: {
  screen: AppScreen;
  leader: LeaderUser;
  crew: Crew;
  workers: Worker[];
  onSave: (submission: ProgressSubmission) => void;
  onNavigate: (screen: AppScreen) => void;
  onChangeUser: () => void;
  onExit: () => void;
}) {
  if (screen === "registrar") return <LeaderRegister leader={leader} crew={crew} workers={workers} onSave={onSave} />;
  if (screen === "cuadrilla") return <MyCrewScreen leader={leader} crew={crew} workers={workers} />;
  if (screen === "rendimiento") return <LeaderPerformance leader={leader} crew={crew} workers={workers} />;
  if (screen === "trabajadores") return <MyWorkersScreen leader={leader} crew={crew} workers={workers} />;
  if (screen === "pendientes") return <LeaderPending crew={crew} />;
  if (screen === "mas") return <LeaderMore onNavigate={onNavigate} onChangeUser={onChangeUser} onExit={onExit} />;
  return <LeaderHome leader={leader} crew={crew} workers={workers} onNavigate={onNavigate} />;
}

function SupervisorRoutes({ screen, onNavigate, onExit }: { screen: AppScreen; onNavigate: (screen: AppScreen) => void; onExit: () => void }) {
  if (screen === "planificacion") return <PlanningScreen />;
  if (screen === "avances") return <AdvancesScreen />;
  if (screen === "reportes") return <SupervisorReports />;
  if (screen === "encargados") return <LeadersScreen />;
  if (screen === "cuadrillas") return <CrewsScreen />;
  if (screen === "trabajadores") return <GlobalWorkersScreen />;
  if (screen === "sectores") return <SectorsScreen />;
  if (screen === "pendientes") return <SupervisorPending onPlan={() => onNavigate("planificacion")} />;
  if (screen === "sincronizacion") return <SyncScreen />;
  if (screen === "configuracion") return <ConfigScreen />;
  if (screen === "mas") return <SupervisorMore onNavigate={onNavigate} onExit={onExit} />;
  return <SupervisorDashboard onNavigate={onNavigate} />;
}

function HRRoutes({ screen, workers, records, selectedWorkerId, onOpenWorker, onNavigate, onExit }: { screen: AppScreen; workers: Worker[]; records: LocalProgressRecord[]; selectedWorkerId: string | null; onOpenWorker: (workerId: string) => void; onNavigate: (screen: AppScreen) => void; onExit: () => void }) {
  if (screen === "hr-trabajador") {
    const worker = workers.find((item) => item.id === selectedWorkerId);
    if (worker) return <HRWorker worker={worker} records={records} onBack={() => onNavigate("hr-personal")} />;
    queueMicrotask(() => onNavigate("hr-personal"));
    return null;
  }
  if (screen === "hr-personal") return <HRPersonal workers={workers} records={records} onOpenWorker={onOpenWorker} />;
  if (screen === "hr-seguimiento") return <HRSeguimiento workers={workers} records={records} onOpenWorker={onOpenWorker} />;
  if (screen === "hr-evaluaciones") return <HREvaluaciones workers={workers} records={records} onOpenWorker={onOpenWorker} />;
  if (screen === "hr-necesidad") return <HRNecesidad onNavigate={onNavigate} />;
  if (screen === "hr-convocatorias") return <HRConvocatorias onNavigate={onNavigate} />;
  if (screen === "hr-postulantes") return <HRPostulantes />;
  if (screen === "hr-historial") return <HRHistorial />;
  if (screen === "hr-config") return <HRConfig />;
  if (screen === "mas") return <HRMore onNavigate={onNavigate} onExit={onExit} />;
  return <HRPanel workers={workers} records={records} onNavigate={onNavigate} onOpenWorker={onOpenWorker} />;
}

function HRMore({ onNavigate, onExit }: { onNavigate: (screen: AppScreen) => void; onExit: () => void }) {
  const items: Array<{ label: string; description: string; icon: typeof Home; screen: AppScreen }> = [
    { label: "Evaluaciones", description: "Desempeño y decisiones", icon: FileSearch, screen: "hr-evaluaciones" },
    { label: "Necesidad de personal", description: "Cálculo de dotación", icon: UserPlus, screen: "hr-necesidad" },
    { label: "Postulantes", description: "Banco de candidatos", icon: UsersRound, screen: "hr-postulantes" },
    { label: "Historial", description: "Cambios y acciones", icon: History, screen: "hr-historial" },
    { label: "Configuración", description: "Parámetros del módulo", icon: Settings, screen: "hr-config" },
  ];
  return (
    <div>
      <ScreenHeading eyebrow="Recursos Humanos" title="Más opciones" description="Gestión completa de personal." />
      <div className="ag-card divide-y divide-[#edf1ee]">
        {items.map(({ label, description, icon: Icon, screen }) => (
          <button key={label} onClick={() => onNavigate(screen)} className="flex min-h-[72px] w-full items-center gap-4 px-5 text-left hover:bg-[#f7f9f7]">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf5f0] text-[#247a56]">
              <Icon size={19} />
            </span>
            <span className="flex-1">
              <strong className="block text-sm text-[#294a3b]">{label}</strong>
              <span className="mt-1 block text-xs text-[#7b8981]">{description}</span>
            </span>
            <ArrowRight size={17} className="text-[#8d9992]" />
          </button>
        ))}
        <button onClick={onExit} className="flex min-h-[72px] w-full items-center gap-4 px-5 text-left hover:bg-[#fff6f3]">
          <span className="grid size-10 place-items-center rounded-xl bg-[#fff0ed] text-[#bd513c]">
            <LogOut size={19} />
          </span>
          <span>
            <strong className="block text-sm text-[#6d3d34]">Salir</strong>
            <span className="mt-1 block text-xs text-[#7b8981]">Cerrar sesión de RR. HH.</span>
          </span>
        </button>
      </div>
    </div>
  );
}

const screenTitles: Record<AppScreen, string> = {
  inicio: "Inicio",
  registrar: "Registrar",
  cuadrilla: "Mi cuadrilla",
  rendimiento: "Rendimiento",
  mas: "Más",
  trabajadores: "Trabajadores",
  pendientes: "Pendientes",
  planificacion: "Planificación",
  avances: "Avances",
  reportes: "Reportes",
  encargados: "Encargados",
  cuadrillas: "Cuadrillas",
  sectores: "Sectores",
  configuracion: "Configuración",
  sincronizacion: "Sincronización",
  "hr-panel": "Panel de personal",
  "hr-personal": "Personal",
  "hr-trabajador": "Trabajador",
  "hr-seguimiento": "Seguimiento",
  "hr-evaluaciones": "Evaluaciones",
  "hr-necesidad": "Necesidad de personal",
  "hr-convocatorias": "Convocatorias",
  "hr-postulantes": "Postulantes",
  "hr-historial": "Historial",
  "hr-config": "Configuración",
};

function primaryNav(role: AppRole): { screen: AppScreen; label: string; icon: typeof Home }[] {
  if (role === "rrhh") {
    return [
      { screen: "hr-panel", label: "Panel", icon: LayoutDashboard },
      { screen: "hr-personal", label: "Personal", icon: UsersRound },
      { screen: "hr-seguimiento", label: "Seguimiento", icon: ClipboardCheck },
      { screen: "hr-convocatorias", label: "Convocatorias", icon: BarChart3 },
      { screen: "mas", label: "Más", icon: MoreHorizontal },
    ];
  }
  return role === "encargado"
    ? [
        { screen: "inicio", label: "Inicio", icon: Home },
        { screen: "registrar", label: "Registrar", icon: ClipboardPlus },
        { screen: "cuadrilla", label: "Mi cuadrilla", icon: UsersRound },
        { screen: "rendimiento", label: "Rendimiento", icon: BarChart3 },
        { screen: "mas", label: "Más", icon: MoreHorizontal },
      ]
    : [
        { screen: "inicio", label: "Inicio", icon: Home },
        { screen: "planificacion", label: "Planificación", icon: LayoutGrid },
        { screen: "sectores", label: "Sectores", icon: ListChecks },
        { screen: "reportes", label: "Productividad", icon: BarChart3 },
        { screen: "mas", label: "Más", icon: MoreHorizontal },
      ];
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
  desktop,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
  desktop?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={desktop
        ? `flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${active ? "bg-[#e9f6ef] text-[#18794e]" : "text-[#6f7f76] hover:bg-[#f5f7f5]"}`
        : `flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[10px] font-bold transition ${active ? "text-[#18794e]" : "text-[#829087]"}`}
    >
      <Icon size={desktop ? 19 : 21} strokeWidth={active ? 2.6 : 2} />
      {label}
    </button>
  );
}

function ConnectionPill({ isOnline, pendingCount }: { isOnline: boolean; pendingCount: number }) {
  return (
    <span className={`flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-[10px] font-extrabold ${isOnline ? "bg-white/5 text-white" : "bg-[#f4ba50] text-[#173c2d]"}`} title={isOnline ? "En línea" : "Sin conexión"}>
      {isOnline ? <span className="size-2 rounded-full bg-[#85e0a7]" /> : <CloudOff size={14} />}
      <span className={isOnline ? "sr-only" : ""}>{isOnline ? "En línea" : "Sin conexión"}</span>
      {pendingCount > 0 && <span className="rounded-full bg-white/20 px-1.5 py-0.5">{pendingCount}</span>}
    </span>
  );
}

function ConnectionNotice({ text, isOnline }: { text: string | null; isOnline: boolean }) {
  const message = text ?? (!isOnline ? "Sin conexión. Los datos se guardarán en este equipo." : null);
  if (!message) return null;

  return (
    <div className={`mb-4 rounded-2xl px-4 py-3 text-sm font-bold ${isOnline ? "bg-[#e9f6ef] text-[#18794e]" : "bg-[#fff8e7] text-[#8b650b]"}`}>
      {message}
    </div>
  );
}

function ProgressBarMini({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white">
      <div className="h-full rounded-full bg-[#24905f]" style={{ width: `${value}%` }} />
    </div>
  );
}

function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const handler = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <button
      onClick={async () => {
        await prompt.prompt();
        await prompt.userChoice;
        setPrompt(null);
      }}
      className="hidden min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#174c37] sm:flex"
    >
      <Download size={16} />
      Instalar
    </button>
  );
}

function recalculateCrews(currentCrews: Crew[], workers: Worker[], leaders: LeaderUser[]) {
  return currentCrews.map((crew) => {
    const leader = leaders.find((item) => item.id === crew.leaderId);
    const crewWorkers = workers.filter((worker) => worker.crewId === crew.id && worker.status !== "Sin cuadrilla");

    return applyProductivityToCrew({
      ...crew,
      leaderName: leader?.name ?? crew.leaderName,
      labor: leader?.labor ?? crew.labor,
      crop: leader?.crop ?? crew.crop,
      sector: leader?.sector ?? crew.sector,
      name: leader?.crewName ?? crew.name,
    }, crewWorkers);
  });
}

function updateDailyWorkers(current: Record<string, DailyRecord>, date: string, workers: Worker[]) {
  const day = current[date] ?? createEmptyDailyRecord();
  const workerIds = new Set(workers.map((worker) => worker.id));
  const merge = (list: Worker[]) => [
    ...workers,
    ...list.filter((worker) => !workerIds.has(worker.id)),
  ];

  return {
    ...current,
    [date]: {
      ...day,
      attendance: merge(day.attendance),
      workerOutputs: merge(day.workerOutputs),
    },
  };
}

