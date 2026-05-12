"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, FileText, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import type { Risk, RiskFormData, RiskLevel, RiskStatus } from "@/types/risk";
import { calculateRiskScore, getLevelBadgeClasses, getRiskLevel, getStatusBadgeClasses } from "@/lib/risk-calculation";
import { sampleRisks } from "@/lib/sample-data";
import { createRiskRecord, deleteRiskRecord, getRisks, replaceRisksWithSamples, updateRiskRecord } from "@/lib/risk-service";
import {
  buildFrameworkReference,
  csfFunctionOptions,
  impactOptions,
  likelihoodOptions,
  riskCategoryOptions,
  statusOptions,
  treatmentOptions,
} from "@/lib/risk-options";

const defaultCategory = riskCategoryOptions[0];

const defaultForm: RiskFormData = {
  title: "",
  description: "",
  category: defaultCategory.value,
  asset: "",
  threat: "",
  vulnerability: "",
  likelihood: 3,
  impact: 3,
  owner: "",
  department: "",
  mitigationPlan: "",
  control: defaultCategory.suggestedControlText,
  frameworkRef: buildFrameworkReference(defaultCategory.suggestedControls),
  csfFunction: defaultCategory.suggestedCsfFunction,
  treatment: "تخفيف",
  status: "مفتوح",
  dueDate: "",
};

const riskLevelOrder: RiskLevel[] = ["حرج", "عالي", "متوسط", "منخفض"];
const statusOrder: RiskStatus[] = ["مفتوح", "قيد المعالجة", "مغلق"];

const riskLevelChartColors: Record<RiskLevel, string> = {
  "حرج": "#dc2626", // أحمر: يحتاج تدخل عاجل
  "عالي": "#f97316", // برتقالي: أولوية عالية
  "متوسط": "#eab308", // أصفر: يحتاج متابعة
  "منخفض": "#22c55e", // أخضر: تحت السيطرة غالبًا
};

const statusChartColors: Record<RiskStatus, string> = {
  "مفتوح": "#ef4444", // أحمر: لم تتم معالجته بعد
  "قيد المعالجة": "#f59e0b", // أصفر/برتقالي: جاري العمل عليه
  "مغلق": "#22c55e", // أخضر: تمت المعالجة أو الإغلاق
};

const categoryChartColors: Record<string, string> = {
  "الوصول والهوية": "#dc2626",
  "إدارة الثغرات": "#f97316",
  "التوعية الأمنية": "#eab308",
  "استمرارية الأعمال": "#22c55e",
  "الأمن السحابي": "#2563eb",
  "الاستجابة للحوادث": "#7c3aed",
  "إدارة الأصول": "#0f766e",
  "الأطراف الخارجية": "#be123c",
  "أمن الشبكات": "#0f172a",
};

function getLevelChartColor(level: string) {
  return riskLevelChartColors[level as RiskLevel] || "#64748b";
}

function getStatusChartColor(status: string) {
  return statusChartColors[status as RiskStatus] || "#64748b";
}

function getCategoryChartColor(category: string) {
  return categoryChartColors[category] || "#64748b";
}

function countRiskLevels(risks: Risk[]) {
  return riskLevelOrder
    .map((level) => ({ name: level, value: risks.filter((risk) => risk.level === level).length }))
    .filter((item) => item.value > 0);
}

function countRiskStatuses(risks: Risk[]) {
  return statusOrder
    .map((status) => ({ name: status, value: risks.filter((risk) => risk.status === status).length }))
    .filter((item) => item.value > 0);
}

