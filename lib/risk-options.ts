import type { ApplicableFramework, Department, ImplementationStatus, RiskStatus, RiskTreatment } from "@/types/risk";

export const OTHER_OPTION = "Other / Custom";

export const departments: Department[] = [
  "Information Technology",
  "Operations",
  "Finance",
  "Human Resources",
  "Procurement",
  "Legal",
];

export type ConcernPreset = {
  label: string;
  scopeAsset: string;
  description: string;
  impactTypes: string[];
  consequence: string;
};

// Guided examples are intentionally business-friendly. Selecting one keeps the
// scope, issue, observed condition and business consequence aligned for MVP demos.
export const concernPresetsByDepartment: Record<Department, ConcernPreset[]> = {
  "Information Technology": [
    {
      label: "Privileged accounts are not consistently protected with MFA",
      scopeAsset: "Identity & Access Management",
      description: "Some privileged or sensitive accounts are not consistently protected with multi-factor authentication.",
      impactTypes: ["Operational / Service", "Data / Information"],
      consequence: "Unauthorized privileged access could affect critical systems or expose sensitive information.",
    },
    {
      label: "Critical security patches are overdue",
      scopeAsset: "Endpoints / Servers",
      description: "One or more systems have overdue critical security updates or known vulnerabilities awaiting remediation.",
      impactTypes: ["Operational / Service", "Data / Information"],
      consequence: "Known vulnerabilities could be exploited and disrupt systems or expose information.",
    },
    {
      label: "A critical system has weak logging or monitoring",
      scopeAsset: "Applications / Systems",
      description: "Security-relevant activity is not fully logged, monitored, or alerted for the affected system.",
      impactTypes: ["Operational / Service", "Data / Information"],
      consequence: "A security event may not be detected or investigated quickly enough, increasing business impact.",
    },
  ],
  Operations: [
    {
      label: "A critical service has no tested recovery process",
      scopeAsset: "Critical Business Service",
      description: "Recovery steps for a critical operational service are not fully documented, tested, or assigned to clear owners.",
      impactTypes: ["Operational / Service", "Customer"],
      consequence: "A service failure could take longer to recover from and disrupt customer or business operations.",
    },
    {
      label: "A critical process depends on one person or one component",
      scopeAsset: "Operational Process",
      description: "A critical process has a single point of dependency with no validated backup resource or alternative process.",
      impactTypes: ["Operational / Service", "Customer"],
      consequence: "Loss of the key person or component could delay or stop the service.",
    },
    {
      label: "A business-critical external service has not been security reviewed",
      scopeAsset: "Third-Party Service",
      description: "A business-critical external or internet-facing service has not completed a recent security review.",
      impactTypes: ["Operational / Service", "Customer", "Reputation"],
      consequence: "An unaddressed weakness could disrupt operations or affect external users.",
    },
  ],
  Finance: [
    {
      label: "Users have more access to a financial process than they need",
      scopeAsset: "Payment / Treasury Process",
      description: "Some users retain permissions beyond their current responsibilities in a financial workflow.",
      impactTypes: ["Financial", "Legal / Regulatory"],
      consequence: "Unauthorized or inappropriate transactions could result in financial loss or control exceptions.",
    },
    {
      label: "Segregation of duties is not clear in a financial workflow",
      scopeAsset: "Payment / Treasury Process",
      description: "The same user or role can perform activities that should be separated for control purposes.",
      impactTypes: ["Financial", "Legal / Regulatory"],
      consequence: "Conflicting duties could allow an error or unauthorized transaction to proceed without independent review.",
    },
    {
      label: "A critical financial report depends on one person or manual process",
      scopeAsset: "Financial Reporting",
      description: "A critical reporting activity depends on one individual or undocumented manual steps.",
      impactTypes: ["Operational / Service", "Financial"],
      consequence: "Absence of the key person or a process failure could delay financial reporting and decisions.",
    },
  ],
  "Human Resources": [
    {
      label: "Sensitive employee files are accessible too broadly",
      scopeAsset: "Employee Records",
      description: "A shared location or HR system allows broader access to employee information than the business need requires.",
      impactTypes: ["Data / Information", "Legal / Regulatory", "Reputation"],
      consequence: "Sensitive employee information could be exposed to unauthorized users.",
    },
    {
      label: "Accounts are not removed quickly after an employee leaves",
      scopeAsset: "Offboarding / Access Termination",
      description: "Account closure can be delayed when employee exit notifications or deprovisioning actions are late.",
      impactTypes: ["Data / Information", "Legal / Regulatory"],
      consequence: "An active account after employee exit could be used to access internal systems without authorization.",
    },
    {
      label: "Employee information is shared through an insecure process",
      scopeAsset: "Employee Records",
      description: "Sensitive employee information is exchanged through a process that may not have appropriate access or protection controls.",
      impactTypes: ["Data / Information", "Reputation"],
      consequence: "Employee data could be disclosed, altered, or accessed by unintended recipients.",
    },
  ],
  Procurement: [
    {
      label: "Supplier cybersecurity evidence is incomplete",
      scopeAsset: "Supplier Evidence / Due Diligence",
      description: "A supplier is progressing through onboarding or review without all required cybersecurity evidence being validated.",
      impactTypes: ["Operational / Service", "Data / Information", "Legal / Regulatory"],
      consequence: "The organization could approve or rely on a supplier whose cybersecurity controls have not been adequately verified.",
    },
    {
      label: "A supplier has access before security due diligence is complete",
      scopeAsset: "Vendor Onboarding",
      description: "A supplier may receive system, data, or facility access before cybersecurity due diligence is completed.",
      impactTypes: ["Data / Information", "Operational / Service", "Legal / Regulatory"],
      consequence: "Unverified supplier access could introduce cybersecurity or compliance exposure.",
    },
    {
      label: "Cybersecurity requirements are missing from a supplier contract",
      scopeAsset: "Supplier Contract",
      description: "A supplier agreement does not clearly define required cybersecurity responsibilities, evidence, or notification obligations.",
      impactTypes: ["Legal / Regulatory", "Operational / Service"],
      consequence: "Unclear obligations could create accountability and remediation gaps if a supplier security issue occurs.",
    },
  ],
  Legal: [
    {
      label: "Cybersecurity responsibilities are unclear in a contract",
      scopeAsset: "Contract / Agreement",
      description: "A draft or active agreement does not clearly define cybersecurity responsibilities between the parties.",
      impactTypes: ["Legal / Regulatory", "Operational / Service"],
      consequence: "Unclear responsibilities could delay response, remediation, or accountability during a security incident.",
    },
    {
      label: "Security incident notification requirements are missing or unclear",
      scopeAsset: "Contract / Agreement",
      description: "The agreement does not clearly define when and how the other party must notify the organization of a cybersecurity incident.",
      impactTypes: ["Legal / Regulatory", "Reputation", "Operational / Service"],
      consequence: "Late or unclear notification could delay incident response and regulatory or contractual actions.",
    },
    {
      label: "A data protection obligation may not be fully addressed",
      scopeAsset: "Data Processing Agreement",
      description: "The contract or processing arrangement may not fully address required protection, handling, or accountability for sensitive information.",
      impactTypes: ["Legal / Regulatory", "Data / Information", "Reputation"],
      consequence: "Insufficient contractual protection could result in data handling, compliance, or accountability issues.",
    },
  ],
};

