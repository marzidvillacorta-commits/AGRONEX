"use client";

import { useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { DEFAULT_WORK_HOURS, type Attendance, type Crew, type LeaderUser, type OperationStatus, type Worker } from "@/data/agronexData";
import { createLocalId } from "@/lib/agronex-offline";
import { useAgroSession } from "./session-context";

const field = "mt-2 min-h-11 w-full rounded-xl border border-[#dbe5de] bg-white px-3 text-sm font-medium text-[#244637] outline-none focus:border-[#238358] focus:ring-4 focus:ring-[#238358]/10";

export function LeaderActionMenu({ leader }: { leader: LeaderUser }) {
  const { currentOperation, operationCatalog, workers, updateLeader, deleteLeader } = useAgroSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(leader);
  const assignedWorkers = workers.filter((worker) => worker.assignedTo === leader.id).length;

  const close = () => { setOpen(false); setMode(null); };

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} aria-label={`Opciones de ${leader.name}`} className="grid size-11 place-items-center rounded-xl border border-[#dfe7e1] bg-white text-[#60736a]">
        <MoreHorizontal size={20} />
      </button>
      {open && <ActionPopup onEdit={() => setMode("edit")} onDelete={() => setMode("delete")} />}
      {message && <p className="absolute right-0 top-12 z-10 w-56 rounded-xl bg-[#e9f6ef] p-3 text-xs font-bold text-[#18794e] shadow-lg">{message}</p>}

      {mode === "edit" && (
        <Modal title="Editar encargado" onClose={close}>
          <form onSubmit={(event) => { event.preventDefault(); updateLeader({ ...draft, crop: currentOperation }); setMessage("Encargado actualizado correctamente."); close(); window.setTimeout(() => setMessage(""), 3500); }} className="space-y-3">
            <TextInput label="Nombre" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <SelectInput label="Área/labor" value={draft.labor} onChange={(value) => setDraft({ ...draft, labor: value })} items={operationCatalog.labors} />
            <TextInput label="Operación" value={currentOperation} onChange={() => {}} disabled />
            <SelectInput label="Sector/Bloque" value={draft.sector} onChange={(value) => setDraft({ ...draft, sector: value })} items={operationCatalog.sectors} />
            <TextInput label="Cuadrilla" value={draft.crewName} onChange={(value) => setDraft({ ...draft, crewName: value })} />
            <SelectInput label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as OperationStatus })} items={["Pendiente", "Programado", "En proceso", "Prioridad", "Terminado"]} />
            <TextInput label="Contraseña temporal" value={draft.accessPassword} onChange={(value) => setDraft({ ...draft, accessPassword: value })} type="password" />
            <button className="ag-primary w-full" type="submit">Guardar cambios</button>
          </form>
        </Modal>
      )}

      {mode === "delete" && (
        <Modal title="¿Eliminar este encargado?" onClose={close}>
          <p className="text-sm leading-6 text-[#60736a]">{assignedWorkers > 0 ? "Este encargado tiene trabajadores asignados. Puedes reasignarlos o eliminarlos." : "Esta acción quitará el encargado de la operación actual."}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={close} className="ag-secondary" type="button">Cancelar</button>
            <button onClick={() => { deleteLeader(leader.id); setMessage("Encargado eliminado correctamente."); close(); window.setTimeout(() => setMessage(""), 3500); }} className="ag-primary bg-[#bd513c]" type="button"><Trash2 size={17} />Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function WorkerActionMenu({ worker, leaderScope }: { worker: Worker; leaderScope?: { leader: LeaderUser; crew: Crew } }) {
  const { leaders, crews, updateWorker, deleteWorker } = useAgroSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "delete" | null>(null);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(worker);
  const close = () => { setOpen(false); setMode(null); };
  const selectableLeaders = leaderScope ? [leaderScope.leader] : leaders;

  const assignLeader = (leaderId: string) => {
    const leader = selectableLeaders.find((item) => item.id === leaderId) ?? selectableLeaders[0];
    const crew = crews.find((item) => item.id === leader.crewId) ?? leaderScope?.crew;
    setDraft({ ...draft, assignedTo: leader.id, assignedName: leader.name, crewId: leader.crewId, crewName: leader.crewName, unit: crew?.unit ?? draft.unit, status: "Activo", crop: leader.crop, labor: leader.labor, sector: leader.sector });
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((value) => !value)} aria-label={`Opciones de ${worker.name}`} className="grid size-10 place-items-center rounded-xl border border-[#dfe7e1] bg-white text-[#60736a]">
        <MoreHorizontal size={19} />
      </button>
      {open && <ActionPopup onEdit={() => setMode("edit")} onDelete={() => setMode("delete")} deleteLabel={leaderScope ? "Quitar de mi cuadrilla" : "Eliminar"} />}
      {message && <p className="absolute right-0 top-12 z-10 w-56 rounded-xl bg-[#e9f6ef] p-3 text-xs font-bold text-[#18794e] shadow-lg">{message}</p>}

      {mode === "edit" && (
        <Modal title="Editar trabajador" onClose={close}>
          <form onSubmit={(event) => { event.preventDefault(); updateWorker(draft); setMessage("Trabajador actualizado correctamente."); close(); window.setTimeout(() => setMessage(""), 3500); }} className="space-y-3">
            <TextInput label="Nombre" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <SelectInput label="Encargado asignado" value={draft.assignedTo} onChange={assignLeader} items={selectableLeaders.map((leader) => ({ value: leader.id, label: leader.name }))} />
            <TextInput label="Cuadrilla" value={draft.crewName} onChange={(value) => setDraft({ ...draft, crewName: value })} disabled />
            <SelectInput label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as Worker["status"] })} items={["Activo", "Inactivo", "Sin cuadrilla"]} />
            <SelectInput label="Asistencia" value={draft.attendance} onChange={(value) => setDraft({ ...draft, attendance: value as Attendance })} items={["Presente", "Ausente"]} />
            <NumberInput label="Avance del día" value={draft.dailyOutput} onChange={(value) => setDraft({ ...draft, dailyOutput: value })} />
            <TextInput label="Unidad" value={draft.unit} onChange={(value) => setDraft({ ...draft, unit: value })} />
            <NumberInput label="Horas trabajadas" value={draft.hoursWorked} onChange={(value) => setDraft({ ...draft, hoursWorked: value })} />
            <TextInput label="Observación" value={draft.observation} onChange={(value) => setDraft({ ...draft, observation: value })} />
            <button className="ag-primary w-full" type="submit">Guardar cambios</button>
          </form>
        </Modal>
      )}

      {mode === "delete" && (
        <Modal title={leaderScope ? "¿Quitar este trabajador de tu cuadrilla?" : "¿Eliminar este trabajador?"} onClose={close}>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={close} className="ag-secondary" type="button">Cancelar</button>
            <button onClick={() => { deleteWorker(worker.id); setMessage(leaderScope ? "Trabajador quitado correctamente." : "Trabajador eliminado correctamente."); close(); window.setTimeout(() => setMessage(""), 3500); }} className="ag-primary bg-[#bd513c]" type="button"><Trash2 size={17} />{leaderScope ? "Quitar" : "Eliminar"}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export function AddWorkerButton({ leader, crew }: { leader: LeaderUser; crew: Crew }) {
  const { addWorker } = useAgroSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ name: "", status: "Activo" as Worker["status"], attendance: "Presente" as Attendance, dailyOutput: 0, hoursWorked: DEFAULT_WORK_HOURS, unit: crew.unit, observation: "" });

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    addWorker({
      id: createLocalId("worker"),
      name: draft.name,
      crewId: crew.id,
      crewName: crew.name,
      assignedTo: leader.id,
      assignedName: leader.name,
      status: draft.status,
      attendance: draft.attendance,
      dailyOutput: draft.attendance === "Ausente" ? 0 : draft.dailyOutput,
      unit: draft.unit,
      hoursWorked: draft.attendance === "Ausente" ? 0 : draft.hoursWorked,
      observation: draft.observation,
      crop: crew.crop,
      labor: crew.labor,
      sector: crew.sector,
    });
    setOpen(false);
    setDraft({ name: "", status: "Activo", attendance: "Presente", dailyOutput: 0, hoursWorked: DEFAULT_WORK_HOURS, unit: crew.unit, observation: "" });
    setMessage("Trabajador agregado correctamente.");
    window.setTimeout(() => setMessage(""), 3500);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(true)} className="ag-primary px-4" type="button"><Plus size={17} />Agregar trabajador</button>
      {message && <p className="absolute right-0 top-12 z-10 w-56 rounded-xl bg-[#e9f6ef] p-3 text-xs font-bold text-[#18794e] shadow-lg">{message}</p>}
      {open && (
        <Modal title="Agregar trabajador" onClose={() => setOpen(false)}>
          <form onSubmit={save} className="space-y-3">
            <TextInput label="Nombre del trabajador" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
            <SelectInput label="Estado" value={draft.status} onChange={(value) => setDraft({ ...draft, status: value as Worker["status"] })} items={["Activo", "Inactivo"]} />
            <SelectInput label="Asistencia inicial" value={draft.attendance} onChange={(value) => setDraft({ ...draft, attendance: value as Attendance })} items={["Presente", "Ausente"]} />
            <NumberInput label="Horas trabajadas" value={draft.hoursWorked} onChange={(value) => setDraft({ ...draft, hoursWorked: value })} />
            <NumberInput label="Avance inicial" value={draft.dailyOutput} onChange={(value) => setDraft({ ...draft, dailyOutput: value })} />
            <TextInput label="Unidad" value={draft.unit} onChange={(value) => setDraft({ ...draft, unit: value })} />
            <TextInput label="Observación opcional" value={draft.observation} onChange={(value) => setDraft({ ...draft, observation: value })} required={false} />
            <div className="rounded-xl bg-[#f6f8f6] p-3 text-xs text-[#60736a]">Se agregará a {crew.name}, con {leader.name} como encargado asignado.</div>
            <button className="ag-primary w-full" type="submit">Guardar trabajador</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ActionPopup({ onEdit, onDelete, deleteLabel = "Eliminar" }: { onEdit: () => void; onDelete: () => void; deleteLabel?: string }) {
  return (
    <div className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-2xl border border-[#dfe7e1] bg-white p-1 shadow-xl">
      <button onClick={onEdit} className="block min-h-11 w-full rounded-xl px-3 text-left text-sm font-bold text-[#315343] hover:bg-[#f5f7f5]">Editar</button>
      <button onClick={onDelete} className="block min-h-11 w-full rounded-xl px-3 text-left text-sm font-bold text-[#bd513c] hover:bg-[#fff6f3]">{deleteLabel}</button>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#123f2e]/45 px-5 py-6 backdrop-blur-sm">
      <section className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold text-[#173c2d]">{title}</h2>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-[#f3f6f3] text-sm font-bold text-[#60736a]" type="button">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}

function TextInput({ label, value, onChange, disabled = false, required = true, type = "text" }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; required?: boolean; type?: "text" | "password" }) {
  return <label className="ag-label block">{label}<input className={field} type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required} /></label>;
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="ag-label block">{label}<input className={field} type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

function SelectInput({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: string[] | { value: string; label: string }[] }) {
  const normalized = items.map((item) => typeof item === "string" ? { value: item, label: item } : item);
  return <label className="ag-label block">{label}<select className={field} value={value} onChange={(event) => onChange(event.target.value)}>{normalized.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
}
