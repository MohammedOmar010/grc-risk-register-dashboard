"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  History,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Department,
  GrcAssessmentFormData,
  Risk,
  RiskLevel,
  SubmissionFormData,
  UserRole,
} from "@/types/risk";
import {
  calculateRiskScore,
  getLevelBadgeClasses,
  getRiskLevel,
  getStatusBadgeClasses,
} from "@/lib/risk-calculation";
import {
  businessConsequenceOptions,
  businessImpactOptions,
  concernDescriptionOptions,
  concernPresetsByDepartment,
  frameworkControlReferenceOptions,
  departments,
  frameworkOptions,
  impactOptions,
  implementationStatusOptions,
  likelihoodOptions,
  mitigationPlanSuggestions,
  OTHER_OPTION,
  recommendedControlSuggestions,
  riskCategoryOptions,
  riskOwnerSuggestionsByDepartment,
  riskStatementSuggestions,
  scopeAssetOptionsByDepartment,
  statusOptions,
  treatmentOptions,
} from "@/lib/risk-options";
import { sampleRisks } from "@/lib/sample-data";
import {
  createRiskRecord,
  deleteRiskRecord,
  getRisks,
  replaceRisksWithSamples,
  updateRiskRecord,
} from "@/lib/risk-service";
import { isSupabaseConfigured } from "@/lib/supabase";

const levelOrder: RiskLevel[] = ["Critical", "High", "Medium", "Low"];
const levelColors: Record<RiskLevel, string> = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#22c55e",
};
const statusColors: Record<string, string> = {
  Submitted: "#64748b",
  "Under GRC Review": "#eab308",
  "Assessment Completed": "#0ea5e9",
  "Treatment Assigned": "#06b6d4",
  "In Progress": "#2563eb",
  "Pending GRC Verification": "#7c3aed",
  Closed: "#22c55e",
};

const emptySubmission = (department: Department): SubmissionFormData => ({
  department,
  scopeAsset: "",
  title: "",
  description: "",
  businessImpactTypes: [],
  businessImpactSummary: "",
  submittedBy: "",
});

function nowIso() {
  return new Date().toISOString();
}
function dateOnly(value: string) {
  return value ? new Date(value).toLocaleDateString("en-GB") : "—";
}
function dateTime(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}
function dateTimeCompact(value: string) {
  if (!value) return "—";
  const d = new Date(value);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}
function nextRiskId(risks: Risk[]) {
  const max = risks.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, "")) || 0), 0);
  return `R-${String(max + 1).padStart(3, "0")}`;
}

function getAssessmentSuggestions(risk: Risk) {
  const text = `${risk.title} ${risk.description} ${risk.scopeAsset}`.toLowerCase();

  if (/mfa|access|permission|privileg|deprovision|account/.test(text)) {
    return {
      category: "Identity & Access",
      statements: [
        `If access remains broader or less protected than required in ${risk.scopeAsset}, unauthorized activity could affect systems, transactions, or sensitive information.`,
        "Inadequate access controls could enable unauthorized access or activity, resulting in confidentiality, integrity, operational, or compliance impact.",
      ],
      controls: [
        "Review access against business need, enforce least privilege, remove unnecessary permissions, and apply MFA where required.",
        "Perform periodic access reviews, document exceptions, and verify timely account provisioning and deprovisioning.",
      ],
      plans: [
        "Complete an access review, remediate exceptions, assign an accountable owner, and provide evidence for GRC verification.",
        "Implement the approved access-control changes and validate that unnecessary or unprotected access has been removed.",
      ],
    };
  }
  if (/patch|vulnerab|security review|legacy|unsupported/.test(text)) {
    return {
      category: "Vulnerability Management",
      statements: [
        `If known weaknesses in ${risk.scopeAsset} remain unresolved, they could be exploited and result in service disruption or information exposure.`,
        "Unresolved security weaknesses could increase the likelihood of exploitation and create operational, data, or compliance impact.",
      ],
      controls: [
        "Prioritize critical remediation, document approved exceptions, and validate closure through patching or compensating controls.",
        "Complete the required security assessment, track material findings, and verify remediation before closure.",
      ],
      plans: [
        "Remediate the identified weaknesses through the approved change process and submit validation evidence by the due date.",
        "Track the security findings to closure, validate remediation effectiveness, and document any approved exception.",
      ],
    };
  }
  if (/recovery|continuity|single point|dependency|backup/.test(text)) {
    return {
      category: "Business Continuity",
      statements: [
        `If the dependency or recovery gap in ${risk.scopeAsset} is not addressed, restoration or service continuity could be delayed during a disruption.`,
        "Insufficient recovery capability could prolong service interruption and affect critical business operations.",
      ],
      controls: [
        "Document recovery responsibilities, maintain backup or alternative arrangements, and validate recovery through periodic testing.",
        "Define continuity and recovery procedures with accountable owners, target recovery objectives, and evidence of testing.",
      ],
      plans: [
        "Document the recovery procedure, assign backup responsibilities, test the process, and provide results for GRC verification.",
        "Remove the single point of dependency by implementing and testing an approved backup resource or recovery method.",
      ],
    };
  }
  if (/supplier|vendor|third-party|due diligence/.test(text)) {
    return {
      category: "Third-Party Risk",
      statements: [
        "Incomplete third-party assurance or security requirements could expose the organization to unverified cybersecurity, operational, or compliance risk.",
        "A supplier control gap could introduce security or compliance exposure before access, integration, or service approval.",
      ],
      controls: [
        "Complete third-party cybersecurity due diligence, validate required evidence, and document security obligations before approval.",
        "Restrict approval or access until required security evidence and contractual obligations are reviewed and accepted.",
      ],
      plans: [
        "Complete the outstanding supplier security review, remediate material gaps, and provide approved evidence before final onboarding or renewal.",
        "Track the supplier corrective actions to closure and verify evidence before granting or continuing the relevant access or service.",
      ],
    };
  }
  if (/contract|agreement|legal|notification|obligation/.test(text)) {
    return {
      category: "Governance & Compliance",
      statements: [
        "Unclear or missing cybersecurity obligations could create accountability, notification, remediation, or compliance gaps.",
        "A governance or contractual gap could delay required actions or leave cybersecurity responsibilities insufficiently defined.",
      ],
      controls: [
        "Update the applicable contract, policy, or procedure to define cybersecurity responsibilities, notification, evidence, and approval requirements.",
        "Validate the requirement against the applicable regulatory and contractual obligations and obtain formal approval for the updated wording.",
      ],
      plans: [
        "Update the relevant agreement or governance document, complete legal and cybersecurity review, and obtain approval before closure.",
        "Document the required obligations, assign accountable owners, and verify that the approved requirements are implemented.",
      ],
    };
  }
  if (/employee|data|record|sharing|information/.test(text)) {
    return {
      category: "Data Protection",
      statements: [
        "Inadequate protection of sensitive information could result in unauthorized access, disclosure, alteration, or compliance impact.",
        `If information in ${risk.scopeAsset} is not appropriately protected, sensitive data could be exposed to unintended users.`,
      ],
      controls: [
        "Restrict information access based on business need, review sharing permissions, and monitor access to sensitive records.",
        "Apply appropriate information handling, access, retention, and monitoring controls for the affected data.",
      ],
      plans: [
        "Review the affected information access, remove unnecessary exposure, implement the approved protection controls, and provide evidence for verification.",
        "Correct the information-handling process and validate access, sharing, and retention settings with the responsible owner.",
      ],
    };
  }
  return {
    category: risk.category || "Governance & Compliance",
    statements: riskStatementSuggestions,
    controls: recommendedControlSuggestions,
    plans: mitigationPlanSuggestions,
  };
}


