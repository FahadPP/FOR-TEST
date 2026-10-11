import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Calendar, 
  Trash2, 
  Edit3, 
  X, 
  CheckSquare, 
  Clock, 
  AlertCircle,
  AlertTriangle,
  Award,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
  FileText,
  Check,
  MessagesSquare,
  FolderGit2,
  Bookmark,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Course, Assignment, AssignmentPriority, AssignmentStatus, AssignmentType, Subtask } from "../types";

interface AssignmentsProps {
  assignments: Assignment[];
  courses: Course[];
  onAddAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  initialAssignmentId?: string;
  onClearInitialAssignmentId?: () => void;
}

export const getTaskTypeConfig = (type?: AssignmentType) => {
  switch (type) {
    case "discussion":
      return {
        label: "مناقشة",
        fullLabel: "مناقشة أسبوعية / تفاعلية",
        badgeStyle: "bg-purple-50 text-purple-700 border-purple-200",
        chipActive: "bg-purple-600 text-white border-purple-600 shadow-sm",
        icon: MessagesSquare,
        colorClass: "text-purple-600",
        bgClass: "bg-purple-500",
        placeholderTitle: "مثال: مناقشة الأسبوع 2: أثر الذكاء الاصطناعي في التعليم...",
        placeholderDesc: "انسخ سؤال المناقشة وشروط المشاركة (مثلاً: طرح رد أساسي من 150 كلمة والرد على طالبين)..."
      };
    case "project":
      return {
        label: "مشروع",
        fullLabel: "مشروع أو تسليم رئيسي",
        badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
        chipActive: "bg-amber-600 text-white border-amber-600 shadow-sm",
        icon: FolderGit2,
        colorClass: "text-amber-600",
        bgClass: "bg-amber-500",
        placeholderTitle: "مثال: تسليم النموذج الأولي لمشروع التخرج...",
        placeholderDesc: "متطلبات المشروع، المعايير المطلوب تسليمها، روابط المستودع أو الملفات..."
      };
    case "quiz":
      return {
        label: "اختبار قصير",
        fullLabel: "اختبار قصير (Quiz)",
        badgeStyle: "bg-rose-50 text-rose-700 border-rose-200",
        chipActive: "bg-rose-600 text-white border-rose-600 shadow-sm",
        icon: HelpCircle,
        colorClass: "text-rose-600",
        bgClass: "bg-rose-500",
        placeholderTitle: "مثال: كويز شابتر 3 في مادة الخوارزميات...",
        placeholderDesc: "مواضيع الاختبار القصير، عدد الأسئلة، والوقت المتاح..."
      };
    case "other":
      return {
        label: "مهمة أخرى",
        fullLabel: "مهمة دراسية إضافية",
        badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
        chipActive: "bg-slate-700 text-white border-slate-700 shadow-sm",
        icon: Bookmark,
        colorClass: "text-slate-600",
        bgClass: "bg-slate-500",
        placeholderTitle: "مثال: قراءة المقال العلمي المحدد قبل المحاضرة...",
        placeholderDesc: "تفاصيل المهمة المطلوب إنجازها..."
      };
    case "assignment":
    default:
      return {
        label: "واجب دراسي",
        fullLabel: "واجب دراسي",
        badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
        chipActive: "bg-indigo-600 text-white border-indigo-600 shadow-sm",
        icon: FileText,
        colorClass: "text-indigo-600",
        bgClass: "bg-indigo-500",
        placeholderTitle: "مثال: واجب هياكل البيانات 1، تقرير المعمل 2...",
        placeholderDesc: "انسخ متطلبات الواجب هنا، مثل مسائل الكتاب أو الأسئلة التي طرحها المحاضر..."
      };
  }
};

