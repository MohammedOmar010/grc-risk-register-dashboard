import type { RiskLevel } from "@/types/risk";

export function calculateRiskScore(likelihood: number | null, impact: number | null): number | null {
  if (!likelihood || !impact) return null;
  return Number(likelihood) * Number(impact);
}

export function getRiskLevel(score: number | null): RiskLevel | null {
  if (score === null) return null;
  if (score >= 16) return "Critical";
  if (score >= 11) return "High";
  if (score >= 6) return "Medium";
  return "Low";
}

export function getLevelBadgeClasses(level: RiskLevel | null): string {
  switch (level) {
    case "Critical": return "bg-red-50 text-red-700 border-red-200";
    case "High": return "bg-orange-50 text-orange-700 border-orange-200";
    case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
    case "Low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default: return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "Closed": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Pending GRC Verification": return "bg-violet-50 text-violet-700 border-violet-200";
    case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Treatment Assigned": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Under GRC Review": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
