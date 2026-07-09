export type AppRole = "encargado" | "supervisor";
export type Attendance = "Presente" | "Ausente";
export type OperationStatus = "En proceso" | "Prioridad" | "Terminado" | "Pendiente";
export type Priority = "Alta" | "Media" | "Normal";

export type AppScreen =
  | "inicio" | "registrar" | "cuadrilla" | "rendimiento" | "mas"
  | "trabajadores" | "pendientes" | "planificacion" | "avances"
  | "reportes" | "encargados" | "cuadrillas" | "sectores" | "configuracion"
  | "sincronizacion";

export type LeaderUser = {
  id: string;
  name: string;
  role: "Encargado de labor";
  labor: string;
  crop: string;
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
};

export type Crew = {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  labor: string;
  crop: string;
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
  crop: string;
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

export const leaders: LeaderUser[] = [
  { id: "leader-marcos", name: "Marcos", role: "Encargado de labor", labor: "Machete", crop: "Palto", sector: "Lote 05", crewId: "crew-machete-01", crewName: "Cuadrilla Machete 01", status: "En proceso", accessPassword: "marcos123" },
  { id: "leader-susana", name: "Susana", role: "Encargado de labor", labor: "Cosecha arándano", crop: "Arándano", sector: "Bloque B3", crewId: "crew-arandano-01", crewName: "Cuadrilla Arándano 01", status: "Prioridad", accessPassword: "susana123" },
  { id: "leader-lopez", name: "López", role: "Encargado de labor", labor: "Riego", crop: "Palto", sector: "Sector A1", crewId: "crew-riego-01", crewName: "Cuadrilla Riego 01", status: "Terminado", accessPassword: "lopez123" },
  { id: "leader-pedro", name: "Pedro", role: "Encargado de labor", labor: "Poda", crop: "Palto", sector: "Lote 04", crewId: "crew-poda-01", crewName: "Cuadrilla Poda 01", status: "En proceso", accessPassword: "pedro123" },
  { id: "leader-carlos", name: "Carlos", role: "Encargado de labor", labor: "Maleza", crop: "Palto", sector: "Lote 07", crewId: "crew-maleza-01", crewName: "Cuadrilla Maleza 01", status: "Pendiente", accessPassword: "carlos123" },
];

export const crews: Crew[] = [
  { id: "crew-machete-01", name: "Cuadrilla Machete 01", leaderId: "leader-marcos", leaderName: "Marcos", labor: "Machete", crop: "Palto", sector: "Lote 05", totalWorkers: 20, presentWorkers: 18, absentWorkers: 2, goal: 50, progress: 30, remaining: 20, unit: "líneas", percentage: 60, hoursPerWorker: 8, manHours: 144, status: "En proceso" },
  { id: "crew-arandano-01", name: "Cuadrilla Arándano 01", leaderId: "leader-susana", leaderName: "Susana", labor: "Cosecha arándano", crop: "Arándano", sector: "Bloque B3", totalWorkers: 25, presentWorkers: 23, absentWorkers: 2, goal: 1200, progress: 980, remaining: 220, unit: "kg", percentage: 82, hoursPerWorker: 8, manHours: 184, status: "Prioridad" },
  { id: "crew-riego-01", name: "Cuadrilla Riego 01", leaderId: "leader-lopez", leaderName: "López", labor: "Riego", crop: "Palto", sector: "Sector A1", totalWorkers: 8, presentWorkers: 8, absentWorkers: 0, goal: 5, progress: 5, remaining: 0, unit: "ha", percentage: 100, hoursPerWorker: 8, manHours: 64, status: "Terminado" },
  { id: "crew-poda-01", name: "Cuadrilla Poda 01", leaderId: "leader-pedro", leaderName: "Pedro", labor: "Poda", crop: "Palto", sector: "Lote 04", totalWorkers: 15, presentWorkers: 14, absentWorkers: 1, goal: 600, progress: 420, remaining: 180, unit: "plantas", percentage: 70, hoursPerWorker: 8, manHours: 112, status: "En proceso" },
  { id: "crew-maleza-01", name: "Cuadrilla Maleza 01", leaderId: "leader-carlos", leaderName: "Carlos", labor: "Maleza", crop: "Palto", sector: "Lote 07", totalWorkers: 16, presentWorkers: 15, absentWorkers: 1, goal: 4, progress: 2.8, remaining: 1.2, unit: "ha", percentage: 70, hoursPerWorker: 8, manHours: 120, status: "Pendiente" },
];

const firstNames = ["José", "Ana", "Luis", "Rosa", "Juan", "María", "Miguel", "Elena", "Pedro", "Carmen", "Diego", "Lucía", "Raúl", "Patricia", "Jorge", "Teresa", "Andrés", "Mónica", "Víctor", "Sofía", "Manuel", "Diana", "Renato", "Claudia", "Hugo"];
const lastNames = ["Quispe", "Flores", "Mendoza", "Rojas", "Vargas", "Torres", "Paredes", "Salazar", "Castro", "Ramos"];

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
    };
  });
}

// Fuente temporal centralizada. Sustituir por consultas tipadas a Supabase en producción.
export const workers: Worker[] = crews.flatMap((crew, index) => createWorkers(crew, index * 4));

export const plannedTasks: PlannedTask[] = crews.map((crew, index) => ({
  id: `task-${index + 1}`,
  date: "2026-07-07",
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
  cultivos: ["Palto", "Arándano", "Uva", "Mango"],
  sectores: ["Lote 04", "Lote 05", "Lote 07", "Bloque B3", "Sector A1", "Sector C2"],
  labores: ["Cosecha arándano", "Poda", "Maleza", "Machete", "Riego", "Fumigación"],
  cuadrillas: crews.map((item) => item.name),
  unidades: ["kg", "jabas", "bins", "plantas", "líneas", "ha", "metros", "sectores"],
};

export const getCrewForLeader = (leaderId: string) => crews.find((crew) => crew.leaderId === leaderId)!;
export const getWorkersForCrew = (crewId: string) => workers.filter((worker) => worker.crewId === crewId);
export const getTaskForLeader = (leaderId: string) => plannedTasks.find((task) => task.assignedTo === leaderId)!;

