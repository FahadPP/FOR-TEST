import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  User, 
  Trash2, 
  Edit3, 
  X, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Course, Lecture, LectureStatus } from "../types";

interface LecturesProps {
  lectures: Lecture[];
  courses: Course[];
  onAddLecture: (lecture: Lecture) => void;
  onDeleteLecture: (lectureId: string) => void;
}

export default function Lectures({ lectures, courses, onAddLecture, onDeleteLecture }: LecturesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [lectureToDeleteId, setLectureToDeleteId] = useState<string | null>(null);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Form states
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [status, setStatus] = useState<LectureStatus>("attended");
  const [notes, setNotes] = useState("");

  // Accordion state for expanded notes
  const [expandedLectures, setExpandedLectures] = useState<Record<string, boolean>>({});

  const handleOpenAdd = () => {
    setEditingLecture(null);
    setCourseId(courses[0]?.id || "");
    setTitle("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("09:00");
    setStatus("attended");
    setNotes("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lec: Lecture, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLecture(lec);
    setCourseId(lec.courseId);
    setTitle(lec.title);
    setDate(lec.date);
    setTime(lec.time);
    setStatus(lec.status);
    setNotes(lec.notes);
    setIsModalOpen(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedLectures(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      alert("الرجاء تحديد المادة الدراسية أولاً.");
      return;
    }
    if (!title.trim()) {
      alert("الرجاء إدخال عنوان المحاضرة.");
      return;
    }

    const newLec: Lecture = {
      id: editingLecture ? editingLecture.id : `lec-${Date.now()}`,
      courseId,
      title,
      date,
      time,
      status,
      notes,
      summary: editingLecture?.summary // Keep summary if editing
    };

    onAddLecture(newLec);
    setIsModalOpen(false);
  };

  // Filter implementation
  const filteredLectures = lectures.filter((l) => {
    const matchesCourse = selectedCourseFilter === "all" || l.courseId === selectedCourseFilter;
    const matchesStatus = selectedStatusFilter === "all" || l.status === selectedStatusFilter;
    return matchesCourse && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (stat: LectureStatus) => {
    switch (stat) {
      case "attended":
        return {
          label: "حاضر",
          style: "bg-emerald-50 text-emerald-700 border-emerald-100",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        };
      case "missed":
        return {
          label: "غائب",
          style: "bg-rose-50 text-rose-700 border-rose-100",
          icon: <XCircle className="w-4 h-4 text-rose-600" />
        };
      default:
        return {
          label: "مجدولة",
          style: "bg-slate-100 text-slate-600 border-slate-200",
          icon: <HelpCircle className="w-4 h-4 text-slate-500" />
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

  return (
    <div className="space-y-6" id="lectures-tab">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start sm:items-center gap-4 bg-white p-3 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900" id="lectures-title">سجل متابعة المحاضرات</h2>
          <p className="text-xs text-slate-500 mt-1">
            سجل المحاضرات التي حضرتها، اكتب ملاحظاتك، وراجع أهم النقاط بسهولة.
          </p>
        </div>
        <button 
          onClick={handleOpenAdd}
          disabled={courses.length === 0}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-sm hover:shadow-indigo-100 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          تسجيل محاضرة
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">يرجى تسجيل مادة دراسية أولاً</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            قبل تسجيل حضور المحاضرات، يجب عليك إنشاء المواد الدراسية في قسم "المواد".
          </p>
        </div>
      ) : (
        <>
          {/* Filters controls */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex flex-wrap gap-3 items-center">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> تصفية السجل:
            </span>

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
              <option value="all">جميع الحالات</option>
              <option value="attended">تم الحضور</option>
              <option value="missed">غائب</option>
              <option value="scheduled">مجدولة</option>
            </select>
          </div>

          {/* Lectures List */}
          {filteredLectures.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد محاضرات تطابق خيارات التصفية المحددة.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLectures.map((lec) => {
                const course = courses.find(c => c.id === lec.courseId);
                const badge = getStatusBadge(lec.status);
                const isExpanded = !!expandedLectures[lec.id];

                return (
                  <motion.div 
                    key={lec.id}
                    layout="position"
                    onClick={() => toggleExpand(lec.id)}
                    className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden cursor-pointer hover:border-slate-200 transition"
                  >
                    {/* Header line of card */}
                    <div className="p-3 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        {/* Course visual color tag */}
                        <div className={`w-2.5 h-10 rounded-full shrink-0 ${getCourseColor(lec.courseId)}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-indigo-600">
                              {course?.code} - {course?.name}
                            </span>
                            <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-md flex items-center gap-1 ${badge.style}`}>
                              {badge.icon}
                              {badge.label}
                            </span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-base mt-1.5">{lec.title}</h3>
                          
                          <div className="flex gap-4 text-xs text-slate-400 mt-2 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-300" />
                              {lec.date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-300" />
                              {lec.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card header */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button 
                          onClick={(e) => handleOpenEdit(lec, e)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {lectureToDeleteId === lec.id ? (
                          <div className="flex items-center gap-1 bg-rose-50 p-1.5 rounded-xl border border-rose-100 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] font-black text-rose-700 px-1">حذف؟</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLecture(lec.id);
                                setLectureToDeleteId(null);
                              }}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              نعم
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLectureToDeleteId(null);
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
                              setLectureToDeleteId(lec.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Notes Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-slate-50 bg-slate-50/50"
                        >
                          <div className="p-3 sm:p-5 space-y-4">
                            {/* Notes text */}
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                الملاحظات والملخص المدون:
                              </h4>
                              <div className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                {lec.notes || <span className="text-slate-400 italic">لا توجد ملاحظات مدونة لهذه المحاضرة. يمكنك النقر على تعديل لإضافتها.</span>}
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
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-3 sm:p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingLecture ? "تعديل تفاصيل المحاضرة" : "تسجيل محاضرة جديدة"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Course select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">المادة الدراسية</label>
                <select
                  required
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition text-slate-700 bg-white"
                >
                  <option value="" disabled>اختر المادة الدراسية...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">عنوان أو موضوع المحاضرة</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مقدمة في المتجهات، قواعد البيانات..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">تاريخ المحاضرة</label>
                  <input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">وقت المحاضرة</label>
                  <input 
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">حالة الحضور</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "attended", label: "تم الحضور", style: "border-emerald-200 text-emerald-700 bg-emerald-50/30", activeStyle: "bg-emerald-600 text-white border-emerald-600" },
                    { val: "missed", label: "غائب", style: "border-rose-200 text-rose-700 bg-rose-50/30", activeStyle: "bg-rose-600 text-white border-rose-600" },
                    { val: "scheduled", label: "مجدولة قادمة", style: "border-slate-200 text-slate-700 bg-slate-50/30", activeStyle: "bg-slate-700 text-white border-slate-700" }
                  ].map((s) => {
                    const isSelected = status === s.val;
                    return (
                      <button
                        key={s.val}
                        type="button"
                        onClick={() => setStatus(s.val as LectureStatus)}
                        className={`py-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                          isSelected ? s.activeStyle : s.style + " hover:bg-slate-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">ملاحظات الدرس وتفاصيل المحاضرة</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="اكتب ملاحظاتك، أهم الأفكار، الواجبات المطلوبة، أو أسئلة للمراجعة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm hover:shadow-indigo-100 cursor-pointer"
                >
                  {editingLecture ? "حفظ التعديلات" : "تسجيل المحاضرة"}
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
    </div>
  );
}
