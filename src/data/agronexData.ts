export type AppRole = "encargado" | "supervisor" | "rrhh";
export type Attendance = "Presente" | "Ausente";
export type OperationStatus = "En proceso" | "Prioridad" | "Terminado" | "Pendiente" | "Programado";
export type Priority = "Alta" | "Media" | "Normal";
export type OperationName = "Palto" | "Arándano";
export const DEFAULT_WORK_HOURS = 8;

export type AppScreen =
  | "inicio" | "registrar" | "cuadrilla" | "rendimiento" | "mas"
  | "trabajadores" | "pendientes" | "planificacion" | "avances"
  | "reportes" | "encargados" | "cuadrillas" | "sectores" | "configuracion"
  | "sincronizacion"
  | "hr-panel" | "hr-personal" | "hr-trabajador" | "hr-seguimiento" | "hr-evaluaciones"
  | "hr-necesidad" | "hr-convocatorias" | "hr-postulantes" | "hr-historial" | "hr-config";

export type Operation = {
  id: string;
  name: OperationName;
  blocksLabel: "Sectores" | "Bloques";
  blocks: string[];
  labors: string[];
};

export type BaseGoal = {
  operation: OperationName;
  labor: string;
  goal: number;
  unit: string;
};

export type LeaderUser = {
  id: string;
  name: string;
  role: "Encargado de labor";
  labor: string;
  crop: OperationName;
  sector: string;
  crewId: string;
  crewName: string;
  status: OperationStatus;
  accessPassword: string;
};

export type Worker = {
  id: string;
  name: string;
  crewId: string;
  crewName: string;
  assignedTo: string;
  assignedName: string;
  status: "Activo" | "Inactivo" | "Sin cuadrilla";
  attendance: Attendance;
  dailyOutput: number;
  unit: string;
  hoursWorked: number;
  observation: string;
  crop?: OperationName;
  labor?: string;
  sector?: string;
};

export type Crew = {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  labor: string;
  crop: OperationName;
  sector: string;
  totalWorkers: number;
  presentWorkers: number;
  absentWorkers: number;
  goal: number;
  progress: number;
  remaining: number;
  unit: string;
  percentage: number;
  hoursPerWorker: number;
  manHours: number;
  status: OperationStatus;
};

export type PlannedTask = {
  id: string;
  date: string;
  assignedTo: string;
  assignedName: string;
  labor: string;
  crop: OperationName;
  sector: string;
  crewId: string;
  goal: number;
  unit: string;
  progress: number;
  remaining: number;
  percentage: number;
  priority: Priority;
  observation: string;
  status: OperationStatus;
};

export type WeeklyPerformance = {
  userId: string;
  day: string;
  goal: number;
  progress: number;
  percentage: number;
  unit: string;
};

export const operations: Operation[] = [
  {
    id: "palto",
    name: "Palto",
    blocksLabel: "Sectores",
    blocks: ["B1", "B2", "B3", "B4", "B5", "B6", "Lote 05", "Lote 07"],
    labors: ["Machete", "Maleza", "Riego", "Poda", "Serrucho", "Fumigación", "Tractor", "Cosecha"],
  },
  {
    id: "arandano",
    name: "Arándano",
    blocksLabel: "Bloques",
    blocks: ["A1", "A2", "B3", "B4", "C1", "C2"],
    labors: ["Cosecha", "Riego", "Poda", "Fumigación", "Selección", "Limpieza"],
  },
];

export const baseGoals: BaseGoal[] = [
  { operation: "Palto", labor: "Machete", goal: 60, unit: "líneas" },
  { operation: "Palto", labor: "Riego", goal: 5, unit: "ha" },
  { operation: "Palto", labor: "Maleza", goal: 4, unit: "ha" },
  { operation: "Palto", labor: "Poda", goal: 600, unit: "plantas" },
  { operation: "Palto", labor: "Serrucho", goal: 400, unit: "plantas" },
  { operation: "Palto", labor: "Tractor", goal: 6, unit: "ha" },
  { operation: "Palto", labor: "Fumigación", goal: 5, unit: "ha" },
  { operation: "Palto", labor: "Cosecha", goal: 800, unit: "kg" },
  { operation: "Arándano", labor: "Cosecha", goal: 1200, unit: "kg" },
  { operation: "Arándano", labor: "Selección", goal: 900, unit: "kg" },
  { operation: "Arándano", labor: "Riego", goal: 6, unit: "ha" },
  { operation: "Arándano", labor: "Poda", goal: 800, unit: "plantas" },
  { operation: "Arándano", labor: "Fumigación", goal: 5, unit: "ha" },
  { operation: "Arándano", labor: "Limpieza", goal: 3, unit: "ha" },
];

