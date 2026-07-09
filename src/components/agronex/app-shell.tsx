"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  ClipboardPlus,
  Cloud,
  CloudOff,
  Download,
  Home,
  LayoutGrid,
  ListChecks,
  LockKeyhole,
  MoreHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  crews,
  getCrewForLeader,
  getWorkersForCrew,
  type AppRole,
  type AppScreen,
  type Crew,
  type LeaderUser,
  type Worker,
} from "@/data/agronexData";
import {
  buildProgressRecord,
  createSyncRecord,
  loadAgroLocalSnapshot,
  saveAgroLocalSnapshot,
  syncPendingRecords,
  type LocalPlanningRecord,
  type LocalProgressRecord,
  type SyncQueueRecord,
} from "@/lib/agronex-offline";
import { AgroLogo } from "./brand";
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

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// En producción, reemplazar este acceso temporal por Supabase Auth con usuarios, roles y permisos en base de datos.
const TEMP_SUPERVISOR_PASSWORD = "admin123";
const SUPERVISOR_SESSION_KEY = "agronex-supervisor-authenticated";

export function AgroNexApp() {
  const [localSnapshot] = useState(() => loadAgroLocalSnapshot(crews, crews.flatMap((crew) => getWorkersForCrew(crew.id))));
  const [stage, setStage] = useState<"welcome" | "user-select" | "supervisor-access" | "app">("welcome");
  const [role, setRole] = useState<AppRole>("encargado");
  const [screen, setScreen] = useState<AppScreen>("inicio");
  const [selectedLeader, setSelectedLeader] = useState<LeaderUser | null>(null);
  const [sessionCrews, setSessionCrews] = useState<Crew[]>(localSnapshot.crews);
  const [sessionWorkers, setSessionWorkers] = useState<Worker[]>(localSnapshot.workers);
  const [progressRecords, setProgressRecords] = useState<LocalProgressRecord[]>(localSnapshot.progressRecords);
  const [planningRecords, setPlanningRecords] = useState<LocalPlanningRecord[]>(localSnapshot.planningRecords);
  const [syncQueue, setSyncQueue] = useState<SyncQueueRecord[]>(localSnapshot.syncQueue);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(localSnapshot.lastSyncAt);
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(() => typeof navigator !== "undefined" && !navigator.onLine ? "Sin conexión. Los datos se guardarán en este equipo." : null);

  useEffect(() => {
    saveAgroLocalSnapshot({
      crews: sessionCrews,
      workers: sessionWorkers,
      progressRecords,
      planningRecords,
      syncQueue,
      lastSyncAt,
    });
  }, [lastSyncAt, planningRecords, progressRecords, sessionCrews, sessionWorkers, syncQueue]);

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

  const exit = () => {
    setScreen("inicio");
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
    const record = buildProgressRecord({
      submission,
      leaderId: selectedLeader.id,
      leaderName: selectedLeader.name,
      crew,
    });
    const present = submission.workers.filter((worker) => worker.attendance === "Presente");

    setSessionWorkers((current) => current.map((worker) => submission.workers.find((item) => item.id === worker.id) ?? worker));
    setSessionCrews((current) => current.map((item) => item.leaderId !== selectedLeader.id ? item : {
      ...item,
      progress: submission.progress,
      remaining: Math.max(0, Number((item.goal - submission.progress).toFixed(2))),
      percentage: Math.min(100, Math.round((submission.progress / item.goal) * 100)),
      hoursPerWorker: submission.hours,
      presentWorkers: present.length,
      absentWorkers: submission.workers.length - present.length,
      manHours: present.reduce((sum, worker) => sum + worker.hoursWorked, 0),
    }));
    setProgressRecords((current) => [record, ...current]);
    enqueueSync(createSyncRecord("avance", submission.saveMode === "partial" ? "update" : "create", record));
  };

  const savePlanningRecord = (record: LocalPlanningRecord) => {
    setPlanningRecords((current) => [record, ...current]);
    enqueueSync(createSyncRecord("tarea", "create", record));
  };

  if (stage === "welcome") return <Welcome onLeader={() => setStage("user-select")} onSupervisor={requestSupervisor} />;
  if (stage === "user-select") return <UserSelector onBack={() => setStage("welcome")} onSelect={enterLeader} />;
  if (stage === "supervisor-access") return <SupervisorAccess onCancel={() => setStage("welcome")} onSuccess={authenticateSupervisor} />;

  return (
    <AgroSessionProvider
      value={{
        crews: sessionCrews,
        workers: sessionWorkers,
        progressRecords,
        planningRecords,
        syncQueue,
        lastSyncAt,
        isOnline,
        connectionNotice,
        savePlanningRecord,
        syncNow: () => runSync("manual"),
      }}
    >
      <AppShell
        role={role}
        screen={screen}
        leader={selectedLeader}
        sessionCrews={sessionCrews}
        sessionWorkers={sessionWorkers}
        onSaveProgress={saveProgress}
        onNavigate={setScreen}
        onChangeUser={() => setStage("user-select")}
        onExit={exit}
      />
    </AgroSessionProvider>
  );
}

