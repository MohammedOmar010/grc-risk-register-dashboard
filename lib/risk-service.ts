import type {
  ApplicableFramework,
  Department,
  ImplementationStatus,
  Risk,
  RiskLevel,
  RiskStatus,
  RiskTreatment,
} from "@/types/risk";
import { assertSupabaseConfigured } from "@/lib/supabase";

type RiskRow = {
  id: string;
  risk_code: string;
  title: string | null;
  description: string | null;
  department: string | null;
  scope_asset: string | null;
  business_impact_types: string[] | null;
  business_impact_summary: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  communication_date: string | null;
  risk_statement: string | null;
  category: string | null;
  likelihood: number | null;
  impact: number | null;
  score: number | null;
  level: string | null;
  owner: string | null;
  applicable_framework: string | null;
  control_reference: string | null;
  recommended_controls: string | null;
  treatment_strategy: string | null;
  mitigation_plan: string | null;
  due_date: string | null;
  implementation_status: string | null;
  residual_likelihood: number | null;
  residual_impact: number | null;
  residual_score: number | null;
  residual_level: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RiskInsert = Omit<RiskRow, "id" | "created_at" | "updated_at">;

const departments: Department[] = ["Information Technology", "Operations", "Finance", "Human Resources", "Procurement", "Legal"];
const levels: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
const statuses: RiskStatus[] = ["Submitted", "Under GRC Review", "Assessment Completed", "Treatment Assigned", "In Progress", "Pending GRC Verification", "Closed"];
const treatments: RiskTreatment[] = ["Mitigation", "Accept", "Transfer", "Avoid"];
const implementations: ImplementationStatus[] = ["Not Started", "In Progress", "Implemented", "Verified"];
const frameworks: ApplicableFramework[] = ["NCA ECC 2-2024", "CST CRF", "Not Determined"];

function cleanDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function asDepartment(value: string | null): Department {
  return departments.includes(value as Department) ? (value as Department) : "Information Technology";
}
function asLevel(value: string | null): RiskLevel | null {
  return levels.includes(value as RiskLevel) ? (value as RiskLevel) : null;
}
function asStatus(value: string | null): RiskStatus {
  return statuses.includes(value as RiskStatus) ? (value as RiskStatus) : "Submitted";
}
function asTreatment(value: string | null): RiskTreatment | "" {
  return treatments.includes(value as RiskTreatment) ? (value as RiskTreatment) : "";
}
function asImplementation(value: string | null): ImplementationStatus {
  return implementations.includes(value as ImplementationStatus) ? (value as ImplementationStatus) : "Not Started";
}
function asFramework(value: string | null): ApplicableFramework {
  return frameworks.includes(value as ApplicableFramework) ? (value as ApplicableFramework) : "Not Determined";
}

function mapRowToRisk(row: RiskRow): Risk {
  return {
    databaseId: row.id,
    id: row.risk_code,
    department: asDepartment(row.department),
    scopeAsset: row.scope_asset || "",
    title: row.title || "",
    description: row.description || "",
    businessImpactTypes: row.business_impact_types || [],
    businessImpactSummary: row.business_impact_summary || "",
    submittedBy: row.submitted_by || "",
    submittedAt: row.submitted_at || row.created_at || "",
    communicationDate: row.communication_date || "",
    riskStatement: row.risk_statement || "",
    category: row.category || "",
    likelihood: row.likelihood === null ? null : Number(row.likelihood),
    impact: row.impact === null ? null : Number(row.impact),
    score: row.score === null ? null : Number(row.score),
    level: asLevel(row.level),
    owner: row.owner || "",
    framework: asFramework(row.applicable_framework),
    controlReference: row.control_reference || "",
    recommendedControls: row.recommended_controls || "",
    treatment: asTreatment(row.treatment_strategy),
    mitigationPlan: row.mitigation_plan || "",
    dueDate: row.due_date || "",
    implementationStatus: asImplementation(row.implementation_status),
    residualLikelihood: row.residual_likelihood === null ? null : Number(row.residual_likelihood),
    residualImpact: row.residual_impact === null ? null : Number(row.residual_impact),
    residualScore: row.residual_score === null ? null : Number(row.residual_score),
    residualLevel: asLevel(row.residual_level),
    status: asStatus(row.status),
    createdAt: cleanDate(row.created_at),
    updatedAt: row.updated_at || row.created_at || "",
  };
}

function mapRiskToInsert(risk: Risk): RiskInsert {
  return {
    risk_code: risk.id,
    title: risk.title || null,
    description: risk.description || null,
    department: risk.department,
    scope_asset: risk.scopeAsset || null,
    business_impact_types: risk.businessImpactTypes,
    business_impact_summary: risk.businessImpactSummary || null,
    submitted_by: risk.submittedBy || null,
    submitted_at: risk.submittedAt || null,
    communication_date: risk.communicationDate || null,
    risk_statement: risk.riskStatement || null,
    category: risk.category || null,
    likelihood: risk.likelihood,
    impact: risk.impact,
    score: risk.score,
    level: risk.level,
    owner: risk.owner || null,
    applicable_framework: risk.framework,
    control_reference: risk.controlReference || null,
    recommended_controls: risk.recommendedControls || null,
    treatment_strategy: risk.treatment || null,
    mitigation_plan: risk.mitigationPlan || null,
    due_date: risk.dueDate || null,
    implementation_status: risk.implementationStatus,
    residual_likelihood: risk.residualLikelihood,
    residual_impact: risk.residualImpact,
    residual_score: risk.residualScore,
    residual_level: risk.residualLevel,
    status: risk.status,
  };
}

export async function getRisks() {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase.from("risks").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRowToRisk(row as RiskRow));
}

export async function createRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const { data, error } = await supabase.from("risks").insert(mapRiskToInsert(risk)).select("*").single();
  if (error) throw error;
  return mapRowToRisk(data as RiskRow);
}

export async function updateRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const query = supabase.from("risks").update(mapRiskToInsert(risk));
  const filtered = risk.databaseId ? query.eq("id", risk.databaseId) : query.eq("risk_code", risk.id);
  const { data, error } = await filtered.select("*").single();
  if (error) throw error;
  return mapRowToRisk(data as RiskRow);
}

export async function deleteRiskRecord(risk: Risk) {
  const supabase = assertSupabaseConfigured();
  const query = supabase.from("risks").delete();
  const { error } = risk.databaseId ? await query.eq("id", risk.databaseId) : await query.eq("risk_code", risk.id);
  if (error) throw error;
}

export async function replaceRisksWithSamples(sampleRisks: Risk[]) {
  const supabase = assertSupabaseConfigured();
  const { error: deleteError } = await supabase.from("risks").delete().neq("risk_code", "__never__");
  if (deleteError) throw deleteError;
  const { data, error } = await supabase.from("risks").insert(sampleRisks.map(mapRiskToInsert)).select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((row) => mapRowToRisk(row as RiskRow));
}
