"use client";

import { useState } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { catalog, unitsByLabor, type CrewAssignment } from "@/data/agronexData";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima" }).format(new Date());

export function RegisterProgressForm({ crew, onProgressUpdate }: { crew: CrewAssignment | null; onProgressUpdate: (percent: number) => void }) {
  const [saved, setSaved] = useState(false);
  const [crop, setCrop] = useState(crew?.crop ?? catalog.cultivos[0]);
  const [sector, setSector] = useState(crew?.sector ?? catalog.sectores[0]);
  const [labor, setLabor] = useState(crew?.labor ?? catalog.labores[0]);
  const [selectedCrew, setSelectedCrew] = useState(crew?.crew ?? catalog.cuadrillas[0]);
  const [goal, setGoal] = useState(String(crew?.goal ?? ""));
  const [progress, setProgress] = useState(String(crew?.progress ?? ""));
  const initialUnits = unitsByLabor[crew?.labor ?? "Cosecha"] ?? catalog.unidades;
  const [unit, setUnit] = useState(crew?.unit ?? initialUnits[0]);
  const field = "mt-2 h-12 w-full rounded-xl border border-[#dbe5de] bg-white px-3.5 text-sm font-medium text-[#244637] outline-none transition focus:border-[#238358] focus:ring-4 focus:ring-[#238358]/10 disabled:bg-[#f1f5f2] disabled:text-[#60736a]";
  const laborUnits = unitsByLabor[labor] ?? catalog.unidades;
  const changeLabor = (value: string) => { setLabor(value); setUnit((unitsByLabor[value] ?? catalog.unidades)[0]); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const goalValue = Number(goal);
    const progressValue = Number(progress);
    if (goalValue > 0) onProgressUpdate(Math.min(100, Math.round((progressValue / goalValue) * 100)));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  };
  return <form onSubmit={submit} className="ag-card p-5 sm:p-6">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="ag-label">Fecha<input className={field} type="date" defaultValue={today} required /></label>
      <Select label="Cultivo" items={catalog.cultivos} value={crop} onChange={setCrop} className={field} />
      <Select label="Sector" items={catalog.sectores} value={sector} onChange={setSector} className={field} />
      <Select label="Labor" items={catalog.labores.includes(labor) ? catalog.labores : [labor, ...catalog.labores]} value={labor} onChange={changeLabor} className={field} />
      <Select label="Cuadrilla" items={catalog.cuadrillas} value={selectedCrew} onChange={setSelectedCrew} className={field} disabled={Boolean(crew)} />
      <label className="ag-label">Meta del día<input className={field} type="number" min="0" step="0.01" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="0" required /></label>
      <Select label="Unidad de medida" items={laborUnits.includes(unit) ? laborUnits : [unit, ...laborUnits]} value={unit} onChange={setUnit} className={field} />
      <label className="ag-label">Avance actual<input className={field} type="number" min="0" step="0.01" value={progress} onChange={(event) => setProgress(event.target.value)} placeholder="0" required /></label>
      <label className="ag-label sm:col-span-2">Observación<textarea className={`${field} min-h-24 resize-none py-3`} defaultValue={crew?.observation} placeholder="Añade información relevante del avance..." /></label>
    </div>
    {saved && <div role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-[#e9f6ef] px-4 py-3 text-sm font-bold text-[#18794e]"><CheckCircle2 size={19} />Avance registrado correctamente.</div>}
    <div className="mt-6 grid gap-3 sm:grid-cols-2"><button className="ag-primary" type="submit"><Save size={18} />Guardar avance</button><button className="ag-secondary" type="button" onClick={submit}>Guardar parcial</button></div>
  </form>;
}

function Select({ label, items, value, onChange, className, disabled = false }: { label: string; items: string[]; value: string; onChange: (value: string) => void; className: string; disabled?: boolean }) {
  return <label className="ag-label">{label}<select className={className} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>{items.map((item) => <option key={item}>{item}</option>)}</select></label>;
}
