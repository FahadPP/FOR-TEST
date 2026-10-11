import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Trash2,
  Loader2,
  Lightbulb,
  GraduationCap,
  CalendarDays,
  ListCheck,
  FileText,
  X,
  BrainCircuit,
  Eye,
  Layers,
  HelpCircle,
  RotateCw,
  ChevronRight,
  Edit2,
  Save,
  ChevronLeft,
  Star,
  Copy,
  Check
} from "lucide-react";
import { Course, Lecture, Assignment, ChatMessage, StudyMaterial, UserProfile, Flashcard } from "../types";
import { mergeStudyMaterials } from "../utils/studyMaterialUtils";

interface AICompanionProps {
  courses: Course[];
  lectures: Lecture[];
  assignments: Assignment[];
  profile?: UserProfile;
  user?: any;
  onUpdateCourse?: (updatedCourse: Course) => void;
  onNavigateToStudyHub?: (courseId?: string) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

/**
 * Smart Flashcard Extractor
 * Automatically extracts flashcards from:
 * 1. ```json:flashcards ... ``` or ```json ... ``` codeblocks
 * 2. Arabic numbered cards ("البطاقة 1: الوجه الأمامي... الوجه الخلفي...")
 * 3. Question & Answer blocks ("السؤال: ... الإجابة: ...")
 */
export function extractFlashcardsFromText(text: string): Flashcard[] {
  if (!text || typeof text !== "string") return [];

  const cards: Flashcard[] = [];

  // 1. JSON Codeblock parsing
  const jsonRegex = /```(?:json:flashcards|json)?\s*([\s\S]*?)\s*```/gi;
  let jMatch: RegExpExecArray | null;
  while ((jMatch = jsonRegex.exec(text)) !== null) {
    const candidate = jMatch[1].trim();
    if (candidate.startsWith("[") || candidate.startsWith("{")) {
      try {
        const parsed = JSON.parse(candidate);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.flashcards)
          ? parsed.flashcards
          : [];
        for (const item of list) {
          if (item && (item.front || item.question) && (item.back || item.answer)) {
            cards.push({
              front: String(item.front || item.question).trim(),
              back: String(item.back || item.answer).trim(),
              status: "new",
              box: 1,
            });
          }
        }
      } catch {
        // ignore json parse error
      }
    }
  }
  if (cards.length > 0) return cards;