export const scopeAssetOptionsByDepartment: Record<Department, string[]> = {
  "Information Technology": ["Identity & Access Management", "Network / Infrastructure", "Applications / Systems", "Cloud Services", "Endpoints / Servers", "Data / Databases"],
  Operations: ["Critical Business Service", "Operational Process", "Facility / Site", "Operational System", "Third-Party Service"],
  Finance: ["Payment / Treasury Process", "Financial Reporting", "ERP / Finance System", "Banking Integration", "Sensitive Financial Data"],
  "Human Resources": ["Employee Records", "HR System", "Payroll / Benefits", "Recruitment / Onboarding", "Offboarding / Access Termination"],
  Procurement: ["Vendor Onboarding", "Supplier Contract", "Third-Party Service", "Purchase Process", "Supplier Evidence / Due Diligence"],
  Legal: ["Contract / Agreement", "Regulatory Obligation", "Legal Case / Matter", "Data Processing Agreement", "Third-Party Terms"],
};

export const concernDescriptionOptions = [
  "A required control is missing or is not consistently implemented.",
  "The current process is manual and may fail, be delayed, or depend on one person.",
  "Access or permissions appear broader than the documented business need.",
  "Required security evidence, review, or validation is incomplete.",
  "The service or process has a dependency or single point of failure.",
  "A regulatory, contractual, or policy requirement may not be fully addressed.",
];

export const businessImpactOptions = ["Operational / Service", "Financial", "Customer", "Legal / Regulatory", "Data / Information", "Reputation", "Other"];

export const businessConsequenceOptions = [
  "Service disruption or delayed operations.",
  "Unauthorized access or disclosure of sensitive information.",
  "Financial loss, incorrect transaction, or delayed reporting.",
  "Regulatory, legal, or contractual non-compliance.",
  "Customer impact or degraded service quality.",
  "Reputational impact or loss of stakeholder confidence.",
  "Third-party or supply-chain exposure.",
];

// Default MVP criteria. These are transparent demonstration criteria, not an
// NCA/CST scoring formula. A production deployment should replace them with the
// organization's formally approved Cybersecurity Risk Management Methodology.
export const likelihoodOptions = [
  {
    value: 1,
    label: "1 - Rare",
    description: "No known similar events; exposure is very limited; existing controls are proven effective.",
  },
  {
    value: 2,
    label: "2 - Unlikely",
    description: "The scenario is possible but uncommon; exposure is limited and controls are generally effective.",
  },
  {
    value: 3,
    label: "3 - Possible",
    description: "A realistic scenario exists; there is meaningful exposure, a known weakness, or only partially effective controls.",
  },
  {
    value: 4,
    label: "4 - Likely",
    description: "There is clear exposure, recent/relevant history, or significant control weakness that makes occurrence reasonably expected.",
  },
  {
    value: 5,
    label: "5 - Almost Certain",
    description: "Exposure is persistent or the event is recurring/ongoing, with ineffective or absent controls.",
  },
];