export const leaders: LeaderUser[] = [
  { id: "leader-marcos", name: "Marcos", role: "Encargado de labor", labor: "Machete", crop: "Palto", sector: "B2", crewId: "crew-palto-machete-01", crewName: "Cuadrilla Palto Machete 01", status: "En proceso", accessPassword: "marcos123" },
  { id: "leader-lopez", name: "López", role: "Encargado de labor", labor: "Riego", crop: "Palto", sector: "B1", crewId: "crew-palto-riego-01", crewName: "Cuadrilla Palto Riego 01", status: "Terminado", accessPassword: "lopez123" },
  { id: "leader-pedro", name: "Pedro", role: "Encargado de labor", labor: "Poda", crop: "Palto", sector: "B6", crewId: "crew-palto-poda-01", crewName: "Cuadrilla Palto Poda 01", status: "En proceso", accessPassword: "pedro123" },
  { id: "leader-carlos", name: "Carlos", role: "Encargado de labor", labor: "Maleza", crop: "Palto", sector: "B5", crewId: "crew-palto-maleza-01", crewName: "Cuadrilla Palto Maleza 01", status: "En proceso", accessPassword: "carlos123" },
  { id: "leader-jose", name: "José", role: "Encargado de labor", labor: "Tractor", crop: "Palto", sector: "B3", crewId: "crew-palto-tractor-01", crewName: "Cuadrilla Palto Tractor 01", status: "Pendiente", accessPassword: "jose123" },
  { id: "leader-ramiro", name: "Ramiro", role: "Encargado de labor", labor: "Fumigación", crop: "Palto", sector: "Lote 07", crewId: "crew-palto-fumigacion-01", crewName: "Cuadrilla Palto Fumigación 01", status: "Programado", accessPassword: "ramiro123" },
  { id: "leader-susana", name: "Susana", role: "Encargado de labor", labor: "Cosecha", crop: "Arándano", sector: "B3", crewId: "crew-arandano-cosecha-01", crewName: "Cuadrilla Arándano Cosecha 01", status: "En proceso", accessPassword: "susana123" },
  { id: "leader-rosa", name: "Rosa", role: "Encargado de labor", labor: "Selección", crop: "Arándano", sector: "B4", crewId: "crew-arandano-seleccion-01", crewName: "Cuadrilla Arándano Selección 01", status: "Prioridad", accessPassword: "rosa123" },
  { id: "leader-luis", name: "Luis", role: "Encargado de labor", labor: "Riego", crop: "Arándano", sector: "A1", crewId: "crew-arandano-riego-01", crewName: "Cuadrilla Arándano Riego 01", status: "Terminado", accessPassword: "luis123" },
  { id: "leader-marta", name: "Marta", role: "Encargado de labor", labor: "Poda", crop: "Arándano", sector: "C1", crewId: "crew-arandano-poda-01", crewName: "Cuadrilla Arándano Poda 01", status: "Programado", accessPassword: "marta123" },
  { id: "leader-jorge", name: "Jorge", role: "Encargado de labor", labor: "Fumigación", crop: "Arándano", sector: "B4", crewId: "crew-arandano-fumigacion-01", crewName: "Cuadrilla Arándano Fumigación 01", status: "Pendiente", accessPassword: "jorge123" },
];

