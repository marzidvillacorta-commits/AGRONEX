"use client";

import { useEffect, useState } from "react";
import { BarChart3, Bell, ChevronRight, ClipboardPlus, Download, Home, Leaf, LockKeyhole, MapPinned, Settings2, ShieldCheck, Sprout, UserRound, UsersRound } from "lucide-react";
import type { Role, Screen } from "@/data/agronexData";
import type { CrewAssignment } from "@/data/agronexData";
import { AdminConfigPanel, Dashboard, PendingScreen, RegisterScreen, ReportsScreen, SectorsScreen } from "./screens";
import { AgroLogo } from "./brand";
import { CrewSelector } from "./crew-selector";

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// En producción, reemplazar esta autenticación temporal por Supabase Auth y control de roles en base de datos.
const TEMP_ADMIN_PASSWORD = "admin123";
const ADMIN_SESSION_KEY = "agronex-admin-authenticated";

export function AgroNexApp() {
  const [stage, setStage] = useState<"welcome" | "roles" | "crew-select" | "admin-access" | "app">("welcome");
  const [role, setRole] = useState<Role>("jefe");
  const [screen, setScreen] = useState<Screen>("inicio");
  const [selectedCrew, setSelectedCrew] = useState<CrewAssignment | null>(null);
  const [sessionPercent, setSessionPercent] = useState(0);
  const enter = (nextRole: Role) => {
    if (nextRole === "administrador" && sessionStorage.getItem(ADMIN_SESSION_KEY) !== "true") {
      setStage("admin-access");
      return;
    }
    if (nextRole === "supervisor") { setStage("crew-select"); return; }
    setRole(nextRole);
    setScreen("inicio");
    setStage("app");
  };
  const selectCrew = (crew: CrewAssignment) => { setSelectedCrew(crew); setSessionPercent(crew.percent); setRole("supervisor"); setScreen("registro"); setStage("app"); };
  const authenticateAdmin = () => { sessionStorage.setItem(ADMIN_SESSION_KEY, "true"); enter("administrador"); };
  if (stage === "welcome") return <Welcome onContinue={() => setStage("roles")} />;
  if (stage === "roles") return <RoleSelector onBack={() => setStage("welcome")} onSelect={enter} />;
  if (stage === "crew-select") return <CrewSelector onBack={() => setStage("roles")} onSelect={selectCrew} />;
  if (stage === "admin-access") return <AdminAccess onCancel={() => setStage("roles")} onSuccess={authenticateAdmin} />;
  return <AppShell role={role} screen={screen} selectedCrew={selectedCrew} sessionPercent={sessionPercent} onProgressUpdate={setSessionPercent} onNavigate={setScreen} onChangeCrew={() => setStage("crew-select")} onExit={() => setStage("roles")} />;
}

