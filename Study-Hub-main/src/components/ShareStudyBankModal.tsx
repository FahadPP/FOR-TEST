import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, 
  X, 
  Check, 
  Copy, 
  FileText, 
  Layers, 
  HelpCircle, 
  Network, 
  Download, 
  Upload, 
  Sparkles, 
  Send,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Course, StudyMaterial, Flashcard, MCQ, MindMapNode } from "../types";

interface ShareStudyBankModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onImportFromFile?: (importedMaterial: Partial<StudyMaterial>) => void;
}

export default function ShareStudyBankModal({
  course,
  isOpen,
  onClose,
  onImportFromFile
}: ShareStudyBankModalProps) {
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [includeMindMap, setIncludeMindMap] = useState(true);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"link" | "file">("link");
  const [fileImportStatus, setFileImportStatus] = useState<string | null>(null);

  const studyMaterial = course.studyMaterial || {};
  const hasSummary = !!studyMaterial.summary?.trim();
  const flashcardsCount = studyMaterial.flashcards?.length || 0;
  const quizzesCount = studyMaterial.quizzes?.length || 0;
  const hasMindMap = !!(studyMaterial.mindMap && (studyMaterial.mindMap.topic || (studyMaterial.mindMap.branches && studyMaterial.mindMap.branches.length > 0)));

  // Build the payload
  const payload = useMemo(() => {
    const data: {
      version: string;
      courseName: string;
      courseCode: string;
      createdAt: string;
      summary?: string;
      flashcards?: Flashcard[];
      quizzes?: MCQ[];
      mindMap?: MindMapNode;
    } = {
      version: "1.0",
      courseName: course.name,
      courseCode: course.code,
      createdAt: new Date().toISOString()
    };

    if (includeSummary && hasSummary) {
      data.summary = studyMaterial.summary;
    }
    if (includeFlashcards && flashcardsCount > 0) {
      data.flashcards = studyMaterial.flashcards;
    }
    if (includeQuizzes && quizzesCount > 0) {
      data.quizzes = studyMaterial.quizzes;
    }
    if (includeMindMap && hasMindMap) {
      data.mindMap = studyMaterial.mindMap;
    }

    return data;
  }, [course, studyMaterial, includeSummary, includeFlashcards, includeQuizzes, includeMindMap, hasSummary, flashcardsCount, quizzesCount, hasMindMap]);

  // Generate URL
  const shareUrl = useMemo(() => {
    try {
      const jsonStr = JSON.stringify(payload);
      const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
      return `${window.location.origin}?studyShare=${encoded}`;
    } catch (e) {
      console.error("Error creating share URL:", e);
      return "";
    }
  }, [payload]);

  const handleCopyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareMessageText = useMemo(() => {
    const items: string[] = [];
    if (includeSummary && hasSummary) items.push("📝 ملخص شامل ومبسط");
    if (includeFlashcards && flashcardsCount > 0) items.push(`🗂️ ${flashcardsCount} بطاقة استذكار`);
    if (includeQuizzes && quizzesCount > 0) items.push(`❓ ${quizzesCount} أسئلة اختبار ذاتي وكويز`);
    if (includeMindMap && hasMindMap) items.push("🗺️ خريطة مفاهيم بصرية");

    return `📚 حزمة المذاكرة والمراجعة لمقرر: *${course.name} (${course.code})*\n\nتشمل الحزمة:\n${items.join("\n")}\n\n🔗 ابدأ المذاكرة والاستيراد التفاعلي بنقرة واحدة عبر الرابط:\n${shareUrl}`;
  }, [course, includeSummary, includeFlashcards, includeQuizzes, includeMindMap, hasSummary, flashcardsCount, quizzesCount, hasMindMap, shareUrl]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(shareMessageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessageText)}`;
    window.open(waUrl, "_blank");
  };

  const handleDownloadJson = () => {
    const fileName = `${course.code || "course"}_study_pack.json`;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (onImportFromFile) {
          onImportFromFile({
            summary: parsed.summary,
            flashcards: parsed.flashcards,
            quizzes: parsed.quizzes,
            mindMap: parsed.mindMap
          });
          setFileImportStatus("✅ تم استيراد حزمة المذاكرة وتحديث محتوى المقرر بنجاح!");
          setTimeout(() => {
            setFileImportStatus(null);
            onClose();
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
        setFileImportStatus("❌ ملف غير صالح أو تالف.");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  const totalSelectedItems = 
    (includeSummary && hasSummary ? 1 : 0) +
    (includeFlashcards && flashcardsCount > 0 ? 1 : 0) +
    (includeQuizzes && quizzesCount > 0 ? 1 : 0) +
    (includeMindMap && hasMindMap ? 1 : 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-800 dark:text-slate-100">
                مشاركة حزمة المذاكرة الشاملة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مقرر: <span className="font-bold text-slate-700 dark:text-slate-300">{course.code} - {course.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2">
          <button
            onClick={() => setActiveTab("link")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "link"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>رابط المشاركة السريع</span>
          </button>
          <button
            onClick={() => setActiveTab("file")}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === "file"
                ? "border-purple-600 text-purple-600 dark:text-purple-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>ملف حزمة المذاكرة (.JSON)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Elements Selector Checkboxes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              اختر مكونات حزمة المذاكرة المراد مشاركتها:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Flashcards */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                includeFlashcards && flashcardsCount > 0
                  ? "border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                  : flashcardsCount === 0
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    disabled={flashcardsCount === 0}
                    checked={includeFlashcards && flashcardsCount > 0}
                    onChange={(e) => setIncludeFlashcards(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>بطاقات الاستذكار (Flashcards)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {flashcardsCount > 0 ? `${flashcardsCount} بطاقة جاهزة` : "لا توجد بطاقات حالياً"}
                    </span>
                  </div>
                </div>
              </label>

              {/* 2. Quizzes */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                includeQuizzes && quizzesCount > 0
                  ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  : quizzesCount === 0
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    disabled={quizzesCount === 0}
                    checked={includeQuizzes && quizzesCount > 0}
                    onChange={(e) => setIncludeQuizzes(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>الاختبار الذاتي (الكويز)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {quizzesCount > 0 ? `${quizzesCount} سؤال واختيارات` : "لا توجد أسئلة حالياً"}
                    </span>
                  </div>
                </div>
              </label>

              {/* 3. Summary */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                includeSummary && hasSummary
                  ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : !hasSummary
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    disabled={!hasSummary}
                    checked={includeSummary && hasSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ملخص المادة الشامل</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {hasSummary ? "ملخص مفصل ومنسق" : "لا يوجد ملخص بعد"}
                    </span>
                  </div>
                </div>
              </label>

              {/* 4. Mind Map */}
              <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                includeMindMap && hasMindMap
                  ? "border-purple-300 bg-purple-50/60 dark:bg-purple-950/30 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                  : !hasMindMap
                  ? "border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60 cursor-not-allowed"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
              }`}>
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    disabled={!hasMindMap}
                    checked={includeMindMap && hasMindMap}
                    onChange={(e) => setIncludeMindMap(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-xs font-bold flex items-center gap-1">
                      <Network className="w-3.5 h-3.5 text-purple-600" />
                      <span>خريطة المفاهيم البصرية</span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {hasMindMap ? `${studyMaterial.mindMap?.branches?.length || 0} فرع مفاهيمي` : "لا توجد خريطة بعد"}
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {activeTab === "link" ? (
            <div className="space-y-4">
              {/* Direct Link Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  رابط المذاكرة المباشر (يمكن لزملائك الاستيراد بنقرة واحدة):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={totalSelectedItems > 0 ? shareUrl : "الرجاء تحديد عنصر واحد على الأقل للمشاركة"}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    disabled={totalSelectedItems === 0}
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-purple-100"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرابط</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick WhatsApp / Telegram Sharing */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    مشاركة مباشرة مع مجموعات الدفعة والشعبة:
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={totalSelectedItems === 0}
                    onClick={handleOpenWhatsApp}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>💬 إرسال عبر الواتساب</span>
                  </button>
                  <button
                    type="button"
                    disabled={totalSelectedItems === 0}
                    onClick={handleCopyMessage}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم نسخ نص الرسالة!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ نص الرسالة الجاهزة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Export & Import Area */}
              <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      تصدير حزمة المذاكرة كملف جاهز (.json)
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      يمكنك حفظ الملف ومشاركته في قنوات التليجرام أو الإيميل، ليقوم أي طالب برفعه واستيراد البطاقات والأسئلة كاملة.
                    </p>
                    <button
                      type="button"
                      disabled={totalSelectedItems === 0}
                      onClick={handleDownloadJson}
                      className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل ملف الحزمة ({course.code}_study_pack.json)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload to this course */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      استيراد حزمة مذاكرة خارجية إلى هذا المقرر
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      إذا شارك معك زميل ملف حزمة (.json)، يمكنك رفعه هنا مباشرة لإضافته إلى هذا المقرر.
                    </p>
                    <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختيار ملف الحزمة (.json)</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {fileImportStatus && (
                      <p className="text-xs font-bold mt-2 text-indigo-600 dark:text-indigo-400">
                        {fileImportStatus}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 flex justify-between items-center">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            💡 مشاركة المذكرات والبطاقات التعليمية تشجع المذاكرة التفاعلية والأمانة الأكاديمية.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
