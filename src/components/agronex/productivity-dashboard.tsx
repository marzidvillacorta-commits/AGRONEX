"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import type { OperationName } from "@/data/agronexData";
import { roundProductivity } from "@/lib/agronex-productivity";
import { addDays, getRecordsInRange, type LocalProgressRecord } from "@/lib/agronex-offline";
import { buildProductivityReport, getReportRange, type ProductivityReport, type ReportPeriod, type ReportRange } from "@/lib/agronex-report";

export function ProductivityDashboard({
  currentOperation,
  operationalDate,
  progressRecords,
}: {
  currentOperation: OperationName;
  operationalDate: string;
  progressRecords: LocalProgressRecord[];
}) {
  const [period, setPeriod] = useState<ReportPeriod>("Semana");
  const [customStart, setCustomStart] = useState(addDays(operationalDate, -6));
  const [customEnd, setCustomEnd] = useState(operationalDate);

  const range = getReportRange(period, operationalDate, customStart, customEnd);
  const records = useMemo(() => getRecordsInRange(progressRecords, range.start, range.end), [progressRecords, range.start, range.end]);
  const report = useMemo(() => buildProductivityReport(records, currentOperation, period, range), [records, currentOperation, period, range]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#2d8a61]">Análisis operativo</p>
          <h1 className="ag-page-title mt-2">Dashboard de productividad</h1>
          <p className="mt-2 text-sm text-[#718078]">Operación: {currentOperation} · Periodo: {period.toLowerCase()}</p>
          <p className="text-xs text-[#8d9992]">{range.start} al {range.end}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons report={report} operation={currentOperation} period={period} range={range} />
        </div>
      </header>

      <PeriodFilter period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomStart={setCustomStart} onCustomEnd={setCustomEnd} />

      {records.length === 0 ? (
        <EmptyState text="Sin registros para este periodo." />
      ) : (
        <>
          <SummaryCards report={report} />
          <ExecutiveSummary text={report.executiveSummary} />
          <LeaderTable rows={report.byLeader} />
          <LaborBars rows={report.byLabor} />
          <div className="grid gap-6 lg:grid-cols-2">
            <TopWorkersTable rows={report.topWorkers} />
            <LowWorkersTable rows={report.lowWorkers} />
          </div>
          <PendingSectorsTable rows={report.pendingSectors} />
        </>
      )}
    </div>
  );
}

function PeriodFilter({
  period, onChange, customStart, customEnd, onCustomStart, onCustomEnd,
}: {
  period: ReportPeriod; onChange: (p: ReportPeriod) => void;
  customStart: string; customEnd: string;
  onCustomStart: (v: string) => void; onCustomEnd: (v: string) => void;
}) {
  return (
    <section className="ag-card p-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["Día", "Semana", "Quincena", "Mes", "Personalizado"] as ReportPeriod[]).map((item) => (
          <button key={item} onClick={() => onChange(item)}
            className={`min-h-10 whitespace-nowrap rounded-full px-4 text-xs font-extrabold ${period === item ? "bg-[#1a5b40] text-white" : "border border-[#dfe7e1] bg-white text-[#587066]"}`}
          >{item}</button>
        ))}
      </div>
      {period === "Personalizado" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="ag-label">Inicio<input className="ag-field" type="date" value={customStart} onChange={(e) => onCustomStart(e.target.value)} /></label>
          <label className="ag-label">Fin<input className="ag-field" type="date" value={customEnd} onChange={(e) => onCustomEnd(e.target.value)} /></label>
        </div>
      )}
    </section>
  );
}

function SummaryCards({ report }: { report: ProductivityReport }) {
  const s = report.summary;
  const cards = [
    { label: "Meta acumulada", value: fmt(s.totalGoal), sub: s.totalGoal > 0 ? "" : "Sin meta" },
    { label: "Avance acumulado", value: fmt(s.totalOutput), sub: "" },
    { label: "Cumplimiento", value: `${s.completion}%`, sub: s.completion >= 100 ? "Meta superada" : s.completion >= 80 ? "Buen avance" : "Requiere atención", highlight: s.completion >= 100 ? "#1a5b40" : s.completion >= 80 ? "#d79a29" : "#bd513c" },
    { label: "Faltante", value: fmt(s.remaining), sub: s.remaining <= 0 ? "Completado" : "" },
    { label: "Horas hombre", value: `${fmt(s.totalManHours)} HH`, sub: "" },
    { label: "Trabajadores presentes", value: String(s.presentCount), sub: `${s.recordCount} día(s)` },
    { label: "Ausencias", value: String(s.absentCount), sub: "" },
    { label: "Rend. hora hombre", value: `${fmt(s.outputPerManHour)}`, sub: s.totalManHours > 0 ? "unid./HH" : "" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="ag-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">{card.label}</p>
          <p className={`mt-1 text-xl font-extrabold tracking-tight tabular-nums ${card.highlight ? "" : "text-[#173c2d]"}`}
            style={card.highlight ? { color: card.highlight } : {}}
          >{card.value}</p>
          {card.sub && <p className="mt-0.5 text-[10px] text-[#8d9992]">{card.sub}</p>}
        </article>
      ))}
    </div>
  );
}