function Welcome({ onContinue }: { onContinue: () => void }) {
  return <main className="relative grid min-h-dvh overflow-hidden bg-[#123f2e] px-6 py-10 text-white sm:place-items-center"><div className="ag-grid absolute inset-0 opacity-20" /><div className="absolute -right-28 top-[-80px] size-80 rounded-full bg-[#2c8b61]/30 blur-3xl" /><Leaf className="absolute -bottom-8 -left-10 size-56 rotate-12 text-white/[.035]" />
    <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-sm flex-col justify-between sm:min-h-0 sm:justify-center sm:py-12"><AgroLogo light /><div className="my-auto py-14 sm:my-14 sm:py-0"><span className="mb-6 grid size-20 place-items-center rounded-[26px] border border-white/15 bg-white/10 shadow-2xl backdrop-blur"><Sprout size={42} className="text-[#bce8cb]" strokeWidth={1.8} /></span><h1 className="text-4xl font-extrabold leading-[1.08] tracking-[-.035em] sm:text-5xl">El campo, bajo control.</h1><p className="mt-5 max-w-xs text-[15px] leading-7 text-white/65">Control diario de labores agrícolas por cuadrilla, sector y cultivo.</p></div><button onClick={onContinue} className="flex h-14 w-full items-center justify-between rounded-2xl bg-white px-5 font-extrabold text-[#174c37] shadow-xl shadow-black/15 transition active:scale-[.98]">Ingresar <span className="grid size-9 place-items-center rounded-xl bg-[#e8f4ec]"><ChevronRight size={19} /></span></button><p className="mt-5 text-center text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">AgroNex</p></div>
  </main>;
}

function RoleSelector({ onBack, onSelect }: { onBack: () => void; onSelect: (role: Role) => void }) {
  const roles = [{ id: "supervisor" as const, title: "Supervisor", text: "Registra el avance diario de tu cuadrilla.", icon: UserRound }, { id: "jefe" as const, title: "Jefe de campo", text: "Supervisa labores, sectores y pendientes.", icon: UsersRound }, { id: "administrador" as const, title: "Administrador", text: "Configura los datos operativos del campo.", icon: ShieldCheck }];
  return <main className="min-h-dvh bg-[#f3f6f3] px-5 py-8 sm:grid sm:place-items-center"><div className="mx-auto w-full max-w-md"><button onClick={onBack} className="mb-10"><AgroLogo /></button><p className="text-xs font-bold uppercase tracking-[.16em] text-[#2d8a61]">Acceso al sistema</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#173c2d]">¿Cuál es tu función?</h1><p className="mt-3 text-sm leading-6 text-[#718078]">Selecciona tu perfil para mostrar las herramientas que necesitas.</p><div className="mt-8 space-y-3">{roles.map(({ id, title, text, icon: Icon }) => <button key={id} onClick={() => onSelect(id)} className="ag-card group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:border-[#bcd3c4] hover:shadow-md"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]"><Icon size={22} /></span><span className="min-w-0 flex-1"><strong className="block text-[15px] text-[#244637]">{title}</strong><span className="mt-1 block text-xs leading-5 text-[#7a8981]">{text}</span></span><ChevronRight size={18} className="text-[#96a39b] transition group-hover:translate-x-0.5 group-hover:text-[#18794e]" /></button>)}</div></div></main>;
}

function AdminAccess({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (password === TEMP_ADMIN_PASSWORD) { onSuccess(); return; }
    setError(true);
    setPassword("");
  };
  return <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#123f2e] px-5 py-10"><div className="ag-grid absolute inset-0 opacity-20" /><div className="relative z-10 w-full max-w-sm"><div className="mb-7"><AgroLogo light /></div><form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-2xl shadow-black/20 sm:p-7"><span className="grid size-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]"><LockKeyhole size={22} /></span><h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[#173c2d]">Acceso administrativo</h1><p className="mt-2 text-sm text-[#718078]">Ingresa la contraseña para continuar.</p><label className="ag-label mt-6 block">Contraseña<input autoFocus autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); setError(false); }} className={`mt-2 h-12 w-full rounded-xl border bg-white px-3.5 text-sm outline-none transition focus:ring-4 ${error ? "border-[#c45b48] focus:border-[#c45b48] focus:ring-[#c45b48]/10" : "border-[#dbe5de] focus:border-[#238358] focus:ring-[#238358]/10"}`} type="password" required /></label>{error && <p role="alert" className="mt-3 text-xs font-bold text-[#b84d3a]">Contraseña incorrecta. Intenta nuevamente.</p>}<div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="submit" className="ag-primary">Ingresar</button><button type="button" onClick={onCancel} className="ag-secondary">Cancelar</button></div></form></div></main>;
}

function AppShell({ role, screen, selectedCrew, sessionPercent, onProgressUpdate, onNavigate, onChangeCrew, onExit }: { role: Role; screen: Screen; selectedCrew: CrewAssignment | null; sessionPercent: number; onProgressUpdate: (percent: number) => void; onNavigate: (screen: Screen) => void; onChangeCrew: () => void; onExit: () => void }) {
  const title = { inicio: "Inicio", registro: "Registro de avance", sectores: "Sectores", pendientes: "Pendientes", reportes: "Reportes", configuracion: "Configuración" }[screen];
  return <div className="min-h-dvh bg-[#f3f6f3]"><header className="fixed inset-x-0 top-0 z-40 h-[72px] border-b border-white/10 bg-[#164c37] text-white shadow-sm"><div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8"><div className="hidden md:block"><AgroLogo light /></div><div className="md:hidden"><AgroLogo compact light /></div><div className="absolute left-1/2 -translate-x-1/2 text-center md:hidden"><p className="text-sm font-bold">{title}</p><p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">AgroNex</p></div><div className="flex items-center gap-2"><InstallPrompt />{role === "supervisor" && <button onClick={onChangeCrew} className="hidden h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold sm:flex"><UsersRound size={16} />Cambiar cuadrilla</button>}<button aria-label="Notificaciones" className="relative grid size-10 place-items-center rounded-xl bg-white/10"><Bell size={18} /><span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-[#f4ba50]" /></button><button onClick={onExit} aria-label="Cambiar rol" className="grid size-10 place-items-center rounded-xl bg-white/10 sm:hidden"><UserRound size={18} /></button><button onClick={onExit} aria-label="Cambiar rol" className="hidden h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-xs font-bold sm:flex"><UserRound size={16} />{role === "jefe" ? "Jefe de campo" : role === "supervisor" ? "Supervisor" : "Administrador"}</button></div></div></header>
    <aside className="fixed bottom-0 left-0 top-[72px] z-30 hidden w-64 border-r border-[#dfe7e1] bg-white p-4 md:flex md:flex-col"><nav className="space-y-1">{navItems(role).map((item) => <NavButton key={item.screen} {...item} active={screen === item.screen} onClick={() => onNavigate(item.screen)} desktop />)}</nav><div className="mt-auto rounded-2xl bg-[#f0f6f2] p-4"><p className="text-xs font-bold text-[#315343]">{selectedCrew?.crew ?? "Jornada en curso"}</p><p className="mt-1 text-[11px] leading-5 text-[#75857c]">{selectedCrew ? `${selectedCrew.labor} · ${selectedCrew.sector}` : "Última actualización: hace 4 min"}</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#24905f]" style={{ width: `${selectedCrew ? sessionPercent : 76}%` }} /></div></div></aside>
    <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-[98px] sm:px-6 md:pl-[280px] md:pr-8 md:pt-[104px] lg:px-10 lg:pl-[296px]">{screen === "inicio" && <Dashboard navigate={onNavigate} />}{screen === "registro" && role !== "jefe" && <RegisterScreen crew={role === "supervisor" ? selectedCrew : null} percent={sessionPercent} onProgressUpdate={onProgressUpdate} onChangeCrew={onChangeCrew} />}{screen === "sectores" && <SectorsScreen crew={role === "supervisor" ? selectedCrew : null} sessionPercent={sessionPercent} />}{screen === "pendientes" && role !== "supervisor" && <PendingScreen />}{screen === "reportes" && role !== "supervisor" && <ReportsScreen />}{screen === "configuracion" && role === "administrador" && <AdminConfigPanel />}</main>
    <nav className="fixed inset-x-0 bottom-0 z-40 overflow-x-auto border-t border-[#dfe7e1] bg-white/95 px-2 pb-[max(.45rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_25px_rgba(24,61,44,.06)] backdrop-blur md:hidden"><div className="mx-auto flex w-max min-w-full max-w-lg justify-around">{navItems(role).map((item) => <NavButton key={item.screen} {...item} active={screen === item.screen} onClick={() => onNavigate(item.screen)} />)}</div></nav>
  </div>;
}

function navItems(role: Role): { screen: Screen; label: string; icon: typeof Home }[] {
  if (role === "supervisor") return [{ screen: "registro", label: "Registro", icon: ClipboardPlus }, { screen: "sectores", label: "Mis sectores", icon: MapPinned }];
  if (role === "jefe") return [{ screen: "inicio", label: "Inicio", icon: Home }, { screen: "sectores", label: "Sectores", icon: MapPinned }, { screen: "pendientes", label: "Pendientes", icon: Leaf }, { screen: "reportes", label: "Reportes", icon: BarChart3 }];
  return [{ screen: "inicio", label: "Inicio", icon: Home }, { screen: "registro", label: "Registro", icon: ClipboardPlus }, { screen: "sectores", label: "Sectores", icon: MapPinned }, { screen: "pendientes", label: "Pendientes", icon: Leaf }, { screen: "reportes", label: "Reportes", icon: BarChart3 }, { screen: "configuracion", label: "Configurar", icon: Settings2 }];
}
function NavButton({ icon: Icon, label, active, onClick, desktop }: { icon: typeof Home; label: string; active: boolean; onClick: () => void; desktop?: boolean }) { return <button onClick={onClick} className={desktop ? `flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition ${active ? "bg-[#e9f6ef] text-[#18794e]" : "text-[#6f7f76] hover:bg-[#f5f7f5]"}` : `flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-bold transition ${active ? "text-[#18794e]" : "text-[#829087]"}`}><Icon size={desktop ? 19 : 21} strokeWidth={active ? 2.6 : 2} />{label}</button>; }

function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }); const handler = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent); }; window.addEventListener("beforeinstallprompt", handler); return () => window.removeEventListener("beforeinstallprompt", handler); }, []);
  if (!prompt) return null;
  return <button onClick={async () => { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }} className="hidden h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#174c37] sm:flex"><Download size={16} />Instalar</button>;
}
