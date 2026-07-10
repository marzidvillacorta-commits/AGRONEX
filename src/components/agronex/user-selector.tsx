"use client";

import { useState } from "react";
import { ArrowLeft, LockKeyhole, UserRound } from "lucide-react";
import type { LeaderUser, OperationName } from "@/data/agronexData";
import { AgroLogo } from "./brand";

export function UserSelector({ operation, leaders, onBack, onSelect }: { operation: OperationName; leaders: LeaderUser[]; onBack: () => void; onSelect: (leader: LeaderUser) => void }) {
  const [selectedLeader, setSelectedLeader] = useState<LeaderUser | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLeader) return;
    if (password === selectedLeader.accessPassword) {
      onSelect(selectedLeader);
      return;
    }
    setPassword("");
    setError("Contraseña incorrecta. Intenta nuevamente.");
  };

  return (
    <main className="min-h-dvh bg-[#f3f6f3] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between">
          <AgroLogo />
          <button onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#587066] hover:bg-white">
            <ArrowLeft size={16} />
            Volver
          </button>
        </div>

        <header className="mb-7 mt-10">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#2d8a61]">Acceso de campo</p>
          <h1 className="ag-page-title mt-2">Selecciona tu usuario</h1>
          <p className="mt-2 text-sm text-[#718078]">Operación: {operation}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {leaders.length === 0 ? (
            <section className="rounded-2xl border border-dashed border-[#cfdcd3] bg-white p-5 text-center sm:col-span-2 xl:col-span-3">
              <p className="text-sm font-extrabold text-[#294a3b]">Sin encargados registrados.</p>
              <p className="mt-2 text-xs leading-5 text-[#718078]">Selecciona otra operación o solicita planificación al supervisor.</p>
            </section>
          ) : leaders.map((leader) => (
            <button key={leader.id} onClick={() => { setSelectedLeader(leader); setPassword(""); setError(""); }} className="ag-card group min-h-[132px] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#bcd3c4] hover:shadow-md">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]">
                <UserRound size={20} />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-[#244637]">{leader.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#567064]">Encargado de {leader.labor.toLowerCase()}</p>
            </button>
          ))}
        </div>

        {selectedLeader && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#123f2e]/45 px-5 backdrop-blur-sm">
            <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <span className="grid size-12 place-items-center rounded-2xl bg-[#e9f6ef] text-[#18794e]">
                <LockKeyhole size={22} />
              </span>
              <h2 className="mt-5 text-xl font-extrabold text-[#173c2d]">Acceso de encargado</h2>
              <p className="mt-2 text-sm text-[#718078]">Ingresa la contraseña de {selectedLeader.name} para continuar.</p>
              <label className="ag-label mt-5 block">
                Contraseña
                <input autoFocus type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} className="ag-field" required />
              </label>
              {error && <p role="alert" className="mt-3 text-xs font-bold text-[#b84d3a]">{error}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button className="ag-primary" type="submit">Ingresar</button>
                <button className="ag-secondary" type="button" onClick={() => setSelectedLeader(null)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <p className="mt-8 text-center text-[10px] font-semibold tracking-[.14em] text-[#9aa69f]">by Zidnex Digital</p>
      </div>
    </main>
  );
}
