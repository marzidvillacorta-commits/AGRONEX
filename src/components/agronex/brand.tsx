import { Sprout } from "lucide-react";

export function AgroLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return <div className="flex items-center gap-2.5"><span className={`grid size-10 place-items-center rounded-[14px] ${light ? "bg-white/15 text-[#b9e5c8]" : "bg-[#e6f4eb] text-[#18794e]"}`}><Sprout size={22} strokeWidth={2.4} /></span>{!compact && <strong className={`text-[19px] font-extrabold tracking-tight ${light ? "text-white" : "text-[#173c2d]"}`}>AgroNex</strong>}</div>;
}
