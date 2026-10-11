import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  CheckSquare, 
  Award, 
  Calendar, 
  ArrowRight, 
  AlertTriangle, 
  Clock, 
  FileText,
  UserCheck,
  Pin,
  Plus,
  Trash2,
  X,
  Edit2,
  Check,
  TrendingUp,
  BarChart2,
  Bell,
  Sparkles,
  CheckCircle,
  Settings2,
  Activity,
  Info,
  MessagesSquare,
  FolderGit2,
  HelpCircle,
  Bookmark,
  CheckCircle2
} from "lucide-react";
import { Course, Lecture, Assignment, StickyNote } from "../types";
import { StorageService, INITIAL_NOTES, LOCAL_NOTES_KEY } from "../lib/storage";

interface DashboardProps {
  user: any;
  isGuest?: boolean;
  courses: Course[];
  lectures: Lecture[];
  assignments: Assignment[];
  onNavigate: (tab: string) => void;
  onSelectCourse: (courseId: string) => void;
  onSelectAssignment?: (assignmentId: string) => void;
  onUpdateAssignment?: (assignment: Assignment) => void;
  onOpenQuickAdd?: (type: "attendance" | "assignment") => void;
  onGuestAction?: () => void;
}

export default function Dashboard({ 
  user,
  isGuest,
  courses, 
  lectures, 
  assignments, 
  onNavigate,
  onSelectCourse,
  onSelectAssignment,
  onUpdateAssignment,
  onOpenQuickAdd,
  onGuestAction
}: DashboardProps) {

  // Sticky Notes State
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [newNoteText, setNewNoteText] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("yellow");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // Agenda and Notification Center states
  const [activeAgendaTab, setActiveAgendaTab] = useState<"today" | "notifications">("today");
  

  // Save notification logs
  

  
  useEffect(() => {
    StorageService.getStickyNotes().then(loadedNotes => {
      setNotes(loadedNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    });
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: StickyNote = {
      id: "note-" + Date.now(),
      content: newNoteText.trim(),
      color: selectedColor,
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setNewNoteText("");
    if (!isGuest && user) {
      await StorageService.saveStickyNote(newNote);
    } else {
      onGuestAction?.();
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (!isGuest && user) {
      await StorageService.deleteStickyNote(id);
    }
  };

  const handleStartEdit = (note: StickyNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    const updated = notes.map(n => {
      if (n.id === id) {
        const updatedNote = { ...n, content: editingText.trim() };
        if (!isGuest && user) {
          StorageService.saveStickyNote(updatedNote);
        } else {
          onGuestAction?.();
        }
        return updatedNote;
      }
      return n;
    });
    setNotes(updated);
    setEditingNoteId(null);
  };

  // Statistics calculation
  const totalCourses = courses.length;
  
  const attendedLectures = lectures.filter(l => l.status === "attended");
  const missedLectures = lectures.filter(l => l.status === "missed");
  const totalLogLectures = attendedLectures.length + missedLectures.length;
  const attendanceRate = totalLogLectures > 0 
    ? Math.round((attendedLectures.length / totalLogLectures) * 100) 
    : 100;

  const pendingAssignments = assignments.filter(a => a.status === "pending");
  
  // Find pending assignments due within 24 hours (due today or tomorrow)
  const urgentAssignments = pendingAssignments.filter(a => {
    if (!a.dueDate) return false;
    
    const [year, month, day] = a.dueDate.split("-").map(Number);
    const dueDateLocal = new Date(year, month - 1, day);
    
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = dueDateLocal.getTime() - todayLocal.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 0 = today, 1 = tomorrow
    return diffDays >= 0 && diffDays <= 1;
  });

  const overdueAssignments = pendingAssignments.filter(a => {
    if (!a.dueDate) return false;
    const [year, month, day] = a.dueDate.split("-").map(Number);
    const dueDateLocal = new Date(year, month - 1, day);
    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dueDateLocal.getTime() < todayLocal.getTime();
  });
  
  const hasCatchUpItems = missedLectures.length > 0 || overdueAssignments.length > 0;

  const completedAssignments = assignments.filter(a => a.status !== "pending");
  const assignmentRate = assignments.length > 0
    ? Math.round((completedAssignments.length / assignments.length) * 100)
    : 0;

  // Calculate Attendance Rate and other stats for the stats grid
  // (We've removed the progressData chart mapping to simplify the dashboard)

  // Next upcoming assignment
  const sortedPendingAssignments = [...pendingAssignments].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
  const upcomingAssignment = sortedPendingAssignments[0];

  // Upcoming lectures based on course schedules
  const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const currentDayName = daysOfWeek[new Date().getDay()];

  // Color mapper for classes
  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string, text: string, border: string, accent: string }> = {
      sky: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", accent: "bg-sky-500" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", accent: "bg-emerald-500" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", accent: "bg-indigo-500" },
      rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", accent: "bg-rose-500" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", accent: "bg-amber-500" },
      violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", accent: "bg-violet-500" }
    };
    return map[color] || map.indigo;
  };

  return (
    <div className="space-y-8" id="dashboard-tab">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight" id="dashboard-title">
            مرحباً بك في منصة مسيرتي 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs md:text-sm font-medium">
            تابع محاضراتك، واجباتك، ونظم وقتك ومذاكرتك بكفاءة وسهولة.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => onOpenQuickAdd ? onOpenQuickAdd("attendance") : onNavigate("courses")}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-sm hover:shadow-indigo-100 text-xs cursor-pointer flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            سجل محاضرة
          </button>
          <button 
            onClick={() => onOpenQuickAdd ? onOpenQuickAdd("assignment") : onNavigate("assignments")}
            className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs cursor-pointer flex items-center gap-1.5"
          >
            <CheckSquare className="w-4 h-4" />
            أضف واجباً جديداً
          </button>
        </div>
      </div>

      {/* 4 Minimalist Academic Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Courses */}
        <div 
          onClick={() => onNavigate("courses")}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المقررات المسجلة</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{totalCourses}</span>
            <span className="text-xs font-semibold text-slate-400">مقررات</span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-2 flex items-center gap-1">
            إدارة وتتبع المواد <ArrowRight className="w-3 h-3 rotate-180" />
          </p>
        </div>

        {/* Attendance Rate */}
        <div 
          onClick={() => onNavigate("courses")}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الحضور</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{attendanceRate}%</span>
            <span className="text-xs font-semibold text-slate-400">{attendedLectures.length} من {totalLogLectures || 0}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${attendanceRate}%` }} />
          </div>
        </div>

        {/* Completed Assignments */}
        <div 
          onClick={() => onNavigate("assignments")}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الواجبات المنجزة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{completedAssignments.length}</span>
            <span className="text-xs font-semibold text-slate-400">من {assignments.length}</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${assignmentRate}%` }} />
          </div>
        </div>

        {/* Pending / Urgent Tasks */}
        <div 
          onClick={() => onNavigate("assignments")}
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">المهام المعلقة</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition ${
              urgentAssignments.length > 0 ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {urgentAssignments.length > 0 ? <AlertTriangle className="w-4.5 h-4.5 animate-pulse" /> : <Clock className="w-4.5 h-4.5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">{pendingAssignments.length}</span>
            <span className="text-xs font-semibold text-slate-400">متبقية</span>
          </div>
          <p className="text-[11px] font-semibold mt-2">
            {urgentAssignments.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold">{urgentAssignments.length} مهام تستحق قريباً!</span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">لا توجد مهام متأخرة 🎉</span>
            )}
          </p>
        </div>

      </div>

      {/* Balanced 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Column (8 cols): Agenda & Tasks */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">

          {/* Catch-Up Section (What did I miss?) */}
          {hasCatchUpItems && (
            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-rose-800 dark:text-rose-300 text-base">ماذا فاتني؟ (تدارك الموقف)</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {overdueAssignments.map(a => (
                  <div 
                    key={a.id} 
                    onClick={() => onSelectAssignment ? onSelectAssignment(a.id) : onNavigate("assignments")}
                    className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-800/60 p-3 rounded-xl flex items-start gap-3 shadow-xs cursor-pointer hover:border-rose-300 transition hover:-translate-y-0.5"
                  >
                    <div className="w-6 h-6 rounded bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">واجب متأخر: {a.title}</p>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">تاريخ الاستحقاق: {a.dueDate}</p>
                    </div>
                  </div>
                ))}
                
                {missedLectures.map(l => {
                  const course = courses.find(c => c.id === l.courseId);
                  return (
                    <div 
                      key={l.id} 
                      onClick={() => onSelectCourse(l.courseId)}
                      className="bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-800/60 p-3 rounded-xl flex items-start gap-3 shadow-xs cursor-pointer hover:border-amber-300 transition hover:-translate-y-0.5"
                    >
                      <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">غياب محاضرة: {course?.name || "مقرر"}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">التاريخ: {new Date(l.date).toLocaleDateString("ar-EG")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks & Discussions List Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-500" />
                قائمة المهام والواجبات المعلقة
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                {pendingAssignments.length} معلق
              </span>
            </div>
            
            <div className="p-3 sm:p-5 space-y-3">
              {pendingAssignments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  أنت متميز! لا توجد واجبات أو مناقشات معلقة 🎉
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pendingAssignments.slice(0, 4).map((assign) => {
                    const isHigh = assign.priority === "high";
                    const isDiscussion = assign.type === "discussion";
                    const course = courses.find(c => c.id === assign.courseId);
                    return (
                      <div 
                        key={assign.id}
                        onClick={() => onSelectAssignment ? onSelectAssignment(assign.id) : onNavigate("assignments")}
                        title={`انقر لفتح وإدارة واجب: ${assign.title}`}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-transform hover:-translate-y-0.5 group ${
                          isHigh 
                            ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50 hover:border-rose-300 shadow-2xs" 
                            : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDiscussion ? (
                            <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-700 dark:text-purple-300">
                              <MessagesSquare className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1 rounded ${
                              isDiscussion ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                            }`}>
                              {isDiscussion ? "مناقشة" : "واجب"}
                            </span>
                            {course && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectCourse(course.id);
                                }}
                                title={`الانتقال لمقرر: ${course.name}`}
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 transition cursor-pointer flex items-center gap-0.5"
                              >
                                <BookOpen className="w-2.5 h-2.5" />
                                {course.code}
                              </button>
                            )}

                            {/* Subtasks Badge if present */}
                            {assign.subtasks && assign.subtasks.length > 0 && (() => {
                              const total = assign.subtasks.length;
                              const done = assign.subtasks.filter(s => s.isCompleted).length;
                              const allDone = total > 0 && done === total;
                              const pct = Math.round((done / total) * 100);
                              return (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                                  allDone 
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                }`}>
                                  {allDone ? "✅ مهام فرعية 100%" : `📋 ${total} مهام${done > 0 ? ` (${pct}%)` : ""}`}
                                </span>
                              );
                            })()}
                            <p className={`text-xs font-bold truncate flex-1 min-w-[70px] ${
                              isHigh ? "text-rose-900 dark:text-rose-200" : "text-slate-800 dark:text-slate-200"
                            }`}>
                              {assign.title}
                            </p>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-1 text-[10px]">
                            <span className={`font-mono font-semibold ${
                              isHigh ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
                            }`}>
                              التسليم: {assign.dueDate}
                            </span>
                            <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                              فتح الواجب ↵
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <button 
                  onClick={() => onNavigate("assignments")}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  عرض وإدارة كل الواجبات والمناقشات
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Side Column (4 cols): AI Advisor Box & Sticky Notes */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* Study & Flashcards Helper Box */}
          <div className="bg-indigo-950 dark:bg-indigo-950/90 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-md relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-32 h-32 rounded-full bg-indigo-500/10 pointer-events-none" />
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              ساحة المذاكرة والبطاقات
            </span>
            <h3 className="font-bold text-sm mt-2 text-white">بطاقات استذكار واختبارات ذاتية 🎯</h3>
            <p className="text-xs text-indigo-200/80 mt-1.5 leading-relaxed">
              راجع مفاهيمك بنظام التكرار المتباعد، تدرب على كويزات المقررات، ونظم ملخصاتك وخريطة المفاهيم!
            </p>
            <button 
              onClick={() => onNavigate("study")}
              className="mt-4 px-3.5 py-2 bg-white text-indigo-950 text-xs font-bold rounded-xl hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              ابدأ المذاكرة والاختبار الذاتي <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>

          {/* Sticky Notes Sidebar Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-3 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 dark:text-white text-base flex items-center gap-2">
                <Pin className="w-5 h-5 text-indigo-500 fill-indigo-100 dark:fill-indigo-950" />
                المفكرة السريعة 📌
              </h2>
              <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900 px-2 py-0.5 rounded-full">
                {notes.length} ملاحظات
              </span>
            </div>

            <div className="p-3 sm:p-5 space-y-4">
              {/* Add note form */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="اكتب خاطرة، فكرة أو تذكير سريع هنا..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <div className="flex items-center justify-between gap-2">
                  {/* Color pickers */}
                  <div className="flex gap-1.5">
                    {[
                      { id: "yellow", bg: "bg-amber-100 border-amber-300", name: "أصفر" },
                      { id: "pink", bg: "bg-rose-100 border-rose-300", name: "وردي" },
                      { id: "blue", bg: "bg-sky-100 border-sky-300", name: "أزرق" },
                      { id: "green", bg: "bg-emerald-100 border-emerald-300", name: "أخضر" },
                      { id: "purple", bg: "bg-purple-100 border-purple-300", name: "بنفسجي" }
                    ].map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color.id)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer flex items-center justify-center ${color.bg} ${
                          selectedColor === color.id ? "scale-120 ring-2 ring-indigo-500 ring-offset-1" : "hover:scale-110"
                        }`}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    أضف
                  </button>
                </div>
              </form>

              {/* Sticky Notes list */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {notes.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      مفكرتك خالية حالياً. دوّن أول فكرة أو خاطرة لك! 💡
                    </div>
                  ) : (
                    notes.map((note) => {
                      const colorClasses: Record<string, { noteBg: string, pinColor: string, text: string, border: string }> = {
                        yellow: { noteBg: "bg-amber-50/90 dark:bg-amber-950/30", pinColor: "text-amber-500", text: "text-amber-900 dark:text-amber-200", border: "border-amber-200 dark:border-amber-900/50" },
                        pink: { noteBg: "bg-rose-50/90 dark:bg-rose-950/30", pinColor: "text-rose-500", text: "text-rose-900 dark:text-rose-200", border: "border-rose-200 dark:border-rose-900/50" },
                        blue: { noteBg: "bg-sky-50/90 dark:bg-sky-950/30", pinColor: "text-sky-500", text: "text-sky-900 dark:text-sky-200", border: "border-sky-200 dark:border-sky-900/50" },
                        green: { noteBg: "bg-emerald-50/90 dark:bg-emerald-950/30", pinColor: "text-emerald-500", text: "text-emerald-900 dark:text-emerald-200", border: "border-emerald-200 dark:border-emerald-900/50" },
                        purple: { noteBg: "bg-purple-50/90 dark:bg-purple-950/30", pinColor: "text-purple-500", text: "text-purple-900 dark:text-purple-200", border: "border-purple-200 dark:border-purple-900/50" }
                      };
                      const cls = colorClasses[note.color] || colorClasses.yellow;

                      return (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className={`p-3.5 rounded-xl border ${cls.noteBg} ${cls.border} relative shadow-3xs overflow-hidden group hover:shadow-xs transition-all duration-200`}
                        >
                          <div className="absolute top-1 left-1/2 -translate-x-1/2">
                            <Pin className={`w-3.5 h-3.5 ${cls.pinColor} rotate-45 transform`} />
                          </div>

                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {editingNoteId !== note.id && (
                              <button
                                onClick={() => handleStartEdit(note)}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-slate-500 transition cursor-pointer"
                                title="تعديل"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 hover:bg-rose-500/10 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-[9px] text-slate-400 font-medium font-mono mb-1.5">
                            {new Date(note.createdAt).toLocaleDateString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>

                          {editingNoteId === note.id ? (
                            <div className="space-y-2 mt-1">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-900 dark:text-white resize-none"
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteId(null)}
                                  className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-md transition cursor-pointer"
                                >
                                  إلغاء
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(note.id)}
                                  className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-md transition cursor-pointer"
                                >
                                  حفظ
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={`text-xs font-semibold leading-relaxed break-words pr-1 ${cls.text}`}>
                              {note.content}
                            </p>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
