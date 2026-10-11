import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  User, 
  X, 
  BookOpen, 
  FileText,
  CalendarDays,
  Check,
  ChevronLeft,
  Sparkles,
  Settings2
} from "lucide-react";
import { Course } from "../types";
import CourseDetailModal from "./CourseDetailModal";

import { Lecture } from "../types";

interface CoursesProps {
  lectures: Lecture[];
  onAddLecture: (lecture: Lecture) => void;
  onUpdateLecture: (lecture: Lecture) => void;
  onDeleteLecture: (lectureId: string) => void;
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onNavigateToStudyHub?: (courseId?: string) => void;
  initialCourseId?: string;
  onClearInitialCourseId?: () => void;
}

export default function Courses({ 
  courses, 
  onAddCourse, 
  onDeleteCourse,
  onNavigateToStudyHub,
  lectures,
  onAddLecture,
  onUpdateLecture,
  onDeleteLecture,
  initialCourseId,
  onClearInitialCourseId
}: CoursesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);
  const [courseToDeleteId, setCourseToDeleteId] = useState<string | null>(null);

  // Automatically open course details modal if initialCourseId is provided
  useEffect(() => {
    if (initialCourseId) {
      const found = courses.find(c => c.id === initialCourseId);
      if (found) {
        setSelectedDetailCourse(found);
      }
    }
  }, [initialCourseId, courses]);

  // Form states
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [instructor, setInstructor] = useState("");
  const [color, setColor] = useState("indigo");
  const [schedule, setSchedule] = useState<{ day: string; time: string }[]>([
    { day: "الأحد", time: "10:00 - 11:30" }
  ]);

  const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const colorOptions = ["indigo", "sky", "emerald", "rose", "amber", "violet"];

  const getColorClasses = (col: string) => {
    const map: Record<string, { bg: string, text: string, border: string, dot: string }> = {
      sky: { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", dot: "bg-sky-500" },
      emerald: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
      indigo: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", dot: "bg-indigo-500" },
      rose: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", dot: "bg-rose-500" },
      amber: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
      violet: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", dot: "bg-violet-500" }
    };
    return map[col] || map.indigo;
  };

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setName("");
    setCode("");
    setInstructor("");
    setColor("indigo");
    setSchedule([{ day: "الأحد", time: "10:00 - 11:30" }]);
    setShowAdvancedOptions(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setName(course.name);
    setCode(course.code);
    setInstructor(course.instructor);
    setColor(course.color);
    setSchedule(course.schedule);
    setShowAdvancedOptions(true);
    setIsModalOpen(true);
  };

  const handleAddScheduleRow = () => {
    setSchedule([...schedule, { day: "الاثنين", time: "10:00 - 11:30" }]);
  };

  const handleRemoveScheduleRow = (index: number) => {
    if (schedule.length > 1) {
      setSchedule(schedule.filter((_, i) => i !== index));
    }
  };

  const handleScheduleChange = (index: number, field: "day" | "time", value: string) => {
    const updated = [...schedule];
    updated[index][field] = value;
    setSchedule(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      alert("الرجاء ملء كافة الحقول الأساسية للمادة (الاسم والرمز).");
      return;
    }

    const newCourse: Course = {
      id: editingCourse ? editingCourse.id : `course-${Date.now()}`,
      name,
      code,
      instructor,
      color,
      schedule
    };

    onAddCourse(newCourse);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6" id="courses-tab">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-4 bg-white p-3 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900" id="courses-title">المواد الدراسية المسجلة</h2>
          <p className="text-xs text-slate-500 mt-1">
            أضف أو عدل أو احذف مقرراتك الدراسية مع جداولها وألوانها الخاصة.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-indigo-100 text-sm cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          مادة جديدة
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">لا توجد مواد دراسية مسجلة حالياً</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            ابدأ بإضافة مقرراتك الأكاديمية وجداول محاضراتك الأسبوعية لتتمكن من تتبعها بسلاسة.
          </p>
          <button 
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            إضافة أول مادة دراسية
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const colors = getColorClasses(course.color);
            return (
              <motion.div 
                key={course.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-indigo-100 transition duration-200 group"
                onClick={() => setSelectedDetailCourse(course)}
              >
                {/* Colored Top bar decoration */}
                <div className={`h-2 ${colors.dot}`} />

                <div className="p-4 sm:p-6 space-y-4 flex-1">
                  {/* Subject Title */}
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {course.code}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(course);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                        title="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {courseToDeleteId === course.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-black text-rose-700 px-1">حذف؟</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCourse(course.id);
                              setCourseToDeleteId(null);
                            }}
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            نعم
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToDeleteId(null);
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
                            setCourseToDeleteId(course.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-snug">
                      {course.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      المحاضر: <span className="font-medium">{course.instructor}</span>
                    </p>
                  </div>

                  {/* Schedule */}
                  <div className="space-y-2 pt-2 border-t border-slate-50">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      الجدول الأسبوعي للمحاضرة:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {course.schedule.map((sched, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                          <span className="font-bold text-slate-700 font-sans">{sched.day}</span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {sched.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Visual Action Footer */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-extrabold text-indigo-600 group-hover:bg-indigo-50/50 transition duration-200">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    المراجع، الحضور، ومتتبع الدرجات
                  </span>
                  <ChevronLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform text-indigo-600" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingCourse ? "تعديل المادة الدراسية" : "إضافة مادة دراسية جديدة"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">اسم المادة الدراسي</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثل: برمجة الحاسب، كيمياء عضوية..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">رمز المادة</label>
                  <input 
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="مثل: CS-101"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition text-center font-mono uppercase"
                  />
                </div>
              </div>

              {/* Advanced Options Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Settings2 className="w-4 h-4" />
                  {showAdvancedOptions ? "إخفاء الخيارات الإضافية" : "إظهار الخيارات الإضافية (الأستاذ، الجداول، اللون)"}
                </button>
              </div>

              {/* Advanced Options Block */}
              {showAdvancedOptions && (
                <div className="space-y-5 animate-fade-in border-t border-slate-100 pt-3">
                  {/* Instructor */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 block">أستاذ المادة (المحاضر) - اختياري</label>
                    <input 
                      type="text"
                      value={instructor}
                      onChange={(e) => setInstructor(e.target.value)}
                      placeholder="مثل: د. محمد العلي..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 block">رمز اللون والتمييز</label>
                    <div className="flex gap-2.5">
                      {colorOptions.map((col) => {
                        const colors = getColorClasses(col);
                        const isSelected = color === col;
                        return (
                          <button
                            key={col}
                            type="button"
                            onClick={() => setColor(col)}
                            className={`w-9 h-9 rounded-xl border cursor-pointer transition flex items-center justify-center ${colors.bg} ${colors.border} hover:scale-105`}
                          >
                            {isSelected && <Check className={`w-4 h-4 ${colors.text}`} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Schedule Block */}
                  <div className="space-y-3.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700">مواعيد المحاضرات الأسبوعية</label>
                      <button
                        type="button"
                        onClick={handleAddScheduleRow}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> أضف موعد آخر
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {schedule.map((sched, index) => (
                        <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {/* Day select */}
                          <div className="w-1/3">
                            <select
                              value={sched.day}
                              onChange={(e) => handleScheduleChange(index, "day", e.target.value)}
                              className="w-full bg-white px-2 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                            >
                              {daysOfWeek.map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>

                          {/* Time input */}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={sched.time}
                              onChange={(e) => handleScheduleChange(index, "time", e.target.value)}
                              placeholder="مثال: 09:00 - 10:30"
                              className="w-full bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs text-center font-mono focus:outline-hidden focus:border-indigo-500"
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            disabled={schedule.length === 1}
                            onClick={() => handleRemoveScheduleRow(index)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm hover:shadow-indigo-100 cursor-pointer"
                >
                  {editingCourse ? "حفظ التعديلات" : "إضافة المادة"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Course Detail Modal */}
      {selectedDetailCourse && (
        <CourseDetailModal
          course={selectedDetailCourse}
          onClose={() => {
            setSelectedDetailCourse(null);
            onClearInitialCourseId?.();
          }}
          onUpdateCourse={(updatedCourse) => {
            onAddCourse(updatedCourse);
            setSelectedDetailCourse(updatedCourse);
          }}
          onNavigateToStudyHub={onNavigateToStudyHub}
          lectures={lectures}
          onAddLecture={onAddLecture}
          onUpdateLecture={onUpdateLecture}
          onDeleteLecture={onDeleteLecture}
        />
      )}
    </div>
  );
}