function getCategoryGuidance(category: string, risk: Risk) {
  const byCategory: Record<string, { controls: string[]; plans: string[] }> = {
    "Identity & Access": {
      controls: [
        "Review access against business need, enforce least privilege, remove unnecessary permissions, and apply MFA where required.",
        "Perform periodic access reviews and verify timely provisioning, role changes, and deprovisioning.",
      ],
      plans: [
        "Complete an access review, remediate exceptions, assign an accountable owner, and provide evidence for GRC verification.",
        "Implement the approved access-control changes and validate that unnecessary or unprotected access has been removed.",
      ],
    },
    "Vulnerability Management": {
      controls: [
        "Prioritize critical remediation, apply approved patches or compensating controls, and validate closure.",
        "Track known vulnerabilities, document approved exceptions, and verify remediation evidence.",
      ],
      plans: [
        "Remediate the identified weaknesses through the approved change process and submit validation evidence by the due date.",
        "Track the security findings to closure and document any approved exception or compensating control.",
      ],
    },
    "Business Continuity": {
      controls: [
        "Document recovery responsibilities, maintain backup or alternative arrangements, and validate recovery through testing.",
        "Define continuity and recovery procedures with accountable owners and evidence of periodic testing.",
      ],
      plans: [
        "Document the recovery procedure, assign backup responsibilities, test the process, and provide results for GRC verification.",
        "Remove the single point of dependency by implementing and testing an approved backup resource or recovery method.",
      ],
    },
    "Third-Party Risk": {
      controls: [
        "Complete third-party cybersecurity due diligence, validate required evidence, and document security obligations before approval.",
        "Restrict approval or access until required security evidence and contractual obligations are reviewed.",
      ],
      plans: [
        "Complete the outstanding supplier security review, remediate material gaps, and provide approved evidence before onboarding or renewal.",
        "Track supplier corrective actions to closure and verify evidence before granting or continuing relevant access.",
      ],
    },
    "Data Protection": {
      controls: [
        "Restrict information access based on business need and apply appropriate handling, sharing, retention, and monitoring controls.",
        "Review access and sharing permissions for sensitive information and remove unnecessary exposure.",
      ],
      plans: [
        "Review the affected information access, remove unnecessary exposure, implement the approved protection controls, and provide evidence.",
        "Correct the information-handling process and validate access, sharing, and retention settings with the responsible owner.",
      ],
    },
    "Governance & Compliance": {
      controls: [
        "Update the applicable policy, procedure, or contract to define cybersecurity responsibilities, evidence, and approval requirements.",
        "Validate the requirement against applicable regulatory and contractual obligations and obtain formal approval.",
      ],
      plans: [
        "Update the relevant governance document, complete required reviews, and obtain approval before closure.",
        "Document the required obligations, assign accountable owners, and verify implementation.",
      ],
    },
    "Network Security": {
      controls: [
        "Review network segmentation, access rules, monitoring, and approved security configurations for the affected service.",
      ],
      plans: [
        "Implement the approved network security changes, validate connectivity and monitoring, and provide evidence for GRC verification.",
      ],
    },
    "Cloud Security": {
      controls: [
        "Review cloud access, configuration, logging, data protection, and security monitoring against the approved baseline.",
      ],
      plans: [
        "Remediate the identified cloud configuration gaps and provide validation evidence before closure.",
      ],
    },
    "Incident Response": {
      controls: [
        "Define incident ownership, notification, escalation, evidence preservation, and response procedures for the scenario.",
      ],
      plans: [
        "Update and test the incident response procedure, confirm accountable contacts, and document the exercise or validation result.",
      ],
    },
    "Asset Management": {
      controls: [
        "Maintain an accurate owner, classification, lifecycle status, and required security baseline for the affected asset.",
      ],
      plans: [
        "Update the asset record, assign the accountable owner, correct the identified control gap, and provide evidence for verification.",
      ],
    },
  };

  return byCategory[category] ?? {
    controls: getAssessmentSuggestions(risk).controls,
    plans: getAssessmentSuggestions(risk).plans,
  };
}

function RatingGuide({
  title,
  items,
}: {
  title: string;
  items: { value: number; label: string; description: string }[];
}) {
  return (
    <details className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <summary className="cursor-pointer text-xs font-bold text-slate-700">{title}</summary>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <div key={item.value} className="grid gap-1 rounded-lg bg-white px-3 py-2 text-xs sm:grid-cols-[120px_1fr]">
            <strong className="text-slate-900">{item.label}</strong>
            <span className="leading-5 text-slate-600">{item.description}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        MVP default guidance only. Replace these criteria with the organization&apos;s formally approved Cybersecurity Risk Management Methodology in production.
      </p>
    </details>
  );
}

function MetricCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-800">{icon}</div>
      </div>
    </div>
  );
}