function ExecutiveSummary({ text }: { text: string }) {
  return (
    <section className="ag-card p-5 sm:p-6">
      <h2 className="mb-3 text-base font-extrabold text-[#173c2d]">Resumen ejecutivo</h2>
      <p className="text-sm leading-7 text-[#4b6358]">{text}</p>
    </section>
  );
}

function LeaderTable({ rows }: { rows: ProductivityReport["byLeader"] }) {
  if (rows.length === 0) return null;
  return (
    <section className="ag-card overflow-hidden">
      <h2 className="p-5 pb-0 text-base font-extrabold text-[#173c2d]">Avance por encargado</h2>
      <div className="overflow-x-auto">
        <table className="mt-3 w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#e1e8e3] text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">
              <th className="p-3 pl-5">Encargado</th>
              <th className="p-3">Labor</th>
              <th className="p-3">Sector</th>
              <th className="p-3 text-right">Meta</th>
              <th className="p-3 text-right">Avance</th>
              <th className="p-3 text-right">Faltante</th>
              <th className="p-3 text-right">Cumplimiento</th>
              <th className="p-3 text-right">HH</th>
              <th className="p-3 pr-5">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.leaderName + row.labor} className="border-b border-[#edf1ee] last:border-0">
                <td className="p-3 pl-5 font-bold text-[#294a3b]">{row.leaderName}</td>
                <td className="p-3 text-[#4b6358]">{row.labor}</td>
                <td className="p-3 text-[#4b6358]">{row.sector}</td>
                <td className="p-3 text-right tabular-nums text-[#4b6358]">{fmt(row.goal)}</td>
                <td className="p-3 text-right tabular-nums font-semibold text-[#294a3b]">{fmt(row.progress)}</td>
                <td className="p-3 text-right tabular-nums text-[#8b6e66]">{fmt(row.remaining)}</td>
                <td className="p-3 text-right tabular-nums">
                  <span className={`font-bold ${row.percentage >= 100 ? "text-[#1a5b40]" : row.percentage >= 80 ? "text-[#d79a29]" : "text-[#bd513c]"}`}>
                    {row.percentage}%
                  </span>
                  <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-[#e8eee9] ml-auto">
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(row.percentage, 100)}%`, backgroundColor: row.percentage >= 100 ? "#1f9d67" : row.percentage >= 80 ? "#d79a29" : "#c4634e" }} />
                  </div>
                </td>
                <td className="p-3 text-right tabular-nums text-[#4b6358]">{fmt(row.manHours)}</td>
                <td className="p-3 pr-5">
                  <StatusChip status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LaborBars({ rows }: { rows: ProductivityReport["byLabor"] }) {
  if (rows.length === 0) return null;
  const maxPct = Math.max(...rows.map((r) => r.percentage), 100);
  return (
    <section className="ag-card p-5 sm:p-6">
      <h2 className="mb-5 text-base font-extrabold text-[#173c2d]">Avance por labor</h2>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.labor}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#355447]">{row.labor}</p>
                <p className="text-[10px] text-[#8d9992]">{fmt(row.progress)} / {fmt(row.goal)} {row.unit}</p>
              </div>
              <strong className="whitespace-nowrap text-xs text-[#173c2d]">{row.percentage}%</strong>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-[#e8eee9]">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(row.percentage / maxPct) * 100}%`, backgroundColor: row.percentage >= 100 ? "#1f9d67" : row.percentage >= 80 ? "#24905f" : row.percentage >= 50 ? "#d79a29" : "#c4634e" }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopWorkersTable({ rows }: { rows: ProductivityReport["topWorkers"] }) {
  if (rows.length === 0) return null;
  const top = rows.slice(0, 10);
  return (
    <section className="ag-card overflow-hidden">
      <h2 className="p-5 pb-0 text-base font-extrabold text-[#173c2d]">Trabajadores con mayor rendimiento</h2>
      <div className="overflow-x-auto">
        <table className="mt-3 w-full min-w-[500px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#e1e8e3] text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">
              <th className="p-3 pl-5">#</th>
              <th className="p-3">Trabajador</th>
              <th className="p-3">Encargado</th>
              <th className="p-3">Labor</th>
              <th className="p-3 text-right">Avance</th>
              <th className="p-3 text-right">Horas</th>
              <th className="p-3 text-right">Rendimiento</th>
              <th className="p-3 pr-5 text-right">Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr key={row.workerName} className="border-b border-[#edf1ee] last:border-0">
                <td className="p-3 pl-5 text-[#8d9992]">{i + 1}</td>
                <td className="p-3 font-bold text-[#294a3b]">{row.workerName}</td>
                <td className="p-3 text-[#4b6358]">{row.leaderName}</td>
                <td className="p-3 text-[#4b6358]">{row.labor}</td>
                <td className="p-3 text-right tabular-nums text-[#294a3b]">{fmt(row.output)} {row.unit}</td>
                <td className="p-3 text-right tabular-nums text-[#4b6358]">{fmt(row.hours)} h</td>
                <td className="p-3 text-right tabular-nums font-bold text-[#1a5b40]">{fmt(row.performance)} <span className="text-[10px] font-normal">/{row.unit === "líneas" ? "h" : "h"}</span></td>
                <td className="p-3 pr-5 text-right tabular-nums text-[#4b6358]">{row.attendanceDays}/{row.attendanceDays + row.absences} días</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LowWorkersTable({ rows }: { rows: ProductivityReport["lowWorkers"] }) {
  if (rows.length === 0) return null;
  const low = rows.slice(0, 10);
  return (
    <section className="ag-card overflow-hidden">
      <h2 className="p-5 pb-0 text-base font-extrabold text-[#173c2d]">Trabajadores que requieren revisión</h2>
      <div className="overflow-x-auto">
        <table className="mt-3 w-full min-w-[500px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#e1e8e3] text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">
              <th className="p-3 pl-5">Trabajador</th>
              <th className="p-3">Encargado</th>
              <th className="p-3">Labor</th>
              <th className="p-3 text-right">Avance</th>
              <th className="p-3 text-right">Horas</th>
              <th className="p-3 text-right">Rendimiento</th>
              <th className="p-3 text-right">Ausencias</th>
              <th className="p-3 pr-5">Observación</th>
            </tr>
          </thead>
          <tbody>
            {low.map((row) => (
              <tr key={row.workerName} className="border-b border-[#edf1ee] last:border-0">
                <td className="p-3 pl-5 font-bold text-[#294a3b]">{row.workerName}</td>
                <td className="p-3 text-[#4b6358]">{row.leaderName}</td>
                <td className="p-3 text-[#4b6358]">{row.labor}</td>
                <td className="p-3 text-right tabular-nums text-[#294a3b]">{fmt(row.output)} {row.unit}</td>
                <td className="p-3 text-right tabular-nums text-[#4b6358]">{fmt(row.hours)} h</td>
                <td className="p-3 text-right tabular-nums text-[#bd513c]">{fmt(row.performance)}</td>
                <td className="p-3 text-right tabular-nums text-[#8b6e66]">{row.absences}</td>
                <td className="p-3 pr-5 text-[#8d9992] italic">{row.observation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {low.length === 0 && <p className="p-5 pt-0 text-sm text-[#60736a]">No hay datos suficientes para evaluar rendimiento bajo.</p>}
    </section>
  );
}

function PendingSectorsTable({ rows }: { rows: ProductivityReport["pendingSectors"] }) {
  if (rows.length === 0) {
    return (
      <section className="ag-card p-5">
        <h2 className="mb-2 text-base font-extrabold text-[#173c2d]">Sectores pendientes</h2>
        <p className="text-sm text-[#60736a]">No hay sectores pendientes en este periodo.</p>
      </section>
    );
  }
  return (
    <section className="ag-card overflow-hidden">
      <h2 className="p-5 pb-0 text-base font-extrabold text-[#173c2d]">Sectores pendientes</h2>
      <div className="overflow-x-auto">
        <table className="mt-3 w-full min-w-[600px] text-left text-xs">
          <thead>
            <tr className="border-b border-[#e1e8e3] text-[10px] font-bold uppercase tracking-wide text-[#8a978f]">
              <th className="p-3 pl-5">Sector</th>
              <th className="p-3">Labor</th>
              <th className="p-3">Encargado</th>
              <th className="p-3 text-right">Meta</th>
              <th className="p-3 text-right">Avance</th>
              <th className="p-3 text-right">Faltante</th>
              <th className="p-3">Prioridad</th>
              <th className="p-3 pr-5">Recomendación</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.sector + row.labor} className="border-b border-[#edf1ee] last:border-0">
                <td className="p-3 pl-5 font-bold text-[#294a3b]">{row.sector}</td>
                <td className="p-3 text-[#4b6358]">{row.labor}</td>
                <td className="p-3 text-[#4b6358]">{row.leaderName}</td>
                <td className="p-3 text-right tabular-nums text-[#4b6358]">{fmt(row.goal)}</td>
                <td className="p-3 text-right tabular-nums text-[#294a3b]">{fmt(row.progress)}</td>
                <td className="p-3 text-right tabular-nums text-[#8b6e66]">{fmt(row.remaining)}</td>
                <td className="p-3"><PriorityBadge priority={row.priority} /></td>
                <td className="p-3 pr-5 text-[#8d9992] text-[10px]">{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "Cumplido": "bg-[#e8f6ee] text-[#18794e]",
    "En avance": "bg-[#fff5dd] text-[#9a6506]",
    "Atrasado": "bg-[#fff0ed] text-[#bd513c]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[status] ?? "bg-[#edf2f8] text-[#50708f]"}`}>{status}</span>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    "Alta": "bg-[#fff0ed] text-[#bd513c]",
    "Media": "bg-[#fff5dd] text-[#9a6506]",
    "Baja": "bg-[#e8f6ee] text-[#18794e]",
  };
  return <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[priority] ?? ""}`}>{priority}</span>;
}

function ExportButtons({ report, operation, period, range }: { report: ProductivityReport; operation: string; period: ReportPeriod; range: ReportRange }) {
  return (
    <>
      <button onClick={() => printReport(report, operation, period, range)} className="ag-secondary min-h-10 px-3 text-xs">
        <Printer size={16} />PDF
      </button>
      <button onClick={() => exportCsv(report, operation, period, range)} className="ag-secondary min-h-10 px-3 text-xs">
        <Download size={16} />CSV
      </button>
      <button onClick={() => exportDoc(report, operation, period, range)} className="ag-secondary min-h-10 px-3 text-xs">
        <FileText size={16} />Informe
      </button>
    </>
  );
}

function fmt(value: number): string {
  return roundProductivity(value).toString();
}

function EmptyState({ text }: { text: string }) {
  return (
    <section className="ag-card p-8 text-center">
      <p className="text-sm font-extrabold text-[#294a3b]">{text}</p>
      <p className="mt-2 text-xs text-[#718078]">Selecciona otro periodo o registra avances para ver datos.</p>
    </section>
  );
}

// ── Export helpers ──────────────────────────────────────────

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(report: ProductivityReport, operation: string, period: string, range: ReportRange) {
  const html = buildReportHtml(report, operation, period, range);
  if (!html) return;
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}

function exportCsv(report: ProductivityReport, operation: string, period: string, range: ReportRange) {
  const rows: string[][] = [];
  const push = (...r: string[][]) => rows.push(...r);

  rows.push(["Dashboard de productividad AgroNex"]);
  rows.push([`Operación: ${operation} · Periodo: ${period} · ${range.start} al ${range.end}`]);
  rows.push([]);

  push(["RESUMEN GENERAL"]);
  push(["Indicador", "Valor"]);
  push(["Meta acumulada", fmt(report.summary.totalGoal)]);
  push(["Avance acumulado", fmt(report.summary.totalOutput)]);
  push(["Cumplimiento", `${report.summary.completion}%`]);
  push(["Faltante", fmt(report.summary.remaining)]);
  push(["Horas hombre", `${fmt(report.summary.totalManHours)} HH`]);
  push(["Trabajadores presentes", String(report.summary.presentCount)]);
  push(["Ausencias", String(report.summary.absentCount)]);
  push(["Rendimiento por hora hombre", fmt(report.summary.outputPerManHour)]);
  rows.push([]);

  if (report.byLeader.length > 0) {
    push(["AVANCE POR ENCARGADO"]);
    push(["Encargado", "Labor", "Sector", "Meta", "Avance", "Faltante", "Cumplimiento", "Horas hombre", "Estado"]);
    report.byLeader.forEach((r) => push([r.leaderName, r.labor, r.sector, fmt(r.goal), fmt(r.progress), fmt(r.remaining), `${r.percentage}%`, fmt(r.manHours), r.status]));
    rows.push([]);
  }

  if (report.byLabor.length > 0) {
    push(["AVANCE POR LABOR"]);
    push(["Labor", "Meta", "Avance", "Cumplimiento"]);
    report.byLabor.forEach((r) => push([r.labor, fmt(r.goal), fmt(r.progress), `${r.percentage}%`]));
    rows.push([]);
  }

  if (report.topWorkers.length > 0) {
    push(["TRABAJADORES CON MAYOR RENDIMIENTO"]);
    push(["Trabajador", "Encargado", "Labor", "Avance", "Horas", "Rendimiento", "Asistencia"]);
    report.topWorkers.slice(0, 10).forEach((r) => push([r.workerName, r.leaderName, r.labor, `${fmt(r.output)} ${r.unit}`, `${fmt(r.hours)} h`, fmt(r.performance), `${r.attendanceDays}/${r.attendanceDays + r.absences} días`]));
    rows.push([]);
  }

  if (report.lowWorkers.length > 0) {
    push(["TRABAJADORES QUE REQUIEREN REVISIÓN"]);
    push(["Trabajador", "Encargado", "Labor", "Avance", "Horas", "Rendimiento", "Ausencias", "Observación"]);
    report.lowWorkers.slice(0, 10).forEach((r) => push([r.workerName, r.leaderName, r.labor, `${fmt(r.output)} ${r.unit}`, `${fmt(r.hours)} h`, fmt(r.performance), String(r.absences), r.observation]));
    rows.push([]);
  }

  if (report.pendingSectors.length > 0) {
    push(["SECTORES PENDIENTES"]);
    push(["Sector", "Labor", "Encargado", "Meta", "Avance", "Faltante", "Prioridad"]);
    report.pendingSectors.forEach((r) => push([r.sector, r.labor, r.leaderName, fmt(r.goal), fmt(r.progress), fmt(r.remaining), r.priority]));
    rows.push([]);
  }

  rows.push(["Resumen ejecutivo"]);
  rows.push([report.executiveSummary]);

  const bom = "\uFEFF";
  const separator = ";";
  const content = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(separator)).join("\n");
  downloadFile(`agronex-dashboard-${range.start}-${range.end}.csv`, bom + content, "text/csv;charset=utf-8");
}

function exportDoc(report: ProductivityReport, operation: string, period: string, range: ReportRange) {
  const html = buildReportHtml(report, operation, period, range);
  if (!html) return;
  downloadFile(`agronex-informe-${range.start}-${range.end}.doc`, html, "application/msword;charset=utf-8");
}

function buildReportHtml(report: ProductivityReport, operation: string, period: string, range: ReportRange): string | null {
  if (report.summary.recordCount === 0) {
    return `<!doctype html><html><head><meta charset="utf-8"><title>Dashboard AgroNex</title></head><body style="font-family:Arial,sans-serif;color:#173c2d;margin:40px"><h1>Dashboard de productividad AgroNex</h1><p>No hay datos suficientes para generar el informe de este periodo.</p></body></html>`;
  }

  const genAt = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const s = report.summary;

  const bar = (pct: number, color = "#1f9d67") =>
    `<div style="height:10px;background:#e8eee9;border-radius:5px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${Math.min(pct, 100)}%;background:${color};border-radius:5px"></div></div>`;

  const cells = [
    ["Meta acumulada", fmt(s.totalGoal)],
    ["Avance acumulado", fmt(s.totalOutput)],
    ["Cumplimiento", `${s.completion}%`],
    ["Faltante", fmt(s.remaining)],
    ["Horas hombre", `${fmt(s.totalManHours)} HH`],
    ["Rend. hora hombre", fmt(s.outputPerManHour)],
  ];

  const tableHtml = (headers: string[], rows: string[][]) =>
    `<table style="border-collapse:collapse;width:100%;margin-top:8px;font-size:11px">
      <thead><tr>${headers.map((h) => `<th style="border:1px solid #dfe7e1;padding:6px 8px;text-align:left;background:#f5f8f6;font-size:10px;text-transform:uppercase">${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((c) => `<td style="border:1px solid #dfe7e1;padding:6px 8px">${c}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;

  const leaderRows = report.byLeader.map((r) => [r.leaderName, r.labor, r.sector, fmt(r.goal), fmt(r.progress), fmt(r.remaining), `${r.percentage}%`, fmt(r.manHours), r.status]);
  const laborRows = report.byLabor.map((r) => [r.labor, fmt(r.goal), fmt(r.progress), `${r.percentage}%${r.percentage > 0 ? bar(r.percentage) : ""}`]);
  const topRows = report.topWorkers.slice(0, 10).map((r, i) => [String(i + 1), r.workerName, r.leaderName, r.labor, `${fmt(r.output)} ${r.unit}`, `${fmt(r.hours)} h`, fmt(r.performance), `${r.attendanceDays}/${r.attendanceDays + r.absences}`]);
  const lowRows = report.lowWorkers.slice(0, 10).map((r) => [r.workerName, r.leaderName, r.labor, `${fmt(r.output)} ${r.unit}`, `${fmt(r.hours)} h`, fmt(r.performance), String(r.absences), r.observation]);
  const pendRows = report.pendingSectors.map((r) => [r.sector, r.labor, r.leaderName, fmt(r.goal), fmt(r.progress), fmt(r.remaining), r.priority, r.recommendation]);

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Dashboard de productividad AgroNex</title>
<style>
  body{font-family:Arial,sans-serif;color:#173c2d;margin:32px;font-size:13px;line-height:1.5}
  h1{font-size:22px;margin:0 0 4px}
  h2{font-size:15px;margin:20px 0 4px;color:#1a5b40}
  .meta{color:#60736a;font-size:12px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
  .card{border:1px solid #dfe7e1;border-radius:8px;padding:10px 12px}
  .card strong{display:block;font-size:18px;margin-top:2px}
  .card .lbl{font-size:10px;text-transform:uppercase;color:#8a978f}
  table{border-collapse:collapse;width:100%;margin-top:8px;font-size:11px}
  th{border:1px solid #dfe7e1;padding:6px 8px;text-align:left;background:#f5f8f6;font-size:10px;text-transform:uppercase;color:#60736a}
  td{border:1px solid #dfe7e1;padding:6px 8px}
  .right{text-align:right}
  .pct{font-weight:bold}
  .ok{color:#1a5b40} .warn{color:#d79a29} .bad{color:#bd513c}
  hr{border:none;border-top:1px solid #dfe7e1;margin:20px 0}
</style></head><body>
<h1>Dashboard de productividad AgroNex</h1>
<p class="meta">Operación: ${operation} · Periodo: ${period} · ${range.start} al ${range.end}</p>
<p class="meta">Fecha de generación: ${genAt}</p>

<h2>Resumen ejecutivo</h2>
<p style="margin-top:4px">${report.executiveSummary}</p>

<h2>Indicadores principales</h2>
<div class="grid">${cells.map(([l, v]) => `<div class="card"><div class="lbl">${l}</div><strong>${v}</strong></div>`).join("")}</div>

${report.byLeader.length > 0 ? `<h2>Avance por encargado</h2>${tableHtml(["Encargado","Labor","Sector","Meta","Avance","Faltante","Cumplimiento","HH","Estado"], leaderRows)}` : ""}

${report.byLabor.length > 0 ? `<h2>Avance por labor</h2>${tableHtml(["Labor","Meta","Avance","Cumplimiento"], laborRows)}` : ""}

${report.topWorkers.length > 0 ? `<h2>Trabajadores con mayor rendimiento</h2>${tableHtml(["#","Trabajador","Encargado","Labor","Avance","Horas","Rendimiento","Asistencia"], topRows)}` : ""}

${report.lowWorkers.length > 0 ? `<h2>Trabajadores que requieren revisión</h2>${tableHtml(["Trabajador","Encargado","Labor","Avance","Horas","Rendimiento","Ausencias","Observación"], lowRows)}` : ""}

${report.pendingSectors.length > 0 ? `<h2>Sectores pendientes</h2>${tableHtml(["Sector","Labor","Encargado","Meta","Avance","Faltante","Prioridad","Recomendación"], pendRows)}` : ""}

<h2>Recomendaciones</h2>
<p>${report.recommendation}</p>
<hr>
<p class="meta" style="font-size:10px">Reporte generado por AgroNex — by Zidnex Digital</p>
</body></html>`;
}
