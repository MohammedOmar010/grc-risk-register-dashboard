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

const storageKey = "grc-risk-register-v1";

const defaultForm: RiskFormData = {
  title: "",
  description: "",
  category: "الوصول والهوية",
  asset: "",
  threat: "",
  vulnerability: "",
  likelihood: 3,
  impact: 3,
  owner: "",
  department: "",
  mitigationPlan: "",
  control: "",
  frameworkRef: "NIST SP 800-53:",
  csfFunction: "Govern",
  treatment: "تخفيف",
  status: "مفتوح",
  dueDate: "",
};

const categories = [
  "الوصول والهوية",
  "إدارة الثغرات",
  "التوعية الأمنية",
  "استمرارية الأعمال",
  "الأمن السحابي",
  "الاستجابة للحوادث",
  "إدارة الأصول",
  "الأطراف الخارجية",
  "أمن الشبكات",
];

const chartColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#475569"];

function countBy<T extends string>(risks: Risk[], key: keyof Risk): { name: T; value: number }[] {
  const counts = risks.reduce<Record<string, number>>((acc, risk) => {
    const value = String(risk[key]);
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).map(([name, value]) => ({ name: name as T, value }));
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildRisk(form: RiskFormData, previous?: Risk): Risk {
  const score = calculateRiskScore(form.likelihood, form.impact);
  const now = todayIsoDate();

  return {
    ...form,
    id: previous?.id || `R-${Math.floor(Math.random() * 9000 + 1000)}`,
    score,
    level: getRiskLevel(score),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
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

function RiskForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  editingRisk,
}: {
  form: RiskFormData;
  setForm: (form: RiskFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  editingRisk?: Risk | null;
}) {
  const previewScore = calculateRiskScore(form.likelihood, form.impact);
  const previewLevel = getRiskLevel(previewScore);

  function update<K extends keyof RiskFormData>(key: K, value: RiskFormData[K]) {
    setForm({ ...form, [key]: value });
  }

  return (
    <section className="card p-6">
      <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{editingRisk ? "تعديل الخطر" : "إضافة خطر جديد"}</h2>
          <p className="mt-1 text-sm text-slate-500">أدخل بيانات الخطر بلغة واضحة حتى يفهمها المختص وغير المختص.</p>
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
          <select className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
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
          <label className="label">الاحتمالية 1 إلى 5</label>
          <input className="input" type="number" min={1} max={5} value={form.likelihood} onChange={(e) => update("likelihood", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">التأثير 1 إلى 5</label>
          <input className="input" type="number" min={1} max={5} value={form.impact} onChange={(e) => update("impact", Number(e.target.value))} />
        </div>
        <div>
          <label className="label">مالك الخطر</label>
          <input className="input" value={form.owner} onChange={(e) => update("owner", e.target.value)} placeholder="مثال: مسؤول أمن المعلومات" />
        </div>
        <div>
          <label className="label">الحالة</label>
          <select className="input" value={form.status} onChange={(e) => update("status", e.target.value as RiskStatus)}>
            <option>مفتوح</option>
            <option>قيد المعالجة</option>
            <option>مغلق</option>
          </select>
        </div>
        <div>
          <label className="label">استراتيجية المعالجة</label>
          <select className="input" value={form.treatment} onChange={(e) => update("treatment", e.target.value as RiskFormData["treatment"])}>
            <option>تخفيف</option>
            <option>قبول</option>
            <option>نقل</option>
            <option>تجنب</option>
          </select>
        </div>
        <div>
          <label className="label">وظيفة NIST CSF</label>
          <select className="input" value={form.csfFunction} onChange={(e) => update("csfFunction", e.target.value as RiskFormData["csfFunction"])}>
            <option>Govern</option>
            <option>Identify</option>
            <option>Protect</option>
            <option>Detect</option>
            <option>Respond</option>
            <option>Recover</option>
          </select>
        </div>
        <div>
          <label className="label">الضابط المقترح</label>
          <input className="input" value={form.control} onChange={(e) => update("control", e.target.value)} placeholder="مثال: إدارة الهوية والمصادقة" />
        </div>
        <div>
          <label className="label">مرجع الإطار</label>
          <input className="input" value={form.frameworkRef} onChange={(e) => update("frameworkRef", e.target.value)} placeholder="مثال: NIST SP 800-53: IA-2" />
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
  const [risks, setRisks] = useState<Risk[]>(sampleRisks);
  const [form, setForm] = useState<RiskFormData>(defaultForm);
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("الكل");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setRisks(JSON.parse(saved) as Risk[]);
      } catch {
        setRisks(sampleRisks);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(risks));
  }, [risks]);

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

  const levelData = countBy<RiskLevel>(risks, "level");
  const statusData = countBy<RiskStatus>(risks, "status");
  const categoryData = countBy<string>(risks, "category");
  const topRisks = [...risks].sort((a, b) => b.score - a.score).slice(0, 5);

  function resetForm() {
    setForm(defaultForm);
    setEditingRisk(null);
    setShowForm(false);
  }

  function submitRisk() {
    if (!form.title.trim() || !form.description.trim() || !form.owner.trim()) {
      alert("فضلاً أدخل عنوان الخطر، الوصف، ومالك الخطر على الأقل.");
      return;
    }

    const risk = buildRisk(form, editingRisk || undefined);

    if (editingRisk) {
      setRisks(risks.map((item) => (item.id === editingRisk.id ? risk : item)));
    } else {
      setRisks([risk, ...risks]);
    }

    resetForm();
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

  function deleteRisk(id: string) {
    const confirmed = confirm("هل تريد حذف هذا الخطر؟");
    if (!confirmed) return;
    setRisks(risks.filter((risk) => risk.id !== id));
  }

  function resetToSamples() {
    const confirmed = confirm("سيتم استبدال البيانات الحالية بالبيانات التجريبية. هل تريد المتابعة؟");
    if (!confirmed) return;
    setRisks(sampleRisks);
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
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100" onClick={() => setShowForm(true)}>
                <Plus className="ml-2 inline h-4 w-4" /> إضافة خطر
              </button>
              <button className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10" onClick={resetToSamples}>
                استعادة البيانات التجريبية
              </button>
            </div>
          </div>
        </header>

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
                <BarChart data={levelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {levelData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold text-slate-950">المخاطر حسب الحالة</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {statusData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
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
                    <span className={`rounded-xl border px-2 py-1 text-xs font-bold ${getLevelBadgeClasses(risk.level)}`}>{risk.score}</span>
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
              <p className="mt-1 text-sm text-slate-500">يمكن البحث، التصفية، التعديل، والحذف. هذه البيانات محفوظة مؤقتًا في المتصفح.</p>
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
            <table className="w-full min-w-[1100px] border-separate border-spacing-y-2 text-right text-sm">
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
                      <span className={`rounded-xl border px-2 py-1 text-xs font-bold ${getLevelBadgeClasses(risk.level)}`}>{risk.level}</span>
                    </td>
                    <td className="px-3 py-4">
                      <span className={`rounded-xl border px-2 py-1 text-xs font-bold ${getStatusBadgeClasses(risk.status)}`}>{risk.status}</span>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{risk.owner}</td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-slate-800">{risk.control}</p>
                      <p className="mt-1 text-xs text-slate-500">{risk.frameworkRef}</p>
                    </td>
                    <td className="px-3 py-4 text-slate-600">{risk.dueDate || "غير محدد"}</td>
                    <td className="rounded-l-2xl px-3 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50" onClick={() => editRisk(risk)}>
                          تعديل
                        </button>
                        <button className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => deleteRisk(risk.id)}>
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
          <div className="card p-5">
            <h2 className="text-lg font-bold text-slate-950">المخاطر حسب التصنيف</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={130} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                    {categoryData.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
          <div className="flex items-start gap-3">
            <X className="mt-1 hidden h-4 w-4 text-slate-400 sm:block" />
            <p>
              ملاحظة: هذه نسخة MVP تعليمية وعملية. التصنيفات والضوابط هنا مبنية كنموذج مبسط للتعلم والعرض المهني، وليست بديلاً عن تقييم رسمي كامل أو اعتماد جهة مختصة. المرحلة التالية هي ربط Supabase وإضافة الصلاحيات والتقارير القابلة للتصدير.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
