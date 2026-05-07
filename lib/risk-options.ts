import type { CsfFunction, RiskStatus, RiskTreatment } from "@/types/risk";

export const likelihoodOptions = [
  { value: 1, label: "1 - نادر", description: "احتمالية الحدوث ضعيفة جدًا أو غير متوقعة إلا في حالات استثنائية." },
  { value: 2, label: "2 - منخفض", description: "قد يحدث الخطر، لكن ليس بشكل متكرر." },
  { value: 3, label: "3 - متوسط", description: "الخطر ممكن الحدوث ويحتاج متابعة." },
  { value: 4, label: "4 - مرتفع", description: "الخطر مرجح الحدوث إذا لم توجد ضوابط مناسبة." },
  { value: 5, label: "5 - شبه مؤكد", description: "الخطر متوقع حدوثه بدرجة عالية." },
];

export const impactOptions = [
  { value: 1, label: "1 - بسيط", description: "تأثير محدود ولا يؤثر بشكل واضح على العمل." },
  { value: 2, label: "2 - محدود", description: "تأثير قابل للاحتواء ولا يسبب ضررًا كبيرًا." },
  { value: 3, label: "3 - متوسط", description: "قد يؤثر على بعض الخدمات أو العمليات." },
  { value: 4, label: "4 - كبير", description: "قد يسبب تعطّلًا أو خسارة أو أثرًا واضحًا على الجهة." },
  { value: 5, label: "5 - خطير جدًا", description: "قد يسبب أثرًا كبيرًا على السرية أو السلامة أو التوفر أو السمعة." },
];

export const statusOptions: { value: RiskStatus; label: string; description: string }[] = [
  { value: "مفتوح", label: "مفتوح", description: "تم تسجيل الخطر ولم تكتمل معالجته بعد." },
  { value: "قيد المعالجة", label: "قيد المعالجة", description: "يوجد إجراء أو خطة معالجة قيد التنفيذ." },
  { value: "مغلق", label: "مغلق", description: "تمت معالجة الخطر أو قبول إغلاقه." },
];

export const treatmentOptions: { value: RiskTreatment; label: string; description: string }[] = [
  { value: "تخفيف", label: "تخفيف", description: "تقليل احتمالية حدوث الخطر أو تقليل أثره من خلال ضوابط وإجراءات." },
  { value: "قبول", label: "قبول", description: "قبول الخطر كما هو بعد فهم أثره، غالبًا إذا كانت تكلفة المعالجة أعلى من أثر الخطر." },
  { value: "نقل", label: "نقل", description: "نقل جزء من أثر الخطر لطرف آخر مثل مزود خدمة أو تأمين أو عقد خارجي." },
  { value: "تجنب", label: "تجنب", description: "إيقاف النشاط أو تغيير الطريقة لتجنب الخطر بالكامل." },
];

export const csfFunctionOptions: { value: CsfFunction; label: string; description: string }[] = [
  { value: "Govern", label: "Govern - الحوكمة", description: "السياسات، الأدوار، المسؤوليات، إدارة المخاطر، والامتثال." },
  { value: "Identify", label: "Identify - التعرّف والتحديد", description: "تحديد الأصول، الأنظمة، البيانات، المخاطر، والاعتماديات." },
  { value: "Protect", label: "Protect - الحماية", description: "ضوابط الوصول، التوعية، التشفير، النسخ الاحتياطي، والحماية الوقائية." },
  { value: "Detect", label: "Detect - الاكتشاف", description: "المراقبة، التنبيهات، واكتشاف الأحداث والأنشطة غير الطبيعية." },
  { value: "Respond", label: "Respond - الاستجابة", description: "التعامل مع الحوادث، تحليل السبب، الإجراءات التصحيحية، والتواصل." },
  { value: "Recover", label: "Recover - التعافي", description: "استعادة الخدمات والبيانات بعد الحوادث أو الانقطاع." },
];

export const riskCategoryOptions = [
  { value: "الوصول والهوية", label: "الوصول والهوية", suggestedCsfFunction: "Protect" as CsfFunction, suggestedControls: ["IA-2", "IA-5", "AC-2", "AC-6"], suggestedControlText: "تفعيل المصادقة متعددة العوامل، إدارة الحسابات، وتطبيق مبدأ أقل صلاحية." },
  { value: "إدارة الثغرات", label: "إدارة الثغرات", suggestedCsfFunction: "Protect" as CsfFunction, suggestedControls: ["RA-5", "SI-2"], suggestedControlText: "فحص الثغرات دوريًا وتطبيق التحديثات الأمنية حسب الأولوية." },
  { value: "التوعية الأمنية", label: "التوعية الأمنية", suggestedCsfFunction: "Protect" as CsfFunction, suggestedControls: ["AT-2", "AT-3"], suggestedControlText: "تنفيذ برامج توعية أمنية واختبارات تصيد دورية للموظفين." },
  { value: "استمرارية الأعمال", label: "استمرارية الأعمال", suggestedCsfFunction: "Recover" as CsfFunction, suggestedControls: ["CP-9", "CP-10"], suggestedControlText: "تطبيق النسخ الاحتياطي واختبار الاستعادة بشكل دوري." },
  { value: "الأمن السحابي", label: "الأمن السحابي", suggestedCsfFunction: "Protect" as CsfFunction, suggestedControls: ["AC-3", "SC-7", "CM-6"], suggestedControlText: "مراجعة إعدادات الوصول، حماية الاتصالات، وضبط الإعدادات السحابية الآمنة." },
  { value: "الاستجابة للحوادث", label: "الاستجابة للحوادث", suggestedCsfFunction: "Respond" as CsfFunction, suggestedControls: ["IR-4", "IR-8"], suggestedControlText: "إعداد خطة استجابة للحوادث وتحديد أدوار ومسؤوليات الفريق." },
  { value: "إدارة الأصول", label: "إدارة الأصول", suggestedCsfFunction: "Identify" as CsfFunction, suggestedControls: ["CM-8"], suggestedControlText: "إنشاء سجل محدث للأصول التقنية وتصنيف أهميتها." },
  { value: "الأطراف الخارجية", label: "الأطراف الخارجية", suggestedCsfFunction: "Govern" as CsfFunction, suggestedControls: ["SR-3", "SR-6"], suggestedControlText: "تقييم مخاطر الموردين ومراجعة المتطلبات الأمنية في العقود." },
  { value: "أمن الشبكات", label: "أمن الشبكات", suggestedCsfFunction: "Protect" as CsfFunction, suggestedControls: ["SC-7", "CM-3"], suggestedControlText: "مراجعة قواعد الجدار الناري، حماية حدود الشبكة، وإدارة التغييرات." },
];

export function buildFrameworkReference(controlCodes: string[]) {
  if (controlCodes.length === 0) return "NIST SP 800-53:";
  return `NIST SP 800-53: ${controlCodes.join(", ")}`;
}
