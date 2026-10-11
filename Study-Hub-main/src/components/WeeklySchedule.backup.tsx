import { useState } from "react";
import { CalendarDays, Clock, BookOpen, GraduationCap, FileDown, X, Info } from "lucide-react";
import { Course, Assignment, UserProfile } from "../types";

interface WeeklyScheduleProps {
  courses: Course[];
  assignments?: Assignment[];
  profile?: UserProfile;
  onSelectCourse: (courseId: string) => void;
}

export default function WeeklySchedule({ 
  courses, 
  assignments = [], 
  profile = { name: "أحمد العامري", major: "هندسة برمجيات", university: "جامعة الملك سعود" }, 
  onSelectCourse 
}: WeeklyScheduleProps) {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const daysOfWeek = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

  // Helper to find courses scheduled for a specific day
  const getCoursesForDay = (day: string) => {
    const list: { course: Course; time: string }[] = [];
    courses.forEach((c) => {
      c.schedule.forEach((s) => {
        // Simple string matching to handle slight deviations
        if (s.day.trim() === day.trim()) {
          list.push({ course: c, time: s.time });
        }
      });
    });
    // Sort courses by start time if possible, otherwise keep original order
    return list.sort((a, b) => a.time.localeCompare(b.time));
  };

  const getColorClasses = (color: string) => {
    const map: Record<string, { bg: string, text: string, border: string, dot: string }> = {
      sky: { bg: "bg-sky-50/70", text: "text-sky-700", border: "border-sky-100/70", dot: "bg-sky-500" },
      emerald: { bg: "bg-emerald-50/70", text: "text-emerald-700", border: "border-emerald-100/70", dot: "bg-emerald-500" },
      indigo: { bg: "bg-indigo-50/70", text: "text-indigo-700", border: "border-indigo-100/70", dot: "bg-indigo-500" },
      rose: { bg: "bg-rose-50/70", text: "text-rose-700", border: "border-rose-100/70", dot: "bg-rose-500" },
      amber: { bg: "bg-amber-50/70", text: "text-amber-700", border: "border-amber-100/70", dot: "bg-amber-500" },
      violet: { bg: "bg-violet-50/70", text: "text-violet-700", border: "border-violet-100/70", dot: "bg-violet-500" }
    };
    return map[color] || map.indigo;
  };

  // Google Calendar/External Calendar Sync (.ics export)
  const handleExportICS = () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Academic Tracker//Academic Schedule//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:الجدول والواجبات الأكاديمية",
      "X-WR-TIMEZONE:Asia/Riyadh"
    ];

    const dayMap: Record<string, string> = {
      "الأحد": "SU",
      "الاثنين": "MO",
      "الثلاثاء": "TU",
      "الأربعاء": "WE",
      "الخميس": "TH",
      "الجمعة": "FR",
      "السبت": "SA"
    };

    // 1. Add recurring lecture sessions
    courses.forEach(course => {
      course.schedule.forEach((s, idx) => {
        const byDay = dayMap[s.day.trim()];
        if (!byDay) return;

        // Parse time, e.g. "10:00 - 11:30"
        const timeParts = s.time.split("-");
        const startTimeStr = timeParts[0]?.trim() || "08:00";
        const endTimeStr = timeParts[1]?.trim() || "09:30";

        const startHour = startTimeStr.split(":")[0]?.padStart(2, "0") || "08";
        const startMin = startTimeStr.split(":")[1]?.padStart(2, "0") || "00";
        const endHour = endTimeStr.split(":")[0]?.padStart(2, "0") || "09";
        const endMin = endTimeStr.split(":")[1]?.padStart(2, "0") || "30";

        // Align base recurrent starts to a baseline week in 2026 (e.g., July 12, 2026 is Sunday)
        const baseDays: Record<string, string> = {
          "الأحد": "20260712",
          "الاثنين": "20260713",
          "الثلاثاء": "20260714",
          "الأربعاء": "20260715",
          "الخميس": "20260716",
          "الجمعة": "20260717",
          "السبت": "20260718"
        };

        const dateStr = baseDays[s.day.trim()] || "20260712";
        const dtStart = `${dateStr}T${startHour}${startMin}00`;
        const dtEnd = `${dateStr}T${endHour}${endMin}00`;

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:course-${course.id}-${idx}@academic-tracker`);
        lines.push(`DTSTAMP:20260711T140000Z`);
        lines.push(`SUMMARY:${course.name} (${course.code}) 📚`);
        lines.push(`DESCRIPTION:المحاضر: ${course.instructor}\\nالرمز الدراسي: ${course.code}`);
        lines.push(`DTSTART;TZID=Asia/Riyadh:${dtStart}`);
        lines.push(`DTEND;TZID=Asia/Riyadh:${dtEnd}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`);
        lines.push("END:VEVENT");
      });
    });

    // 2. Add assignments deadlines
    assignments.forEach(assign => {
      if (!assign.dueDate) return;
      const cleanDate = assign.dueDate.replace(/-/g, ""); // "20260715"
      const course = courses.find(c => c.id === assign.courseId);
      const coursePrefix = course ? `${course.name} - ` : "";

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:assign-${assign.id}@academic-tracker`);
      lines.push(`DTSTAMP:20260711T140000Z`);
      lines.push(`SUMMARY:تسليم واجب: ${coursePrefix}${assign.title} 📝`);
      lines.push(`DESCRIPTION:الوصف التفصيلي: ${assign.description || 'لا يوجد تفاصيل'}\\nالأولوية الأكاديمية: ${assign.priority === 'high' ? 'عالية جداً' : assign.priority === 'medium' ? 'متوسطة' : 'منخفضة'}\\nحالة التسليم الحالية: ${assign.status === 'pending' ? 'بانتظار العمل عليها' : assign.status === 'submitted' ? 'تم التسليم والمراجعة' : 'تم رصد الدرجة'}`);
      lines.push(`DTSTART;VALUE=DATE:${cleanDate}`);
      lines.push(`DTEND;VALUE=DATE:${cleanDate}`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");

    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "academic_schedule.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowSyncModal(true);
  };

  // High-fidelity custom printable PDF generator
  const handlePrintPDF = () => {
    const getDayRowHtml = (day: string) => {
      const dayCourses = getCoursesForDay(day);
      if (dayCourses.length === 0) {
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 14px; font-weight: bold; background: #f8fafc; color: #475569; width: 110px; text-align: center; font-size: 13px;">${day}</td>
            <td colspan="3" style="padding: 14px; color: #94a3b8; font-style: italic; text-align: center; font-size: 12px;">لا توجد محاضرات في هذا اليوم الدراسي</td>
          </tr>
        `;
      }

      return dayCourses.map(({ course, time }, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          ${idx === 0 ? `<td rowspan="${dayCourses.length}" style="padding: 14px; font-weight: bold; background: #f8fafc; color: #475569; width: 110px; text-align: center; border-left: 1px solid #e2e8f0; vertical-align: middle; font-size: 13px;">${day}</td>` : ''}
          <td style="padding: 14px; font-weight: bold; color: #1e293b; font-size: 13px;">
            <span style="font-family: monospace; background: #f1f5f9; padding: 3px 7px; border-radius: 6px; font-size: 11px; margin-left: 8px; border: 1px solid #cbd5e1; color: #334155; font-weight: bold;">${course.code}</span>
            ${course.name}
          </td>
          <td style="padding: 14px; font-family: monospace; color: #4f46e5; font-weight: 800; font-size: 13px;">${time}</td>
          <td style="padding: 14px; color: #475569; font-size: 12px; font-weight: 600;">${course.instructor}</td>
        </tr>
      `).join('');
    };

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير الدراسي الموحد - الجدول الدراسي والواجبات</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
          
          body {
            font-family: 'Cairo', sans-serif;
            color: #334155;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 3px double #cbd5e1;
            padding-bottom: 22px;
            margin-bottom: 30px;
          }

          .header-title h1 {
            font-size: 26px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0 0 8px 0;
            letter-spacing: -0.5px;
          }

          .header-title p {
            font-size: 13px;
            color: #4f46e5;
            margin: 0;
            font-weight: 700;
          }

          .student-info {
            text-align: right;
            font-size: 12px;
            line-height: 1.7;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 12px 18px;
            border-radius: 12px;
            min-w-[280px];
          }

          .student-info div {
            margin-bottom: 3px;
          }

          .student-info strong {
            color: #0f172a;
          }

          .section-title {
            font-size: 17px;
            font-weight: 800;
            color: #4f46e5;
            margin: 30px 0 15px 0;
            display: flex;
            align-items: center;
            gap: 10px;
            border-right: 4px solid #4f46e5;
            padding-right: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 12px;
          }

          th {
            background-color: #4f46e5;
            color: #ffffff;
            font-weight: 700;
            padding: 12px;
            text-align: right;
            font-size: 13px;
          }

          td {
            padding: 12px;
            text-align: right;
          }

          .table-bordered {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }

          .table-bordered th, .table-bordered td {
            border: 1px solid #e2e8f0;
          }

          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: 700;
          }

          .badge-high { background-color: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }
          .badge-medium { background-color: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
          .badge-low { background-color: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

          .badge-pending { background-color: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
          .badge-submitted { background-color: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
          .badge-graded { background-color: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7; }

          .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            font-weight: bold;
          }

          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-title">
            <h1>التقرير الأكاديمي والجدول الدراسي الأسبوعي 🎓</h1>
            <p>الخطة الدراسية ومتابعة الواجبات الذكية</p>
          </div>
          <div class="student-info">
            <div><strong>اسم الطالب:</strong> ${profile.name || 'أحمد العامري'}</div>
            <div><strong>التخصص الدراسي:</strong> ${profile.major || 'هندسة برمجيات'}</div>
            <div><strong>الجامعة / الكلية:</strong> ${profile.university || 'جامعة الملك سعود'}</div>
            <div><strong>تاريخ التصدير:</strong> ${new Date().toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        <div class="section-title">أولاً: جدول المحاضرات الأسبوعي</div>
        <table class="table-bordered">
          <thead>
            <tr>
              <th style="width: 110px; text-align: center;">اليوم</th>
              <th>المقرر الدراسي</th>
              <th style="width: 150px;">التوقيت الزمني</th>
              <th>عضو هيئة التدريس</th>
            </tr>
          </thead>
          <tbody>
            ${daysOfWeek.map(day => getDayRowHtml(day)).join('')}
          </tbody>
        </table>

        <div class="section-title">ثانياً: قائمة الواجبات والتسليمات الأكاديمية</div>
        <table class="table-bordered">
          <thead>
            <tr>
              <th>المقرر الدراسي</th>
              <th>عنوان الواجب</th>
              <th>الوصف والتفاصيل</th>
              <th style="width: 120px;">تاريخ الاستحقاق</th>
              <th style="width: 80px; text-align: center;">الأولوية</th>
              <th style="width: 100px; text-align: center;">الحالة</th>
              <th style="width: 80px; text-align: center;">الدرجة</th>
            </tr>
          </thead>
          <tbody>
            ${assignments.length === 0 ? `
              <tr>
                <td colspan="7" style="padding: 24px; text-align: center; color: #94a3b8; font-style: italic; font-size: 13px;">لا توجد واجبات دراسية مضافة حالياً.</td>
              </tr>
            ` : assignments.map(assign => {
              const course = courses.find(c => c.id === assign.courseId);
              const priorityBadge = assign.priority === 'high' 
                ? '<span class="badge badge-high">عالية</span>' 
                : assign.priority === 'medium' 
                  ? '<span class="badge badge-medium">متوسطة</span>' 
                  : '<span class="badge badge-low">منخفضة</span>';
              const statusBadge = assign.status === 'pending'
                ? '<span class="badge badge-pending">قيد الانتظار</span>'
                : assign.status === 'submitted'
                  ? '<span class="badge badge-submitted">تم التسليم</span>'
                  : '<span class="badge badge-graded">تم الرصد</span>';

              return `
                <tr>
                  <td style="font-weight: bold; color: #1e293b; font-size: 13px;">
                    ${course ? `<span style="font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; border: 1px solid #cbd5e1; margin-left: 6px; font-weight: bold; color: #334155;">${course.code}</span> ${course.name}` : 'عام'}
                  </td>
                  <td style="font-weight: bold; color: #0f172a; font-size: 13px;">${assign.title}</td>
                  <td style="color: #64748b; font-size: 12px; max-width: 250px;">${assign.description || '-'}</td>
                  <td style="font-family: monospace; color: #4f46e5; font-weight: bold; font-size: 12px;">${assign.dueDate}</td>
                  <td style="text-align: center;">${priorityBadge}</td>
                  <td style="text-align: center;">${statusBadge}</td>
                  <td style="text-align: center; font-weight: 800; color: #0f172a; font-size: 12px;">${assign.grade || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          تم استخراج هذا المستند بشكل رسمي وموثق بواسطة تطبيق المتابع الدراسي الذكي © ${new Date().getFullYear()}
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="schedule-tab">
      {/* Tab Header with Export utilities */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 justify-end" id="schedule-title">
            الجدول الدراسي الأسبوعي
            <CalendarDays className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            جدول زمني متكامل للمحاضرات يوضح المواعيد والأيام الأكاديمية المسجلة.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto" dir="rtl">
            {/* Export as PDF */}
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 border border-indigo-100 shadow-3xs"
            >
              <FileDown className="w-4 h-4" />
              تصدير الجدول والواجبات (PDF)
            </button>
            
            {/* Sync to Google Calendar / ICS */}
            <button
              onClick={handleExportICS}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-xs shadow-emerald-100"
            >
              <CalendarDays className="w-4 h-4" />
              مزامنة مع تقويم Google (ملف ICS)
            </button>
          </div>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">الجدول الدراسي فارغ</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            قم بإضافة مقررات دراسية جديدة مع تحديد مواعيدها ليتم رسم جدولك الأسبوعي تلقائياً هنا.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {daysOfWeek.map((day) => {
            const dayCourses = getCoursesForDay(day);
            const isToday = day === ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()];

            return (
              <div 
                key={day} 
                className={`bg-white rounded-2xl border transition flex flex-col min-h-[350px] shadow-3xs ${
                  isToday 
                    ? "border-indigo-500/60 ring-1 ring-indigo-500/10 shadow-md" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {/* Day Header */}
                <div className={`p-4 border-b text-center rounded-t-2xl font-bold ${
                  isToday 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-50 text-slate-700"
                }`}>
                  <span className="text-sm block">{day}</span>
                  {isToday && <span className="text-[10px] font-semibold text-indigo-100">اليوم الدراسي</span>}
                </div>

                {/* Day Lectures list */}
                <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
                  {dayCourses.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 text-slate-300">
                      <Clock className="w-5 h-5 opacity-40 mb-1" />
                      <span className="text-[11px] font-medium text-slate-400">لا توجد محاضرات</span>
                    </div>
                  ) : (
                    dayCourses.map(({ course, time }) => {
                      const colors = getColorClasses(course.color);
                      return (
                        <div
                          key={`${course.id}-${time}`}
                          onClick={() => onSelectCourse(course.id)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 hover:-translate-y-0.5 ${colors.bg} ${colors.border} hover:shadow-xs group`}
                        >
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase font-mono tracking-tight bg-white px-1.5 py-0.5 rounded-md text-slate-600 border border-slate-100">
                              {course.code}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-800 text-xs leading-snug group-hover:text-indigo-600 transition">
                            {course.name}
                          </h4>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{time}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 font-sans">
                            <GraduationCap className="w-3 h-3 text-slate-300" />
                            <span className="truncate">{course.instructor}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Google Calendar Sync Instructions Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 sm:backdrop-blur-xs">
          {/* Backdrop click closer */}
          <div 
            className="fixed inset-0"
            onClick={() => setShowSyncModal(false)}
          />
          
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative z-10 p-6 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                تم تحميل ملف التقويم الأكاديمي بنجاح! 🎉
              </h3>
              <button 
                onClick={() => setShowSyncModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-bold">
                لقد قمنا بتوليد وتحميل الملف التقويمي الموحد <code className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700">academic_schedule.ics</code> الذي يحتوي على جميع محاضراتك الأسبوعية المجدولة كأحداث متكررة، بالإضافة لتواريخ تسليم كافة واجباتك الأكاديمية.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 text-right">
                <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-600" />
                  💡 خطوات المزامنة مع تقويم Google (Google Calendar):
                </h4>
                <ol className="list-decimal list-inside text-[11px] text-slate-600 space-y-2 font-medium">
                  <li>افتح <strong>تقويم Google</strong> في متصفحك عبر الرابط: <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">calendar.google.com</a></li>
                  <li>اضغط على أيقونة <strong>الإعدادات (شكل الترس)</strong> في أعلى الصفحة ثم اختر <strong>الإعدادات</strong>.</li>
                  <li>من القائمة الجانبية اليمنى، اضغط على تبويب <strong>الاستيراد والتصدير</strong>.</li>
                  <li>اضغط على خيار <strong>تحديد ملف من جهاز الكمبيوتر</strong>، ثم اختر ملف <code className="bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-700">academic_schedule.ics</code> الذي تم تحميله للتو.</li>
                  <li>اختر التقويم الذي تود استيراد المواعيد إليه (أو أنشئ تقويماً جديداً باسم "الجدول الأكاديمي")، ثم انقر على زر <strong>استيراد</strong>.</li>
                </ol>
              </div>

              <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3.5 text-[10px] text-indigo-900 leading-relaxed font-medium">
                📅 <strong>ملاحظة المزامنة الخارجية:</strong> هذا الملف متوافق كلياً مع جميع تطبيقات التقويم الأخرى مثل تقويم Apple (iCal) على هواتف الآيفون وأجهزة الماك، وتقويم Microsoft Outlook! فقط قم بفتح الملف على جهازك وسيتم إضافته لتقويمك تلقائياً.
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
