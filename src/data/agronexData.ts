export type Role = "supervisor" | "jefe" | "administrador";
export type Screen = "inicio" | "registro" | "sectores" | "pendientes" | "reportes" | "configuracion";
export type OperationStatus = "En proceso" | "Prioridad" | "Terminado" | "Pendiente";

export type OperationRecord = {
  id: string;
  crop: string;
  sector: string;
  labor: string;
  crew: string;
  goal: number;
  progress: number;
  unit: string;
  remaining: number;
  percent: number;
  status: OperationStatus;
  observation: string;
};

export type CrewAssignment = OperationRecord & {
  tomorrow: string;
};

export const catalog = {
  cultivos: ["Palto", "Arándano", "Uva", "Mango"],
  sectores: ["Lote 04", "Lote 05", "Lote 07", "Bloque B3", "Sector A1", "Sector C2"],
  labores: ["Cosecha", "Poda", "Maleza", "Machete", "Riego", "Fumigación"],
  cuadrillas: ["Cuadrilla 01", "Cuadrilla 02", "Cuadrilla 03", "Cuadrilla 04"],
  unidades: ["kg", "jabas", "bins", "plantas", "líneas", "hectáreas", "metros", "sectores"],
};

// Fuente simulada central. Sustituir por consultas tipadas a Supabase al conectar el backend.
export const crewAssignments: CrewAssignment[] = [
  { id: "crew-01", crew: "Cuadrilla 01", crop: "Palto", sector: "Lote 05", labor: "Machete", goal: 20, progress: 15, unit: "líneas", remaining: 5, percent: 75, status: "En proceso", observation: "Avance uniforme hasta la línea 15.", tomorrow: "Continuar desde la línea 16 para completar las 5 líneas restantes." },
  { id: "crew-02", crew: "Cuadrilla 02", crop: "Palto", sector: "Lote 04", labor: "Poda", goal: 600, progress: 408, unit: "plantas", remaining: 192, percent: 68, status: "Prioridad", observation: "Reforzar el frente norte del lote.", tomorrow: "Retomar la poda desde el frente norte y completar las plantas pendientes." },
  { id: "crew-03", crew: "Cuadrilla 03", crop: "Palto", sector: "Lote 07", labor: "Maleza", goal: 4, progress: 2.88, unit: "hectáreas", remaining: 1.12, percent: 72, status: "Pendiente", observation: "Terreno húmedo en el extremo oeste.", tomorrow: "Continuar el control de maleza en el extremo oeste." },
  { id: "crew-04", crew: "Cuadrilla 04", crop: "Arándano", sector: "Bloque B3", labor: "Cosecha arándano", goal: 1200, progress: 996, unit: "kg", remaining: 204, percent: 83, status: "En proceso", observation: "Fruta pendiente en las hileras centrales.", tomorrow: "Reforzar las hileras centrales para cerrar la cosecha pendiente." },
];

export const sectorOperations: OperationRecord[] = [
  { id: "sector-04", crew: "Cuadrilla 02", crop: "Palto", sector: "Lote 04", labor: "Poda", goal: 600, progress: 420, unit: "plantas", remaining: 180, percent: 70, status: "En proceso", observation: "Continuar en el frente norte." },
  { id: "sector-05", crew: "Cuadrilla 01", crop: "Palto", sector: "Lote 05", labor: "Machete", goal: 20, progress: 15, unit: "líneas", remaining: 5, percent: 75, status: "En proceso", observation: "Avance uniforme hasta la línea 15." },
  { id: "sector-07", crew: "Cuadrilla 03", crop: "Palto", sector: "Lote 07", labor: "Maleza", goal: 4, progress: 2.8, unit: "hectáreas", remaining: 1.2, percent: 70, status: "Pendiente", observation: "Programar continuidad en el extremo oeste." },
  { id: "sector-b3", crew: "Cuadrilla 04", crop: "Arándano", sector: "Bloque B3", labor: "Cosecha", goal: 1200, progress: 980, unit: "kg", remaining: 220, percent: 82, status: "Prioridad", observation: "Reforzar las hileras centrales." },
  { id: "sector-a1", crew: "Cuadrilla 05", crop: "Palto", sector: "Sector A1", labor: "Riego", goal: 5, progress: 5, unit: "hectáreas", remaining: 0, percent: 100, status: "Terminado", observation: "Labor concluida sin incidencias." },
];

export const metrics = { activeCrews: 7, workedSectors: 12, overallProgress: 76, pendingCount: 6 };

export const laborProgress = [
  { name: "Cosecha arándano", value: 83, color: "#1f9d67" },
  { name: "Poda palto", value: 68, color: "#e5a62c" },
  { name: "Maleza", value: 72, color: "#4f8f54" },
  { name: "Machete", value: 75, color: "#5687bc" },
];

export const pending = [
  { sector: "Lote 04", labor: "Poda palto", remaining: "180 plantas", priority: "Alta" },
  { sector: "Lote 07", labor: "Maleza", remaining: "1.2 ha", priority: "Media" },
  { sector: "Lote 05", labor: "Machete", remaining: "5 líneas", priority: "Media" },
  { sector: "Bloque B3", labor: "Cosecha arándano", remaining: "220 kg", priority: "Alta" },
];

export const planningSuggestions = [
  "Priorizar Lote 04 por menor cumplimiento.",
  "Reforzar Bloque B3 por producción pendiente.",
  "Mantener una cuadrilla pequeña en Lote 05 para cierre de machete.",
  "Programar continuidad de maleza en Lote 07.",
];

export const unitsByLabor: Record<string, string[]> = {
  "Cosecha arándano": ["kg", "jabas"],
  Cosecha: ["kg", "jabas", "bins"],
  Poda: ["plantas", "líneas", "hectáreas"],
  Maleza: ["hectáreas", "líneas", "sectores"],
  Machete: ["líneas", "metros", "sectores"],
  Riego: ["sectores", "hectáreas"],
  Fumigación: ["hectáreas", "sectores"],
};
