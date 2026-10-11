import { useState, useMemo } from "react";
import { 
  FileDown, 
  Download, 
  X, 
  Check, 
  Copy, 
  Star, 
  CheckSquare, 
  Layers, 
  BookOpen, 
  Award,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { Course, MCQ, Flashcard } from "../types";
import ExportToNotionModal from "./ExportToNotionModal";

interface PrintStudyBankModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

type DocumentMode = "practice_exam" | "study_guide" | "flashcards" | "full_pack";

type PageItem = 
  | { type: "summary"; content: string }
  | { type: "flashcard"; card: Flashcard; index: number }
  | { type: "quiz"; quiz: MCQ; index: number }
  | { type: "answer_key"; quizzes: MCQ[] }
  | { type: "scratchpad" };

export default function PrintStudyBankModal({ course, isOpen, onClose }: PrintStudyBankModalProps) {
  const [docMode, setDocMode] = useState<DocumentMode>("practice_exam");
  const [filterHighlightedOnly, setFilterHighlightedOnly] = useState(false);
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true);
  const [includeScratchArea, setIncludeScratchArea] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studyMaterial = course.studyMaterial;
  const allQuizzes = studyMaterial?.quizzes || [];
  const allCards = studyMaterial?.flashcards || [];

  // Filtered lists
  const quizzes = allQuizzes.filter(q => {
    if (filterHighlightedOnly && !q.isTeacherHighlighted) return false;
    return true;
  });

  const cards = allCards.filter(c => {
    if (filterHighlightedOnly && !c.isTeacherHighlighted) return false;
    return true;
  });

  const highlightedQuizCount = allQuizzes.filter(q => q.isTeacherHighlighted).length;
  const highlightedCardCount = allCards.filter(c => c.isTeacherHighlighted).length;

  // Build Paginated Items without splitting
  const pages: PageItem[][] = useMemo(() => {
    const allItems: PageItem[] = [];

    if (docMode === "full_pack" && studyMaterial?.summary) {
      allItems.push({ type: "summary", content: studyMaterial.summary });
    }

    if (docMode === "flashcards" || docMode === "full_pack") {
      cards.forEach((card, idx) => {
        allItems.push({ type: "flashcard", card, index: idx });
      });
    }

    if (docMode === "practice_exam" || docMode === "study_guide" || docMode === "full_pack") {
      quizzes.forEach((quiz, idx) => {
        allItems.push({ type: "quiz", quiz, index: idx });
      });
    }

    if (docMode === "practice_exam" && includeAnswerKey && quizzes.length > 0) {
      allItems.push({ type: "answer_key", quizzes });
    }

    if (includeScratchArea) {
      allItems.push({ type: "scratchpad" });
    }

    const getItemWeight = (item: PageItem): number => {
      switch (item.type) {
        case "summary":
          return 220;
        case "flashcard":
          return 65;
        case "quiz": {
          const textLen = item.quiz.question.length;
          const optLen = item.quiz.options.reduce((acc, o) => acc + o.length, 0);
          return textLen > 100 || optLen > 120 ? 190 : 155;
        }
        case "answer_key":
          return item.quizzes.length > 12 ? 160 : 120;
        case "scratchpad":
          return 140;
        default:
          return 100;
      }
    };

    const paginated: PageItem[][] = [];
    let currentPage: PageItem[] = [];
    let currentWeight = 0;
    // Page 1 reserves space for main exam header if enabled
    let pageLimit = includeHeader ? 640 : 860;

    for (const item of allItems) {
      const w = getItemWeight(item);
      if (currentWeight + w > pageLimit && currentPage.length > 0) {
        paginated.push(currentPage);
        currentPage = [item];
        currentWeight = w;
        pageLimit = 820; // subsequent pages use mini header
      } else {
        currentPage.push(item);
        currentWeight += w;
      }
    }

    if (currentPage.length > 0) {
      paginated.push(currentPage);
    }

    return paginated.length > 0 ? paginated : [[]];
  }, [docMode, quizzes, cards, studyMaterial, includeHeader, includeAnswerKey, includeScratchArea]);

  const handleDownloadPdf = async () => {
    const pageElements = document.querySelectorAll(".pdf-page-container");
    if (!pageElements || pageElements.length === 0) {
      setErrorMessage("لم يتم العثور على صفحات لتوليد ملف الـ PDF");
      return;
    }

    setIsGeneratingPdf(true);
    setErrorMessage(null);
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i] as HTMLElement;
        if (i > 0) {
          pdf.addPage();
        }

        const pageImg = await toJpeg(pageEl, {
          quality: 0.95,
          backgroundColor: "#ffffff",
          pixelRatio: 2,
          skipFonts: true,
          fontEmbedCSS: "",
        });

        // Exactly map page 1:1 onto standard A4 (210mm x 297mm) with zero splitting
        pdf.addImage(pageImg, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }

      const modeArabic = 
        docMode === "practice_exam" ? "اختبار_تدريبي" :
        docMode === "study_guide" ? "دليل_المراجعة" :
        docMode === "flashcards" ? "بطاقات_استذكار" : "الملف_الشامل";

      const cleanCourseName = (course.name || "مقرر").replace(/[\\/:*?"<>|]/g, "_");
      const safeCode = (course.code || "").replace(/[\\/:*?"<>|]/g, "_");
      const fileName = `${safeCode ? safeCode + "_" : ""}${cleanCourseName}_${modeArabic}.pdf`;

      pdf.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      setErrorMessage(error?.message || "حدث خطأ غير متوقع أثناء توليد ملف الـ PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyText = () => {
    let text = `=======================================================\n`;
    text += `📘 ${course.name} (${course.code}) - ${docMode === "practice_exam" ? "ورقة اختبار تدريبي" : "دليل المراجعة والحلول"}\n`;
    text += `أستاذ المادة: ${course.instructor || "غير محدد"}\n`;
    text += `=======================================================\n\n`;

    if (docMode === "practice_exam" || docMode === "study_guide" || docMode === "full_pack") {
      text += `📝 بنك الأسئلة (${quizzes.length} سؤال):\n`;
      quizzes.forEach((q, idx) => {
        text += `\nس ${idx + 1}: ${q.question} ${q.isTeacherHighlighted ? "[⭐ تنويه المعلم]" : ""}\n`;
        q.options.forEach((opt, oIdx) => {
          const letter = ["أ", "ب", "ج", "د", "هـ"][oIdx] || `${oIdx + 1}`;
          const isCorrect = oIdx === q.answerIndex;
          if (docMode === "study_guide" && isCorrect) {
            text += `   (${letter}) ${opt}  <-- [ الإجابة الصحيحة ]\n`;
          } else {
            text += `   (${letter}) ${opt}\n`;
          }
        });
      });
      text += `\n`;
    }

    if (docMode === "flashcards" || docMode === "full_pack") {
      text += `\n🗂️ بطاقات الاستذكار (${cards.length} بطاقة):\n`;
      cards.forEach((c, idx) => {
        text += `\n[بطاقة ${idx + 1}] ${c.isTeacherHighlighted ? "[⭐ تنويه المعلم]" : ""}\n`;
        text += `• السؤال/المفهوم: ${c.front}\n`;
        text += `• الإجابة/الشرح: ${c.back}\n`;
      });
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/60" dir="rtl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                تحميل بنك الأسئلة والمراجعة كـ PDF
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                  {course.code} - {course.name}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
                  {pages.length} {pages.length === 1 ? "صفحة A4" : "صفحات A4"}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                أوراق اختبار مقسمة بذكاء وفق قياس A4 بدون أي تداخل أو انشطار للمسودات والأسئلة.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100 dark:divide-slate-800" dir="rtl">
          
          {/* OPTIONS SIDEBAR */}
          <div className="lg:col-span-4 p-5 space-y-5 bg-slate-50/40 dark:bg-slate-900/40 overflow-y-auto">
            
            {/* 1. Document Mode */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                1. نوع المستند المطلوب:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setDocMode("practice_exam")}
                  className={`p-2.5 rounded-xl border text-right transition flex items-start gap-2.5 cursor-pointer ${
                    docMode === "practice_exam"
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-xs"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <CheckSquare className={`w-4 h-4 shrink-0 mt-0.5 ${docMode === "practice_exam" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <h5 className="text-xs font-black">ورقة اختبار تدريبي (Exam Sheet)</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      أسئلة فارغة مع دوائر اختيار ومساحة للحل دون كشف الإجابات.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDocMode("study_guide")}
                  className={`p-2.5 rounded-xl border text-right transition flex items-start gap-2.5 cursor-pointer ${
                    docMode === "study_guide"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Award className={`w-4 h-4 shrink-0 mt-0.5 ${docMode === "study_guide" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                  <div>
                    <h5 className="text-xs font-black">دليل المراجعة ونموذج الإجابة (Study Guide)</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      الأسئلة مع تظليل الإجابة الصحيحة وشرح الحل وإبراز تلميحات الدكتور.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDocMode("flashcards")}
                  className={`p-2.5 rounded-xl border text-right transition flex items-start gap-2.5 cursor-pointer ${
                    docMode === "flashcards"
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 shadow-xs"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <Layers className={`w-4 h-4 shrink-0 mt-0.5 ${docMode === "flashcards" ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`} />
                  <div>
                    <h5 className="text-xs font-black">ملزمة بطاقات الاستذكار (Flashcards)</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      جدول مرتب للمفاهيم والتعريفات والأسئلة مع شروحاتها للمراجعة السريعة.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDocMode("full_pack")}
                  className={`p-2.5 rounded-xl border text-right transition flex items-start gap-2.5 cursor-pointer ${
                    docMode === "full_pack"
                      ? "bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-950 dark:text-purple-200 shadow-xs"
                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                  }`}
                >
                  <BookOpen className={`w-4 h-4 shrink-0 mt-0.5 ${docMode === "full_pack" ? "text-purple-600 dark:text-purple-400" : "text-slate-400"}`} />
                  <div>
                    <h5 className="text-xs font-black">الملف الأكاديمي الشامل (Full Pack)</h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      يجمع الملخص + بنك الأسئلة + البطاقات في مستند موحد.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Scope & Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                2. نطاق الأسئلة والتصفية:
              </label>

              <div className="space-y-2">
                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition text-xs font-bold ${
                  !filterHighlightedOnly 
                    ? "bg-white dark:bg-slate-800 border-indigo-400 text-indigo-900 dark:text-indigo-200" 
                    : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  <input
                    type="radio"
                    name="filter-scope"
                    checked={!filterHighlightedOnly}
                    onChange={() => setFilterHighlightedOnly(false)}
                    className="w-3.5 h-3.5 text-indigo-600 cursor-pointer"
                  />
                  <span>كافة الأسئلة والبطاقات ({allQuizzes.length} سؤال / {allCards.length} بطاقة)</span>
                </label>

                <label className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition text-xs font-bold ${
                  filterHighlightedOnly 
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200" 
                    : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  <input
                    type="radio"
                    name="filter-scope"
                    checked={filterHighlightedOnly}
                    onChange={() => setFilterHighlightedOnly(true)}
                    className="w-3.5 h-3.5 text-amber-600 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    تنويهات وتلميحات المعلم فقط ⭐ ({highlightedQuizCount} سؤال / {highlightedCardCount} بطاقة)
                  </span>
                </label>
              </div>
            </div>

            {/* 3. Document Options */}
            <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-800">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                3. خيارات مستند الـ PDF:
              </label>

              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                  <input
                    type="checkbox"
                    checked={includeHeader}
                    onChange={(e) => setIncludeHeader(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded-sm cursor-pointer"
                  />
                  <span>إدراج ترويسة اختبار رسمية (اسم الطالب، التاريخ، الدرجة)</span>
                </label>

                {docMode === "practice_exam" && (
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                    <input
                      type="checkbox"
                      checked={includeAnswerKey}
                      onChange={(e) => setIncludeAnswerKey(e.target.checked)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded-sm cursor-pointer"
                    />
                    <span>إدراج مفتاح الحلول (Answer Key) في نهاية الاختبار</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-bold">
                  <input
                    type="checkbox"
                    checked={includeScratchArea}
                    onChange={(e) => setIncludeScratchArea(e.target.checked)}
                    className="w-3.5 h-3.5 text-indigo-600 rounded-sm cursor-pointer"
                  />
                  <span>إدراج مساحة فارغة للمسودة والملاحظات الأكاديمية</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري توليد صفحات الـ PDF ({pages.length} صفحة)...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>تم تحميل ملف الـ PDF بنجاح! 🎉</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تحميل المستند كـ PDF ({pages.length} صفحة) 📥</span>
                  </>
                )}
              </button>

              {errorMessage && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsNotionModalOpen(true)}
                className="w-full py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span className="w-3.5 h-3.5 bg-white text-black rounded-xs flex items-center justify-center text-[9px] font-black">N</span>
                <span>تصدير إلى Notion 📓</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="w-full py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ بنجاح!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ النص كاملاً للمشاركة</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* LIVE PREVIEW CANVAS (PAGINATED A4 SHEETS) */}
          <div className="lg:col-span-8 p-6 sm:p-8 bg-slate-200/60 dark:bg-slate-950/70 overflow-y-auto space-y-6">
            
            {pages.map((pageItems, pageIdx) => (
              <div key={pageIdx} className="space-y-4">
                {/* Visual Separator between multiple pages */}
                {pageIdx > 0 && (
                  <div className="py-2 flex items-center justify-center gap-3 text-slate-400 dark:text-slate-500 text-xs font-bold select-none">
                    <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
                    <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
                      بداية الصفحة {pageIdx + 1} من {pages.length}
                    </span>
                    <div className="h-px bg-slate-300 dark:bg-slate-700 flex-1" />
                  </div>
                )}

                {/* INDIVIDUAL A4 PAGE CONTAINER */}
                <div 
                  className="pdf-page-container bg-white text-slate-900 rounded-xl shadow-md border border-slate-200 p-8 sm:p-10 max-w-3xl mx-auto flex flex-col justify-between"
                  style={{
                    width: "100%",
                    maxWidth: "750px",
                    minHeight: "1060px",
                    boxSizing: "border-box",
                  }}
                >
                  <div className="space-y-5">
                    {/* PAGE 1 OFFICIAL EXAM HEADER */}
                    {pageIdx === 0 && includeHeader && (
                      <div className="border-b-2 border-slate-900 pb-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="text-right space-y-0.5">
                            <h2 className="text-base font-black text-slate-950">{course.name}</h2>
                            <p className="text-xs font-bold text-slate-600">
                              رمز المقرر: <span className="font-mono">{course.code}</span> | أستاذ المادة: {course.instructor || "غير محدد"}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-500">
                              نوع النموذج: {
                                docMode === "practice_exam" ? "ورقة اختبار وتدريب ذاتي" :
                                docMode === "study_guide" ? "دليل المراجعة والحلول النموذجية" :
                                docMode === "flashcards" ? "ملزمة بطاقات المفاهيم والاستذكار" : "الملف الأكاديمي الشامل للمقرر"
                              }
                              {filterHighlightedOnly && " [⭐ تنويهات المعلم فقط]"}
                            </p>
                          </div>

                          <div className="text-left border border-slate-900 rounded-lg p-2 min-w-28 text-center bg-slate-50">
                            <span className="text-[9px] block text-slate-600 font-bold">الدرجة المستحقة</span>
                            <span className="text-sm font-black font-mono">____ / {quizzes.length || cards.length}</span>
                          </div>
                        </div>

                        {/* Student Credentials Filling Line */}
                        <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-bold text-slate-700 border-t border-dashed border-slate-300">
                          <div>اسم الطالب: __________________</div>
                          <div>الرقم الجامعي: __________________</div>
                          <div>تاريخ الإنجاز: ____ / ____ / 2026 م</div>
                        </div>
                      </div>
                    )}

                    {/* SUBSEQUENT PAGES COMPACT MINI-HEADER */}
                    {pageIdx > 0 && (
                      <div className="border-b border-slate-300 pb-3 flex justify-between items-center text-xs">
                        <div className="font-black text-slate-800">
                          {course.name} <span className="font-mono text-slate-500">({course.code})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">
                          متابعة الأسئلة والتدريب الأكاديمي - الصفحة {pageIdx + 1}
                        </div>
                      </div>
                    )}

                    {/* PAGE ATOMIC ITEMS */}
                    <div className="space-y-4">
                      {pageItems.map((item, itemIdx) => {
                        // 1. SUMMARY
                        if (item.type === "summary") {
                          return (
                            <div key={itemIdx} className="space-y-2 pb-4 border-b border-slate-200">
                              <h3 className="text-xs font-black text-indigo-900 border-r-3 border-indigo-600 pr-2">
                                ملخص النقاط والمفاهيم الرئيسية
                              </h3>
                              <div className="text-xs leading-relaxed text-slate-800 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="whitespace-pre-wrap">{item.content}</p>
                              </div>
                            </div>
                          );
                        }

                        // 2. FLASHCARD
                        if (item.type === "flashcard") {
                          return (
                            <div 
                              key={itemIdx}
                              className={`p-3 rounded-lg border text-xs leading-relaxed ${
                                item.card.isTeacherHighlighted 
                                  ? "bg-amber-50/60 border-amber-300" 
                                  : "bg-slate-50/80 border-slate-200"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1">
                                <span className="font-black text-slate-900">
                                  {item.index + 1}. {item.card.front}
                                </span>
                                {item.card.isTeacherHighlighted && (
                                  <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-sm font-black shrink-0">
                                    ⭐ تنويه المعلم
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-700 font-semibold pt-1 border-t border-slate-200/60">
                                {item.card.back}
                              </div>
                            </div>
                          );
                        }

                        // 3. QUIZ
                        if (item.type === "quiz") {
                          return (
                            <div 
                              key={itemIdx}
                              className={`p-3.5 rounded-xl border space-y-2.5 ${
                                item.quiz.isTeacherHighlighted 
                                  ? "bg-amber-50/30 border-amber-300" 
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="text-xs font-black text-slate-900 leading-snug">
                                  <span className="inline-block w-6 font-mono">{item.index + 1}.</span>
                                  {item.quiz.question}
                                </h4>
                                {item.quiz.isTeacherHighlighted && (
                                  <span className="text-[9px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded-md font-black shrink-0">
                                    ⭐ تنويه المعلم
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-medium text-xs">
                                {item.quiz.options.map((opt, optIdx) => {
                                  const letter = ["( أ )", "( ب )", "( ج )", "( د )", "( هـ )"][optIdx] || `(${optIdx + 1})`;
                                  const isCorrect = optIdx === item.quiz.answerIndex;

                                  if (docMode === "study_guide" || docMode === "full_pack") {
                                    return (
                                      <div 
                                        key={optIdx}
                                        className={`p-2 rounded-lg border flex items-center gap-2 ${
                                          isCorrect 
                                            ? "bg-emerald-100/70 border-emerald-500 text-emerald-950 font-black" 
                                            : "bg-slate-50/50 border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        <span className="font-bold shrink-0">{letter}</span>
                                        <span>{opt}</span>
                                        {isCorrect && (
                                          <span className="text-[9px] bg-emerald-600 text-white px-1 rounded-sm mr-auto font-bold">
                                            ✓ الإجابة الصحيحة
                                          </span>
                                        )}
                                      </div>
                                    );
                                  }

                                  return (
                                    <div 
                                      key={optIdx}
                                      className="p-2 rounded-lg border border-slate-200 bg-slate-50/30 text-slate-800 flex items-center gap-2"
                                    >
                                      <div className="w-4 h-4 rounded-full border-2 border-slate-400 shrink-0" />
                                      <span className="font-bold shrink-0 text-slate-600">{letter}</span>
                                      <span>{opt}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // 4. ANSWER KEY
                        if (item.type === "answer_key") {
                          return (
                            <div key={itemIdx} className="pt-4 border-t-2 border-dashed border-slate-300 space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-black text-slate-900">
                                  مفتاح الإجابات النموذجية (Answer Key Sheet)
                                </h4>
                                <span className="text-[9px] text-slate-500 font-semibold">
                                  راجع إجاباتك بعد الانتهاء التام من الحل
                                </span>
                              </div>

                              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center text-xs font-bold pt-1">
                                {item.quizzes.map((quiz, qIdx) => {
                                  const letter = ["أ", "ب", "ج", "د", "هـ"][quiz.answerIndex] || `${quiz.answerIndex + 1}`;
                                  return (
                                    <div key={qIdx} className="p-1.5 bg-slate-100 rounded-lg border border-slate-300 text-slate-900">
                                      <span className="text-[10px] text-slate-500 block">س {qIdx + 1}</span>
                                      <span className="text-xs font-black text-indigo-700 font-mono">({letter})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        // 5. SCRATCHPAD AREA
                        if (item.type === "scratchpad") {
                          return (
                            <div key={itemIdx} className="pt-4 border-t border-slate-200 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 block">
                                مساحة للمسودة والملاحظات الأكاديمية:
                              </span>
                              <div className="h-28 rounded-lg border border-dashed border-slate-300 bg-slate-50/40" />
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>
                  </div>

                  {/* PAGE FOOTER */}
                  <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <img src="/logo.png" alt="مسيرتي" className="w-3.5 h-3.5 object-contain" />
                      تم إعداد وتنسيق هذا النموذج بصيغة PDF عبر المنصة الأكاديمية مسيرتي
                    </span>
                    <span className="font-bold font-mono">الصفحة {pageIdx + 1} من {pages.length}</span>
                  </div>

                </div>
              </div>
            ))}

          </div>
        </div>

      </div>

      {/* EXPORT TO NOTION MODAL */}
      <ExportToNotionModal
        course={course}
        isOpen={isNotionModalOpen}
        onClose={() => setIsNotionModalOpen(false)}
      />
    </div>
  );
}