function Welcome({ onLeader, onSupervisor }: { onLeader: () => void; onSupervisor: () => void }) {
  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-[#123f2e] px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-white sm:place-items-center">
      <div className="ag-grid absolute inset-0 opacity-20" />
      <div className="absolute -right-28 top-[-80px] size-80 rounded-full bg-[#2c8b61]/30 blur-3xl" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-sm flex-col justify-between sm:min-h-0 sm:py-12">
        <button onClick={onSupervisor} aria-label="Acceso de supervisor" className="w-fit rounded-2xl text-left">
          <AgroLogo light />
        </button>

        <div className="my-auto py-14 sm:my-14 sm:py-0">
          <div className="mb-6 grid size-20 place-items-center rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur">
            <UsersRound size={40} className="text-[#bce8cb]" strokeWidth={1.8} />
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-.035em] sm:text-5xl">Tu operación de campo, clara cada día.</h1>
          <p className="mt-5 max-w-xs text-[15px] leading-7 text-white/65">Registra avances, controla cuadrillas y planifica la siguiente jornada.</p>
        </div>

        <button onClick={onLeader} className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-5 font-extrabold text-[#174c37] shadow-xl shadow-black/15 transition active:scale-[.98]">
          Ingresar como encargado
          <span className="grid size-9 place-items-center rounded-xl bg-[#e8f4ec]">
            <UserRound size={18} />
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

function AppShell({
  role,
  screen,
  leader,
  sessionCrews,
  sessionWorkers,
  onSaveProgress,
  onNavigate,
  onChangeUser,
  onExit,
}: {
  role: AppRole;
  screen: AppScreen;
  leader: LeaderUser | null;
  sessionCrews: Crew[];
  sessionWorkers: Worker[];
  onSaveProgress: (submission: ProgressSubmission) => void;
  onNavigate: (screen: AppScreen) => void;
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
            <p className="text-sm font-bold">{title}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">AgroNex</p>
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
              {role === "supervisor" ? "Supervisor general" : leader?.name}
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-[calc(64px+env(safe-area-inset-top))] z-40 hidden w-64 border-r border-[#dfe7e1] bg-white p-4 md:flex md:flex-col">
        <nav className="space-y-1">
          {primaryNav(role).map((item) => <NavButton key={item.screen} {...item} active={screen === item.screen} onClick={() => onNavigate(item.screen)} desktop />)}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#f0f6f2] p-4">
          <p className="text-xs font-bold text-[#315343]">{role === "supervisor" ? "Operación general" : crew?.name}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#75857c]">{role === "supervisor" ? `${sessionCrews.length} labores activas` : `${crew?.labor} · ${crew?.sector}`}</p>
          {crew && <div className="mt-3"><ProgressBarMini value={crew.percentage} /></div>}
        </div>
      </aside>

      <main className="mx-auto max-w-[1440px] overflow-x-hidden px-4 pb-[calc(104px+env(safe-area-inset-bottom))] pt-[calc(88px+env(safe-area-inset-top))] sm:px-6 md:pb-10 md:pl-[280px] md:pr-8 md:pt-[calc(88px+env(safe-area-inset-top))] lg:px-10 lg:pl-[296px]">
        <ConnectionNotice text={connectionNotice} isOnline={isOnline} />
        {role === "encargado" && leader && crew ? (
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
  if (screen === "trabajadores") return <MyWorkersScreen crew={crew} workers={workers} />;
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
};

function primaryNav(role: AppRole): { screen: AppScreen; label: string; icon: typeof Home }[] {
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
        { screen: "planificacion", label: "Planificar", icon: LayoutGrid },
        { screen: "avances", label: "Avances", icon: ListChecks },
        { screen: "reportes", label: "Reportes", icon: BarChart3 },
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
  const Icon = isOnline ? Cloud : CloudOff;
  return (
    <span className={`flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-[10px] font-extrabold ${isOnline ? "bg-white/10 text-white" : "bg-[#f4ba50] text-[#173c2d]"}`}>
      <Icon size={15} />
      <span>{isOnline ? "En línea" : "Sin conexión"}</span>
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

