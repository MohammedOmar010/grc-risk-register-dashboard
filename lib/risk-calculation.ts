import type { RiskLevel } from "@/types/risk";

export function calculateRiskScore(likelihood: number, impact: number): number {
  return Number(likelihood) * Number(impact);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 16) return "حرج";
  if (score >= 11) return "عالي";
  if (score >= 6) return "متوسط";
  return "منخفض";
}

export function getLevelBadgeClasses(level: RiskLevel): string {
  switch (level) {
    case "حرج":
      return "bg-red-50 text-red-700 border-red-200";
    case "عالي":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "متوسط":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case "مغلق":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "قيد المعالجة":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}
