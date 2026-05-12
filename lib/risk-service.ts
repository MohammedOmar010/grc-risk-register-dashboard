import type { CsfFunction, Risk, RiskLevel, RiskStatus, RiskTreatment } from "@/types/risk";
import { assertSupabaseConfigured } from "@/lib/supabase";

type RiskRow = {
  id: string;
  risk_code: string;
  title: string;
  description: string;
  asset: string | null;
  threat: string | null;
  vulnerability: string | null;
  category: string;
  likelihood: number;
  impact: number;
  score: number;
  level: string;
  status: string;
  owner: string;
  department: string | null;
  mitigation_plan: string | null;
  treatment_strategy: string | null;
  nist_csf_function: string | null;
  framework: string | null;
  control: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RiskInsert = Omit<RiskRow, "id" | "created_at" | "updated_at">;

const riskLevels: RiskLevel[] = ["منخفض", "متوسط", "عالي", "حرج"];
const riskStatuses: RiskStatus[] = ["مفتوح", "قيد المعالجة", "مغلق"];
const riskTreatments: RiskTreatment[] = ["تخفيف", "قبول", "نقل", "تجنب"];
const csfFunctions: CsfFunction[] = ["Govern", "Identify", "Protect", "Detect", "Respond", "Recover"];

function toIsoDate(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function asRiskLevel(value: string): RiskLevel {
  return riskLevels.includes(value as RiskLevel) ? (value as RiskLevel) : "منخفض";
}

function asRiskStatus(value: string): RiskStatus {
  return riskStatuses.includes(value as RiskStatus) ? (value as RiskStatus) : "مفتوح";
}

function asRiskTreatment(value: string | null): RiskTreatment {
  return riskTreatments.includes(value as RiskTreatment) ? (value as RiskTreatment) : "تخفيف";
}

function asCsfFunction(value: string | null): CsfFunction {
  return csfFunctions.includes(value as CsfFunction) ? (value as CsfFunction) : "Govern";
}

function mapRowToRisk(row: RiskRow): Risk {
  return {
    databaseId: row.id,
    id: row.risk_code,
    title: row.title,
    description: row.description,
    category: row.category,
    asset: row.asset || "",
    threat: row.threat || "",
    vulnerability: row.vulnerability || "",
    likelihood: Number(row.likelihood),
    impact: Number(row.impact),
    score: Number(row.score),
    level: asRiskLevel(row.level),
    owner: row.owner,
    department: row.department || "",
    mitigationPlan: row.mitigation_plan || "",
    control: row.control || "",
    frameworkRef: row.framework || "",
    csfFunction: asCsfFunction(row.nist_csf_function),
    treatment: asRiskTreatment(row.treatment_strategy),
    status: asRiskStatus(row.status),
    dueDate: row.due_date || "",
    createdAt: toIsoDate(row.created_at),
    updatedAt: toIsoDate(row.updated_at),
  };
}

function mapRiskToInsert(risk: Risk): RiskInsert {
  return {
    risk_code: risk.id,
    title: risk.title,
    description: risk.description,
    asset: risk.asset || null,
    threat: risk.threat || null,
    vulnerability: risk.vulnerability || null,
    category: risk.category,
    likelihood: risk.likelihood,
    impact: risk.impact,
    score: risk.score,
    level: risk.level,
    status: risk.status,
    owner: risk.owner,
    department: risk.department || null,
    mitigation_plan: risk.mitigationPlan || null,
    treatment_strategy: risk.treatment,
    nist_csf_function: risk.csfFunction,
    framework: risk.frameworkRef || null,
    control: risk.control || null,
    due_date: risk.dueDate || null,
  };
}

export async function getRisks() {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("risks")
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => mapRowToRisk(row as RiskRow));
}

export async function createRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase
    .from("risks")
    .insert(mapRiskToInsert(risk))
    .select("*")
    .single();

  if (error) throw error;

  return mapRowToRisk(data as RiskRow);
}

export async function updateRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const updateQuery = supabase.from("risks").update(mapRiskToInsert(risk));
  const filteredQuery = risk.databaseId
    ? updateQuery.eq("id", risk.databaseId)
    : updateQuery.eq("risk_code", risk.id);

  const { data, error } = await filteredQuery.select("*").single();

  if (error) throw error;

  return mapRowToRisk(data as RiskRow);
}

export async function deleteRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const query = supabase.from("risks").delete();
  const { error } = risk.databaseId
    ? await query.eq("id", risk.databaseId)
    : await query.eq("risk_code", risk.id);

  if (error) throw error;
}

export async function replaceRisksWithSamples(sampleRisks: Risk[]) {
  const supabase = assertSupabaseConfigured();
  const { error: deleteError } = await supabase.from("risks").delete().neq("risk_code", "__never__");

  if (deleteError) throw deleteError;

  const { data, error } = await supabase
    .from("risks")
    .insert(sampleRisks.map(mapRiskToInsert))
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((row) => mapRowToRisk(row as RiskRow));
}
