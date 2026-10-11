import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Timer, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  VolumeX,
  FileText,
  AlertCircle,
  Flame,
  Trophy,
  Plus,
  Trash2,
  Edit2,
  Save,
  Music,
  ListTodo,
  Check,
  X,
  HelpCircle,
  Lightbulb,
  Star,
  FileDown,
  FileUp,
  Sparkles,
  Shuffle,
  Eye,
  LayoutGrid,
  Filter,
  CheckSquare,
  BookMarked,
  Share2
} from "lucide-react";
import { Course, StudyMaterial, MCQ, Flashcard } from "../types";
import Markdown from "react-markdown";
import PrintStudyBankModal from "./PrintStudyBankModal";
import ExportToNotionModal from "./ExportToNotionModal";
import ShareStudyBankModal from "./ShareStudyBankModal";

interface StudyHubProps {
  courses: Course[];
  onUpdateCourse: (updatedCourse: Course) => void;
  initialCourseId?: string;
}

export default function StudyHub({ courses, onUpdateCourse, initialCourseId }: StudyHubProps) {
  // Main SubTabs: Study Materials (Flashcards/Quizzes/Summary/MindMap) OR Focus Timer
  const [activeSubTab, setActiveSubTab] = useState<"materials" | "timer">("materials");

  // Materials active sub-tab: 'flashcards' | 'quizzes' | 'summary' | 'mindmap'
  const [materialsSubTab, setMaterialsSubTab] = useState<"flashcards" | "quizzes" | "summary" | "mindmap">("flashcards");

  // Selected Course
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || courses[0]?.id || "");
  const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];

  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId]);

  // =========================================================================
  // FLASHCARDS STUDIO STATE (Anki / Quizlet inspired)
  // =========================================================================
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsFilter, setCardsFilter] = useState<"all" | "starred" | "review" | "learned">("all");
  const [cardsSearch, setCardsSearch] = useState("");
  const [cardsViewMode, setCardsViewMode] = useState<"player" | "grid">("player");

  // Modals for Flashcards
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);

  // Single card form inputs
  const [newCardFront, setNewCardFront] = useState("");
  const [newCardBack, setNewCardBack] = useState("");
  const [newCardStarred, setNewCardStarred] = useState(false);

  // Bulk import input
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkSeparator, setBulkSeparator] = useState<":" | "-" | "tab" | ",">(":");

  // =========================================================================
  // PRACTICE QUIZ STATE
  // =========================================================================
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizAnsweredList, setQuizAnsweredList] = useState<{ [key: number]: { chosen: number; correct: number; isCorrect: boolean } }>({});
  const [quizFilterStarredOnly, setQuizFilterStarredOnly] = useState(false);
  const [quizWrongOnlyMode, setQuizWrongOnlyMode] = useState(false);
  const [wrongQuestionsPool, setWrongQuestionsPool] = useState<MCQ[]>([]);

  // Modals for Quiz
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  const [editingQuizIndex, setEditingQuizIndex] = useState<number | null>(null);
  const [newQuizQuestion, setNewQuizQuestion] = useState("");
  const [newQuizOptions, setNewQuizOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuizAnswerIndex, setNewQuizAnswerIndex] = useState<number>(0);
  const [newQuizStarred, setNewQuizStarred] = useState(false);

  // =========================================================================
  // SUMMARY & MIND MAP EDITING STATE
  // =========================================================================
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isSummarySaved, setIsSummarySaved] = useState(false);

  // Sync summary text on course change
  useEffect(() => {
    setSummaryText(selectedCourse?.studyMaterial?.summary || "");
  }, [selectedCourseId, selectedCourse?.studyMaterial?.summary]);

  // Mind map state
  const [newBranchTitle, setNewBranchTitle] = useState("");
  const [newSubpointText, setNewSubpointText] = useState("");
  const [selectedBranchIndex, setSelectedBranchIndex] = useState<number | null>(null);

  // Print, Notion & Share Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // =========================================================================
  // FOCUS TIMER & STUDY TOOLS STATE
  // =========================================================================
  const [timerMode, setTimerMode] = useState<"study" | "shortBreak" | "longBreak">("study");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Scratchpad
  const [scratchpad, setScratchpad] = useState(() => {
    return localStorage.getItem("study_hub_scratchpad") || "";
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("study_hub_scratchpad", scratchpad);
    }, 400);
    return () => clearTimeout(handler);
  }, [scratchpad]);

  // Tasks Checklist
  const [tasks, setTasks] = useState<{ id: string; text: string; completed: boolean }[]>(() => {
    const saved = localStorage.getItem("study_hub_tasks");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "1", text: "مراجعة بطاقات الاستذكار السريعة", completed: false },
      { id: "2", text: "حل الكويز التدريبي وقياس الاستيعاب", completed: false },
      { id: "3", text: "تدوين النقاط الصعبة في المسودة", completed: false }
    ];
  });
  const [newTaskText, setNewTaskText] = useState("");

  const saveTasks = (newTasks: typeof tasks) => {
    setTasks(newTasks);
    localStorage.setItem("study_hub_tasks", JSON.stringify(newTasks));
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const updated = [...tasks, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }];
    saveTasks(updated);
    setNewTaskText("");
  };

  const handleToggleTask = (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveTasks(updated);
  };

  // Timer Countdown Logic
  useEffect(() => {
    let minutes = 25;
    if (timerMode === "shortBreak") minutes = 5;
    else if (timerMode === "longBreak") minutes = 15;
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  }, [timerMode]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playCompletionSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timerMode]);

  const playCompletionSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playNote = (freq: number, start: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + dur);
      };
      const now = audioCtx.currentTime;
      playNote(659.25, now, 0.4);
      playNote(880.00, now + 0.25, 0.6);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // =========================================================================
  // FLASHCARDS DATA OPERATIONS
  // =========================================================================
  const allCards: Flashcard[] = selectedCourse?.studyMaterial?.flashcards || [];

  const filteredCards = allCards.filter(card => {
    if (cardsFilter === "starred" && !card.isTeacherHighlighted) return false;
    if (cardsFilter === "learned" && card.status !== "learned") return false;
    if (cardsFilter === "review" && card.status !== "review") return false;
    if (cardsSearch.trim()) {
      const q = cardsSearch.toLowerCase();
      return card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCard = filteredCards[currentCardIndex] || filteredCards[0];

  // Helper to save updated study material to course
  const updateStudyMaterial = (updatedMaterial: Partial<StudyMaterial>) => {
    if (!selectedCourse) return;
    const newMaterial: StudyMaterial = {
      ...(selectedCourse.studyMaterial || {}),
      ...updatedMaterial
    };
    onUpdateCourse({
      ...selectedCourse,
      studyMaterial: newMaterial
    });
  };

  // Toggle card highlight (star)
  const handleToggleCardStar = (indexInFiltered: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = filteredCards[indexInFiltered];
    if (!target) return;
    const updatedCards = allCards.map(c => 
      c.front === target.front && c.back === target.back 
        ? { ...c, isTeacherHighlighted: !c.isTeacherHighlighted }
        : c
    );
    updateStudyMaterial({ flashcards: updatedCards });
  };

  // Set card mastery status (Anki style)
  const handleSetCardStatus = (status: "learned" | "review") => {
    if (!activeCard) return;
    const updatedCards = allCards.map(c => 
      c.front === activeCard.front && c.back === activeCard.back 
        ? { ...c, status }
        : c
    );
    updateStudyMaterial({ flashcards: updatedCards });

    // Move to next card smoothly
    if (currentCardIndex < filteredCards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  // Save or Add Single Card
  const handleSaveSingleCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) {
      alert("الرجاء كتابة السؤال والجواب معاً.");
      return;
    }

    if (editingCardIndex !== null) {
      // Editing existing
      const updated = [...allCards];
      updated[editingCardIndex] = {
        ...updated[editingCardIndex],
        front: newCardFront.trim(),
        back: newCardBack.trim(),
        isTeacherHighlighted: newCardStarred
      };
      updateStudyMaterial({ flashcards: updated });
    } else {
      // Adding new
      const newCard: Flashcard = {
        front: newCardFront.trim(),
        back: newCardBack.trim(),
        isTeacherHighlighted: newCardStarred,
        status: "new"
      };
      updateStudyMaterial({ flashcards: [newCard, ...allCards] });
    }

    setIsAddCardModalOpen(false);
    setEditingCardIndex(null);
    setNewCardFront("");
    setNewCardBack("");
    setNewCardStarred(false);
  };

  const handleOpenEditCard = (card: Flashcard, indexInAll: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingCardIndex(indexInAll);
    setNewCardFront(card.front);
    setNewCardBack(card.back);
    setNewCardStarred(Boolean(card.isTeacherHighlighted));
    setIsAddCardModalOpen(true);
  };

  const handleDeleteCard = (card: Flashcard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه البطاقة؟")) return;
    const updated = allCards.filter(c => !(c.front === card.front && c.back === card.back));
    updateStudyMaterial({ flashcards: updated });
    if (currentCardIndex >= updated.length) {
      setCurrentCardIndex(Math.max(0, updated.length - 1));
    }
    setIsFlipped(false);
  };

  // Bulk Import Parser (Quizlet style)
  const handleProcessBulkImport = () => {
    if (!bulkImportText.trim()) {
      alert("الرجاء لصق النص أو الجدول للاستيراد.");
      return;
    }

    const lines = bulkImportText.split("\n").map(l => l.trim()).filter(Boolean);
    const parsedCards: Flashcard[] = [];

    lines.forEach(line => {
      let sep = ":";
      if (bulkSeparator === "-") sep = "-";
      else if (bulkSeparator === "tab") sep = "\t";
      else if (bulkSeparator === ",") sep = ",";

      let parts: string[] = [];
      if (bulkSeparator === "tab") {
        parts = line.split("\t");
      } else {
        parts = line.split(sep);
      }

      if (parts.length >= 2) {
        const front = parts[0].trim();
        const back = parts.slice(1).join(sep).trim();
        if (front && back) {
          parsedCards.push({
            front,
            back,
            status: "new",
            isTeacherHighlighted: false
          });
        }
      }
    });

    if (parsedCards.length === 0) {
      alert("تعذر التعرف على البطاقات. تأكد من وجود الفاصل المختار (مثل النقطتين : أو -) بين السؤال والجواب في كل سطر.");
      return;
    }

    updateStudyMaterial({ flashcards: [...parsedCards, ...allCards] });
    setBulkImportText("");
    setIsBulkImportModalOpen(false);
    alert(`تم بنجاح استيراد ${parsedCards.length} بطاقة دراسية! 🎉`);
  };

  // Load Ready Study Template
  const handleLoadTemplate = (templateType: "cs" | "definitions" | "formulas") => {
    let sampleCards: Flashcard[] = [];
    let sampleQuizzes: MCQ[] = [];

    if (templateType === "definitions") {
      sampleCards = [
        { front: "المفهوم الأساسي (المصطلح)", back: "التعريف العلمي الدقيق وشرح الأهمية بالتفصيل.", isTeacherHighlighted: true, status: "new" },
        { front: "الخاصية الأولى", back: "وصف الخاصية وتأثيرها على النتائج العملية.", isTeacherHighlighted: false, status: "new" },
        { front: "المقارنة والفرق", back: "وجه الشبه ووجه الاختلاف بين العنصر الأول والعنصر الثاني.", isTeacherHighlighted: true, status: "new" }
      ];
      sampleQuizzes = [
        {
          question: "أي من الخيارات التالية يمثل التعريف الأصح للمفهوم الأساسي؟",
          options: ["التعريف العلمي الصحيح", "تعريف غير مكتمل", "مفهوم معاكس تماماً", "تطبيق ثانوي لا يمثل الأصل"],
          answerIndex: 0,
          isTeacherHighlighted: true
        }
      ];
    } else if (templateType === "formulas") {
      sampleCards = [
        { front: "القانون الرياضي / الفيزيائي", back: "الصيغة: Y = X * 2 + C، حيث تمثل X المتغير المستقل و C الثابت.", isTeacherHighlighted: true, status: "new" },
        { front: "وحدة القياس والعوامل المؤثرة", back: "تُقاس بـ (Joule / ثانية) وتتأثر طردياً بالحرارة وعكسياً بالضغط.", isTeacherHighlighted: false, status: "new" }
      ];
      sampleQuizzes = [
        {
          question: "ما هي العلاقة بين المتغيرين في القانون أعلاه؟",
          options: ["علاقة طردية خطية", "علاقة عكسية", "لا توجد علاقة إطلاقاً", "علاقة أسية متناقصة"],
          answerIndex: 0,
          isTeacherHighlighted: true
        }
      ];
    } else {
      sampleCards = [
        { front: "ما هو الـ Time Complexity لخوارزمية البحث الثنائي Binary Search؟", back: "O(log n) لأن نطاق البحث ينقسم إلى النصف في كل خطوة مقارنة.", isTeacherHighlighted: true, status: "new" },
        { front: "ما هو مفهوم الـ Encapsulation في البرمجة كائنية التوجه OOP؟", back: "تجميع البيانات والعمليات المرتبطة بها في وحدة واحدة (Class) وإخفاء التفاصيل الداخلية باستخدام Private و Getters/Setters.", isTeacherHighlighted: true, status: "new" },
        { front: "ما الفرق بين Stack و Queue؟", back: "الـ Stack يعتمد نظام LIFO (أول داخل آخر خارج)، بينما الـ Queue يعتمد نظام FIFO (أول داخل أول خارج).", isTeacherHighlighted: false, status: "new" }
      ];
      sampleQuizzes = [
        {
          question: "أي هيكل بيانات يعتمد مبدأ FIFO (First In First Out)؟",
          options: ["Queue", "Stack", "Binary Tree", "Hash Table"],
          answerIndex: 0,
          isTeacherHighlighted: true
        }
      ];
    }

    updateStudyMaterial({
      flashcards: [...sampleCards, ...allCards],
      quizzes: [...sampleQuizzes, ...(selectedCourse?.studyMaterial?.quizzes || [])]
    });
    setIsTemplatesModalOpen(false);
    alert("تم إضافة القالب الدراسي بنجاح! يمكنك الآن تعديله وإضافة أسئلتك.");
  };

  // =========================================================================
  // PRACTICE QUIZ DATA OPERATIONS
  // =========================================================================
  const allQuizzes: MCQ[] = selectedCourse?.studyMaterial?.quizzes || [];

  const activeQuizList = quizWrongOnlyMode 
    ? wrongQuestionsPool 
    : quizFilterStarredOnly 
      ? allQuizzes.filter(q => q.isTeacherHighlighted)
      : allQuizzes;

  const currentQuiz = activeQuizList[currentQuizIndex];

  const handleAnswerQuizOption = (optionIndex: number) => {
    if (selectedAnswer !== null || !currentQuiz) return;
    setSelectedAnswer(optionIndex);
    const isCorrect = optionIndex === currentQuiz.answerIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    } else {
      // Add to wrong pool if not already there
      setWrongQuestionsPool(prev => {
        if (!prev.some(q => q.question === currentQuiz.question)) {
          return [...prev, currentQuiz];
        }
        return prev;
      });
    }

    setQuizAnsweredList(prev => ({
      ...prev,
      [currentQuizIndex]: {
        chosen: optionIndex,
        correct: currentQuiz.answerIndex,
        isCorrect
      }
    }));
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIndex < activeQuizList.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const handleResetQuiz = (wrongOnly: boolean = false) => {
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizFinished(false);
    setQuizAnsweredList({});
    setQuizWrongOnlyMode(wrongOnly);
  };

  // Single Quiz Create / Edit
  const handleSaveQuizQuestion = () => {
    if (!newQuizQuestion.trim()) {
      alert("الرجاء كتابة نص السؤال.");
      return;
    }
    const cleanOptions = newQuizOptions.map(o => o.trim());
    if (cleanOptions.some(o => !o)) {
      alert("الرجاء ملء جميع الخيارات الأربعة.");
      return;
    }

    const quizObj: MCQ = {
      question: newQuizQuestion.trim(),
      options: cleanOptions,
      answerIndex: newQuizAnswerIndex,
      isTeacherHighlighted: newQuizStarred
    };

    if (editingQuizIndex !== null) {
      const updated = [...allQuizzes];
      updated[editingQuizIndex] = quizObj;
      updateStudyMaterial({ quizzes: updated });
    } else {
      updateStudyMaterial({ quizzes: [quizObj, ...allQuizzes] });
    }

    setIsAddQuizModalOpen(false);
    setEditingQuizIndex(null);
    setNewQuizQuestion("");
    setNewQuizOptions(["", "", "", ""]);
    setNewQuizAnswerIndex(0);
    setNewQuizStarred(false);
  };

  const handleOpenEditQuiz = (quiz: MCQ, indexInAll: number) => {
    setEditingQuizIndex(indexInAll);
    setNewQuizQuestion(quiz.question);
    setNewQuizOptions([...quiz.options]);
    setNewQuizAnswerIndex(quiz.answerIndex);
    setNewQuizStarred(Boolean(quiz.isTeacherHighlighted));
    setIsAddQuizModalOpen(true);
  };

  const handleDeleteQuizQuestion = (indexInAll: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا السؤال من بنك الاختبار؟")) return;
    const updated = allQuizzes.filter((_, idx) => idx !== indexInAll);
    updateStudyMaterial({ quizzes: updated });
    if (currentQuizIndex >= updated.length) {
      setCurrentQuizIndex(Math.max(0, updated.length - 1));
    }
    setSelectedAnswer(null);
  };

  // Toggle quiz starred
  const handleToggleQuizStarred = (indexInAll: number) => {
    const updated = allQuizzes.map((q, idx) => 
      idx === indexInAll ? { ...q, isTeacherHighlighted: !q.isTeacherHighlighted } : q
    );
    updateStudyMaterial({ quizzes: updated });
  };

  // =========================================================================
  // SUMMARY DATA OPERATIONS
  // =========================================================================
  const handleSaveSummary = () => {
    updateStudyMaterial({ summary: summaryText });
    setIsEditingSummary(false);
    setIsSummarySaved(true);
    setTimeout(() => setIsSummarySaved(false), 2500);
  };

  // =========================================================================
  // MIND MAP DATA OPERATIONS
  // =========================================================================
  const mindMapData = selectedCourse?.studyMaterial?.mindMap || {
    topic: selectedCourse?.name || "خريطة المفاهيم",
    branches: [
      { title: "المفاهيم الأساسية", subpoints: ["المصطلح والتعريف", "القوانين والنظريات"] },
      { title: "التطبيقات العملية", subpoints: ["أمثلة محلولة", "أخطاء شائعة"] }
    ]
  };

  const handleAddMindMapBranch = () => {
    if (!newBranchTitle.trim()) return;
    const updatedBranches = [
      ...mindMapData.branches,
      { title: newBranchTitle.trim(), subpoints: [] }
    ];
    updateStudyMaterial({
      mindMap: { ...mindMapData, branches: updatedBranches }
    });
    setNewBranchTitle("");
  };

  const handleAddSubpoint = (branchIndex: number) => {
    if (!newSubpointText.trim()) return;
    const updatedBranches = [...mindMapData.branches];
    updatedBranches[branchIndex].subpoints.push(newSubpointText.trim());
    updateStudyMaterial({
      mindMap: { ...mindMapData, branches: updatedBranches }
    });
    setNewSubpointText("");
    setSelectedBranchIndex(null);
  };

  const handleDeleteBranch = (branchIndex: number) => {
    const updatedBranches = mindMapData.branches.filter((_, idx) => idx !== branchIndex);
    updateStudyMaterial({
      mindMap: { ...mindMapData, branches: updatedBranches }
    });
  };

  const handleDeleteSubpoint = (branchIndex: number, subIndex: number) => {
    const updatedBranches = [...mindMapData.branches];
    updatedBranches[branchIndex].subpoints = updatedBranches[branchIndex].subpoints.filter((_, idx) => idx !== subIndex);
    updateStudyMaterial({
      mindMap: { ...mindMapData, branches: updatedBranches }
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      
      {/* Top Header & Mode Selector Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">
              ساحة المذاكرة وبطاقات الاستذكار
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              أنشئ بطاقاتك، تدرب بالاختبار الذاتي، ونظم ملخصاتك لكل مادة دراسية بسرعة وسلاسة.
            </p>
          </div>
        </div>

        {/* Global SubTab Switcher (Materials vs Focus Timer) */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab("materials")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "materials"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>أدوات المذاكرة والبطاقات</span>
            </button>

            <button
              onClick={() => setActiveSubTab("timer")}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                activeSubTab === "timer"
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-200 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Timer className="w-4 h-4 text-amber-500" />
              <span>مؤقت التركيز (بومودورو)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: STUDY MATERIALS & FLASHCARDS STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === "materials" && (
        <div className="space-y-6">
          
          {/* Course Selection & Export Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                المقرر الدراسي:
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setCurrentCardIndex(0);
                  setIsFlipped(false);
                  setCurrentQuizIndex(0);
                  setSelectedAnswer(null);
                  setQuizScore(0);
                  setQuizFinished(false);
                }}
                className="flex-1 md:w-64 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Export Tools */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
              {selectedCourse && (
                <>
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200/60 dark:border-purple-800/60 rounded-xl transition text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-102"
                    title="مشاركة حزمة المذاكرة الشاملة (الملخص، البطاقات، الكويز، وخريطة المفاهيم)"
                  >
                    <Share2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>مشاركة حزمة المذاكرة 🚀</span>
                  </button>

                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800/60 rounded-xl transition text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="تحميل بنك الأسئلة والمراجعة بصيغة PDF"
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>تحميل بنك الأسئلة PDF 📥</span>
                  </button>

                  <button
                    onClick={() => setIsNotionModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl transition text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                    title="تصدير ومزامنة مع Notion"
                  >
                    <span className="w-3.5 h-3.5 bg-white text-black rounded-xs flex items-center justify-center text-[9px] font-black">N</span>
                    <span>تصدير إلى Notion</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 4 Study Pillars Sub-Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1">
            <button
              onClick={() => setMaterialsSubTab("flashcards")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                materialsSubTab === "flashcards"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>بطاقات الاستذكار ({allCards.length})</span>
            </button>

            <button
              onClick={() => setMaterialsSubTab("quizzes")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                materialsSubTab === "quizzes"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>الاختبار الذاتي الكويز ({allQuizzes.length})</span>
            </button>

            <button
              onClick={() => setMaterialsSubTab("summary")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                materialsSubTab === "summary"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>ملخص المراجعة الشامل</span>
            </button>

            <button
              onClick={() => setMaterialsSubTab("mindmap")}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                materialsSubTab === "mindmap"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <BookMarked className="w-4 h-4" />
              <span>خريطة المفاهيم البصرية</span>
            </button>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: FLASHCARDS STUDIO (Anki & Quizlet style) */}
          {/* ================================================================= */}
          {materialsSubTab === "flashcards" && (
            <div className="space-y-5">
              
              {/* Flashcards Top Action Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                
                {/* Creation Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setEditingCardIndex(null);
                      setNewCardFront("");
                      setNewCardBack("");
                      setNewCardStarred(false);
                      setIsAddCardModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة بطاقة جديدة</span>
                  </button>

                  <button
                    onClick={() => setIsBulkImportModalOpen(true)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="استيراد سريع بالنص والجداول المنسوخة"
                  >
                    <FileUp className="w-3.5 h-3.5 text-indigo-500" />
                    <span>استيراد سريع (نص / جدول)</span>
                  </button>

                  <button
                    onClick={() => setIsTemplatesModalOpen(true)}
                    className="px-3 py-2 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>قوالب جاهزة</span>
                  </button>
                </div>

                {/* View Switcher & Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setCardsViewMode("player")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        cardsViewMode === "player" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs" : "text-slate-500"
                      }`}
                      title="عرض بطاقة ببطاقة"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden md:inline">عرض تفاعلي</span>
                    </button>
                    <button
                      onClick={() => setCardsViewMode("grid")}
                      className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        cardsViewMode === "grid" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs" : "text-slate-500"
                      }`}
                      title="عرض شبكة البطاقات"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden md:inline">كل البطاقات</span>
                    </button>
                  </div>

                  {/* Filter Pills */}
                  <select
                    value={cardsFilter}
                    onChange={(e) => {
                      setCardsFilter(e.target.value as any);
                      setCurrentCardIndex(0);
                    }}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="all">كل البطاقات ({allCards.length})</option>
                    <option value="starred">المميزة للاختبار ⭐ ({allCards.filter(c => c.isTeacherHighlighted).length})</option>
                    <option value="learned">أتقنتها ✅ ({allCards.filter(c => c.status === "learned").length})</option>
                    <option value="review">بحاجة مراجعة 🔄 ({allCards.filter(c => c.status === "review").length})</option>
                  </select>
                </div>
              </div>

              {/* No Cards Empty State */}
              {allCards.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">لا توجد بطاقات استذكار في هذه المادة بعد</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      ابدأ بإنشاء أول بطاقة بيدك لتثبيت معلومات المحاضرة، أو استخدم الاستيراد السريع أو أحد القوالب الجاهزة!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingCardIndex(null);
                        setNewCardFront("");
                        setNewCardBack("");
                        setNewCardStarred(false);
                        setIsAddCardModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة بطاقة يدوياً
                    </button>
                    <button
                      onClick={() => handleLoadTemplate("definitions")}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      تحميل قالب نموذجي
                    </button>
                  </div>
                </div>
              ) : filteredCards.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                  لا توجد بطاقات تطابق التصفية الحالية.
                </div>
              ) : cardsViewMode === "player" ? (
                /* FLASHCARD 3D FLIP PLAYER (Anki Style) */
                <div className="max-w-2xl mx-auto space-y-4">
                  
                  {/* Progress Header */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
                    <span>البطاقة {currentCardIndex + 1} من {filteredCards.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md font-bold">
                        {activeCard.status === "learned" ? "✅ متقنة" : activeCard.status === "review" ? "🔄 قيد المراجعة" : "🆕 جديدة"}
                      </span>
                    </div>
                  </div>

                  {/* The Interactive Flippable Card */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className={`min-h-[260px] sm:min-h-[300px] rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between relative shadow-md select-none group ${
                      isFlipped 
                        ? "bg-indigo-950 text-white border-indigo-700 shadow-indigo-950/20" 
                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    {/* Top Tag & Card Actions */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        isFlipped 
                          ? "bg-indigo-800 text-indigo-200" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {isFlipped ? "💡 الجواب / الشرح" : "❓ السؤال / المصطلح"}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleCardStar(currentCardIndex, e)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            activeCard.isTeacherHighlighted 
                              ? "text-amber-400 bg-amber-500/10" 
                              : "text-slate-400 hover:text-amber-400 hover:bg-black/5"
                          }`}
                          title="تحديد كتنويه مهم للاختبار"
                        >
                          <Star className={`w-4 h-4 ${activeCard.isTeacherHighlighted ? "fill-amber-400" : ""}`} />
                        </button>

                        <button
                          onClick={(e) => {
                            const indexInAll = allCards.findIndex(c => c.front === activeCard.front && c.back === activeCard.back);
                            handleOpenEditCard(activeCard, indexInAll, e);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-black/5 transition cursor-pointer"
                          title="تعديل البطاقة"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleDeleteCard(activeCard, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                          title="حذف البطاقة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Content Center */}
                    <div className="py-6 text-center">
                      <p className={`text-base sm:text-lg md:text-xl font-black leading-relaxed ${
                        isFlipped ? "text-indigo-100" : "text-slate-800 dark:text-white"
                      }`}>
                        {isFlipped ? activeCard.back : activeCard.front}
                      </p>
                    </div>

                    {/* Bottom Hint */}
                    <div className="text-center">
                      <span className={`text-[10px] font-bold transition-opacity ${
                        isFlipped ? "text-indigo-300/70" : "text-slate-400 dark:text-slate-500 group-hover:opacity-100"
                      }`}>
                        {isFlipped ? "اضغط لإخفاء الجواب والعودة للسؤال" : "اضغط على البطاقة لإظهار الجواب 🔄"}
                      </span>
                    </div>
                  </div>

                  {/* Anki Spaced Repetition Feedback Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleSetCardStatus("review")}
                      className="py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>أحتاج مراجعتها مجدداً</span>
                    </button>

                    <button
                      onClick={() => handleSetCardStatus("learned")}
                      className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>أتقنت هذه المعلومة ✅</span>
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        if (currentCardIndex > 0) {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => prev - 1);
                        }
                      }}
                      disabled={currentCardIndex === 0}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابقة
                    </button>

                    <button
                      onClick={() => {
                        // Shuffle cards
                        const shuffled = [...allCards].sort(() => Math.random() - 0.5);
                        updateStudyMaterial({ flashcards: shuffled });
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                      title="خلط ترتيب البطاقات عشوائياً"
                    >
                      <Shuffle className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (currentCardIndex < filteredCards.length - 1) {
                          setIsFlipped(false);
                          setCurrentCardIndex(prev => prev + 1);
                        }
                      }}
                      disabled={currentCardIndex === filteredCards.length - 1}
                      className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      التالية
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* GRID VIEW OF ALL FLASHCARDS */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCards.map((card, idx) => {
                    const indexInAll = allCards.findIndex(c => c.front === card.front && c.back === card.back);
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                              بطاقة #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleToggleCardStar(idx)}
                                className={`p-1 rounded-md transition cursor-pointer ${
                                  card.isTeacherHighlighted ? "text-amber-400" : "text-slate-300 hover:text-amber-400"
                                }`}
                              >
                                <Star className={`w-3.5 h-3.5 ${card.isTeacherHighlighted ? "fill-amber-400" : ""}`} />
                              </button>
                              <button
                                onClick={() => handleOpenEditCard(card, indexInAll)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                            {card.front}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2">
                            {card.back}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1">
                          <span>الحالة: {card.status === "learned" ? "✅ متقنة" : card.status === "review" ? "🔄 مراجعة" : "🆕 جديدة"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: PRACTICE QUIZ SIMULATOR */}
          {/* ================================================================= */}
          {materialsSubTab === "quizzes" && (
            <div className="space-y-5">
              
              {/* Quiz Top Action Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setEditingQuizIndex(null);
                      setNewQuizQuestion("");
                      setNewQuizOptions(["", "", "", ""]);
                      setNewQuizAnswerIndex(0);
                      setNewQuizStarred(false);
                      setIsAddQuizModalOpen(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة سؤال كويز جديد</span>
                  </button>

                  <button
                    onClick={() => handleResetQuiz(false)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بدء من جديد</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quizFilterStarredOnly}
                      onChange={(e) => {
                        setQuizFilterStarredOnly(e.target.checked);
                        handleResetQuiz(false);
                      }}
                      className="rounded-md text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>الأسئلة المميزة للاختبار فقط ⭐</span>
                  </label>
                </div>
              </div>

              {/* No Quizzes Empty State */}
              {allQuizzes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 dark:text-white">بنك أسئلة الكويز خالي حالياً</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                      أضف أسئلة اختيار من متعدد مع خياراتها الأربعة للتدرب عليها واختبار نفسك قبل الاختبار الفعلي!
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingQuizIndex(null);
                      setNewQuizQuestion("");
                      setNewQuizOptions(["", "", "", ""]);
                      setNewQuizAnswerIndex(0);
                      setNewQuizStarred(false);
                      setIsAddQuizModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة أول سؤال في الكويز
                  </button>
                </div>
              ) : activeQuizList.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
                  لا توجد أسئلة مميزة حالياً.
                </div>
              ) : quizFinished ? (
                /* QUIZ RESULT SCREEN */
                <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-6 shadow-sm">
                  <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                    <Trophy className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                      أحسنت! اكتمل الاختبار التجريبي 🎉
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                      نتيجتك: {quizScore} من {activeQuizList.length} (
                      {Math.round((quizScore / activeQuizList.length) * 100)}%)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleResetQuiz(false)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      إعادة الاختبار كاملاً
                    </button>

                    {wrongQuestionsPool.length > 0 && (
                      <button
                        onClick={() => handleResetQuiz(true)}
                        className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <span>إعادة اختبار الأسئلة الخاطئة فقط ({wrongQuestionsPool.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ACTIVE QUIZ QUESTION CARD */
                <div className="max-w-2xl mx-auto space-y-5">
                  
                  {/* Progress & Counter */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-2">
                    <span>السؤال {currentQuizIndex + 1} من {activeQuizList.length}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">الدرجة الحالية: {quizScore}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
                    
                    {/* Header with Star and Edit */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase">
                        سؤال اختيار من متعدد
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const idx = allQuizzes.findIndex(q => q.question === currentQuiz.question);
                            handleToggleQuizStarred(idx);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            currentQuiz.isTeacherHighlighted ? "text-amber-400 bg-amber-500/10" : "text-slate-300 hover:text-amber-400"
                          }`}
                          title="تنويه مهم للاختبار"
                        >
                          <Star className={`w-4 h-4 ${currentQuiz.isTeacherHighlighted ? "fill-amber-400" : ""}`} />
                        </button>

                        <button
                          onClick={() => {
                            const idx = allQuizzes.findIndex(q => q.question === currentQuiz.question);
                            handleOpenEditQuiz(currentQuiz, idx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                          title="تعديل السؤال"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            const idx = allQuizzes.findIndex(q => q.question === currentQuiz.question);
                            handleDeleteQuizQuestion(idx);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="حذف السؤال"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Text */}
                    <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-relaxed">
                      {currentQuiz.question}
                    </h3>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {currentQuiz.options.map((option, oIdx) => {
                        const isChosen = selectedAnswer === oIdx;
                        const isCorrect = oIdx === currentQuiz.answerIndex;
                        const hasAnswered = selectedAnswer !== null;

                        let btnClass = "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800";
                        if (hasAnswered) {
                          if (isCorrect) {
                            btnClass = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-extrabold";
                          } else if (isChosen && !isCorrect) {
                            btnClass = "bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-200 font-extrabold";
                          } else {
                            btnClass = "opacity-50 border-slate-200 dark:border-slate-800";
                          }
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={hasAnswered}
                            onClick={() => handleAnswerQuizOption(oIdx)}
                            className={`w-full p-4 rounded-2xl border text-right text-xs sm:text-sm font-bold transition flex items-center justify-between cursor-pointer ${btnClass}`}
                          >
                            <span>{option}</span>
                            {hasAnswered && isCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {hasAnswered && isChosen && !isCorrect && (
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Next Action Button */}
                    {selectedAnswer !== null && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={handleNextQuizQuestion}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <span>{currentQuizIndex < activeQuizList.length - 1 ? "السؤال التالي" : "عرض النتيجة النهائية"}</span>
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: STUDY SUMMARY & NOTES */}
          {/* ================================================================= */}
          {materialsSubTab === "summary" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    ملخص مادة {selectedCourse?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    اكتب وراجع النقاط والمفاهيم الجوهرية قبل الاختبارات.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isSummarySaved && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4" /> تم الحفظ
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (isEditingSummary) {
                        handleSaveSummary();
                      } else {
                        setIsEditingSummary(true);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isEditingSummary
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                    }`}
                  >
                    {isEditingSummary ? (
                      <>
                        <Save className="w-4 h-4" />
                        حفظ التعديلات
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-4 h-4" />
                        تعديل الملخص
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isEditingSummary ? (
                <div className="space-y-3">
                  <textarea
                    rows={14}
                    value={summaryText}
                    onChange={(e) => setSummaryText(e.target.value)}
                    placeholder="اكتب ملخص الدرس هنا بالتنسيق الذي يناسبك (يدعم عناوين، نقاط وقوانين)..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 leading-relaxed resize-y font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingSummary(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveSummary}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      حفظ الملخص الآن
                    </button>
                  </div>
                </div>
              ) : summaryText.trim() ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-right leading-relaxed p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Markdown>{summaryText}</Markdown>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                  <p>لا يوجد ملخص مكتوب لهذه المادة بعد.</p>
                  <button
                    onClick={() => setIsEditingSummary(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + كتابة ملخص جديد
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: MIND MAP BUILDER & VISUALIZER */}
          {/* ================================================================= */}
          {materialsSubTab === "mindmap" && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                    خريطة مفاهيم مادة {selectedCourse?.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    قسّم المادة إلى فروع وعناصر فرعية يسهل ربطها وحفظها بصرياً.
                  </p>
                </div>

                {/* Add Branch Form */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newBranchTitle}
                    onChange={(e) => setNewBranchTitle(e.target.value)}
                    placeholder="اسم فرع رئيسي جديد..."
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex-1 sm:w-48"
                  />
                  <button
                    onClick={handleAddMindMapBranch}
                    disabled={!newBranchTitle.trim()}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    + إضافة فرع
                  </button>
                </div>
              </div>

              {/* Mind Map Tree Display */}
              <div className="space-y-4">
                
                {/* Central Root Node */}
                <div className="p-4 bg-indigo-600 text-white rounded-2xl text-center shadow-md font-black text-sm max-w-sm mx-auto">
                  🌟 {mindMapData.topic}
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {mindMapData.branches.map((branch, bIdx) => (
                    <div
                      key={bIdx}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <h4 className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                          📌 {branch.title}
                        </h4>
                        <button
                          onClick={() => handleDeleteBranch(bIdx)}
                          className="text-slate-300 hover:text-rose-500 transition cursor-pointer p-1"
                          title="حذف الفرع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subpoints */}
                      <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        {branch.subpoints.map((sub, sIdx) => (
                          <li key={sIdx} className="flex items-center justify-between p-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            <span>• {sub}</span>
                            <button
                              onClick={() => handleDeleteSubpoint(bIdx, sIdx)}
                              className="text-slate-300 hover:text-rose-500 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>

                      {/* Add Subpoint Form */}
                      {selectedBranchIndex === bIdx ? (
                        <div className="flex gap-1.5 pt-1">
                          <input
                            type="text"
                            value={newSubpointText}
                            onChange={(e) => setNewSubpointText(e.target.value)}
                            placeholder="نقطة فرعية..."
                            className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] flex-1 font-bold"
                          />
                          <button
                            onClick={() => handleAddSubpoint(bIdx)}
                            className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                          >
                            إضافة
                          </button>
                          <button
                            onClick={() => setSelectedBranchIndex(null)}
                            className="px-1.5 py-1 bg-slate-200 text-slate-600 rounded-lg text-[11px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedBranchIndex(bIdx)}
                          className="w-full py-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition cursor-pointer text-center"
                        >
                          + إضافة عنصر فرعي
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: POMODORO FOCUS TIMER & TOOLS */}
      {/* ========================================================================= */}
      {activeSubTab === "timer" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left / Main Column: The Timer Card */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs space-y-6 text-center">
            
            {/* Mode Switcher */}
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setTimerMode("study")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  timerMode === "study" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                جلسة تركيز (25 دقيقة)
              </button>
              <button
                onClick={() => setTimerMode("shortBreak")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  timerMode === "shortBreak" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                استراحة قصيرة (5 دقائق)
              </button>
              <button
                onClick={() => setTimerMode("longBreak")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  timerMode === "longBreak" ? "bg-sky-600 text-white shadow-xs" : "text-slate-600 dark:text-slate-400"
                }`}
              >
                استراحة طويلة (15 دقيقة)
              </button>
            </div>

            {/* Huge Digital Clock Display */}
            <div className="py-8">
              <span className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-slate-800 dark:text-white">
                {formatTime(timeLeft)}
              </span>
              <p className="text-xs text-slate-400 font-bold mt-2">
                {isRunning ? "⚡ الجلسة جارية حالياً، حافظ على تركيزك!" : "اضغط بدء للانطلاق 🚀"}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-3.5 rounded-2xl text-sm font-black transition flex items-center gap-2 cursor-pointer shadow-md ${
                  isRunning
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    إيقاف مؤقت
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    بدء المؤقت
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsRunning(false);
                  let mins = 25;
                  if (timerMode === "shortBreak") mins = 5;
                  else if (timerMode === "longBreak") mins = 15;
                  setTimeLeft(mins * 60);
                }}
                className="p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
                title="إعادة ضبط"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  soundEnabled 
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600" 
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-400"
                }`}
                title={soundEnabled ? "الصوت مفعل" : "الصوت مكتوم"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>

          </div>

          {/* Right Column: Scratchpad & Tasks Checklist */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Quick Tasks Checklist */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3.5">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-indigo-600" />
                مهام جلسة المذاكرة السريعة
              </h3>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  placeholder="مهمة سريعة..."
                  className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 flex-1"
                />
                <button
                  onClick={handleAddTask}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  +
                </button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                {tasks.map(t => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700"
                  >
                    <button
                      onClick={() => handleToggleTask(t.id)}
                      className="flex items-center gap-2 flex-1 text-right cursor-pointer"
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        t.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
                      }`}>
                        {t.completed && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <span className={`text-xs font-bold ${t.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}`}>
                        {t.text}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto-Saved Scratchpad */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  مسودة وقوانين سريعة 📝
                </h3>
                <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-bold animate-pulse">
                  حفظ تلقائي
                </span>
              </div>

              <textarea
                rows={6}
                value={scratchpad}
                onChange={(e) => setScratchpad(e.target.value)}
                placeholder="اكتب ملاحظاتك وقوانين الدرس أثناء الجلسة..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 resize-none leading-relaxed"
              />
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SINGLE FLASHCARD */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddCardModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  {editingCardIndex !== null ? "تعديل بطاقة الاستذكار" : "إضافة بطاقة استذكار جديدة"}
                </h3>
                <button
                  onClick={() => setIsAddCardModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    الوجه الأمامي للبطاقة (السؤال / المصطلح):
                  </label>
                  <input
                    type="text"
                    value={newCardFront}
                    onChange={(e) => setNewCardFront(e.target.value)}
                    placeholder="مثال: ما هو تعريف الـ Virtual DOM؟"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    الوجه الخلفي للبطاقة (الإجابة / الشرح):
                  </label>
                  <textarea
                    rows={4}
                    value={newCardBack}
                    onChange={(e) => setNewCardBack(e.target.value)}
                    placeholder="اكتب الإجابة النموذجية أو التعريف بالتفصيل..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 leading-relaxed resize-none"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newCardStarred}
                    onChange={(e) => setNewCardStarred(e.target.checked)}
                    className="rounded-md text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>تمييز كتنويه مهم للاختبار ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsAddCardModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveSingleCard}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingCardIndex !== null ? "حفظ التعديل" : "إضافة البطاقة"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: BULK QUICK IMPORT (Quizlet Style) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isBulkImportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-xl w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    الاستيراد السريع للبطاقات
                  </h3>
                </div>
                <button
                  onClick={() => setIsBulkImportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                الصق جدولاً من Excel أو أسطراً من Word / Notion، وسيقوم التطبيق بتحويل كل سطر إلى بطاقة فوراً!
              </p>

              {/* Separator selector */}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>الفاصل بين السؤال والجواب:</span>
                <select
                  value={bulkSeparator}
                  onChange={(e) => setBulkSeparator(e.target.value as any)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value=":">نقطتان رأسيتان ( : )</option>
                  <option value="-">شرطة ( - )</option>
                  <option value="tab">مسافة جدول Tab (Excel)</option>
                  <option value=",">فاصلة ( , )</option>
                </select>
              </div>

              <textarea
                rows={8}
                value={bulkImportText}
                onChange={(e) => setBulkImportText(e.target.value)}
                placeholder={"مثال:\nReact : مكتبة واجهات مستخدم من فيسبوك\nState : حالة داخلية للمكون تتغير مع تفاعل المستخدم\nVirtual DOM : تمثيل خفيف لشجرة العناصر في الذاكرة"}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 leading-relaxed"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsBulkImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleProcessBulkImport}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  تحويل واستيراد البطاقات الآن ⚡
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: STUDY TEMPLATES PICKER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isTemplatesModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">
                    مكتبة القوالب الدراسية النموذجية
                  </h3>
                </div>
                <button
                  onClick={() => setIsTemplatesModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                اختر قالباً جاهزاً لإضافته لمادتك، وسيقوم بإنشاء مجموعة بطاقات وأسئلة يمكنك التعديل عليها بحرية:
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => handleLoadTemplate("definitions")}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition cursor-pointer"
                >
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">📖 قالب المصطلحات والتعاريف العلمية</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مناسب للمواد النظرية، العلوم، واللغات.</p>
                </button>

                <button
                  onClick={() => handleLoadTemplate("formulas")}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition cursor-pointer"
                >
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">📐 قالب القوانين والمعادلات الرياضية</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مناسب للرياضيات، الفيزياء، والهندسة.</p>
                </button>

                <button
                  onClick={() => handleLoadTemplate("cs")}
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-right transition cursor-pointer"
                >
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">💻 قالب البرمجة وهياكل البيانات</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">مناسب لعلوم الحاسب، الويب، والخوارزميات.</p>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsTemplatesModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 4: ADD / EDIT QUIZ QUESTION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddQuizModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  {editingQuizIndex !== null ? "تعديل سؤال الكويز" : "إضافة سؤال اختيار من متعدد"}
                </h3>
                <button
                  onClick={() => setIsAddQuizModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    نص السؤال:
                  </label>
                  <textarea
                    rows={2}
                    value={newQuizQuestion}
                    onChange={(e) => setNewQuizQuestion(e.target.value)}
                    placeholder="مثال: أي من الـ Hooks التالية يُستخدم لتخزين حالة متغيرة؟"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-2">
                    الخيارات الأربعة (حدد الدائرة بجانب الخيار الصحيح):
                  </label>
                  <div className="space-y-2">
                    {newQuizOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={newQuizAnswerIndex === idx}
                          onChange={() => setNewQuizAnswerIndex(idx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          title="تحديد كإجابة صحيحة"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...newQuizOptions];
                            updated[idx] = e.target.value;
                            setNewQuizOptions(updated);
                          }}
                          placeholder={`الخيار ${idx + 1}`}
                          className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold ${
                            newQuizAnswerIndex === idx 
                              ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30" 
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newQuizStarred}
                    onChange={(e) => setNewQuizStarred(e.target.checked)}
                    className="rounded-md text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>تمييز كتنويه أستاذ مهم للاختبار ⭐</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setIsAddQuizModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveQuizQuestion}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  {editingQuizIndex !== null ? "حفظ التعديل" : "إضافة السؤال"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Study Bank Modal */}
      {selectedCourse && (
        <PrintStudyBankModal
          course={selectedCourse}
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {/* Export to Notion Modal */}
      {selectedCourse && (
        <ExportToNotionModal
          course={selectedCourse}
          isOpen={isNotionModalOpen}
          onClose={() => setIsNotionModalOpen(false)}
        />
      )}

      {/* Share Study Bank Modal */}
      {selectedCourse && (
        <ShareStudyBankModal
          course={selectedCourse}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onImportFromFile={(imported) => {
            updateStudyMaterial(imported);
          }}
        />
      )}

    </div>
  );
}
