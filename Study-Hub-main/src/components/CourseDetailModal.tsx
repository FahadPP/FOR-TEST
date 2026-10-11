
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Trash2, FileText, Save, Calculator, BookOpen, Check,
  ChevronLeft, CheckCircle2, XCircle, RotateCcw, Calendar, Play
} from "lucide-react";
import { Course, Lecture } from "../types";

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onUpdateCourse: (updatedCourse: Course) => void;
  onNavigateToStudyHub?: (courseId?: string) => void;
  onNavigateToCoursePage?: (courseId: string) => void;
  lectures?: Lecture[];
  onAddLecture?: (lecture: Lecture) => void;
  onUpdateLecture?: (lecture: Lecture) => void;
  onDeleteLecture?: (lectureId: string) => void;
}

export default function CourseDetailModal({ 
  course, 
  onClose, 
  onUpdateCourse,
  onNavigateToStudyHub,
  onNavigateToCoursePage,
  lectures = [],
  onAddLecture,
  onUpdateLecture,
  onDeleteLecture
}: CourseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "lectures">("overview");

  // Grades State (Simplified)
  const [currentGrade, setCurrentGrade] = useState(course.grades?.assignments || 0);
  const [targetGrade, setTargetGrade] = useState(90);
  const [isGradeSaved, setIsGradeSaved] = useState(false);

  // Lectures State
  const courseLectures = lectures.filter(l => l.courseId === course.id);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [lecTitle, setLecTitle] = useState("");
  const [lecStatus, setLecStatus] = useState<"attended" | "missed">("attended");
  const [lecNotes, setLecNotes] = useState("");
  const [isLecModalOpen, setIsLecModalOpen] = useState(false);

  const handleSaveGrades = () => {
    onUpdateCourse({
      ...course,
      grades: {
        ...course.grades,
        assignments: currentGrade
      }
    });
    setIsGradeSaved(true);
    setTimeout(() => setIsGradeSaved(false), 2000);
  };

  const handleOpenLecModal = (lec?: Lecture) => {
    if (lec) {
      setEditingLecture(lec);
      setLecTitle(lec.title);
      setLecStatus(lec.status as any);
      setLecNotes(lec.notes || "");
    } else {
      setEditingLecture(null);
      setLecTitle("");
      setLecStatus("attended");
      setLecNotes("");
    }
    setIsLecModalOpen(true);
  };

  const handleSaveLecture = () => {
    if (!lecTitle.trim() || !onAddLecture || !onUpdateLecture) return;

    if (editingLecture) {
      onUpdateLecture({
        ...editingLecture,
        title: lecTitle,
        status: lecStatus,
        notes: lecNotes
      });
    } else {
      onAddLecture({
        id: `lec-${Date.now()}`,
        courseId: course.id,
        date: new Date().toISOString().split("T")[0],
        time: "00:00",
        title: lecTitle,
        status: lecStatus,
        notes: lecNotes
      });
    }
    setIsLecModalOpen(false);
  };

  // Helper functions
  const attendedCount = courseLectures.filter(l => l.status === "attended").length;
  const missedCount = courseLectures.filter(l => l.status === "missed").length;
  const totalRecorded = attendedCount + missedCount;
  const attendanceRate = totalRecorded > 0 ? Math.round((attendedCount / totalRecorded) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 sm:backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex justify-between items-center relative z-10 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              {course.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{course.code} • {course.instructor || "بدون أستاذ"}</p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToCoursePage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToCoursePage(course.id);
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-indigo-100"
                title="عرض في صفحة المقررات الكاملة"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">الانتقال لصفحة المقررات</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 shrink-0 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`py-3.5 text-xs font-bold border-b-2 px-3 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            الغياب والدرجات (نظرة عامة)
          </button>
          
          <button 
            onClick={() => setActiveTab("lectures")}
            className={`py-3.5 text-xs font-bold border-b-2 px-3 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "lectures" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            المحاضرات والملاحظات
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-white">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              {/* Attendance Tracking */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>متابعة الحضور والغياب</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      إحصائيات الحضور والغياب المسجلة لهذا المقرر
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">نسبة الحضور:</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      attendanceRate >= 85 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : attendanceRate >= 70 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-rose-100 text-rose-700'
                    }`}>
                      {attendanceRate}%
                    </span>
                  </div>
                </div>

                {/* Stat Badges Grid */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-center">
                    <span className="block text-[11px] font-bold text-slate-500">إجمالي المرصود</span>
                    <span className="text-base font-extrabold text-slate-800 font-mono mt-0.5 block">{totalRecorded}</span>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70 text-center">
                    <span className="block text-[11px] font-bold text-emerald-700">حاضر</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono mt-0.5 block">{attendedCount}</span>
                  </div>

                  <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/70 text-center">
                    <span className="block text-[11px] font-bold text-rose-700">غياب</span>
                    <span className="text-base font-extrabold text-rose-700 font-mono mt-0.5 block">{missedCount}</span>
                  </div>
                </div>

                {/* Attendance Rate Progress bar */}
                {totalRecorded > 0 && (
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        attendanceRate >= 85 ? 'bg-emerald-500' : attendanceRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Simplified Grades */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-600" />
                  حساب الدرجة المتوقعة
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">أدخل نسبتك الحالية وسنحسب الباقي تلقائياً لتصل إلى هدفك.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">حصيلتك الحالية (من 100)</label>
                    <input 
                      type="number" 
                      value={currentGrade}
                      onChange={(e) => setCurrentGrade(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">الدرجة الهدف (مثل 90 لـ A)</label>
                    <input 
                      type="number" 
                      value={targetGrade}
                      onChange={(e) => setTargetGrade(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  {currentGrade >= targetGrade 
                    ? "تهانينا! لقد وصلت لهدفك." 
                    : `تحتاج إلى ${targetGrade - currentGrade} درجات إضافية للوصول إلى هدفك المرجو.`}
                </div>

                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleSaveGrades}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                  >
                    {isGradeSaved ? "تم الحفظ!" : "حفظ الحصيلة"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "lectures" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">ملاحظات وسجل المحاضرات</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">سجل ملاحظاتك وراجع ملخصات المحاضرات واستعراض الحضور.</p>
                </div>
                <button 
                  onClick={() => handleOpenLecModal()}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  محاضرة جديدة
                </button>
              </div>

              {courseLectures.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">لا توجد سجلات للمحاضرات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseLectures.map(lec => (
                    <div key={lec.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {lec.status === "attended" ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">حاضر</span>
                            ) : (
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">غائب</span>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{lec.date}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">{lec.title || "بدون عنوان"}</h4>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleOpenLecModal(lec)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition">
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteLecture && (
                            <button onClick={() => onDeleteLecture(lec.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {lec.notes && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <p className="text-xs text-slate-600 line-clamp-3">{lec.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Add/Edit Lecture Modal */}
      <AnimatePresence>
        {isLecModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsLecModalOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
              dir="rtl"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">
                  {editingLecture ? "تعديل المحاضرة والملاحظات" : "إضافة محاضرة وملاحظات"}
                </h3>
                <button onClick={() => setIsLecModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">عنوان المحاضرة</label>
                  <input 
                    type="text" 
                    value={lecTitle}
                    onChange={(e) => setLecTitle(e.target.value)}
                    placeholder="مثال: مقدمة في المعادلات..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">حالة الحضور</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLecStatus("attended")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${lecStatus === "attended" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-100 text-slate-500"}`}
                    >
                      حاضر
                    </button>
                    <button 
                      onClick={() => setLecStatus("missed")}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border-2 transition ${lecStatus === "missed" ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-100 text-slate-500"}`}
                    >
                      غائب
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex justify-between">
                    <span>الملاحظات</span>
                    <span className="text-[10px] text-slate-400 font-medium">ملاحظاتك ونقاط المراجعة</span>
                  </label>
                  <textarea 
                    value={lecNotes}
                    onChange={(e) => setLecNotes(e.target.value)}
                    rows={6}
                    placeholder="اكتب ملاحظاتك هنا..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button 
                  onClick={handleSaveLecture}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                  حفظ المحاضرة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