export const impactOptions = [
  {
    value: 1,
    label: "1 - Insignificant",
    description: "Minimal effect; no meaningful service, financial, legal, data, customer, or reputation consequence.",
  },
  {
    value: 2,
    label: "2 - Minor",
    description: "Limited local impact; short disruption or small business effect that can be recovered from easily.",
  },
  {
    value: 3,
    label: "3 - Moderate",
    description: "Noticeable impact to one department, service, process, customer group, or internal obligation.",
  },
  {
    value: 4,
    label: "4 - Major",
    description: "Major service, financial, regulatory, data, customer, or reputation impact requiring management attention.",
  },
  {
    value: 5,
    label: "5 - Severe",
    description: "Enterprise-wide or critical-service impact, severe financial/regulatory consequence, or major sensitive-data/customer harm.",
  },
];

export const statusOptions: RiskStatus[] = ["Submitted", "Under GRC Review", "Assessment Completed", "Treatment Assigned", "In Progress", "Pending GRC Verification", "Closed"];

export const treatmentOptions: RiskTreatment[] = ["Mitigation", "Accept", "Transfer", "Avoid"];
export const implementationStatusOptions: ImplementationStatus[] = ["Not Started", "In Progress", "Implemented", "Verified"];
export const frameworkOptions: ApplicableFramework[] = ["NCA ECC 2-2024", "CST CRF", "Not Determined"];

export const riskCategoryOptions = ["Identity & Access", "Vulnerability Management", "Asset Management", "Network Security", "Cloud Security", "Data Protection", "Third-Party Risk", "Business Continuity", "Incident Response", "Governance & Compliance"];

export const riskStatementSuggestions = [
  "A control weakness could allow unauthorized access, resulting in loss of confidentiality, integrity, or availability.",
  "A known security weakness could be exploited, resulting in service disruption or information exposure.",
  "A process or governance gap could result in non-compliance, delayed remediation, or unclear accountability.",
  "A critical dependency or recovery gap could result in prolonged service disruption.",
  "A third-party control gap could introduce cybersecurity, operational, or compliance exposure.",
];

export const riskOwnerSuggestionsByDepartment: Record<Department, string[]> = {
  "Information Technology": ["IT Director", "Infrastructure Manager", "Application Owner", "Service Owner", "System Owner"],
  Operations: ["Operations Director", "Operations Manager", "Process Owner", "Service Owner", "Business Owner"],
  Finance: ["Finance Director", "Finance Manager", "Process Owner", "System Owner", "Business Owner"],
  "Human Resources": ["HR Director", "HR Manager", "Process Owner", "System Owner", "Business Owner"],
  Procurement: ["Procurement Director", "Procurement Manager", "Vendor Owner", "Contract Owner", "Business Owner"],
  Legal: ["Legal Director", "Legal Manager", "Contract Owner", "Process Owner", "Business Owner"],
};

export const recommendedControlSuggestions = [
  "Enable MFA, review access, and enforce least privilege.",
  "Apply security patches, document exceptions, and validate remediation.",
  "Complete a security assessment and remediate material findings.",
  "Implement centralized logging, monitoring, and alerting for the affected service.",
  "Validate backup, recovery, and continuity procedures through documented testing.",
  "Complete third-party due diligence and validate required security evidence before approval.",
  "Add cybersecurity responsibilities, incident notification, and evidence obligations to the contract.",
];

export const mitigationPlanSuggestions = [
  "Implement the recommended control and provide evidence by the approved due date.",
  "Complete remediation through the approved change process and validate closure.",
  "Perform an access review, remediate exceptions, and confirm completion with evidence.",
  "Complete security due diligence before final approval or onboarding.",
  "Update the relevant policy, process, or contract and obtain the required approval.",
  "Implement the corrective action, validate effectiveness, and submit evidence for GRC verification.",
];

export const controlReferenceSuggestions = [
  "Pending validation against the approved applicability / compliance matrix.",
  "Applicable control validated in the approved internal compliance matrix.",
  "No applicable regulatory control identified for this risk.",
];

export const frameworkControlReferenceOptions: Record<ApplicableFramework, string[]> = {
  "NCA ECC 2-2024": [
    "Pending validation against the approved NCA ECC 2-2024 applicability / compliance matrix.",
    "Applicable NCA ECC 2-2024 control validated in the approved internal compliance matrix.",
    "No applicable NCA ECC 2-2024 control identified for this risk.",
  ],
  "CST CRF": [
    "Pending validation against the approved CST CRF applicability / compliance matrix.",
    "Applicable CST CRF control validated in the approved internal compliance matrix.",
    "No applicable CST CRF control identified for this risk.",
  ],
  "Not Determined": [
    "Framework applicability has not yet been determined.",
  ],
};