const crewSeed: Array<Omit<Crew, "totalWorkers" | "presentWorkers" | "absentWorkers" | "progress" | "remaining" | "percentage" | "manHours"> & { total: number; present: number; progress: number }> = [
  { id: "crew-palto-machete-01", name: "Cuadrilla Palto Machete 01", leaderId: "leader-marcos", leaderName: "Marcos", labor: "Machete", crop: "Palto", sector: "B2", total: 18, present: 16, goal: 60, progress: 48, unit: "líneas", hoursPerWorker: 8, status: "En proceso" },
  { id: "crew-palto-riego-01", name: "Cuadrilla Palto Riego 01", leaderId: "leader-lopez", leaderName: "López", labor: "Riego", crop: "Palto", sector: "B1", total: 8, present: 8, goal: 5, progress: 5, unit: "ha", hoursPerWorker: 8, status: "Terminado" },
  { id: "crew-palto-poda-01", name: "Cuadrilla Palto Poda 01", leaderId: "leader-pedro", leaderName: "Pedro", labor: "Poda", crop: "Palto", sector: "B6", total: 16, present: 15, goal: 600, progress: 410, unit: "plantas", hoursPerWorker: 8, status: "En proceso" },
  { id: "crew-palto-maleza-01", name: "Cuadrilla Palto Maleza 01", leaderId: "leader-carlos", leaderName: "Carlos", labor: "Maleza", crop: "Palto", sector: "B5", total: 14, present: 13, goal: 4, progress: 2.6, unit: "ha", hoursPerWorker: 8, status: "En proceso" },
  { id: "crew-palto-tractor-01", name: "Cuadrilla Palto Tractor 01", leaderId: "leader-jose", leaderName: "José", labor: "Tractor", crop: "Palto", sector: "B3", total: 4, present: 0, goal: 6, progress: 0, unit: "ha", hoursPerWorker: 0, status: "Pendiente" },
  { id: "crew-palto-fumigacion-01", name: "Cuadrilla Palto Fumigación 01", leaderId: "leader-ramiro", leaderName: "Ramiro", labor: "Fumigación", crop: "Palto", sector: "Lote 07", total: 6, present: 0, goal: 5, progress: 0, unit: "ha", hoursPerWorker: 0, status: "Programado" },
  { id: "crew-arandano-cosecha-01", name: "Cuadrilla Arándano Cosecha 01", leaderId: "leader-susana", leaderName: "Susana", labor: "Cosecha", crop: "Arándano", sector: "B3", total: 28, present: 25, goal: 1200, progress: 980, unit: "kg", hoursPerWorker: 8, status: "En proceso" },
  { id: "crew-arandano-seleccion-01", name: "Cuadrilla Arándano Selección 01", leaderId: "leader-rosa", leaderName: "Rosa", labor: "Selección", crop: "Arándano", sector: "B4", total: 22, present: 19, goal: 900, progress: 610, unit: "kg", hoursPerWorker: 8, status: "Prioridad" },
  { id: "crew-arandano-riego-01", name: "Cuadrilla Arándano Riego 01", leaderId: "leader-luis", leaderName: "Luis", labor: "Riego", crop: "Arándano", sector: "A1", total: 7, present: 7, goal: 6, progress: 6, unit: "ha", hoursPerWorker: 8, status: "Terminado" },
  { id: "crew-arandano-poda-01", name: "Cuadrilla Arándano Poda 01", leaderId: "leader-marta", leaderName: "Marta", labor: "Poda", crop: "Arándano", sector: "C1", total: 14, present: 0, goal: 800, progress: 0, unit: "plantas", hoursPerWorker: 0, status: "Programado" },
  { id: "crew-arandano-fumigacion-01", name: "Cuadrilla Arándano Fumigación 01", leaderId: "leader-jorge", leaderName: "Jorge", labor: "Fumigación", crop: "Arándano", sector: "B4", total: 6, present: 0, goal: 5, progress: 0, unit: "ha", hoursPerWorker: 0, status: "Pendiente" },
];

export const crews: Crew[] = crewSeed.map((crew) => {
  const remaining = Math.max(0, Number((crew.goal - crew.progress).toFixed(2)));
  return {
    ...crew,
    totalWorkers: crew.total,
    presentWorkers: crew.present,
    absentWorkers: crew.total - crew.present,
    progress: crew.progress,
    remaining,
    percentage: crew.goal > 0 ? Math.min(100, Math.round((crew.progress / crew.goal) * 100)) : 0,
    manHours: crew.present * crew.hoursPerWorker,
  };
});

const firstNames = ["José", "Ana", "Luis", "Rosa", "Juan", "María", "Miguel", "Elena", "Pedro", "Carmen", "Diego", "Lucía", "Raúl", "Patricia", "Jorge", "Teresa", "Andrés", "Mónica", "Víctor", "Sofía", "Manuel", "Diana", "Renato", "Claudia", "Hugo", "Marta", "Susana"];
const lastNames = ["Quispe", "Flores", "Mendoza", "Rojas", "Vargas", "Torres", "Paredes", "Salazar", "Castro", "Ramos", "Acuña", "Medina"];

