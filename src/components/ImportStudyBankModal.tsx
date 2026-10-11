import { useState } from "react";
import { motion } from "motion/react";
import { 
  Sparkles, 
  Layers, 
  HelpCircle, 
  FileText, 
  Network, 
  Check, 
  X, 
  ArrowLeft, 
  BookOpen,
  CheckCircle2,
  FolderPlus
} from "lucide-react";
import { Course, StudyMaterial, Flashcard, MCQ, MindMapNode } from "../types";

export interface SharedStudyPackageData {
  version?: string;
  courseName: string;
  courseCode?: string;
  createdAt?: string;
  summary?: string;
  flashcards?: Flashcard[];
  quizzes?: MCQ[];
  mindMap?: MindMapNode;
}

interface ImportStudyBankModalProps {
  packageData: SharedStudyPackageData;
  courses: Course[];
  onImport: (targetCourseId: string, importMode: "merge" | "replace", newCourseData?: { name: string; code: string }) => Promise<void>;
  onClose: () => void;
}

export default function ImportStudyBankModal({
  packageData,
  courses,
  onImport,
  onClose
}: ImportStudyBankModalProps) {
  const [selectedTargetCourseId, setSelectedTargetCourseId] = useState<string>(
    courses[0]?.id || "new"
  );
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSummary = !!packageData.summary?.trim();
  const flashcardsCount = packageData.flashcards?.length || 0;
  const quizzesCount = packageData.quizzes?.length || 0;
  const hasMindMap = !!(packageData.mindMap && (packageData.mindMap.topic || (packageData.mindMap.branches && packageData.mindMap.branches.length > 0)));

  const handleConfirmImport = async () => {
    setIsSubmitting(true);
    try {
      const isNewCourse = selectedTargetCourseId === "new";
      await onImport(
        selectedTargetCourseId,
        importMode,
        isNewCourse ? { name: packageData.courseName, code: packageData.courseCode || "GEN-101" } : undefined
      );
    } catch (e) {
      console.error("Error during import:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-purple-50/60 dark:bg-purple-950/40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200 dark:shadow-none">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 tracking-wider">
                حزمة مذاكرة مشتركة
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">
                {packageData.courseName} {packageData.courseCode ? `(${packageData.courseCode})` : ""}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Summary of incoming items */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              محتويات حزمة المذاكرة الواردة:
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Flashcards badge */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                flashcardsCount > 0 
                  ? "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}>
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">بطاقات استذكار</p>
                  <p className="text-[10px] opacity-80">{flashcardsCount > 0 ? `${flashcardsCount} بطاقة جاهزة` : "غير متوفرة"}</p>
                </div>
              </div>

              {/* Quizzes badge */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                quizzesCount > 0 
                  ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}>
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-300 shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">كويز واختبار ذاتي</p>
                  <p className="text-[10px] opacity-80">{quizzesCount > 0 ? `${quizzesCount} أسئلة خيارات` : "غير متوفر"}</p>
                </div>
              </div>

              {/* Summary badge */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                hasSummary 
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">ملخص دراسي</p>
                  <p className="text-[10px] opacity-80">{hasSummary ? "ملخص مفصل ومنسق" : "غير متوفر"}</p>
                </div>
              </div>

              {/* Mind map badge */}
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                hasMindMap 
                  ? "bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200"
                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
              }`}>
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
                  <Network className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">خريطة مفاهيم</p>
                  <p className="text-[10px] opacity-80">{hasMindMap ? `${packageData.mindMap?.branches?.length || 0} فرع مفاهيمي` : "غير متوفرة"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Select Target Course */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              اختر المقرر الدراسي لحفظ الحزمة داخله:
            </label>
            <select
              value={selectedTargetCourseId}
              onChange={(e) => setSelectedTargetCourseId(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 cursor-pointer"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  📚 {c.code} - {c.name}
                </option>
              ))}
              <option value="new">
                ✨ إنشاء مقرر جديد باسم "{packageData.courseName}"
              </option>
            </select>
          </div>

          {/* Import Mode (Merge vs Replace) */}
          {selectedTargetCourseId !== "new" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                طريقة الحفظ في المقرر المختار:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode("merge")}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                    importMode === "merge"
                      ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-400/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>دمج مع المحتوى الحالي</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    إضافة البطاقات والأسئلة الجديدة إلى ما لديك مسبقاً دون حذفه.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                    importMode === "replace"
                      ? "border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 ring-1 ring-purple-400/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600"
                  }`}
                >
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>استبدال المحتوى بالكامل</span>
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    تحديث شامل للمقرر واستبدال البطاقات والملخص بهذه الحزمة.
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmImport}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-purple-200 dark:shadow-none"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? "جاري الحفظ..." : "📥 استيراد وحفظ في ساحة المذاكرة"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