function Help({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>;
}

function SuggestedTextarea({
  label,
  value,
  options,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  help?: React.ReactNode;
}) {
  const known = options.includes(value);
  const [customMode, setCustomMode] = useState(Boolean(value && !known));

  useEffect(() => {
    if (!value) return;
    setCustomMode(!options.includes(value));
  }, [value, options]);

  const selectValue = customMode ? OTHER_OPTION : known ? value : "";

  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input"
        value={selectValue}
        onChange={(e) => {
          const selected = e.target.value;
          if (selected === OTHER_OPTION) {
            setCustomMode(true);
            onChange("");
            return;
          }
          setCustomMode(false);
          onChange(selected);
        }}
      >
        <option value="">Select the closest answer</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
        <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
      </select>
      {customMode ? (
        <textarea
          className="input mt-2 min-h-20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Type the custom answer"}
          autoFocus
        />
      ) : null}
      {help ? <Help>{help}</Help> : null}
    </div>
  );
}

function ClearChoiceField({
  label,
  value,
  options,
  onChange,
  help,
  customPlaceholder = "Type a custom answer",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  help?: React.ReactNode;
  customPlaceholder?: string;
}) {
  const known = options.includes(value);
  const [customMode, setCustomMode] = useState(Boolean(value && !known));
  const selectValue = customMode ? OTHER_OPTION : known ? value : "";

  return (
    <div>
      <label className="label">{label}</label>
      <select
        className="input"
        value={selectValue}
        onChange={(e) => {
          const selected = e.target.value;
          if (selected === OTHER_OPTION) {
            setCustomMode(true);
            onChange("");
          } else {
            setCustomMode(false);
            onChange(selected);
          }
        }}
      >
        <option value="">Select the closest answer</option>
        {options.map((item) => <option key={item} value={item}>{item}</option>)}
        <option value={OTHER_OPTION}>{OTHER_OPTION}</option>
      </select>
      {customMode ? (
        <input
          className="input mt-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={customPlaceholder}
          autoFocus
        />
      ) : null}
      {help ? <Help>{help}</Help> : null}
    </div>
  );
}

function SubmissionForm({
  department,
  role,
  onSubmit,
  onCancel,
}: {
  department: Department;
  role: UserRole;
  onSubmit: (form: SubmissionFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(department);
  const [form, setForm] = useState<SubmissionFormData>(emptySubmission(department));
  const [saving, setSaving] = useState(false);
  const [otherImpact, setOtherImpact] = useState("");
  const presets = concernPresetsByDepartment[selectedDepartment];
  const selectedPreset = presets.find((item) => item.label === form.title);

  useEffect(() => {
    setSelectedDepartment(department);
    setForm(emptySubmission(department));
    setOtherImpact("");
  }, [department]);

  function changeDepartment(nextDepartment: Department) {
    setSelectedDepartment(nextDepartment);
    setForm(emptySubmission(nextDepartment));
    setOtherImpact("");
  }

  function applyIssueChoice(title: string) {
    const preset = presets.find((item) => item.label === title);
    if (!preset) {
      setForm((current) => ({ ...current, title }));
      return;
    }
    setForm((current) => ({
      ...current,
      title: preset.label,
      scopeAsset: preset.scopeAsset,
      description: preset.description,
      businessImpactTypes: preset.impactTypes,
      businessImpactSummary: preset.consequence,
    }));
    setOtherImpact("");
  }

  function toggleImpact(value: string) {
    const next = form.businessImpactTypes.includes(value)
      ? form.businessImpactTypes.filter((x) => x !== value)
      : [...form.businessImpactTypes, value];
    setForm({ ...form, businessImpactTypes: next });
  }

  async function submit() {
    const finalImpacts = form.businessImpactTypes
      .filter((item) => item !== "Other")
      .concat(form.businessImpactTypes.includes("Other") && otherImpact.trim() ? [otherImpact.trim()] : []);

    if (!form.scopeAsset.trim() || !form.title.trim() || !form.description.trim() || finalImpacts.length === 0 || !form.businessImpactSummary.trim()) {
      alert("Please complete all five guided questions and select at least one business impact.");
      return;
    }

    setSaving(true);
    await onSubmit({
      ...form,
      businessImpactTypes: finalImpacts,
      department: selectedDepartment,
      submittedBy: role === "Cybersecurity GRC" ? "Cybersecurity GRC" : `${selectedDepartment} ${role}`,
    });
    setSaving(false);
  }

  const descriptionChoices = Array.from(new Set([selectedPreset?.description, ...concernDescriptionOptions].filter(Boolean))) as string[];
  const consequenceChoices = Array.from(new Set([selectedPreset?.consequence, ...businessConsequenceOptions].filter(Boolean))) as string[];

  return (
    <section className="card p-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{role === "Cybersecurity GRC" ? "Add a Risk / Capture a Risk Concern" : "Submit a Risk Concern"}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {role === "Cybersecurity GRC"
              ? "Use this form when GRC identifies a risk directly or receives it through an email, call, meeting, or informal escalation. The guided answers keep the record consistent before formal assessment."
              : "Answer the five business questions below. You do not need cybersecurity expertise; selecting a suggested issue will automatically align the related answers for a consistent submission."}
          </p>
        </div>
        <button className="btn-secondary" onClick={onCancel} aria-label="Close submission form"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        {role === "Cybersecurity GRC" ? (
          <><strong>GRC capture mode:</strong> record the concern using the same structured business questions, then continue with the formal GRC assessment after saving.</>
        ) : (
          <><strong>Your role:</strong> describe the business concern and possible consequence. <strong>Cybersecurity GRC</strong> will perform the formal likelihood, impact, control, and treatment assessment.</>
        )}
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label className="label">Department</label>
          {role === "Cybersecurity GRC" ? (
            <select className="input" value={selectedDepartment} onChange={(e) => changeDepartment(e.target.value as Department)}>
              {departments.map((d) => <option key={d}>{d}</option>)}
            </select>
          ) : (
            <input className="input bg-slate-50" value={selectedDepartment} readOnly />
          )}
          <Help>{role === "Cybersecurity GRC" ? "Select the department that owns or is affected by the risk." : "Assigned from the selected MVP department profile."}</Help>
        </div>

        <ClearChoiceField
          label="1. Which area, asset, or service is affected?"
          value={form.scopeAsset}
          options={scopeAssetOptionsByDepartment[selectedDepartment]}
          onChange={(scopeAsset) => setForm({ ...form, scopeAsset })}
          customPlaceholder="Example: Customer mobile application"
          help="Choose the closest business area. Use Other / Custom only when none of the listed options fits."
        />

        <div className="md:col-span-2">
          <ClearChoiceField
            label="2. Which issue best matches what you observed?"
            value={form.title}
            options={presets.map((item) => item.label)}
            onChange={applyIssueChoice}
            customPlaceholder="Write a short issue title in plain business language"
            help="Choosing a suggested issue pre-fills the remaining answers so the submission stays logically consistent. You can still adjust them."
          />
        </div>

        <div className="md:col-span-2">
          <SuggestedTextarea
            label="3. What did you observe?"
            value={form.description}
            options={descriptionChoices}
            onChange={(description) => setForm({ ...form, description })}
            placeholder="Describe the condition you observed without trying to calculate the risk."
            help="Describe the current condition only. Avoid proposing controls or assigning a risk score here."
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">4. What business areas could be affected?</label>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {businessImpactOptions.map((item) => (
              <label key={item} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium hover:bg-slate-50">
                <input type="checkbox" checked={form.businessImpactTypes.includes(item)} onChange={() => toggleImpact(item)} />
                {item}
              </label>
            ))}
          </div>
          {form.businessImpactTypes.includes("Other") ? (
            <input className="input mt-2" value={otherImpact} onChange={(e) => setOtherImpact(e.target.value)} placeholder="Describe the other business impact" />
          ) : null}
          <Help>Select the business consequences you understand. Cybersecurity GRC will determine the formal Impact rating.</Help>
        </div>

        <div className="md:col-span-2">
          <SuggestedTextarea
            label="5. What could happen if the issue is not addressed?"
            value={form.businessImpactSummary}
            options={consequenceChoices}
            onChange={(businessImpactSummary) => setForm({ ...form, businessImpactSummary })}
            placeholder="Select the most realistic consequence, then adjust the wording if needed."
            help="Focus on the business outcome, such as service disruption, financial loss, data exposure, or non-compliance."
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" disabled={saving} onClick={submit}>
          {saving ? "Saving..." : role === "Cybersecurity GRC" ? "Save & Start GRC Review" : "Submit to Cybersecurity GRC"}
        </button>
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}