function countCategories(risks: Risk[]) {
  return riskCategoryOptions
    .map((category) => ({
      name: category.value,
      value: risks.filter((risk) => risk.category === category.value).length,
    }))
    .filter((item) => item.value > 0);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildRisk(form: RiskFormData, previous?: Risk): Risk {
  const score = calculateRiskScore(form.likelihood, form.impact);
  const now = todayIsoDate();

  return {
    ...form,
    databaseId: previous?.databaseId,
    id: previous?.id || `R-${Math.floor(Math.random() * 9000 + 1000)}`,
    score,
    level: getRiskLevel(score),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
}

function findOptionDescription<T extends { value: string | number; description: string }>(options: T[], value: string | number) {
  return options.find((option) => option.value === value)?.description || "";
}

function MetricCard({ title, value, helper, icon }: { title: string; value: number | string; helper: string; icon: React.ReactNode }) {
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

function FieldHelp({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs leading-5 text-slate-500">{children}</p>;
}

function RiskForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  editingRisk,
}: {
  form: RiskFormData;
  setForm: (form: RiskFormData) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
  editingRisk?: Risk | null;
}) {
  const previewScore = calculateRiskScore(form.likelihood, form.impact);
  const previewLevel = getRiskLevel(previewScore);

  function update<K extends keyof RiskFormData>(key: K, value: RiskFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  function updateCategory(categoryValue: string) {
    const selectedCategory = riskCategoryOptions.find((category) => category.value === categoryValue);

    if (!selectedCategory) {
      update("category", categoryValue);
      return;
    }

    setForm({
      ...form,
      category: selectedCategory.value,
      csfFunction: selectedCategory.suggestedCsfFunction,
      control: selectedCategory.suggestedControlText,
      frameworkRef: buildFrameworkReference(selectedCategory.suggestedControls),
    });
  }

  const likelihoodHelp = findOptionDescription(likelihoodOptions, form.likelihood);
  const impactHelp = findOptionDescription(impactOptions, form.impact);
  const statusHelp = findOptionDescription(statusOptions, form.status);
  const treatmentHelp = findOptionDescription(treatmentOptions, form.treatment);
  const csfHelp = findOptionDescription(csfFunctionOptions, form.csfFunction);
  const selectedCategory = riskCategoryOptions.find((category) => category.value === form.category);

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{editingRisk ? "تعديل الخطر" : "إضافة خطر جديد"}</h2>
          <p className="mt-1 text-sm text-slate-500">أدخل بيانات الخطر بلغة واضحة. الحقول الحساسة تم تحويلها لاختيارات لتقليل الأخطاء.</p>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-sm font-bold ${getLevelBadgeClasses(previewLevel)}`}>
          الدرجة: {previewScore} — {previewLevel}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">عنوان الخطر</label>
          <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="مثال: عدم تفعيل MFA" />
        </div>

        <div>
          <label className="label">التصنيف</label>
          <select className="input" value={form.category} onChange={(e) => updateCategory(e.target.value)}>
            {riskCategoryOptions.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          <FieldHelp>عند اختيار التصنيف، يتم اقتراح وظيفة NIST CSF ومرجع NIST SP 800-53 تلقائيًا.</FieldHelp>
        </div>

        <div>
          <label className="label">الأصل المتأثر</label>
          <input className="input" value={form.asset} onChange={(e) => update("asset", e.target.value)} placeholder="مثال: حسابات الموظفين" />
        </div>
        <div>
          <label className="label">القسم / الإدارة</label>
          <input className="input" value={form.department} onChange={(e) => update("department", e.target.value)} placeholder="مثال: تقنية المعلومات" />
        </div>
        <div>
          <label className="label">التهديد</label>
          <input className="input" value={form.threat} onChange={(e) => update("threat", e.target.value)} placeholder="مثال: التصيد الاحتيالي" />
        </div>
        <div>
          <label className="label">نقطة الضعف</label>
          <input className="input" value={form.vulnerability} onChange={(e) => update("vulnerability", e.target.value)} placeholder="مثال: كلمة مرور فقط" />
        </div>

        <div>
          <label className="label">الاحتمالية</label>
          <select className="input" value={form.likelihood} onChange={(e) => update("likelihood", Number(e.target.value))}>
            {likelihoodOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldHelp>{likelihoodHelp}</FieldHelp>
        </div>

        <div>
          <label className="label">التأثير</label>
          <select className="input" value={form.impact} onChange={(e) => update("impact", Number(e.target.value))}>
            {impactOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldHelp>{impactHelp}</FieldHelp>
        </div>

        <div>
          <label className="label">مالك الخطر</label>
          <input className="input" value={form.owner} onChange={(e) => update("owner", e.target.value)} placeholder="مثال: مسؤول أمن المعلومات" />
        </div>

        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => update("status", e.target.value as RiskStatus)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldHelp>{statusHelp}</FieldHelp>
        </div>

        <div>
          <label className="label">استراتيجية المعالجة</label>
          <select className="input" value={form.treatment} onChange={(e) => update("treatment", e.target.value as RiskFormData["treatment"])}>
            {treatmentOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldHelp>{treatmentHelp}</FieldHelp>
        </div>

        <div>
          <label className="label">وظيفة NIST CSF</label>
          <select className="input" value={form.csfFunction} onChange={(e) => update("csfFunction", e.target.value as RiskFormData["csfFunction"])}>
            {csfFunctionOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldHelp>{csfHelp}</FieldHelp>
        </div>

        <div>
          <label className="label">الضابط المقترح</label>
          <textarea
            className="input min-h-20"
            value={form.control}
            onChange={(e) => update("control", e.target.value)}
            placeholder="مثال: إدارة الهوية والمصادقة"
          />
          <FieldHelp>تم اقتراحه بناءً على التصنيف ويمكن تعديله حسب واقع الجهة.</FieldHelp>
        </div>

        <div>
          <label className="label">مرجع الإطار</label>
          <input className="input bg-slate-50 font-semibold text-slate-700" value={form.frameworkRef} readOnly />
          <FieldHelp>
            يتم توليد المرجع تلقائيًا من التصنيف. الضوابط المقترحة: {selectedCategory?.suggestedControls.join("، ") || "غير محدد"}.
          </FieldHelp>
        </div>

        <div>
          <label className="label">تاريخ الاستحقاق</label>
          <input className="input" type="date" value={form.dueDate} onChange={(e) => update("dueDate", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">وصف الخطر</label>
          <textarea className="input min-h-24" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="اشرح الخطر بلغة بسيطة وواضحة" />
        </div>
        <div className="md:col-span-2">
          <label className="label">خطة المعالجة / التخفيف</label>
          <textarea className="input min-h-24" value={form.mitigationPlan} onChange={(e) => update("mitigationPlan", e.target.value)} placeholder="ما الإجراء العملي لتقليل الخطر؟" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="btn-primary" type="button" onClick={onSubmit}>
          {editingRisk ? "حفظ التعديل" : "إضافة الخطر"}
        </button>
        <button className="btn-secondary" type="button" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </section>
  );
}

export default function GrcDashboard() {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [form, setForm] = useState<RiskFormData>(defaultForm);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("الكل");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadRisks() {
      try {
        setDatabaseError(null);
        const databaseRisks = await getRisks();

        if (!isMounted) return;

        if (databaseRisks.length > 0) {
          setRisks(databaseRisks);
          return;
        }

        const seededRisks = await replaceRisksWithSamples(sampleRisks);
        if (isMounted) {
          setRisks(seededRisks);
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setDatabaseError("تعذر تحميل البيانات من Supabase. تأكد من إعداد ملف .env.local وسياسات RLS.");
          setRisks(sampleRisks);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRisks();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRisks = useMemo(() => {
    return risks.filter((risk) => {
      const searchable = `${risk.title} ${risk.category} ${risk.owner} ${risk.department} ${risk.status} ${risk.level}`.toLowerCase();
      const matchesQuery = searchable.includes(query.toLowerCase());
      const matchesLevel = levelFilter === "الكل" || risk.level === levelFilter;
      return matchesQuery && matchesLevel;
    });
  }, [risks, query, levelFilter]);

  const metrics = useMemo(() => {
    const critical = risks.filter((risk) => risk.level === "حرج").length;
    const high = risks.filter((risk) => risk.level === "عالي").length;
    const open = risks.filter((risk) => risk.status !== "مغلق").length;
    const closed = risks.filter((risk) => risk.status === "مغلق").length;
    const closureRate = risks.length ? Math.round((closed / risks.length) * 100) : 0;
    return { total: risks.length, critical, high, open, closed, closureRate };
  }, [risks]);

  const levelData = countRiskLevels(risks);
  const statusData = countRiskStatuses(risks);
  const categoryData = countCategories(risks);
  const maxCategoryValue = Math.max(...categoryData.map((item) => item.value), 1);
  const categoryChartData = categoryData.map((item) => ({
  ...item,
  color: getCategoryChartColor(item.name),
  percentage: Math.max((item.value / maxCategoryValue) * 100, 10),
}));

const topFiveCategoryData = categoryChartData
  .map((category) => {
    const categoryRisks = risks.filter((risk) => risk.category === category.name);

    const totalScore = categoryRisks.reduce((sum, risk) => sum + risk.score, 0);

    const highAndCriticalCount = categoryRisks.filter(
      (risk) => risk.level === "عالي" || risk.level === "حرج"
    ).length;

    return {
      ...category,
      totalScore,
      highAndCriticalCount,
    };
  })
  .sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    return b.value - a.value;
  })
  .slice(0, 5);

const topRisks = [...risks].sort((a, b) => b.score - a.score).slice(0, 5);

function resetForm() {
  setForm(defaultForm);
  setEditingRisk(null);
  setShowForm(false);
}

async function submitRisk() {
  if (!form.title.trim() || !form.description.trim() || !form.owner.trim()) {
    alert("فضلاً أدخل عنوان الخطر، الوصف، ومالك الخطر على الأقل.");
    return;
  }

  try {
    setIsSaving(true);
    setDatabaseError(null);
    const risk = buildRisk(form, editingRisk || undefined);
    const savedRisk = editingRisk ? await updateRiskRecord(risk) : await createRiskRecord(risk);

    if (editingRisk) {
      setRisks(risks.map((item) => (item.databaseId === savedRisk.databaseId || item.id === savedRisk.id ? savedRisk : item)));
    } else {
      setRisks([savedRisk, ...risks]);
    }

    resetForm();
  } catch (error) {
    console.error(error);
    setDatabaseError("تعذر حفظ الخطر في قاعدة البيانات. تحقق من اتصال Supabase وسياسات RLS.");
  } finally {
    setIsSaving(false);
  }
}

  function editRisk(risk: Risk) {
    setEditingRisk(risk);
    setForm({
      title: risk.title,
      description: risk.description,
      category: risk.category,
      asset: risk.asset,
      threat: risk.threat,
      vulnerability: risk.vulnerability,
      likelihood: risk.likelihood,
      impact: risk.impact,
      owner: risk.owner,
      department: risk.department,
      mitigationPlan: risk.mitigationPlan,
      control: risk.control,
      frameworkRef: risk.frameworkRef,
      csfFunction: risk.csfFunction,
      treatment: risk.treatment,
      status: risk.status,
      dueDate: risk.dueDate,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteRisk(risk: Risk) {
    const confirmed = confirm("هل تريد حذف هذا الخطر؟");
    if (!confirmed) return;

    try {
      setDatabaseError(null);
      await deleteRiskRecord(risk);
      setRisks(risks.filter((item) => item.databaseId !== risk.databaseId && item.id !== risk.id));
    } catch (error) {
      console.error(error);
      setDatabaseError("تعذر حذف الخطر من قاعدة البيانات.");
    }
  }

  async function resetToSamples() {
    const confirmed = confirm("سيتم استبدال البيانات الحالية بالبيانات التجريبية في Supabase. هل تريد المتابعة؟");
    if (!confirmed) return;

    try {
      setIsSaving(true);
      setDatabaseError(null);
      const seededRisks = await replaceRisksWithSamples(sampleRisks);
      setRisks(seededRisks);
    } catch (error) {
      console.error(error);
      setDatabaseError("تعذر استعادة البيانات التجريبية في Supabase.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">GRC Risk Register MVP</p>
              <h1 className="text-3xl font-black md:text-4xl">سجل المخاطر ولوحة مؤشرات الحوكمة</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                نظام عربي مبسط لتسجيل المخاطر التقنية والأمنية، تقييم الاحتمالية والتأثير، ربط الخطر بالضوابط، ومتابعة المعالجة بطريقة مفهومة للموظفين والإدارة.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100" disabled={isSaving} onClick={() => setShowForm(true)}>
                <Plus className="ml-2 inline h-4 w-4" /> إضافة خطر
              </button>
              <button className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10" disabled={isSaving} onClick={resetToSamples}>
                {isSaving ? "جاري الحفظ..." : "استعادة البيانات التجريبية"}
              </button>
            </div>
          </div>
        </header>

        {databaseError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-7 text-red-700">
            {databaseError}
          </div>
        )}

        {isLoading ? (
          <section className="card p-6 text-center text-sm font-bold text-slate-600">
            جاري تحميل بيانات المخاطر من قاعدة البيانات...
          </section>
        ) : null}

        {showForm && <RiskForm form={form} setForm={setForm} onSubmit={submitRisk} onCancel={resetForm} editingRisk={editingRisk} />}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard title="إجمالي المخاطر" value={metrics.total} helper="كل المخاطر المسجلة" icon={<FileText className="h-6 w-6" />} />
          <MetricCard title="مخاطر حرجة" value={metrics.critical} helper="تحتاج متابعة عاجلة" icon={<AlertTriangle className="h-6 w-6" />} />
          <MetricCard title="مخاطر عالية" value={metrics.high} helper="تحتاج خطة واضحة" icon={<ShieldCheck className="h-6 w-6" />} />
          <MetricCard title="مفتوحة" value={metrics.open} helper="لم تغلق بعد" icon={<Clock className="h-6 w-6" />} />
          <MetricCard title="نسبة الإغلاق" value={`${metrics.closureRate}%`} helper="مغلقة من إجمالي المخاطر" icon={<CheckCircle2 className="h-6 w-6" />} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-950">المخاطر حسب المستوى</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
  <BarChart
    data={levelData}
    margin={{ top: 10, right: 20, left: 35, bottom: 10 }}
  >
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis
      dataKey="name"
      tick={{ fontSize: 12, fill: "#475569" }}
      tickMargin={10}
    />
    <YAxis
      allowDecimals={false}
      width={50}
      tickMargin={14}
      tick={{ fontSize: 13, fill: "#475569" }}
    />
    <Tooltip formatter={(value, name) => [value, name]} />
    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
      {levelData.map((entry) => (
        <Cell key={entry.name} fill={getLevelChartColor(entry.name)} />
      ))}
    </Bar>
  </BarChart>
</ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {riskLevelOrder.map((level) => (
                <span key={level} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getLevelChartColor(level) }} />
                  {level}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-950">المخاطر حسب الحالة</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
<PieChart margin={{ top: 20, right: 70, left: 70, bottom: 20 }}>    <Pie
      data={statusData}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      outerRadius={68}
      labelLine={false}
label={(props) => {        const { cx, cy, midAngle, outerRadius, name, value, fill } = props;
        const RADIAN = Math.PI / 180;
        const labelRadius = outerRadius + 32;
        const x = cx + labelRadius * Math.cos(-midAngle * RADIAN);
        const y = cy + labelRadius * Math.sin(-midAngle * RADIAN);

        const isRightSide = x > cx;
        const extraOffset = name === "مغلق" ? 20 : 12;

        return (
          <text
            x={isRightSide ? x + extraOffset : x - extraOffset}
            y={y}
            fill={fill}
            textAnchor={isRightSide ? "start" : "end"}
            dominantBaseline="central"
            fontSize={14}
            fontWeight={700}
          >
            {`${name}: ${value}`}
          </text>
        );
      }}
    >
      {statusData.map((entry) => (
        <Cell key={entry.name} fill={getStatusChartColor(entry.name)} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
</ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {statusOrder.map((status) => (
                <span key={status} className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getStatusChartColor(status) }} />
                  {status}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-950">أعلى 5 مخاطر</h2>
            <div className="space-y-3">
              {topRisks.map((risk) => (
                <div key={risk.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{risk.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{risk.owner} — {risk.category}</p>
                    </div>
                    <span className={`whitespace-nowrap rounded-xl border px-2 py-1 text-xs font-bold ${getLevelBadgeClasses(risk.level)}`}>{risk.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 card p-5">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">سجل المخاطر</h2>
              <p className="mt-1 text-sm text-slate-500">يمكن البحث، التصفية، التعديل، والحذف. هذه البيانات محفوظة الآن في قاعدة بيانات Supabase.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input className="input sm:w-72" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث باسم الخطر أو المسؤول..." />
              <select className="input sm:w-44" value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
                <option>الكل</option>
                <option>حرج</option>
                <option>عالي</option>
                <option>متوسط</option>
                <option>منخفض</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1150px] border-separate border-spacing-y-2 text-right text-sm">
              <thead>
                <tr className="text-xs font-bold text-slate-500">
                  <th className="px-3 py-2">المعرف</th>
                  <th className="px-3 py-2">الخطر</th>
                  <th className="px-3 py-2">التصنيف</th>
                  <th className="px-3 py-2">الدرجة</th>
                  <th className="px-3 py-2">المستوى</th>
                  <th className="px-3 py-2">الحالة</th>
                  <th className="px-3 py-2">المسؤول</th>
                  <th className="px-3 py-2">الإطار / الضابط</th>
                  <th className="px-3 py-2">الاستحقاق</th>
                  <th className="px-3 py-2">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredRisks.map((risk) => (
                  <tr key={risk.id} className="bg-white shadow-sm">
                    <td className="rounded-r-2xl px-3 py-4 font-bold text-slate-500">{risk.id}</td>
                    <td className="px-3 py-4">
                      <p className="font-bold text-slate-950">{risk.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-slate-500">{risk.description}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{risk.category}</td>
                    <td className="px-3 py-4 font-black text-slate-950">{risk.score}</td>
                    <td className="px-3 py-4">
                      <span className={`whitespace-nowrap rounded-xl border px-2 py-1 text-xs font-bold ${getLevelBadgeClasses(risk.level)}`}>{risk.level}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`inline-flex min-w-24 items-center justify-center whitespace-nowrap rounded-xl border px-2 py-1 text-xs font-bold ${getStatusBadgeClasses(risk.status)}`}>{risk.status}</span>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{risk.owner}</td>
                    <td className="px-3 py-4">
                      <p className="max-w-xs font-semibold text-slate-800">{risk.control}</p>
                      <p className="mt-1 text-xs text-slate-500">{risk.frameworkRef}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{risk.dueDate || "غير محدد"}</td>
                    <td className="rounded-l-2xl px-3 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50" onClick={() => editRisk(risk)}>
                          تعديل
                        </button>
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => deleteRisk(risk)}>
                          <Trash2 className="inline h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="text-lg font-bold text-slate-950">تقرير تنفيذي مختصر</h2>
            <p className="mt-3 leading-7 text-slate-600">
              يوجد حاليًا <strong>{metrics.total}</strong> مخاطر مسجلة، منها <strong>{metrics.critical}</strong> حرجة و <strong>{metrics.high}</strong> عالية. يوصى بالتركيز أولًا على المخاطر الحرجة، ثم المخاطر المرتبطة بالوصول والهوية، لأن أثرها غالبًا مباشر على سرية وسلامة الأنظمة.
            </p>
          </div>
          <div className="card overflow-hidden p-0">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-950">المخاطر حسب التصنيف</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                يوضح هذا القسم توزيع المخاطر على المجالات الرئيسية. تم استخدام عرض مخصص بدل محور الرسم التقليدي حتى تظهر النصوص العربية بوضوح.
              </p>
            </div>

            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="p-5">
                <div className="space-y-4">
                  {categoryChartData.map((item) => (
                    <div key={item.name} className="grid gap-2 sm:grid-cols-[150px_minmax(0,1fr)_44px] sm:items-center">
                      <div className="text-sm font-bold text-slate-700 sm:text-right">{item.name}</div>
                      <div className="h-9 rounded-2xl bg-slate-100 p-1">
                        <div
                          className="flex h-full items-center justify-end rounded-xl px-3 text-xs font-black text-white shadow-sm transition-all"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        >
                          {item.value}
                        </div>
                      </div>
                      <div className="hidden text-center text-sm font-black text-slate-700 sm:block">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="border-t border-slate-100 bg-slate-50 p-5 xl:border-r xl:border-t-0">
                <h3 className="text-base font-black text-slate-950">أعلى 5 تصنيفات حسب الخطورة</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
يعرض هذا القسم أكثر التصنيفات خطورة بناءً على مجموع درجات المخاطر داخل كل تصنيف، وليس عدد المخاطر فقط. </p>

                <div className="mt-5 space-y-3">
                  {topFiveCategoryData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-700">{item.name}</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-800">{item.totalScore}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
          <div className="flex items-start gap-3">
            <X className="mt-1 hidden h-4 w-4 text-slate-400 sm:block" />
            <p>
              ملاحظة: هذه نسخة MVP تعليمية وعملية. التصنيفات والضوابط هنا مبنية كنموذج مبسط للتعلم والعرض المهني، وليست بديلاً عن تقييم رسمي كامل أو اعتماد جهة مختصة. تم ربط البيانات بقاعدة Supabase كمرحلة ثانية، والمرحلة القادمة هي إضافة تسجيل الدخول، الصلاحيات، والتقارير القابلة للتصدير.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