  // 2. Arabic Numbered Cards pattern: "البطاقة 1:" or "بطاقة 1:"
  const cardSplits = text.split(/(?:^|\n)\s*(?:البطاقة|بطاقة)\s*\d+[:：\-]/i);
  if (cardSplits.length > 1) {
    for (let i = 1; i < cardSplits.length; i++) {
      const chunk = cardSplits[i];
      const frontBackSplit = chunk.split(
        /(?:الوجه الخلفي|الوجه الثاني|الإجابة|الاجابة|الجواب|Back|A)\s*(?:\([^)]*\))?[:：]/i
      );
      if (frontBackSplit.length >= 2) {
        let front = frontBackSplit[0]
          .replace(/(?:الوجه الأمامي|الوجه الاول|السؤال|سؤال|Front|Q)\s*(?:\([^)]*\))?[:：]/i, "")
          .trim()
          .replace(/^[\*\-_#\s:]+|[\*\-_#\s:]+$/g, "");
        let back = frontBackSplit.slice(1).join(" ")
          .trim()
          .replace(/^[\*\-_#\s:]+|[\*\-_#\s:]+$/g, "");

        if (front && back) {
          cards.push({
            front,
            back,
            status: "new",
            box: 1,
          });
        }
      }
    }
  }
  if (cards.length > 0) return cards;

  // 3. Question / Answer pairs
  const qaChunks = text.split(/(?:^|\n)\s*(?:السؤال|سؤال|س)\s*\d*[:：]/i);
  if (qaChunks.length > 1) {
    for (let i = 1; i < qaChunks.length; i++) {
      const chunk = qaChunks[i];
      const ansSplit = chunk.split(/(?:الإجابة|الاجابة|الجواب|ج)\s*(?:\([^)]*\))?[:：]/i);
      if (ansSplit.length >= 2) {
        const front = ansSplit[0].trim().replace(/^[\*\-_#\s:]+|[\*\-_#\s:]+$/g, "");
        const back = ansSplit.slice(1).join(" ").trim().replace(/^[\*\-_#\s:]+|[\*\-_#\s:]+$/g, "");
        if (front && back && front.length > 3 && back.length > 2) {
          cards.push({
            front,
            back,
            status: "new",
            box: 1,
          });
        }
      }
    }
  }

  return cards;
}

interface ChatFlashcardDeckProps {
  cards: Flashcard[];
  courses: Course[];
  onSave: (courseId: string, cards: Flashcard[]) => void;
  onNavigateToStudyHub?: (courseId?: string) => void;
}

function ChatFlashcardDeck({ cards, courses, onSave, onNavigateToStudyHub }: ChatFlashcardDeckProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [isSaved, setIsSaved] = useState(false);

  const card = cards[currentIdx];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(false);
    setCurrentIdx((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const handleDoSave = () => {
    if (!selectedCourseId) {
      alert("الرجاء اختيار المادة لحفظ البطاقات بها أولاً.");
      return;
    }
    onSave(selectedCourseId, cards);
    setIsSaved(true);
  };

  if (!card) return null;

  return (
    <div className="mt-3.5 pt-3.5 border-t border-indigo-100 dark:border-slate-700/80 space-y-3" dir="rtl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/90 dark:bg-indigo-950/70 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
        <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>بطاقات استذكار تفاعلية ({cards.length}) 🃏</span>
        </div>

        <div className="flex items-center gap-2">
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setIsSaved(false);
              }}
              className="bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-800 dark:text-slate-100 text-[11px] font-bold rounded-lg px-2 py-1 focus:outline-hidden"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleDoSave}
            disabled={isSaved || courses.length === 0}
            className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition shadow-xs cursor-pointer ${
              isSaved
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تم الحفظ في المقرر ✓</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>حفظ في المقرر ({cards.length}) 💾</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Flip Card */}
      <div
        onClick={handleFlip}
        className={`relative min-h-[140px] p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer shadow-xs flex flex-col justify-between select-none ${
          isFlipped
            ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
            : "bg-white dark:bg-slate-900 border-indigo-200/80 dark:border-indigo-800/80 hover:border-indigo-400"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
              isFlipped
                ? "bg-emerald-600 text-white"
                : "bg-indigo-600 text-white"
            }`}
          >
            {isFlipped ? "الوجه الخلفي (الإجابة)" : "الوجه الأمامي (السؤال)"}
          </span>
          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> انقر للقلب
          </span>
        </div>

        <div className="my-3 text-right">
          {isFlipped ? (
            <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
              {card.back}
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
              {card.front}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {isFlipped ? "↩ انقر للرجوع للسؤال" : "↩ انقر لإظهار الإجابة"}
          </span>
          <span className="font-mono">
            {currentIdx + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Navigation & StudyHub link */}
      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={cards.length <= 1}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="البطاقة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 px-1 font-mono">
            {currentIdx + 1} من {cards.length}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={cards.length <= 1}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="البطاقة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {isSaved && onNavigateToStudyHub && (
          <button
            type="button"
            onClick={() => onNavigateToStudyHub(selectedCourseId)}
            className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>مذاكرة البطاقات في Study Hub 🚀</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function AICompanion({ 
  courses, 
  lectures, 
  assignments,
  profile,
  user,
  onUpdateCourse,
  onNavigateToStudyHub,
  initialPrompt,
  onClearInitialPrompt
}: AICompanionProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  
  // Convert to Study Cards states (Student-driven text conversion)
  const [showConvertToCardsModal, setShowConvertToCardsModal] = useState(false);
  const [selectedCourseIdForConversion, setSelectedCourseIdForConversion] = useState<string>(courses[0]?.id || "");
  const [customConversionText, setCustomConversionText] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState<{ courseName: string; courseId: string; statsInfo?: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveDirectCards = (courseId: string, cardsToSave: Flashcard[]) => {
    const targetCourse = courses.find((c) => c.id === courseId);
    if (!targetCourse) {
      alert("الرجاء اختيار المادة لحفظ البطاقات بها.");
      return;
    }

    const { mergedMaterial, stats } = mergeStudyMaterials(
      targetCourse.studyMaterial,
      { flashcards: cardsToSave },
      "merge"
    );

    if (onUpdateCourse) {
      onUpdateCourse({
        ...targetCourse,
        studyMaterial: mergedMaterial,
      });
    }

    let statsStr = `(أضيفت ${stats.newCardsCount} بطاقة جديدة لمقرر ${targetCourse.name})`;
    if (stats.duplicateCardsSkipped > 0) {
      statsStr += ` • تم منع تكرار ${stats.duplicateCardsSkipped} بطاقة موجودة مسبقاً`;
    }

    setConversionSuccess({
      courseName: targetCourse.name,
      courseId: targetCourse.id,
      statsInfo: statsStr,
    });
  };

  // Preview Modal States
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState<"cards" | "quizzes" | "summary">("cards");
  const [previewSaveMode, setPreviewSaveMode] = useState<"merge" | "replace">("merge");
  const [previewCardIndex, setPreviewCardIndex] = useState(0);
  const [previewCardFlipped, setPreviewCardFlipped] = useState(false);

  // Editing States
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");

  const [editingQuizIndex, setEditingQuizIndex] = useState<number | null>(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState("");
  const [editQuizOptions, setEditQuizOptions] = useState<string[]>(["", "", "", ""]);
  const [editQuizAnswerIndex, setEditQuizAnswerIndex] = useState<number>(0);

  // Edit / Delete Handlers
  const handleDeleteCard = (index: number) => {
    if (!previewMaterial || !previewMaterial.flashcards) return;
    const newCards = [...previewMaterial.flashcards];
    newCards.splice(index, 1);
    setPreviewMaterial({ ...previewMaterial, flashcards: newCards });
    if (previewCardIndex >= newCards.length && newCards.length > 0) {
      setPreviewCardIndex(newCards.length - 1);
    }
  };

  const handleSaveEditCard = (index: number) => {
    if (!previewMaterial || !previewMaterial.flashcards) return;
    const newCards = [...previewMaterial.flashcards];
    newCards[index] = { ...newCards[index], front: editCardFront, back: editCardBack };
    setPreviewMaterial({ ...previewMaterial, flashcards: newCards });
    setEditingCardIndex(null);
  };

  const handleDeleteQuiz = (index: number) => {
    if (!previewMaterial || !previewMaterial.quizzes) return;
    const newQuizzes = [...previewMaterial.quizzes];
    newQuizzes.splice(index, 1);
    setPreviewMaterial({ ...previewMaterial, quizzes: newQuizzes });
  };

  const handleSaveEditQuiz = (index: number) => {
    if (!previewMaterial || !previewMaterial.quizzes) return;
    const newQuizzes = [...previewMaterial.quizzes];
    newQuizzes[index] = { 
      ...newQuizzes[index], 
      question: editQuizQuestion, 
      options: editQuizOptions, 
      answerIndex: editQuizAnswerIndex 
    };
    setPreviewMaterial({ ...previewMaterial, quizzes: newQuizzes });
    setEditingQuizIndex(null);
  };

  const handleToggleHighlightCard = (index: number) => {
    if (!previewMaterial || !previewMaterial.flashcards) return;
    const newCards = [...previewMaterial.flashcards];
    newCards[index] = { 
      ...newCards[index], 
      isTeacherHighlighted: !newCards[index].isTeacherHighlighted 
    };
    setPreviewMaterial({ ...previewMaterial, flashcards: newCards });
  };

  const handleToggleHighlightQuiz = (index: number) => {
    if (!previewMaterial || !previewMaterial.quizzes) return;
    const newQuizzes = [...previewMaterial.quizzes];
    newQuizzes[index] = { 
      ...newQuizzes[index], 
      isTeacherHighlighted: !newQuizzes[index].isTeacherHighlighted 
    };
    setPreviewMaterial({ ...previewMaterial, quizzes: newQuizzes });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto handle initial prompt when navigating from StudyHub
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  // Update selected course default when courses prop changes
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseIdForConversion) {
      setSelectedCourseIdForConversion(courses[0].id);
    }
  }, [courses]);

  // Suggested prompt ideas
  const suggestions = [
    { text: "كيف أستعد لاختباراتي القادمة وموادي الحالية؟", icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { text: "اصنع لي خطة دراسية تناسب موادي هذا الأسبوع.", icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { text: "ما هي المهام والواجبات المتبقية عليّ؟", icon: <ListCheck className="w-3.5 h-3.5" /> },
    { text: "اشرح لي أفضل طريقة لمراجعة المقررات بذكاء.", icon: <Lightbulb className="w-3.5 h-3.5" /> }
  ];

  // Initialize with a welcome message
  useEffect(() => {
    const savedMessages = localStorage.getItem("masirati_academic_chat_history") || localStorage.getItem("masar_academic_chat_history");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages).map((m: any) => ({
          ...m,
          // Sanitize any old response that might have mistakenly mentioned the old name
          content: typeof m.content === "string" ? m.content.replace(/منصة\s+مسار/g, "منصة مسيرتي") : m.content,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
      } catch {
        initDefaultWelcome();
      }
    } else {
      initDefaultWelcome();
    }
  }, [profile?.name]);

  const initDefaultWelcome = () => {
    const studentName = profile?.name || user?.displayName || "يا بطل";
    const welcome: ChatMessage = {
      id: "welcome",
      role: "assistant",
      content: `أهلاً بك يا ${studentName}! أنا **المساعد الأكاديمي الذكي** لمنصة **مسيرتي**. 🎓✨

أنا مطلع تماماً على جميع مقرراتك وجدولك وواجباتك المسجلة هنا، وجاهز للإجابة على جميع استفساراتك:
- **معلومات مقرراتك وجدولك**: اسألني عن أي مادة، أستاذ المقرر، مواعيد المحاضرات، أو الواجبات المتبقية.
- **شرح وتوضيح المفاهيم**: شرح وتبسيط أي مفهوم أو مسألة في تخصصك ومقرراتك.
- **إدارة وتنظيم الوقت**: بناء خطة مذاكرة ومراجعة مخصصة تناسب جدولك الأسبوعي.
- **تحويل أسئلتك ومذكراتك لبطاقات**: اضغط على زر **"تحويل أسئلة لبطاقات"** بالأعلى وسأنسقها لك فوراً دون كتابة يدوية!

بماذا تحب أن نبدأ اليوم يا ${studentName}؟`,
      timestamp: new Date()
    };
    setMessages([welcome]);
  };

  // Save messages history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("masirati_academic_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Friendly error localizer
  const getFriendlyErrorMessage = (rawError?: string) => {
    if (!rawError) return "عذراً، واجهت مشكلة في الاتصال بمزود الذكاء الاصطناعي حالياً. الرجاء المحاولة مرة أخرى لاحقاً.";
    const lower = rawError.toLowerCase();
    if (lower.includes("503") || lower.includes("high demand") || lower.includes("unavailable") || lower.includes("spikes in demand")) {
      return "خوادم الذكاء الاصطناعي تشهد ضغطاً مؤقتاً في هذه اللحظة. يرجى الانتظار بضع ثوانٍ وإعادة إرسال طلبك.";
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("rate limit") || lower.includes("resource_exhausted")) {
      return "تم تجاوز حد الاستخدام اللحظي المؤقت للذكاء الاصطناعي. يرجى الانتظار دقيقة واحدة والمحاولة مجدداً.";
    }
    if (lower.includes("api key") || lower.includes("401") || lower.includes("403") || lower.includes("unauthenticated")) {
      return "مفتاح GEMINI_API_KEY غير مصرح به أو يحتاج إلى تفعيل في لوحة التحكم.";
    }
    return rawError;
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // 1. Student Identity Details
    const studentName = profile?.name || user?.displayName || "أحمد العامري";
    const studentMajor = profile?.major || "هندسة برمجيات";
    const studentUniversity = profile?.university || "جامعة الملك سعود";

    // 2. Comprehensive Courses Details
    const coursesDetails = courses.map(c => {
      const scheduleStr = c.schedule && c.schedule.length > 0
        ? c.schedule.map(s => `${s.day} (${s.time})`).join("، ")
        : "غير محدد";
      
      const gradesStr = c.grades
        ? `الواجبات: ${c.grades.assignments}/${c.grades.assignmentsMax}، الكويزات: ${c.grades.quizzes}/${c.grades.quizzesMax}، النصفي: ${c.grades.midterm}/${c.grades.midtermMax}، النهائي: ${c.grades.finalWeight}%`
        : "لم يُرصد بعد";

      const flashcardsCount = c.studyMaterial?.flashcards?.length || 0;
      const quizzesCount = c.studyMaterial?.quizzes?.length || 0;

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        instructor: c.instructor || "غير محدد",
        schedule: scheduleStr,
        grades: gradesStr,
        flashcardsCount,
        quizzesCount
      };
    });

    // 3. Comprehensive Lectures Breakdown
    const attendedCount = lectures.filter(l => l.status === "attended").length;
    const missedCount = lectures.filter(l => l.status === "missed").length;
    const scheduledCount = lectures.filter(l => l.status === "scheduled").length;
    const attendanceRate = lectures.length > 0 ? Math.round((attendedCount / lectures.length) * 100) : 100;

    const recentLectures = lectures.slice(-8).map(l => {
      const cName = courses.find(c => c.id === l.courseId)?.name || "";
      const statusAr = l.status === "attended" ? "حاضر ✅" : l.status === "missed" ? "غائب ❌" : "مجدولة ⏳";
      return `${l.title} [مقرر: ${cName}] - التاريخ: ${l.date} ${l.time || ''} - الحالة: ${statusAr}${l.notes ? ` - ملاحظات: "${l.notes.slice(0, 100)}"` : ''}`;
    });

    // 4. Comprehensive Assignments Breakdown
    const pendingAssignments = assignments.filter(a => a.status === "pending");
    const submittedAssignments = assignments.filter(a => a.status === "submitted" || a.status === "graded");
    
    const pendingList = pendingAssignments.map(a => {
      const cName = courses.find(c => c.id === a.courseId)?.name || "";
      const priorityAr = a.priority === "high" ? "عالية 🔥" : a.priority === "medium" ? "متوسطة ⚡" : "منخفضة ☕";
      const subtasksInfo = a.subtasks && a.subtasks.length > 0 
        ? ` (المهام الفرعية المنجزة: ${a.subtasks.filter(s => s.isCompleted).length}/${a.subtasks.length})` 
        : "";
      return `• ${a.title} [مقرر: ${cName}] - موعد التسليم: ${a.dueDate || 'غير محدد'} - الأولوية: ${priorityAr}${subtasksInfo}${a.description ? ` - التفاصيل: ${a.description.slice(0, 100)}` : ''}`;
    });

    // 5. Aggregated Study Materials Stats
    const totalFlashcards = courses.reduce((acc, c) => acc + (c.studyMaterial?.flashcards?.length || 0), 0);
    const totalQuizzes = courses.reduce((acc, c) => acc + (c.studyMaterial?.quizzes?.length || 0), 0);

    const context = {
      student: {
        name: studentName,
        major: studentMajor,
        university: studentUniversity
      },
      courses: coursesDetails,
      lectures: {
        total: lectures.length,
        attended: attendedCount,
        missed: missedCount,
        scheduled: scheduledCount,
        attendanceRate: `${attendanceRate}%`,
        recentList: recentLectures
      },
      assignments: {
        total: assignments.length,
        pendingCount: pendingAssignments.length,
        submittedCount: submittedAssignments.length,
        pendingList
      },
      studyBank: {
        totalFlashcards,
        totalQuizzes
      }
    };

    try {
      // Send up to the last 12 messages for clean conversation history
      const historyToSend = [...messages, userMsg].slice(-12).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: historyToSend,
          context
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.reply) {
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: getFriendlyErrorMessage(data.error),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: getFriendlyErrorMessage(e?.message) || "حدث خطأ في الاتصال بالخادم. يرجى التأكد من تشغيل الخادم واتصالك بالإنترنت.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    initDefaultWelcome();
    setShowClearConfirmModal(false);
  };

  const handleConvertToStudyMaterial = async () => {
    if (!selectedCourseIdForConversion) {
      alert("الرجاء اختيار المادة الدراسية أولاً.");
      return;
    }

    const targetCourse = courses.find(c => c.id === selectedCourseIdForConversion);
    if (!targetCourse) {
      alert("لم يتم العثور على المادة المحددة.");
      return;
    }

    // Determine the content to convert: either custom text pasted by the student, or chat summary
    let textToProcess = customConversionText.trim();
    if (!textToProcess) {
      // If student left text empty, fallback to the chat history questions
      const chatText = messages
        .filter(m => m.id !== "welcome")
        .map(m => `${m.role === "user" ? "سؤال الطالب" : "إجابة المساعد"}: ${m.content}`)
        .join("\n\n");
      textToProcess = chatText.trim();
    }

    if (!textToProcess) {
      alert("الرجاء لصق الأسئلة أو النصوص التي تريد تحويلها لبطاقات دراسية أولاً.");
      return;
    }

    setIsConverting(true);

    try {
      const response = await fetch("/api/gemini/generate-study-material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `بطاقات الطالب - ${targetCourse.name}`,
          subject: targetCourse.name,
          content: textToProcess
        }),
      });

      const data = await response.json();

      if (response.ok && data.summary && data.flashcards && data.quizzes) {
        setPreviewMaterial(data as StudyMaterial);
        setPreviewCardIndex(0);
        setPreviewCardFlipped(false);
        setPreviewSubTab("cards");
        setShowConvertToCardsModal(false);
        setShowPreviewModal(true);
      } else {
        alert(getFriendlyErrorMessage(data.error) || `عذراً، فشل تنسيق وتحويل البطاقات: ${response.statusText || "خطأ في الاتصال بالخادم"}`);
      }
    } catch (err: any) {
      console.error("Conversion error:", err);
      alert(getFriendlyErrorMessage(err?.message) || `حدث خطأ أثناء معالجة الأسئلة بالذكاء الاصطناعي: ${err?.message || "تعذر الوصول إلى الخادم"}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleSavePreviewData = (shouldNavigate: boolean) => {
    if (!previewMaterial || !selectedCourseIdForConversion) return;

    const targetCourse = courses.find(c => c.id === selectedCourseIdForConversion);
    if (!targetCourse) {
      alert("لم يتم العثور على المادة المحددة.");
      return;
    }

    const { mergedMaterial, stats } = mergeStudyMaterials(
      targetCourse.studyMaterial,
      previewMaterial,
      previewSaveMode
    );

    if (onUpdateCourse) {
      onUpdateCourse({
        ...targetCourse,
        studyMaterial: mergedMaterial,
      });
    }

    setShowPreviewModal(false);

    let statsStr = `تم حفظ ${stats.newCardsCount} بطاقة جديدة و ${stats.newQuizzesCount} سؤال اختبار.`;
    if (stats.duplicateCardsSkipped > 0 || stats.duplicateQuizzesSkipped > 0) {
      statsStr += ` (تم منع تكرار ${stats.duplicateCardsSkipped + stats.duplicateQuizzesSkipped} عنصر مسبق)`;
    }

    if (shouldNavigate && onNavigateToStudyHub) {
      onNavigateToStudyHub(targetCourse.id);
    } else {
      setConversionSuccess({
        courseName: targetCourse.name,
        courseId: targetCourse.id,
        statsInfo: statsStr,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100vh-12rem)] md:h-[650px] relative transition-colors" id="companion-tab">
      
      {/* Modal 1: Student-driven Convert Text/Questions to Study Cards Modal */}
      {showConvertToCardsModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-right animate-in fade-in zoom-in duration-150" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400 font-extrabold text-sm">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl">
                  <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span>تحويل أسئلتك وملاحظاتك إلى بطاقات وكويز 🚀</span>
              </div>
              <button
                type="button"
                onClick={() => setShowConvertToCardsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
              بدلاً من كتابة كل بطاقة يدوياً، الصق هنا الأسئلة أو المفاهيم التي حددتها بنفسك، وسيقوم الذكاء الاصطناعي بتنسيقها لك كبطاقات وكويز اختباري منظم لمعاينتها واعتمادها!
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">اختر المادة لحفظ البطاقات بها:</label>
              {courses.length === 0 ? (
                <p className="text-xs text-rose-500 font-bold">لا توجد مواد مسجلة حالياً. الرجاء إضافة مادة أولاً.</p>
              ) : (
                <select
                  value={selectedCourseIdForConversion}
                  onChange={(e) => setSelectedCourseIdForConversion(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Custom Text/Questions Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصق الأسئلة أو نصوص المراجعة هنا:
                </label>
                {messages.filter(m => m.id !== "welcome" && m.role === "assistant").length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const lastAi = [...messages].reverse().find(m => m.id !== "welcome" && m.role === "assistant");
                      if (lastAi) {
                        setCustomConversionText(prev => prev ? `${prev}\n\n${lastAi.content}` : lastAi.content);
                      }
                    }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ آخر إجابة من الشات</span>
                  </button>
                )}
              </div>
              <textarea
                rows={5}
                value={customConversionText}
                onChange={(e) => setCustomConversionText(e.target.value)}
                placeholder="مثال: الصق أسئلة الدكتور، نماذج اختبار سابقة، أو فقرات مراجعة تريد تحويلها لبطاقات وكويز بضغطة زر..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowConvertToCardsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConvertToStudyMaterial}
                disabled={isConverting || courses.length === 0}
                className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جاري التنسيق والتحويل...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    تنسيق وتحويل للبطاقات والكويز ⚡
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Preview & Confirm Generated Study Materials */}
      {showPreviewModal && previewMaterial && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] text-right my-auto animate-in fade-in zoom-in duration-150" dir="rtl">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-3 text-indigo-700 dark:text-indigo-400">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl">
                  <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">معاينة وتأكيد البطاقات قبل الحفظ 🎯</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">راجع البطاقات والكويزات المولدة واعتمدها لمقررك</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SubTab Selection */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mt-3 mb-4 gap-2">
              <button
                type="button"
                onClick={() => setPreviewSubTab("cards")}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  previewSubTab === "cards"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>بطاقات الاستذكار ({previewMaterial.flashcards?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewSubTab("quizzes")}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  previewSubTab === "quizzes"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>أسئلة الكويز ({previewMaterial.quizzes?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewSubTab("summary")}
                className={`flex items-center gap-1.5 py-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                  previewSubTab === "summary"
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>الملخص الذكي</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[320px] p-3 bg-slate-50/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 mb-4">
              {/* Tab 1: Flashcards Preview */}
              {previewSubTab === "cards" && (
                <div className="space-y-4">
                  {(!previewMaterial.flashcards || previewMaterial.flashcards.length === 0) ? (
                    <p className="text-xs text-slate-500 text-center py-8">لا توجد بطاقات مولدة.</p>
                  ) : (
                    <div>
                      {/* Interactive Flip Card Box or Edit Mode */}
                      {editingCardIndex === previewCardIndex ? (
                        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 min-h-[140px] flex flex-col gap-3 shadow-xs">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">السؤال (الجهة الأمامية)</label>
                            <textarea
                              className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              rows={2}
                              value={editCardFront}
                              onChange={(e) => setEditCardFront(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">الإجابة (الجهة الخلفية)</label>
                            <textarea
                              className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              rows={2}
                              value={editCardBack}
                              onChange={(e) => setEditCardBack(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingCardIndex(null)}
                              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button
                              onClick={() => handleSaveEditCard(previewCardIndex)}
                              className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" /> حفظ التعديل
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          {/* Top controls: Highlight / Edit / Delete */}
                          <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHighlightCard(previewCardIndex);
                              }}
                              className={`p-1 rounded transition cursor-pointer ${
                                previewMaterial.flashcards[previewCardIndex]?.isTeacherHighlighted
                                  ? "text-amber-500 hover:text-amber-600 font-bold"
                                  : "text-slate-400 hover:text-amber-500"
                              }`}
                              title="تحديد كتنويه مهم من المعلم"
                            >
                              <Star className={`w-4 h-4 ${previewMaterial.flashcards[previewCardIndex]?.isTeacherHighlighted ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCardFront(previewMaterial.flashcards![previewCardIndex].front);
                                setEditCardBack(previewMaterial.flashcards![previewCardIndex].back);
                                setEditingCardIndex(previewCardIndex);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition cursor-pointer"
                              title="تعديل البطاقة"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(previewCardIndex);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="حذف البطاقة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Flip Card Action Box */}
                          <div 
                            onClick={() => setPreviewCardFlipped(!previewCardFlipped)}
                            className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/60 hover:border-indigo-300 rounded-2xl p-6 min-h-[160px] flex flex-col items-center justify-center text-center cursor-pointer transition shadow-xs relative"
                          >
                            {previewMaterial.flashcards[previewCardIndex]?.isTeacherHighlighted && (
                              <span className="absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-md flex items-center gap-1 shadow-xs">
                                <Star className="w-2.5 h-2.5 fill-current" />
                                <span>تنويه المعلم</span>
                              </span>
                            )}

                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-2">
                              {previewCardFlipped ? "الإجابة / الشرح (انقر للقلب)" : "السؤال / المفهوم (انقر للقلب)"}
                            </span>
                            <p className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed max-w-lg">
                              {previewCardFlipped 
                                ? previewMaterial.flashcards[previewCardIndex]?.back 
                                : previewMaterial.flashcards[previewCardIndex]?.front
                              }
                            </p>
                            <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>انقر للوجه الآخر</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Pagination Controls */}
                      <div className="flex items-center justify-between mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <button
                          type="button"
                          disabled={previewCardIndex === 0}
                          onClick={() => {
                            setPreviewCardIndex(prev => Math.max(0, prev - 1));
                            setPreviewCardFlipped(false);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>السابقة</span>
                        </button>
                        
                        <span>
                          بطاقة {previewCardIndex + 1} من {previewMaterial.flashcards.length}
                        </span>

                        <button
                          type="button"
                          disabled={previewCardIndex >= previewMaterial.flashcards.length - 1}
                          onClick={() => {
                            setPreviewCardIndex(prev => Math.min(previewMaterial.flashcards!.length - 1, prev + 1));
                            setPreviewCardFlipped(false);
                          }}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                        >
                          <span>التالية</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Quizzes Preview */}
              {previewSubTab === "quizzes" && (
                <div className="space-y-3">
                  {(!previewMaterial.quizzes || previewMaterial.quizzes.length === 0) ? (
                    <p className="text-xs text-slate-500 text-center py-8">لا توجد أسئلة مولدة.</p>
                  ) : (
                    previewMaterial.quizzes.map((quiz, qIdx) => (
                      <div key={qIdx} className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-right relative group">
                        {editingQuizIndex === qIdx ? (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">السؤال</label>
                              <input
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editQuizQuestion}
                                onChange={(e) => setEditQuizQuestion(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">الخيارات (حدد الإجابة الصحيحة)</label>
                              {editQuizOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={`correct-answer-${qIdx}`}
                                    checked={editQuizAnswerIndex === oIdx}
                                    onChange={() => setEditQuizAnswerIndex(oIdx)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <input
                                    type="text"
                                    className={`flex-1 text-xs p-2 border rounded-md outline-none ${editQuizAnswerIndex === oIdx ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700' : 'border-slate-200 dark:border-slate-700 dark:bg-slate-800'}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...editQuizOptions];
                                      newOpts[oIdx] = e.target.value;
                                      setEditQuizOptions(newOpts);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingQuizIndex(null)}
                                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleSaveEditQuiz(qIdx)}
                                className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" /> حفظ التعديل
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                  {qIdx + 1}. {quiz.question}
                                </p>
                                {quiz.isTeacherHighlighted && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-500 text-white rounded-md flex items-center gap-0.5 shadow-xs shrink-0 animate-pulse">
                                    <Star className="w-2 h-2 fill-current" />
                                    <span>تنويه المعلم 🎯</span>
                                  </span>
                                )}
                              </div>
                              {/* Edit/Delete Actions */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleToggleHighlightQuiz(qIdx)}
                                  className={`p-1 rounded transition cursor-pointer ${
                                    quiz.isTeacherHighlighted
                                      ? "text-amber-500 hover:text-amber-600 font-bold"
                                      : "text-slate-400 hover:text-amber-500"
                                  }`}
                                  title="تحديد كتنويه مهم من المعلم"
                                >
                                  <Star className={`w-3.5 h-3.5 ${quiz.isTeacherHighlighted ? "fill-current" : ""}`} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditQuizQuestion(quiz.question);
                                    setEditQuizOptions([...quiz.options]);
                                    setEditQuizAnswerIndex(quiz.answerIndex);
                                    setEditingQuizIndex(qIdx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                                  title="تعديل السؤال"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuiz(qIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="حذف السؤال"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {quiz.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx}
                                  className={`p-2 rounded-lg text-[11px] border font-semibold ${
                                    oIdx === quiz.answerIndex
                                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-bold"
                                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  {opt} {oIdx === quiz.answerIndex && "✓ (صحيحة)"}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Summary Preview */}
              {previewSubTab === "summary" && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {previewMaterial.summary ? (
                    <div className="markdown-body prose prose-slate prose-sm max-w-none">
                      <Markdown>{previewMaterial.summary}</Markdown>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-6">لا يوجد ملخص متاح.</p>
                  )}
                </div>
              )}
            </div>

            {/* Merge Strategy Radio */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 mb-4 text-xs font-semibold">
              <span className="block text-slate-700 dark:text-slate-200 font-bold text-[11px]">طريقة الحفظ في المادة:</span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="previewSaveMode"
                    value="merge"
                    checked={previewSaveMode === "merge"}
                    onChange={() => setPreviewSaveMode("merge")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>دمج مع البطاقات الحالية (مع منع التكرار) 🛡️</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="radio"
                    name="previewSaveMode"
                    value="replace"
                    checked={previewSaveMode === "replace"}
                    onChange={() => setPreviewSaveMode("replace")}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span>استبدال المواد السابقة</span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                إلغاء المعاينة
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSavePreviewData(false)}
                  className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>حفظ والبقاء في الشات</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePreviewData(true)}
                  className="px-4.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>حفظ والانتقال للمذاكرة 🚀</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Clear History Confirmation */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-right animate-in fade-in zoom-in duration-150" dir="rtl">
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">مسح سجل المحادثات؟</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في مسح سجل المحادثات الحالي؟ لن تتمكن من استرجاعه.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer"
              >
                نعم، مسح السجل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Success Notification */}
      {conversionSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm">✓</span>
            <div>
              <span className="font-bold">تم حفظ البطاقات لمقرر {conversionSuccess.courseName} بنجاح! </span>
              {conversionSuccess.statsInfo && (
                <span className="text-[11px] opacity-90">{conversionSuccess.statsInfo}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToStudyHub && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToStudyHub(conversionSuccess.courseId);
                  setConversionSuccess(null);
                }}
                className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition cursor-pointer text-[10px]"
              >
                الانتقال للمذاكرة
              </button>
            )}
            <button
              type="button"
              onClick={() => setConversionSuccess(null)}
              className="p-1 hover:bg-emerald-200/50 dark:hover:bg-emerald-900 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="p-3 md:p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
        <div className="flex items-center gap-2 md:gap-2.5 overflow-hidden">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 rounded-xl relative shrink-0">
            <Bot className="w-4 h-4 md:w-5 md:h-5" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full border border-white dark:border-slate-900" />
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-slate-800 dark:text-white text-[11px] sm:text-xs md:text-base flex items-center gap-1 md:gap-1.5 truncate">
              <span className="truncate">المساعد الأكاديمي</span>
              <span className="text-[8px] md:text-[10px] font-extrabold bg-indigo-600 text-white px-1 md:px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                <Sparkles className="w-2 h-2 md:w-2.5 md:h-2.5 fill-white" /> نشط
              </span>
            </h3>
            <p className="text-[9px] md:text-xs text-slate-400 dark:text-slate-400 truncate mt-0.5">مستشارك الذكي للإجابة عن أسئلتك الأكاديمية وموادك</p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <button
            onClick={() => setShowConvertToCardsModal(true)}
            className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 rounded-xl transition text-[10px] md:text-xs font-bold cursor-pointer shadow-3xs"
            title="تحويل أسئلتك المنسوخة إلى بطاقات استذكار واختبار بضغطة زر"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">تحويل أسئلة لبطاقات 🚀</span>
            <span className="md:hidden">بطاقات 🚀</span>
          </button>

          <button 
            onClick={() => setShowClearConfirmModal(true)}
            className="p-1 md:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
            title="مسح السجل"
          >
            <Trash2 className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((m) => {
          const isAI = m.role === "assistant";
          const detectedCards = isAI ? extractFlashcardsFromText(m.content) : [];
          // Clean display text by hiding any raw json codeblock if present
          const displayContent = isAI && detectedCards.length > 0
            ? m.content.replace(/```(?:json:flashcards|json)\s*[\s\S]*?\s*```/gi, "").trim()
            : m.content;

          return (
            <div 
              key={m.id}
              className={`flex items-start gap-3 max-w-[90%] md:max-w-[85%] ${isAI ? "mr-0" : "mr-auto flex-row-reverse"}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${isAI ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400" : "bg-indigo-600 text-white"}`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className={`rounded-2xl p-4 text-xs md:text-sm leading-relaxed w-full ${
                isAI 
                  ? "bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 rounded-tr-xs border border-slate-100 dark:border-slate-700/60 shadow-3xs" 
                  : "bg-indigo-600 text-white rounded-tl-xs shadow-indigo-100 dark:shadow-none shadow-sm max-w-fit"
              }`}>
                {isAI ? (
                  <>
                    {displayContent && (
                      <div className="markdown-body prose prose-slate prose-sm max-w-none leading-relaxed dark:prose-invert">
                        <Markdown>{displayContent}</Markdown>
                      </div>
                    )}

                    {/* Interactive Flashcard Deck if cards were detected */}
                    {detectedCards.length > 0 && (
                      <ChatFlashcardDeck
                        cards={detectedCards}
                        courses={courses}
                        onSave={handleSaveDirectCards}
                        onNavigateToStudyHub={onNavigateToStudyHub}
                      />
                    )}

                    {/* Action Footer for AI message */}
                    <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 mt-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.content, m.id)}
                          className="text-[10px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition cursor-pointer"
                          title="نسخ محتوى الرد"
                        >
                          {copiedMessageId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500 font-bold">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>نسخ</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomConversionText(m.content);
                            setShowConvertToCardsModal(true);
                          }}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline flex items-center gap-1 transition cursor-pointer"
                          title="تحويل وتنسيق هذا الرد في استوديو المذاكرة"
                        >
                          <BrainCircuit className="w-3 h-3" />
                          <span>تحويل لبطاقات وكويز 🚀</span>
                        </button>
                      </div>

                      <span className="text-[9px] font-mono text-slate-400">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span className="block text-[9px] mt-1.5 font-mono text-indigo-200 text-left">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-xl shrink-0">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 rounded-2xl rounded-tr-xs p-4 border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold animate-pulse text-indigo-600 dark:text-indigo-400">يفكر المرشد ويصيغ الإجابة...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {messages.length > 0 && !isLoading && (
        <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
          <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar whitespace-nowrap scroll-smooth">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.text)}
                className="inline-flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 transition duration-150 shadow-3xs cursor-pointer"
              >
                {s.icon}
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input area (Clean without file attachments) */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex gap-2"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="اسأل المساعد الأكاديمي عن أي شيء بمقرراتك وجدولك..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4 md:w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