function GrcAssessment({
  risk,
  onSave,
  onCommunicate,
  onClose,
}: {
  risk: Risk;
  onSave: (risk: Risk) => Promise<void>;
  onCommunicate: (risk: Risk) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<GrcAssessmentFormData>({
    riskStatement: risk.riskStatement,
    category: risk.category,
    likelihood: risk.likelihood,
    impact: risk.impact,
    owner: risk.owner,
    framework: risk.framework,
    controlReference: risk.controlReference,
    recommendedControls: risk.recommendedControls,
    treatment: risk.treatment,
    mitigationPlan: risk.mitigationPlan,
    dueDate: risk.dueDate,
    implementationStatus: risk.implementationStatus,
    residualLikelihood: risk.residualLikelihood,
    residualImpact: risk.residualImpact,
    status: risk.status,
  });

  const contextual = getAssessmentSuggestions(risk);
  const contextualStatements = contextual.statements;
  const categoryChoices = Array.from(new Set([contextual.category, ...riskCategoryOptions]));
  const categoryGuidance = getCategoryGuidance(form.category || contextual.category, risk);
  const contextualControls = Array.from(new Set(categoryGuidance.controls));
  const contextualPlans = Array.from(new Set(categoryGuidance.plans));
  const ownerChoices = riskOwnerSuggestionsByDepartment[risk.department];
  const controlReferenceChoices = frameworkControlReferenceOptions[form.framework];

  function applyRiskStatement(riskStatement: string) {
    if (!contextualStatements.includes(riskStatement)) {
      setForm((current) => ({ ...current, riskStatement }));
      return;
    }

    const nextCategory = contextual.category;
    const guidance = getCategoryGuidance(nextCategory, risk);
    const nextFramework = form.framework === "Not Determined" ? "NCA ECC 2-2024" : form.framework;

    setForm((current) => ({
      ...current,
      riskStatement,
      category: nextCategory,
      owner: current.owner || ownerChoices[0] || "",
      framework: nextFramework,
      controlReference: current.controlReference || frameworkControlReferenceOptions[nextFramework][0] || "",
      recommendedControls: guidance.controls[0] || current.recommendedControls,
      treatment: current.treatment || "Mitigation",
      mitigationPlan: guidance.plans[0] || current.mitigationPlan,
    }));
  }

  function applyCategory(category: string) {
    if (!riskCategoryOptions.includes(category)) {
      setForm((current) => ({ ...current, category }));
      return;
    }
    const guidance = getCategoryGuidance(category, risk);
    setForm((current) => ({
      ...current,
      category,
      recommendedControls: guidance.controls[0] || current.recommendedControls,
      mitigationPlan: guidance.plans[0] || current.mitigationPlan,
      treatment: current.treatment || "Mitigation",
    }));
  }

  function applyFramework(framework: GrcAssessmentFormData["framework"]) {
    setForm((current) => ({
      ...current,
      framework,
      controlReference: frameworkControlReferenceOptions[framework][0] || "",
    }));
  }

  function applyControlAction(recommendedControls: string) {
    if (!contextualControls.includes(recommendedControls)) {
      setForm((current) => ({ ...current, recommendedControls }));
      return;
    }
    setForm((current) => ({
      ...current,
      recommendedControls,
      treatment: current.treatment || "Mitigation",
      mitigationPlan: contextualPlans[0] || current.mitigationPlan,
    }));
  }

  const score = calculateRiskScore(form.likelihood, form.impact);
  const level = getRiskLevel(score);
  const residualScore = calculateRiskScore(form.residualLikelihood, form.residualImpact);
  const residualLevel = getRiskLevel(residualScore);
  const residualAllowed = ["Implemented", "Verified"].includes(form.implementationStatus);

  async function save() {
    await onSave({
      ...risk,
      ...form,
      score,
      level,
      residualLikelihood: residualAllowed ? form.residualLikelihood : null,
      residualImpact: residualAllowed ? form.residualImpact : null,
      residualScore: residualAllowed ? residualScore : null,
      residualLevel: residualAllowed ? residualLevel : null,
      updatedAt: nowIso(),
    });
  }

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Cybersecurity GRC Assessment · {risk.id}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">{risk.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{risk.department} · {risk.scopeAsset}</p>
        </div>
        <div className="flex gap-2">
          <span className={`inline-flex items-center whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-bold ${getLevelBadgeClasses(level)}`}>
            {score ?? "—"} · {level ?? "Not assessed"}
          </span>
          <button className="btn-secondary" onClick={onClose} aria-label="Close GRC assessment">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Management submission</p>
        <p className="mt-2 text-sm"><strong>Description:</strong> {risk.description}</p>
        <p className="mt-2 text-sm"><strong>Potential impact:</strong> {risk.businessImpactTypes.join(", ")}</p>
        <p className="mt-2 text-sm"><strong>Business consequence:</strong> {risk.businessImpactSummary || "Not provided"}</p>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
        <strong>Guided assessment:</strong> Question 1 recommends Question 2 and prepares matching control/treatment suggestions. Question 6 filters Question 7. You can override any recommendation using Other / Custom.
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <SuggestedTextarea
            label="1. How should this risk be formally described?"
            value={form.riskStatement}
            options={contextualStatements}
            onChange={applyRiskStatement}
            placeholder="Write the formal risk statement in cause → event → business impact form."
            help="Select the closest statement generated from the submitted concern. Choose Other / Custom only when you need different wording."
          />
        </div>

        <ClearChoiceField
          label="2. Which risk category best matches the statement above?"
          value={form.category}
          options={categoryChoices}
          onChange={applyCategory}
          customPlaceholder="Enter the approved internal risk category"
          help="Selecting a suggested statement in Question 1 automatically recommends the matching category. You can change it if the context requires."
        />

        <ClearChoiceField
          label="3. Who is accountable for owning this risk?"
          value={form.owner}
          options={ownerChoices}
          onChange={(owner) => setForm({ ...form, owner })}
          customPlaceholder="Enter the accountable role or owner"
          help="Choose the business or technical owner accountable for the risk. Use Other / Custom only when the correct owner is not listed."
        />

        <div>
          <label className="label">4. Which likelihood description best matches the current scenario?</label>
          <select
            className="input"
            value={form.likelihood ?? ""}
            onChange={(e) => setForm({ ...form, likelihood: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Select after reviewing the criteria</option>
            {likelihoodOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
          <Help>{likelihoodOptions.find((x) => x.value === form.likelihood)?.description || "Choose the level whose history, exposure, and control-effectiveness description best matches the current scenario."}</Help>
          <div className="mt-2">
            <RatingGuide title="View the 1-5 likelihood criteria" items={likelihoodOptions} />
          </div>
        </div>

        <div>
          <label className="label">5. Which impact description best matches the submitted business consequence?</label>
          <select
            className="input"
            value={form.impact ?? ""}
            onChange={(e) => setForm({ ...form, impact: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Select after reviewing the criteria</option>
            {impactOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
          <Help>{impactOptions.find((x) => x.value === form.impact)?.description || `Use the management submission above as evidence: ${risk.businessImpactTypes.join(", ") || "no impact types selected"}.`}</Help>
          <div className="mt-2">
            <RatingGuide title="View the 1-5 impact criteria" items={impactOptions} />
          </div>
        </div>

        <div>
          <label className="label">6. Which regulatory framework applies to this organization / risk?</label>
          <select
            className="input"
            value={form.framework}
            onChange={(e) => applyFramework(e.target.value as GrcAssessmentFormData["framework"])}
          >
            {frameworkOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
          <Help>NCA ECC 2-2024 is the default MVP profile. Select CST CRF only when the organization is within CST regulatory scope.</Help>
        </div>

        <ClearChoiceField
          label="7. What is the status of the validated control reference?"
          value={form.controlReference}
          options={controlReferenceChoices}
          onChange={(controlReference) => setForm({ ...form, controlReference })}
          customPlaceholder="Enter the validated control ID/reference from the approved internal compliance matrix"
          help="This list follows Question 6. Use Other / Custom only when you have the exact validated control reference."
        />

        <div className="md:col-span-2">
          <SuggestedTextarea
            label="8. What control action should reduce this risk?"
            value={form.recommendedControls}
            options={contextualControls}
            onChange={applyControlAction}
            placeholder="Enter the exact validated control action."
            help="The options are filtered from the selected risk category. Choosing one also prepares a related mitigation-plan suggestion."
          />
        </div>

        <div>
          <label className="label">9. What treatment decision is being applied?</label>
          <select
            className="input"
            value={form.treatment}
            onChange={(e) => setForm({ ...form, treatment: e.target.value as GrcAssessmentFormData["treatment"] })}
          >
            <option value="">Select treatment</option>
            {treatmentOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
          <Help>Mitigation reduces the likelihood and/or impact through controls or corrective actions.</Help>
        </div>

        <div>
          <label className="label">10. When should the treatment be completed?</label>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>

        <div className="md:col-span-2">
          <SuggestedTextarea
            label="11. What exact action will be implemented?"
            value={form.mitigationPlan}
            options={contextualPlans}
            onChange={(mitigationPlan) => setForm({ ...form, mitigationPlan })}
            placeholder="Enter the exact treatment action, accountable owner, evidence, and expected result."
            help="The suggested plans are linked to the selected risk category and control action. Choose Other / Custom when a different plan is required."
          />
        </div>

        <div>
          <label className="label">12. What is the current implementation status?</label>
          <select
            className="input"
            value={form.implementationStatus}
            onChange={(e) => setForm({ ...form, implementationStatus: e.target.value as GrcAssessmentFormData["implementationStatus"] })}
          >
            {implementationStatusOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Communication Date</label>
          <input className="input bg-slate-50" value={dateTime(risk.communicationDate)} readOnly />
          <Help>Set automatically when Cybersecurity GRC marks the risk as communicated.</Help>
        </div>

        <div>
          <label className="label">Workflow Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as GrcAssessmentFormData["status"] })}
          >
            {statusOptions.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Current Inherent Risk</p>
          <p className="mt-1 text-lg font-bold text-slate-950">{score ?? "—"} · {level ?? "Not assessed"}</p>
        </div>

        <div>
          <label className="label">13. After the treatment is implemented, how likely is the scenario to occur?</label>
          <select
            className="input disabled:bg-slate-100"
            disabled={!residualAllowed}
            value={residualAllowed ? (form.residualLikelihood ?? "") : ""}
            onChange={(e) => setForm({ ...form, residualLikelihood: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Not reassessed</option>
            {likelihoodOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">14. If the scenario still occurs, how severe would the remaining impact be?</label>
          <select
            className="input disabled:bg-slate-100"
            disabled={!residualAllowed}
            value={residualAllowed ? (form.residualImpact ?? "") : ""}
            onChange={(e) => setForm({ ...form, residualImpact: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Not reassessed</option>
            {impactOptions.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <Help>Residual assessment becomes available only after treatment is Implemented or Verified. Reassess the same scenario using evidence of treatment effectiveness; likelihood and impact do not have to decrease together.</Help>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" onClick={save}>Save GRC Assessment</button>
        <button
          className="btn-secondary"
          onClick={() => onCommunicate({
            ...risk,
            ...form,
            score,
            level,
            residualScore: residualAllowed ? residualScore : null,
            residualLevel: residualAllowed ? residualLevel : null,
          })}
        >
          {risk.communicationDate ? "Update Communication Date" : "Mark Risk Communicated"}
        </button>
      </div>
    </section>
  );
}

function RiskPreviewModal({ risk, onClose }: { risk: Risk; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-label={`Risk preview ${risk.id}`}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Risk Preview · {risk.id}</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{risk.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{risk.department} · {risk.scopeAsset}</p>
          </div>
          <button className="btn-secondary" onClick={onClose} aria-label="Close risk preview"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-5 p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Risk Level</p><p className="mt-1 font-bold">{risk.score ?? "—"} · {risk.level ?? "Pending"}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Workflow Status</p><p className="mt-1 font-bold">{risk.status}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-500">Risk Owner</p><p className="mt-1 font-bold">{risk.owner || "Not assigned"}</p></div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">Management Submission</h3>
            <dl className="mt-2 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <div><dt className="font-semibold text-slate-600">Observed condition</dt><dd className="mt-1 text-slate-900">{risk.description}</dd></div>
              <div><dt className="font-semibold text-slate-600">Potential business impact</dt><dd className="mt-1 text-slate-900">{risk.businessImpactTypes.join(", ") || "Not provided"}</dd></div>
              <div><dt className="font-semibold text-slate-600">Possible consequence</dt><dd className="mt-1 text-slate-900">{risk.businessImpactSummary || "Not provided"}</dd></div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900">GRC Assessment Summary</h3>
            <dl className="mt-2 grid gap-x-5 gap-y-3 rounded-2xl border border-slate-100 p-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2"><dt className="font-semibold text-slate-600">Risk statement</dt><dd className="mt-1">{risk.riskStatement || "Under GRC review"}</dd></div>
              <div><dt className="font-semibold text-slate-600">Category</dt><dd className="mt-1">{risk.category || "Not assessed"}</dd></div>
              <div><dt className="font-semibold text-slate-600">Treatment</dt><dd className="mt-1">{risk.treatment || "Not assigned"}</dd></div>
              <div><dt className="font-semibold text-slate-600">Implementation status</dt><dd className="mt-1">{risk.implementationStatus}</dd></div>
              <div><dt className="font-semibold text-slate-600">Due date</dt><dd className="mt-1">{dateOnly(risk.dueDate)}</dd></div>
              <div><dt className="font-semibold text-slate-600">Residual risk</dt><dd className="mt-1">{risk.residualScore !== null ? `${risk.residualScore} · ${risk.residualLevel}` : "Not yet reassessed"}</dd></div>
              <div><dt className="font-semibold text-slate-600">Last updated</dt><dd className="mt-1">{dateTime(risk.updatedAt)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GrcDashboard() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>("Cybersecurity GRC");
  const [department, setDepartment] = useState<Department>("Information Technology");
  const [grcDepartmentFilter, setGrcDepartmentFilter] = useState<Department | "All Departments">("All Departments");
  const [showSubmission, setShowSubmission] = useState(false);
  const [selected, setSelected] = useState<Risk | null>(null);
  const [previewRisk, setPreviewRisk] = useState<Risk | null>(null);
  const [query, setQuery] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const auditSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!isSupabaseConfigured) {
        if (mounted) {
          setRisks(sampleRisks);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        const rows = await getRisks();
        if (!mounted) return;
        if (rows.length) {
          setRisks(rows);
        } else {
          setRisks(await replaceRisksWithSamples(sampleRisks));
        }
      } catch {
        if (mounted) {
          setError("Live Supabase data could not be loaded, so the MVP is showing local demo data.");
          setRisks(sampleRisks);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const visibleRisks = useMemo(() => {
    if (role !== "Cybersecurity GRC") return risks.filter((r) => r.department === department);
    if (grcDepartmentFilter === "All Departments") return risks;
    return risks.filter((r) => r.department === grcDepartmentFilter);
  }, [risks, role, department, grcDepartmentFilter]);
  const filtered = useMemo(
    () => visibleRisks.filter((r) => `${r.id} ${r.title} ${r.department} ${r.category} ${r.status} ${r.owner}`.toLowerCase().includes(query.toLowerCase())),
    [visibleRisks, query],
  );
  const metrics = useMemo(() => ({
    total: visibleRisks.length,
    critical: visibleRisks.filter((r) => r.level === "Critical").length,
    high: visibleRisks.filter((r) => r.level === "High").length,
    open: visibleRisks.filter((r) => r.status !== "Closed").length,
    overdue: visibleRisks.filter((r) => r.dueDate && r.status !== "Closed" && new Date(r.dueDate) < new Date()).length,
  }), [visibleRisks]);
  const lastUpdated = useMemo(() => visibleRisks.map((r) => r.updatedAt).filter(Boolean).sort().at(-1) || "", [visibleRisks]);
  const levelData = levelOrder.map((name) => ({ name, value: visibleRisks.filter((r) => r.level === name).length })).filter((x) => x.value);
  const statusData = statusOptions.map((name) => ({ name, value: visibleRisks.filter((r) => r.status === name).length })).filter((x) => x.value);

  async function submitConcern(form: SubmissionFormData) {
    try {
      setSaving(true);
      const timestamp = nowIso();
      const risk: Risk = {
        databaseId: undefined,
        id: nextRiskId(risks),
        department: form.department,
        scopeAsset: form.scopeAsset,
        title: form.title,
        description: form.description,
        businessImpactTypes: form.businessImpactTypes,
        businessImpactSummary: form.businessImpactSummary,
        submittedBy: form.submittedBy,
        submittedAt: timestamp,
        communicationDate: "",
        riskStatement: "",
        category: "",
        likelihood: null,
        impact: null,
        score: null,
        level: null,
        owner: "",
        framework: "Not Determined",
        controlReference: "",
        recommendedControls: "",
        treatment: "",
        mitigationPlan: "",
        dueDate: "",
        implementationStatus: "Not Started",
        residualLikelihood: null,
        residualImpact: null,
        residualScore: null,
        residualLevel: null,
        status: role === "Cybersecurity GRC" ? "Under GRC Review" : "Submitted",
        createdAt: timestamp.slice(0, 10),
        updatedAt: timestamp,
      };

      const saved = isSupabaseConfigured ? await createRiskRecord(risk) : risk;
      setRisks((current) => [saved, ...current]);
      setShowSubmission(false);
      if (role === "Cybersecurity GRC") {
        setSelected(saved);
        window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
      }
      setError(null);
    } catch {
      setError("The risk concern could not be saved to Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function saveRisk(risk: Risk) {
    try {
      setSaving(true);
      const saved = isSupabaseConfigured ? await updateRiskRecord(risk) : risk;
      setRisks((current) => current.map((x) => x.id === saved.id ? saved : x));
      setSelected(saved);
      setError(null);
    } catch {
      setError("The GRC assessment could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function communicate(risk: Risk) {
    const nextStatus = risk.status === "Assessment Completed" ? "Treatment Assigned" : risk.status;
    const updated = { ...risk, communicationDate: nowIso(), status: nextStatus, updatedAt: nowIso() } as Risk;
    await saveRisk(updated);
  }

  async function remove(risk: Risk) {
    if (role !== "Cybersecurity GRC") return;
    if (!confirm(`Delete ${risk.id}?`)) return;
    try {
      if (isSupabaseConfigured) await deleteRiskRecord(risk);
      setRisks((current) => current.filter((x) => x.id !== risk.id));
      if (selected?.id === risk.id) setSelected(null);
      setError(null);
    } catch {
      setError("Risk deletion failed.");
    }
  }

  async function reset() {
    if (!confirm("Replace current demo data with the V2 sample dataset?")) return;
    try {
      setSaving(true);
      const restored = isSupabaseConfigured ? await replaceRisksWithSamples(sampleRisks) : sampleRisks;
      setRisks(restored);
      setSelected(null);
      setError(null);
    } catch {
      setError("Demo data could not be restored.");
    } finally {
      setSaving(false);
    }
  }

  function openAuditLog() {
    setShowAudit(true);
    window.setTimeout(() => {
      auditSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  const auditEvents = useMemo(() => visibleRisks.flatMap((r) => [
    {
      time: r.submittedAt,
      type: "Submission",
      label: "Risk concern submitted",
      actor: r.submittedBy || r.department,
      riskId: r.id,
      department: r.department,
      detail: r.title,
    },
    ...(r.communicationDate ? [{
      time: r.communicationDate,
      type: "Communication",
      label: "Risk communicated",
      actor: "Cybersecurity GRC",
      riskId: r.id,
      department: r.department,
      detail: `Treatment / response communicated · ${r.status}`,
    }] : []),
    ...(r.updatedAt ? [{
      time: r.updatedAt,
      type: "Update",
      label: "Risk record updated",
      actor: "Cybersecurity GRC",
      riskId: r.id,
      department: r.department,
      detail: `${r.status}${r.owner ? ` · Owner: ${r.owner}` : ""}`,
    }] : []),
  ]).filter((x) => x.time).sort((a, b) => String(b.time).localeCompare(String(a.time))).slice(0, 40), [visibleRisks]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">Cybersecurity GRC Risk Management · MVP V2</p>
              <h1 className="text-3xl font-black md:text-4xl">Risk Management & Executive Dashboard</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">Management-level risk submission, centralized Cybersecurity GRC assessment, treatment tracking, department segregation, and Saudi regulatory alignment.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/10" onClick={reset} disabled={saving}>
                <RefreshCcw className="mr-2 inline h-4 w-4" />Restore Demo Data
              </button>
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950" onClick={() => { setSelected(null); setShowSubmission(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <Plus className="mr-2 inline h-4 w-4" />{role === "Cybersecurity GRC" ? "Add Risk" : "Submit Risk Concern"}
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <div>
            <label className="label">MVP Role Preview</label>
            <select className="input" value={role} onChange={(e) => { setRole(e.target.value as UserRole); setSelected(null); setPreviewRisk(null); setShowAudit(false); }}>
              <option>Cybersecurity GRC</option>
              <option>Director</option>
              <option>Manager</option>
            </select>
          </div>
          <div>
            <label className="label">Department Scope</label>
            {role === "Cybersecurity GRC" ? (
              <select className="input" value={grcDepartmentFilter} onChange={(e) => { setGrcDepartmentFilter(e.target.value as Department | "All Departments"); setSelected(null); }}>
                <option>All Departments</option>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            ) : (
              <select className="input" value={department} onChange={(e) => { setDepartment(e.target.value as Department); setPreviewRisk(null); }}>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            )}
            <Help>{role === "Cybersecurity GRC" ? "GRC can view the enterprise portfolio or filter it to one department for faster review." : "For the MVP preview, switch departments to simulate a different Director or Manager account."}</Help>
          </div>
          <div>
            <label className="label">Last Updated</label>
            <div className="input bg-slate-50">{dateTime(lastUpdated)}</div>
            <Help>Automatically derived from the latest visible risk update.</Help>
          </div>
        </section>

        {!isSupabaseConfigured ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <strong>Demo mode:</strong> Supabase environment variables are not configured, so changes are kept locally for this browser session only.
          </div>
        ) : null}
        {error ? <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div> : null}
        {loading ? <section className="card mb-6 p-6 text-center text-sm font-bold text-slate-600">Loading risk data...</section> : null}

        {showSubmission ? (
          <SubmissionForm
            department={role === "Cybersecurity GRC" && grcDepartmentFilter !== "All Departments" ? grcDepartmentFilter : department}
            role={role}
            onSubmit={submitConcern}
            onCancel={() => setShowSubmission(false)}
          />
        ) : null}

        {selected && role === "Cybersecurity GRC" ? (
          <div className="mt-6">
            <GrcAssessment risk={selected} onSave={saveRisk} onCommunicate={communicate} onClose={() => setSelected(null)} />
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="Total Risks" value={metrics.total} helper={role === "Cybersecurity GRC" ? "Enterprise portfolio" : "Department portfolio"} icon={<FileText className="h-6 w-6" />} />
          <MetricCard title="Critical" value={metrics.critical} helper="Immediate attention" icon={<AlertTriangle className="h-6 w-6" />} />
          <MetricCard title="High" value={metrics.high} helper="Prioritized treatment" icon={<ShieldCheck className="h-6 w-6" />} />
          <MetricCard title="Open" value={metrics.open} helper="Not closed" icon={<Clock className="h-6 w-6" />} />
          <MetricCard title="Overdue Plans" value={metrics.overdue} helper="Past due and not closed" icon={<CheckCircle2 className="h-6 w-6" />} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold">Risks by Level</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={levelData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} width={30} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {levelData.map((x) => <Cell key={x.name} fill={levelColors[x.name]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-2">
              <h2 className="text-lg font-bold">Risks by Workflow Status</h2>
              <p className="mt-1 text-xs text-slate-500">Status labels are listed below the chart to keep long workflow names readable.</p>
            </div>
            <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={54}
                      outerRadius={82}
                      paddingAngle={2}
                      labelLine={false}
                      label={false}
                    >
                      {statusData.map((x) => <Cell key={x.name} fill={statusColors[x.name] || "#64748b"} />)}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: statusColors[item.name] || "#64748b" }} />
                      <span className="leading-4" title={item.name}>{item.name}</span>
                    </span>
                    <strong className="shrink-0 text-slate-950">{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card mt-6 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold">Risk Register</h2>
              <p className="mt-1 text-sm text-slate-500">{role === "Cybersecurity GRC" ? (grcDepartmentFilter === "All Departments" ? "Full GRC portfolio with assessment actions." : `${grcDepartmentFilter} portfolio filtered for GRC review.`) : `${department} risks only.`}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input className="input w-full sm:w-72" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search risks..." />
              {role === "Cybersecurity GRC" ? (
                <button className="btn-secondary whitespace-nowrap" onClick={openAuditLog} title="Open the GRC-only audit log">
                  <History className="mr-2 inline h-4 w-4" />Open Audit Log
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] table-fixed text-xs">
              <colgroup>
                <col className="w-[62px]" />
                <col className="w-[270px]" />
                <col className="w-[125px]" />
                <col className="w-[100px]" />
                <col className="w-[165px]" />
                <col className="w-[120px]" />
                <col className="w-[95px]" />
                <col className="w-[105px]" />
                <col className="w-[125px]" />
                <col className="w-[90px]" />
              </colgroup>
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-3">Risk ID</th>
                  <th className="p-3">Risk / Concern</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Due</th>
                  <th className="p-3">Residual</th>
                  <th className="p-3">Updated</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const updated = dateTimeCompact(r.updatedAt);
                  return (
                    <tr key={r.id} className="border-t border-slate-100 align-top hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-500">{r.id}</td>
                      <td className="p-3">
                        <div className="font-bold leading-5 text-slate-900">{r.title}</div>
                        <div className="mt-1 line-clamp-3 text-[11px] leading-4 text-slate-500">{r.riskStatement || r.description}</div>
                      </td>
                      <td className="p-3 leading-5 text-slate-700">{r.department}</td>
                      <td className="p-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold leading-4 ${getLevelBadgeClasses(r.level)}`}>
                          {r.score ?? "—"} · {r.level ?? "Pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold leading-4 ${getStatusBadgeClasses(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 leading-5">{r.owner || "—"}</td>
                      <td className="p-3 whitespace-nowrap">{dateOnly(r.dueDate)}</td>
                      <td className="p-3">
                        {r.residualScore !== null ? (
                          <span className="inline-flex whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold">
                            {r.residualScore} · {r.residualLevel}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="p-3 leading-4">
                        {typeof updated === "string" ? updated : <><div>{updated.date}</div><div className="mt-1 text-[10px] text-slate-500">{updated.time}</div></>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          {role === "Cybersecurity GRC" ? (
                            <>
                              <button
                                title="Open GRC assessment"
                                aria-label={`Open assessment for ${r.id}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                                onClick={() => { setSelected(r); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                              >
                                <UserRoundCog className="h-4 w-4" />
                              </button>
                              <button
                                title="Delete risk"
                                aria-label={`Delete ${r.id}`}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                onClick={() => remove(r)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              title="View risk"
                              aria-label={`View ${r.id}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                              onClick={() => setPreviewRisk(r)}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {showAudit && role === "Cybersecurity GRC" ? (
          <section ref={auditSectionRef} id="audit-log" className="card mt-6 scroll-mt-6 overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/10 p-3"><History className="h-6 w-6" /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black">Audit Log</h2>
                      <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-bold text-emerald-200">GRC ONLY</span>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">A chronological view of risk submissions, GRC updates, and risk communications for the currently visible portfolio.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"><strong>{auditEvents.length}</strong> events</div>
                  <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold hover:bg-white/10" onClick={() => setShowAudit(false)}>Close</button>
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Submissions</div><div className="mt-1 text-2xl font-black text-slate-950">{auditEvents.filter((e) => e.type === "Submission").length}</div></div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">GRC Updates</div><div className="mt-1 text-2xl font-black text-slate-950">{auditEvents.filter((e) => e.type === "Update").length}</div></div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="text-xs font-bold uppercase tracking-wide text-slate-500">Communications</div><div className="mt-1 text-2xl font-black text-slate-950">{auditEvents.filter((e) => e.type === "Communication").length}</div></div>
              </div>

              {auditEvents.length ? (
                <div className="space-y-3">
                  {auditEvents.map((e, i) => {
                    const tone = e.type === "Submission" ? "border-blue-200 bg-blue-50 text-blue-700" : e.type === "Communication" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-violet-200 bg-violet-50 text-violet-700";
                    return (
                      <div key={`${e.time}-${i}`} className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-[150px_1fr_auto] md:items-center">
                        <div className="text-xs leading-5 text-slate-500">{dateTime(e.time)}</div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${tone}`}>{e.type}</span>
                            <strong className="text-sm text-slate-950">{e.label}</strong>
                            <span className="text-xs font-bold text-slate-500">{e.riskId}</span>
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{e.detail}</div>
                          <div className="mt-1 text-xs text-slate-400">{e.actor} · {e.department}</div>
                        </div>
                        <button
                          className="btn-secondary whitespace-nowrap"
                          onClick={() => {
                            const risk = risks.find((item) => item.id === e.riskId);
                            if (risk) {
                              setSelected(risk);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }
                          }}
                        >
                          Open Risk
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No audit events are available for the current portfolio filter.</div>
              )}

              <p className="mt-4 text-xs leading-5 text-slate-500">MVP note: this preview is derived from risk metadata. In production, the audit trail should be append-only and access-controlled through authenticated server-side authorization / RLS.</p>
            </div>
          </section>
        ) : null}
      </div>
      {previewRisk ? <RiskPreviewModal risk={previewRisk} onClose={() => setPreviewRisk(null)} /> : null}
    </main>
  );
}
