import { Link } from "@tanstack/react-router";
import { Brain, ChevronRight, Heart, Shield, Zap } from "lucide-react";
import type { UserStats } from "@/hooks/useUserStore";
import type { CheckinRecord, WellbeingPrediction } from "@/lib/wellbeing/types";
import { RISK_COPY, DISCLAIMER } from "@/lib/wellbeing/copy";
import { TREND_COPY } from "@/lib/wellbeing/trend";
import { CheckinCard } from "@/components/wellbeing/CheckinCard";
import { getMissionById, primaryStatOf } from "@/lib/missionsData";

const STATS = [
  { key: "bienestar" as const, label: "Bienestar", icon: Heart },
  { key: "resiliencia" as const, label: "Resiliencia", icon: Shield },
  { key: "energia" as const, label: "Energía", icon: Zap },
  { key: "claridad" as const, label: "Claridad", icon: Brain },
];

interface Props {
  stats: UserStats;
  missionHistory: { id: string; title: string; date: string; xp: number }[];
  isLoading: boolean;
  consentAccepted: boolean;
  todayCheckin: CheckinRecord | null;
  prediction: WellbeingPrediction | null;
  checkinPending: boolean;
  onCheckin: (v: { mood: number; stress: number; energy: number; social: number; sleepHours: number | null }) => void;
}

export function IntegratedStatus({ stats, missionHistory, isLoading, consentAccepted, todayCheckin, prediction, checkinPending, onCheckin }: Props) {
  if (isLoading) return <div className="space-y-3"><div className="h-20 animate-pulse rounded-2xl bg-card" /><div className="h-40 animate-pulse rounded-2xl bg-card" /></div>;
  const level = prediction?.riskLevel ?? "insuficiente";
  const copy = RISK_COPY[level];
  return <div className="space-y-3">
    {!consentAccepted ? <Link to="/ai" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4"><Brain className="h-5 w-5 text-primary" /><div className="flex-1"><p className="text-sm font-semibold">Predicción de bienestar</p><p className="text-xs text-muted-foreground">Activa el módulo preventivo</p></div><ChevronRight className="h-4 w-4" /></Link> : <Link to="/ai" className="block rounded-2xl border border-primary/30 bg-primary/5 p-4"><div className="flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /><span className="font-semibold">{copy.title}</span>{typeof prediction?.score === "number" && <span className="ml-auto font-bold">{Math.round(prediction.score * 100)}%</span>}</div><p className="mt-1 text-xs text-muted-foreground">{todayCheckin ? "Check-in de hoy listo" : "Aún no has hecho tu check-in de hoy"}</p>{prediction && <p className="mt-2 text-[10px] text-muted-foreground">{TREND_COPY[prediction.trend].label}</p>}<p className="mt-2 text-[10px] text-muted-foreground">{DISCLAIMER}</p></Link>}
    <div className="grid grid-cols-2 gap-3">{STATS.map(({ key, label, icon: Icon }) => <div key={key} className="rounded-xl border border-border bg-card p-3"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div><p className="mt-1 text-2xl font-bold">{stats[key]}%</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${stats[key]}%` }} /></div></div>)}</div>
    {consentAccepted && <CheckinCard today={todayCheckin} pending={checkinPending} onSubmit={onCheckin} />}
    <div><div className="flex items-center justify-between"><h2 className="font-cinzel font-semibold">Actividad reciente</h2><Link to="/missions" className="text-xs text-primary">Ir a misiones →</Link></div><div className="mt-3 space-y-2">{missionHistory.slice(0, 3).map((h, i) => { const stat = primaryStatOf(getMissionById(h.id)); return <div key={`${h.id}-${i}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"><span>✅</span><div className="flex-1"><p className="text-sm font-medium">{h.title}</p><p className="text-[10px] text-muted-foreground">{h.date}</p></div>{stat && <span className="text-[10px] text-muted-foreground">{stat}</span>}<span className="text-[10px] font-bold text-soul-gold">+{h.xp} XP</span></div>})}</div></div>
  </div>;
}
