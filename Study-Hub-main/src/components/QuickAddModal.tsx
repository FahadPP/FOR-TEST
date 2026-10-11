import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckSquare, UserCheck, BookOpen } from "lucide-react";
import { Course } from "../types";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: string; // e.g., "assignments", "courses", "dashboard"
  courses: Course[];
  onAddAssignment: (assignment: any) => void;
  onAddLecture: (lecture: any) => void;
}

export default function QuickAddModal({
  isOpen,
  onClose,
  activeContext,
  courses,
  onAddAssignment,
  onAddLecture
}: QuickAddModalProps) {
  // Determine default type based on context
  const defaultType = activeContext === "assignments" ? "assignment" : "attendance";
  const [addType, setAddType] = useState<"assignment" | "attendance">(defaultType);

  // Assignment Form State
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignCourseId, setAssignCourseId] = useState("");

  // Attendance Form State
  const [attendanceCourseId, setAttendanceCourseId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"attended" | "missed">("attended");

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim() || !assignDueDate.trim() || !assignCourseId) {
      alert("الرجاء تعبئة اسم الواجب، التاريخ، والمادة.");
      return;
    }
    
    onAddAssignment({
      id: `assign-${Date.now()}`,
      courseId: assignCourseId,
      title: assignTitle,
      type: "assignment",
      dueDate: assignDueDate,
      priority: "medium",
      status: "pending",
      details: "",
      grade: 0
    });
    
    onClose();
    resetForms();
  };

  const handleSubmitAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceCourseId) {
      alert("الرجاء اختيار المادة.");
      return;
    }

    onAddLecture({
      id: `lec-${Date.now()}`,
      courseId: attendanceCourseId,
      date: new Date().toISOString().split("T")[0],
      topic: "تسجيل سريع",
      status: attendanceStatus,
      notes: ""
    });

    onClose();
    resetForms();
  };

  const resetForms = () => {
    setAssignTitle("");
    setAssignDueDate("");
    setAssignCourseId("");
    setAttendanceCourseId("");
    setAttendanceStatus("attended");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex gap-2 p-1 bg-slate-200/50 rounded-lg">
            <button
              onClick={() => setAddType("assignment")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                addType === "assignment" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              واجب
            </button>
            <button
              onClick={() => setAddType("attendance")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                addType === "attendance" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              غياب/حضور
            </button>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Forms */}
        <div className="p-5">
          {addType === "assignment" ? (
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">اسم الواجب أو المهمة</label>
                <input 
                  type="text" 
                  value={assignTitle}
                  onChange={e => setAssignTitle(e.target.value)}
                  placeholder="مثال: الواجب الأول"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">المادة</label>
                  <select
                    value={assignCourseId}
                    onChange={e => setAssignCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  >
                    <option value="" disabled>اختر...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">تاريخ التسليم</label>
                  <input 
                    type="date"
                    value={assignDueDate}
                    onChange={e => setAssignDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-indigo-200 cursor-pointer"
              >
                حفظ الواجب
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">اختر المادة</label>
                <select
                  value={attendanceCourseId}
                  onChange={e => setAttendanceCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="" disabled>اختر المادة...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">الحالة اليوم</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus("attended")}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition cursor-pointer ${
                      attendanceStatus === "attended" 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    حاضر ✅
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceStatus("missed")}
                    className={`py-2 rounded-xl text-sm font-bold border-2 transition cursor-pointer ${
                      attendanceStatus === "missed" 
                        ? "border-rose-500 bg-rose-50 text-rose-700" 
                        : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                    }`}
                  >
                    غائب ❌
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-md shadow-emerald-200 cursor-pointer mt-2"
              >
                تسجيل السجل
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
