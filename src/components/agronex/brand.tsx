import { Sprout } from "lucide-react";

export function AgroLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className={`grid size-10 place-items-center rounded-[14px] ${light ? "bg-white/15 text-[#b9e5c8]" : "bg-[#e6f4eb] text-[#18794e]"}`}><Sprout size={22} strokeWidth={2.4} /></span>{!compact && <span className={`leading-tight ${light ? "text-white" : "text-[#173c2d]"}`}><strong className="block text-[17px] font-extrabold tracking-tight">AgroNex</strong><span className={`block text-[10px] font-semibold uppercase tracking-[.16em] ${light ? "text-white/60" : "text-[#6e8278]"}`}>Gestión agrícola</span></span>}</div>;
}