export default function Assignments({ 
  assignments, 
  courses, 
  onAddAssignment, 
  onDeleteAssignment,
  initialAssignmentId,
  onClearInitialAssignmentId
}: AssignmentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignToDeleteId, setAssignToDeleteId] = useState<string | null>(null);

  // Automatically expand and open details for initialAssignmentId if passed
  useEffect(() => {
    if (initialAssignmentId) {
      const found = assignments.find(a => a.id === initialAssignmentId);
      if (found) {
        setExpandedAssignments(prev => ({ ...prev, [found.id]: true }));
        setEditingAssignment(found);
        setCourseId(found.courseId);
        setType(found.type || "assignment");
        setTitle(found.title);
        setDescription(found.description || "");
        setDueDate(found.dueDate || "");
        setPriority(found.priority);
        setStatus(found.status);
        setGrade(found.grade || "");
        setSubtasks(found.subtasks || []);
        setIsModalOpen(true);

        setTimeout(() => {
          const el = document.getElementById(`assignment-card-${found.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 150);
      }
    }
  }, [initialAssignmentId, assignments]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState("all");

  // Form states
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState<AssignmentType>("assignment");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<AssignmentPriority>("medium");
  const [status, setStatus] = useState<AssignmentStatus>("pending");
  const [grade, setGrade] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // UI state
  const [expandedAssignments, setExpandedAssignments] = useState<Record<string, boolean>>({});

  const handleOpenAdd = (defaultType?: AssignmentType) => {
    setEditingAssignment(null);
    setCourseId(courses[0]?.id || "");
    setType(defaultType || "assignment");
    setTitle("");
    setDescription("");
    setDueDate(new Date().toISOString().split("T")[0]);
    setPriority("medium");
    setStatus("pending");
    setGrade("");
    setSubtasks([]);
    setNewSubtaskTitle("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (assign: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAssignment(assign);
    setCourseId(assign.courseId);
    setType(assign.type || "assignment");
    setTitle(assign.title);
    setDescription(assign.description);
    setDueDate(assign.dueDate);
    setPriority(assign.priority);
    setStatus(assign.status);
    setGrade(assign.grade || "");
    setSubtasks(assign.subtasks || []);
    setNewSubtaskTitle("");
    setIsModalOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedAssignments(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleStatus = (assign: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: AssignmentStatus = assign.status === "pending" ? "submitted" : "pending";
    const updated: Assignment = {
      ...assign,
      status: nextStatus
    };
    onAddAssignment(updated);
  };

  const handleToggleSubtask = (assign: Assignment, subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSubtasks = (assign.subtasks || []).map(st => 
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );
    
    // Automatically update assignment status if all subtasks are completed?
    // Let's keep it simple: just update subtasks.
    onAddAssignment({
      ...assign,
      subtasks: updatedSubtasks
    });
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `st-${Date.now()}`, title: newSubtaskTitle.trim(), isCompleted: false }
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      alert("الرجاء اختيار المادة الدراسية.");
      return;
    }
    if (!title.trim()) {
      alert("الرجاء إدخال عنوان المهمة.");
      return;
    }

    const newAssign: Assignment = {
      id: editingAssignment ? editingAssignment.id : `assign-${Date.now()}`,
      courseId,
      type,
      title,
      description,
      dueDate,
      priority,
      status,
      grade: status === "graded" ? grade : undefined,
      explanation: editingAssignment?.explanation,
      subtasks: subtasks.length > 0 ? subtasks : undefined
    };

    onAddAssignment(newAssign);
    setIsModalOpen(false);
    onClearInitialAssignmentId?.();
  };

  // Filters logic
  const filteredAssignments = assignments.filter((a) => {
    const taskType = a.type || "assignment";
    const matchesType = selectedTypeFilter === "all" || taskType === selectedTypeFilter;
    const matchesCourse = selectedCourseFilter === "all" || a.courseId === selectedCourseFilter;
    const matchesStatus = selectedStatusFilter === "all" || a.status === selectedStatusFilter;
    const matchesPriority = selectedPriorityFilter === "all" || a.priority === selectedPriorityFilter;
    const matchesSearch = !searchQuery.trim() || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesCourse && matchesStatus && matchesPriority && matchesSearch;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Statistics calculation
  const totalCount = assignments.length;
  const pendingAssignmentsCount = assignments.filter(a => (a.type || "assignment") === "assignment" && a.status === "pending").length;
  const pendingDiscussionsCount = assignments.filter(a => a.type === "discussion" && a.status === "pending").length;
  const pendingProjectsOrQuizzesCount = assignments.filter(a => (a.type === "project" || a.type === "quiz") && a.status === "pending").length;
  const completedCount = assignments.filter(a => a.status !== "pending").length;

  const getPriorityBadge = (prio: AssignmentPriority) => {
    switch (prio) {
      case "high":
        return {
          label: "أهمية عالية",
          style: "bg-rose-50 text-rose-700 border-rose-100",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
        };
      case "medium":
        return {
          label: "أهمية متوسطة",
          style: "bg-amber-50 text-amber-700 border-amber-100",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        };
      default:
        return {
          label: "أهمية منخفضة",
          style: "bg-slate-50 text-slate-600 border-slate-200",
          icon: <Clock className="w-3.5 h-3.5 text-slate-400" />
        };
    }
  };

  const getStatusBadge = (stat: AssignmentStatus) => {
    switch (stat) {
      case "pending":
        return {
          label: "معلق",
          style: "bg-rose-50 text-rose-700 border-rose-100",
        };
      case "submitted":
        return {
          label: "تم الإنجاز / التسليم",
          style: "bg-sky-50 text-sky-700 border-sky-100",
        };
      default:
        return {
          label: "تم التقييم",
          style: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };
    }
  };

  const getCourseColor = (cId: string) => {
    const course = courses.find(c => c.id === cId);
    if (!course) return "bg-indigo-500";
    const map: Record<string, string> = {
      sky: "bg-sky-500",
      emerald: "bg-emerald-500",
      indigo: "bg-indigo-500",
      rose: "bg-rose-500",
      amber: "bg-amber-500",
      violet: "bg-violet-500"
    };
    return map[course.color] || "bg-indigo-500";
  };

  const selectedTypeConfig = getTaskTypeConfig(type);

  return (
    <div className="space-y-6" id="assignments-tab">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-3 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2" id="assignments-title">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            الواجبات والمناقشات والمهام
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تابع تسليم الواجبات، مشاركات المناقشات الأسبوعية، والمشاريع مع إمكانية التحديد كمكتمل بنقرة واحدة.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={() => handleOpenAdd("assignment")}
            disabled={courses.length === 0}
            className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-indigo-100 text-xs sm:text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            أضف مهمة / واجباً
          </button>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">يرجى إضافة مادة دراسية أولاً</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            قبل تسجيل وتتبع الواجبات والمناقشات، يجب عليك إنشاء المواد الدراسية في قسم "المواد".
          </p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">واجبات معلقة</span>
                <span className="text-lg font-extrabold text-slate-900">{pendingAssignmentsCount}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                <MessagesSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">مناقشات معلقة</span>
                <span className="text-lg font-extrabold text-slate-900">{pendingDiscussionsCount}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">مشاريع وكويزات</span>
                <span className="text-lg font-extrabold text-slate-900">{pendingProjectsOrQuizzesCount}</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-semibold block">تم إنجازها</span>
                <span className="text-lg font-extrabold text-emerald-700">{completedCount} <span className="text-xs text-slate-400 font-normal">/ {totalCount}</span></span>
              </div>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو موضوع المهمة أو سؤال المناقشة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Type Filter */}
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden text-slate-700 font-medium"
              >
                <option value="all">كل الأنواع (الكل)</option>
                <option value="assignment">📝 واجبات دراسية</option>
                <option value="discussion">💬 مناقشات (Discussions)</option>
                <option value="project">🚀 مشاريع</option>
                <option value="quiz">⏱️ اختبارات قصيرة (Quizzes)</option>
                <option value="other">📌 أخرى</option>
              </select>

              {/* Course Filter */}
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden text-slate-700"
              >
                <option value="all">كل المواد الدراسية</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden text-slate-700"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">⏳ معلقة فقط</option>
                <option value="submitted">✅ تم التسليم / الإنجاز</option>
                <option value="graded">🎯 تم التقييم ورصد الدرجة</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden text-slate-700"
              >
                <option value="all">كل الأولويات</option>
                <option value="high">🔴 أهمية عالية</option>
                <option value="medium">🟡 أهمية متوسطة</option>
                <option value="low">⚪ أهمية منخفضة</option>
              </select>
            </div>
          </div>

          {/* Assignments & Discussions List */}
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-bold text-sm">لا توجد مهام أو مناقشات تطابق خيارات التصفية.</p>
              <p className="text-slate-400 text-xs mt-1">جرّب تغيير فلاتر البحث أو أضف تكليفاً جديداً.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredAssignments.map((assign) => {
                const course = courses.find(c => c.id === assign.courseId);
                const taskType = assign.type || "assignment";
                const typeConfig = getTaskTypeConfig(taskType);
                const TypeIcon = typeConfig.icon;
                const prioBadge = getPriorityBadge(assign.priority);
                const statBadge = getStatusBadge(assign.status);
                const isExpanded = !!expandedAssignments[assign.id];
                const isDone = assign.status !== "pending";

                // Subtasks metrics
                const subtasksList = assign.subtasks || [];
                const totalSubtasks = subtasksList.length;
                const completedSubtasks = subtasksList.filter(s => s.isCompleted).length;
                const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
                const allSubtasksDone = totalSubtasks > 0 && completedSubtasks === totalSubtasks;

                return (
                  <motion.div
                    key={assign.id}
                    id={`assignment-card-${assign.id}`}
                    layout="position"
                    onClick={() => toggleExpand(assign.id)}
                    className={`bg-white rounded-xl border transition-all overflow-hidden cursor-pointer ${
                      assign.id === initialAssignmentId
                        ? "ring-2 ring-indigo-500 shadow-md border-indigo-300"
                        : isDone 
                        ? "border-slate-200/80 bg-slate-50/40 hover:border-slate-300" 
                        : "border-slate-200 hover:border-indigo-200 shadow-xs hover:shadow-sm"
                    }`}
                  >
                    {/* Assignment Header */}
                    <div className="p-3 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Quick Completion Checkbox Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStatus(assign, e)}
                          className={`mt-0.5 p-1 rounded-lg transition shrink-0 cursor-pointer ${
                            isDone 
                              ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                              : "text-slate-300 hover:text-indigo-600 hover:bg-indigo-50"
                          }`}
                          title={isDone ? "انقر لإعادة التعيين كمعلق" : "انقر لتحديد كمكتمل / تم الإنجاز"}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        {/* Course visual color tag */}
                        <div className={`w-2.5 h-11 rounded-full shrink-0 ${getCourseColor(assign.courseId)}`} />
                        
                        <div>
                          {/* Badges row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Type Badge */}
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md flex items-center gap-1 ${typeConfig.badgeStyle}`}>
                              <TypeIcon className="w-3 h-3" />
                              {typeConfig.label}
                            </span>

                            {/* Course name */}
                            <span className="text-xs font-bold text-slate-700">
                              {course?.code} - {course?.name}
                            </span>

                            {/* Priority Badge */}
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md flex items-center gap-1 ${prioBadge.style}`}>
                              {prioBadge.icon}
                              {prioBadge.label}
                            </span>

                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md ${statBadge.style}`}>
                              {statBadge.label}
                            </span>

                            {/* Prominent Interactive Subtasks Badge */}
                            {totalSubtasks > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(assign.id);
                                }}
                                title={
                                  allSubtasksDone 
                                    ? `اكتملت جميع المهام الفرعية (${completedSubtasks}/${totalSubtasks}) - انقر لعرض القائمة` 
                                    : `يحتوي على ${totalSubtasks} مهام فرعية (${completedSubtasks} مكتملة) - انقر لعرض وإنجاز المهام الفرعية`
                                }
                                className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-md flex items-center gap-1.5 transition-all shadow-2xs hover:scale-102 active:scale-95 cursor-pointer ${
                                  allSubtasksDone
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400/20 hover:bg-emerald-100"
                                    : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-400/20 hover:bg-indigo-100"
                                }`}
                              >
                                {allSubtasksDone ? (
                                  <>
                                    <span>✅</span>
                                    <span>اكتملت كافة المهام الفرعية 100%</span>
                                  </>
                                ) : (
                                  <>
                                    <span>📋</span>
                                    <span>
                                      {completedSubtasks > 0 
                                        ? `يحتوي على ${totalSubtasks} مهام فرعية (${subtaskPercent}%)`
                                        : `يحتوي على ${totalSubtasks} ${totalSubtasks === 1 ? "مهمة فرعية" : "مهام فرعية"}`
                                      }
                                    </span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Graded badge */}
                            {assign.status === "graded" && assign.grade && (
                              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-xs">
                                <Award className="w-3 h-3" />
                                الدرجة: {assign.grade}
                              </span>
                            )}
                          </div>
                          
                          {/* Title */}
                          <h3 className={`font-bold text-base mt-1.5 transition ${
                            isDone ? "text-slate-500 line-through decoration-slate-300" : "text-slate-900"
                          }`}>
                            {assign.title}
                          </h3>
                          
                          {/* Date and info */}
                          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 font-mono flex-wrap">
                            <span className={`flex items-center gap-1 font-semibold ${isDone ? "text-slate-400" : "text-rose-600"}`}>
                              <Calendar className="w-3.5 h-3.5" />
                              تاريخ الاستحقاق: {assign.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action items on right side */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        {/* Quick Mark Done Button for Mobile/Desktop */}
                        <button
                          onClick={(e) => handleToggleStatus(assign, e)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            isDone 
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-600" 
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isDone ? "معلق" : "تم الإنجاز"}</span>
                        </button>

                        {/* Edit */}
                        <button 
                          onClick={(e) => handleOpenEdit(assign, e)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                          title="تعديل التفاصيل"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        {assignToDeleteId === assign.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-black text-rose-700 px-1">حذف؟</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAssignment(assign.id);
                                setAssignToDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAssignToDeleteId(null);
                              }}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              لا
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignToDeleteId(assign.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                        >
                          <div className="p-3 sm:p-5 space-y-4">
                            {/* Subtasks Progress & List */}
                            {assign.subtasks && assign.subtasks.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <CheckSquare className={`w-3.5 h-3.5 ${allSubtasksDone ? "text-emerald-600" : "text-indigo-600"}`} />
                                    <span>المهام الفرعية ({completedSubtasks} من {totalSubtasks})</span>
                                  </h4>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    allSubtasksDone 
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  }`}>
                                    {allSubtasksDone ? "✅ مكتملة 100%" : `إنجاز ${subtaskPercent}%`}
                                  </span>
                                </div>
                                <div className="bg-white rounded-xl border border-slate-100 p-3 sm:p-4 space-y-3">
                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${
                                        allSubtasksDone ? "bg-emerald-500" : "bg-indigo-500"
                                      }`} 
                                      style={{ width: `${subtaskPercent}%` }}
                                    />
                                  </div>
                                  
                                  <div className="space-y-2">
                                    {assign.subtasks.map(st => (
                                      <div 
                                        key={st.id} 
                                        className="flex items-center gap-3 cursor-pointer group"
                                        onClick={(e) => handleToggleSubtask(assign, st.id, e)}
                                      >
                                        <button 
                                          type="button" 
                                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                                            st.isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-slate-50 group-hover:border-indigo-400"
                                          }`}
                                        >
                                          {st.isCompleted && <Check className="w-3 h-3" />}
                                        </button>
                                        <span className={`text-sm transition ${st.isCompleted ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                                          {st.title}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Description / Requirements */}
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                {taskType === "discussion" ? "تفاصيل وسؤال المناقشة المطلوب:" : "تفاصيل ومتطلبات المهمة:"}
                              </h4>
                              <div className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                {assign.description || (
                                  <span className="text-slate-400 italic">
                                    لا يوجد وصف مدون. انقر على تعديل لتدوين نص السؤال أو الشروط.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-3 sm:p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                {editingAssignment ? "تعديل تفاصيل المهمة / المناقشة" : "إضافة تكليف دراسي جديد"}
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  onClearInitialAssignmentId?.();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1" dir="rtl">
              
              {/* Task Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">نوع التكليف / المهمة</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: "assignment", label: "واجب دراسي", icon: FileText },
                    { id: "discussion", label: "مناقشة (Discussion)", icon: MessagesSquare },
                    { id: "project", label: "مشروع", icon: FolderGit2 },
                    { id: "quiz", label: "اختبار قصير (Quiz)", icon: HelpCircle },
                    { id: "other", label: "مهمة أخرى", icon: Bookmark },
                  ].map(t => {
                    const Icon = t.icon;
                    const isSelected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id as AssignmentType)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs" 
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-500"}`} />
                        <span className="truncate">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Course select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">المادة الدراسية</label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition text-slate-700 bg-white"
                >
                  <option value="" disabled>اختر المادة الدراسية...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  عنوان {selectedTypeConfig.label}
                </label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={selectedTypeConfig.placeholderTitle}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">تاريخ الاستحقاق (الموعد النهائي)</label>
                <input 
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الأهمية والأولوية</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AssignmentPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white"
                  >
                    <option value="high">مرتفعة (أهمية قصوى)</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">حالة الإنجاز</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as AssignmentStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 text-slate-700 bg-white"
                  >
                    <option value="pending">⏳ معلق (لم يُنجز بعد)</option>
                    <option value="submitted">✅ تم التسليم / المشاركة</option>
                    <option value="graded">🎯 تم التقييم ورصد الدرجة</option>
                  </select>
                </div>
              </div>

              {/* Grade field (Only shown when status is graded) */}
              {status === "graded" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">الدرجة المرصودة</label>
                  <input 
                    type="text"
                    required
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="مثال: 5/5 أو 10/10 أو ممتاز، A+..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  {type === "discussion" ? "سؤال المناقشة وشروط المشاركة" : "متطلبات ووصف المهمة"}
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={selectedTypeConfig.placeholderDesc}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition resize-none"
                />
              </div>

              {/* Subtasks */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">المهام الفرعية (اختياري)</label>
                  {subtasks.length > 0 && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                      📋 {subtasks.length} مهام مضافة (تظهر بشارة تفاعلية على البطاقة)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="مهمة فرعية (مثال: قراءة الفصل الأول)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={handleAddSubtask} 
                    className="px-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-700 font-bold text-sm transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
                {subtasks.length > 0 && (
                  <div className="space-y-2 mt-3 max-h-32 overflow-y-auto pr-1">
                    {subtasks.map(st => (
                      <div key={st.id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                        <span className={st.isCompleted ? "line-through text-slate-400" : "text-slate-700 font-medium"}>
                          {st.title}
                        </span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSubtask(st.id)} 
                          className="text-rose-400 hover:text-rose-600 p-1 bg-white rounded-lg shadow-xs cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm hover:shadow-indigo-100 cursor-pointer"
                >
                  {editingAssignment ? "حفظ التعديلات" : `إضافة ${selectedTypeConfig.label}`}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
