export type RiskStatus = "مفتوح" | "قيد المعالجة" | "مغلق";
export type RiskLevel = "منخفض" | "متوسط" | "عالي" | "حرج";
export type RiskTreatment = "تخفيف" | "قبول" | "نقل" | "تجنب";
export type CsfFunction = "Govern" | "Identify" | "Protect" | "Detect" | "Respond" | "Recover";

export type Risk = {
  databaseId?: string;
  id: string;
  title: string;
  description: string;
  category: string;
  asset: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  score: number;
  level: RiskLevel;
  owner: string;
  department: string;
  mitigationPlan: string;
  control: string;
  frameworkRef: string;
  csfFunction: CsfFunction;
  treatment: RiskTreatment;
  status: RiskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type RiskFormData = Omit<Risk, "id" | "score" | "level" | "createdAt" | "updatedAt">;
