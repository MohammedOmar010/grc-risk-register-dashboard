export type Department =
  | "Information Technology"
  | "Operations"
  | "Finance"
  | "Human Resources"
  | "Procurement"
  | "Legal";

export type UserRole = "Cybersecurity GRC" | "Director" | "Manager";
export type RiskStatus =
  | "Submitted"
  | "Under GRC Review"
  | "Assessment Completed"
  | "Treatment Assigned"
  | "In Progress"
  | "Pending GRC Verification"
  | "Closed";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";
export type RiskTreatment = "Mitigation" | "Accept" | "Transfer" | "Avoid";
export type ImplementationStatus = "Not Started" | "In Progress" | "Implemented" | "Verified";
export type ApplicableFramework = "NCA ECC 2-2024" | "CST CRF" | "Not Determined";

export type Risk = {
  databaseId?: string;
  id: string;
  department: Department;
  scopeAsset: string;
  title: string;
  description: string;
  businessImpactTypes: string[];
  businessImpactSummary: string;
  submittedBy: string;
  submittedAt: string;
  communicationDate: string;

  riskStatement: string;
  category: string;
  likelihood: number | null;
  impact: number | null;
  score: number | null;
  level: RiskLevel | null;
  owner: string;
  framework: ApplicableFramework;
  controlReference: string;
  recommendedControls: string;
  treatment: RiskTreatment | "";
  mitigationPlan: string;
  dueDate: string;
  implementationStatus: ImplementationStatus;
  residualLikelihood: number | null;
  residualImpact: number | null;
  residualScore: number | null;
  residualLevel: RiskLevel | null;
  status: RiskStatus;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionFormData = {
  department: Department;
  scopeAsset: string;
  title: string;
  description: string;
  businessImpactTypes: string[];
  businessImpactSummary: string;
  submittedBy: string;
};

export type GrcAssessmentFormData = Pick<
  Risk,
  | "riskStatement"
  | "category"
  | "likelihood"
  | "impact"
  | "owner"
  | "framework"
  | "controlReference"
  | "recommendedControls"
  | "treatment"
  | "mitigationPlan"
  | "dueDate"
  | "implementationStatus"
  | "residualLikelihood"
  | "residualImpact"
  | "status"
>;

export type AuditEvent = {
  id: string;
  riskId: string;
  timestamp: string;
  user: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
};