function createWorkers(crew: Crew, offset: number): Worker[] {
  const average = crew.presentWorkers ? crew.progress / crew.presentWorkers : 0;
  return Array.from({ length: crew.totalWorkers }, (_, index) => {
    const present = index < crew.presentWorkers;
    const factor = 0.78 + ((index * 7) % 9) * 0.055;
    return {
      id: `${crew.id}-worker-${String(index + 1).padStart(2, "0")}`,
      name: `${firstNames[(index + offset) % firstNames.length]} ${lastNames[(index * 3 + offset) % lastNames.length]}`,
      crewId: crew.id,
      crewName: crew.name,
      assignedTo: crew.leaderId,
      assignedName: crew.leaderName,
      status: "Activo",
      attendance: present ? "Presente" : "Ausente",
      dailyOutput: present ? Number((average * factor).toFixed(2)) : 0,
      unit: crew.unit,
      hoursWorked: present ? crew.hoursPerWorker : 0,
      observation: present ? (factor > 1.05 ? "Buen ritmo de trabajo." : "Avance regular durante la jornada.") : "Ausencia registrada.",
      crop: crew.crop,
      labor: crew.labor,
      sector: crew.sector,
    };
  });
}

// Fuente temporal centralizada. Sustituir por consultas tipadas a Supabase en producción.
export const workers: Worker[] = crews.flatMap((crew, index) => createWorkers(crew, index * 4));

export const plannedTasks: PlannedTask[] = crews.map((crew, index) => ({
  id: `task-${index + 1}`,
  date: "2026-07-09",
  assignedTo: crew.leaderId,
  assignedName: crew.leaderName,
  labor: crew.labor,
  crop: crew.crop,
  sector: crew.sector,
  crewId: crew.id,
  goal: crew.goal,
  unit: crew.unit,
  progress: crew.progress,
  remaining: crew.remaining,
  percentage: crew.percentage,
  priority: crew.percentage < 70 ? "Alta" : crew.percentage < 85 ? "Media" : "Normal",
  observation: crew.remaining ? `Continuar hasta completar ${crew.remaining} ${crew.unit}.` : "Labor completada.",
  status: crew.status,
}));

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const weeklyPerformance: WeeklyPerformance[] = crews.flatMap((crew, crewIndex) => weekdays.map((day, dayIndex) => {
  const percentage = Math.min(100, Math.max(45, crew.percentage - 12 + dayIndex * 3 + crewIndex));
  return { userId: crew.leaderId, day, goal: crew.goal, progress: Number((crew.goal * percentage / 100).toFixed(2)), percentage, unit: crew.unit };
}));

export const catalog = {
  encargados: leaders.map((item) => item.name),
  trabajadores: workers.map((item) => item.name),
  cultivos: operations.map((item) => item.name),
  sectores: operations.flatMap((item) => item.blocks),
  labores: operations.flatMap((item) => item.labors),
  cuadrillas: crews.map((item) => item.name),
  unidades: ["kg", "jabas", "bins", "plantas", "líneas", "ha", "metros", "sectores"],
};

export function getOperationCatalog(operation: OperationName) {
  const current = operations.find((item) => item.name === operation) ?? operations[0];
  const goals = baseGoals.filter((item) => item.operation === operation);
  return {
    operation: current,
    sectors: current.blocks,
    labors: current.labors,
    baseGoals: goals,
    units: Array.from(new Set([...goals.map((item) => item.unit), ...catalog.unidades])),
    crews: crews.filter((item) => item.crop === operation).map((item) => item.name),
  };
}

export function getBaseGoal(operation: OperationName, labor: string) {
  return baseGoals.find((item) => item.operation === operation && item.labor === labor);
}

export const getCrewForLeader = (leaderId: string) => crews.find((crew) => crew.leaderId === leaderId)!;
export const getWorkersForCrew = (crewId: string) => workers.filter((worker) => worker.crewId === crewId);
export const getTaskForLeader = (leaderId: string) => plannedTasks.find((task) => task.assignedTo === leaderId)!;
