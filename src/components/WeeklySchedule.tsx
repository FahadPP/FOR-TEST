import { useState } from "react";
import { 
  CalendarDays, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  FileDown, 
  X, 
  Info,
  LayoutGrid,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Check,
  UserCheck,
  Edit3,
  Bookmark
} from "lucide-react";
import { Course, Assignment, UserProfile, Lecture } from "../types";
import CourseDetailModal from "./CourseDetailModal";

interface WeeklyScheduleProps {
  courses: Course[];
  assignments?: Assignment[];
  lectures?: Lecture[];
  onAddLecture?: (lecture: Lecture) => void;
  onUpdateLecture?: (lecture: Lecture) => void;
  onDeleteLecture?: (lectureId: string) => void;
  profile?: UserProfile;
  onSelectCourse: (courseId: string) => void;
  onUpdateCourse?: (course: Course) => void;
  onSelectAssignment?: (assignmentId: string) => void;
  onNavigateToStudyHub?: (courseId?: string) => void;
}

export default function WeeklySchedule({ 
  courses, 
  assignments = [], 
  lectures = [],
  onAddLecture,
  onUpdateLecture,
  onDeleteLecture,
  profile = { name: "أحمد العامري", major: "هندسة برمجيات", university: "جامعة الملك سعود" }, 
  onSelectCourse,
  onUpdateCourse,
  onSelectAssignment,
  onNavigateToStudyHub
}: WeeklyScheduleProps) {
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [showOverdueDrawer, setShowOverdueDrawer] = useState(false);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);
  // Quick Lecture Details/Title edit modal
  const [editingLectureModal, setEditingLectureModal] = useState<{
    course: Course;
    day: { dateStr: string; name: string };
    time: string;
    existingId?: string;
    title: string;
    status: 'attended' | 'missed' | 'scheduled';
    notes: string;
  } | null>(null);
  // Track expanded state for days that exceed the compact limit
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const toggleDayExpansion = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  // Helper to get Sunday (start of week) for any date
  const getWeekStartDate = (refDate: Date): Date => {
    const d = new Date(refDate);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 is Sunday ... 6 is Saturday
    d.setDate(d.getDate() - day);
    return d;
  };

  const formatLocalDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Hijri date formatters (Umm al-Qura calendar standard)
  const formatHijriFull = (d: Date): string => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return '';
    }
  };

  const formatHijriShort = (d: Date): string => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'short'
      }).format(d);
    } catch {
      return '';
    }
  };

  const ALL_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const monthNamesArabic = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const weekStart = getWeekStartDate(selectedDate);
  const realToday = new Date();
  realToday.setHours(0, 0, 0, 0);
  const realTodayStr = formatLocalDateStr(realToday);
  const realTodayName = ALL_DAY_NAMES[realToday.getDay()];
  const todayHijriStr = formatHijriFull(realToday);

  const realWeekStart = getWeekStartDate(realToday);
  const isCurrentWeek = realWeekStart.getTime() === weekStart.getTime();

  // Generate the 7 concrete days for this viewed week with Hijri & Gregorian dates
  const weekDays = ALL_DAY_NAMES.map((name, idx) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + idx);
    d.setHours(0, 0, 0, 0);
    const dateStr = formatLocalDateStr(d);
    const isToday = dateStr === realTodayStr;

    return {
      name,
      dateStr,
      displayDate: `${d.getDate()} ${monthNamesArabic[d.getMonth()]}`,
      hijriDate: formatHijriShort(d),
      dayNumber: d.getDate(),
      isToday,
      dateObj: d
    };
  });

  // Unified full week days
  const displayedDays = weekDays;
  const daysOfWeek = displayedDays.map(d => d.name);

  // Navigation handlers
  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleGoToCurrentWeek = () => {
    setSelectedDate(new Date());
  };

  const firstDay = displayedDays[0];
  const lastDay = displayedDays[displayedDays.length - 1];
  const weekRangeLabel = firstDay && lastDay 
    ? `${firstDay.name} ${firstDay.displayDate} (${firstDay.hijriDate}) – ${lastDay.name} ${lastDay.displayDate} (${lastDay.hijriDate})`
    : "";

  // Helper to normalize Arabic day names (handles همزة variations like الأحد / الاحد, الإثنين / الاثنين, الأربعاء / الاربعاء)
  const normalizeDay = (d: string): string => {
    return d.trim().replace(/[أإآ]/g, "ا").replace(/ة$/g, "ه");
  };

  // Helper to find courses scheduled for a specific day
  const getCoursesForDay = (day: string) => {
    const target = normalizeDay(day);
    const list: { course: Course; time: string }[] = [];
    courses.forEach((c) => {
      (c.schedule || []).forEach((s) => {
        if (normalizeDay(s.day) === target) {
          list.push({ course: c, time: s.time });
        }
      });
    });
    return list.sort((a, b) => a.time.localeCompare(b.time));
  };

  // Helper to find assignments due on an EXACT concrete date (YYYY-MM-DD)
  const getAssignmentsForDate = (dateStr: string) => {
    return assignments.filter((assign) => assign.dueDate === dateStr);
  };

  // Detect overdue items that belong to past dates outside the currently displayed week
  const overdueOutsideView = assignments.filter((assign) => {
    if (assign.status === 'submitted' || !assign.dueDate) return false;
    const parts = assign.dueDate.split("-").map(Number);
    if (parts.length !== 3) return false;
    const due = new Date(parts[0], parts[1] - 1, parts[2]);
    due.setHours(0, 0, 0, 0);

    const isInCurrentView = displayedDays.some((d) => d.dateStr === assign.dueDate);
    return due.getTime() < realToday.getTime() && !isInCurrentView;
  });

  // Helper to determine truthful assignment due status relative to real today
  const getAssignmentDueStatus = (dueDateStr?: string, status?: string) => {
    if (status === 'submitted') {
      return {
        statusText: 'تم التسليم ✓',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isToday: false,
        isOverdue: false,
      };
    }

    if (!dueDateStr) {
      return {
        statusText: 'تسليم مجدول',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        isToday: false,
        isOverdue: false,
      };
    }

    const [year, month, day] = dueDateStr.split("-").map(Number);
    if (!year || !month || !day) {
      return {
        statusText: 'تسليم مجدول',
        badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
        isToday: false,
        isOverdue: false,
      };
    }

    const dueDateObj = new Date(year, month - 1, day);
    dueDateObj.setHours(0, 0, 0, 0);

    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    const diffTime = dueDateObj.getTime() - todayObj.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        statusText: 'مستحق اليوم 📍',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold shadow-2xs',
        isToday: true,
        isOverdue: false,
      };
    } else if (diffDays === 1) {
      return {
        statusText: 'مستحق غداً ⏳',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        isToday: false,
        isOverdue: false,
      };
    } else if (diffDays < 0) {
      const daysAgo = Math.abs(diffDays);
      return {
        statusText: `تجاوز موعده (${daysAgo} ${daysAgo === 1 ? 'يوم' : daysAgo === 2 ? 'يومين' : 'أيام'}) ⚠️`,
        badgeClass: 'bg-red-100 text-red-800 border-red-300 font-extrabold',
        isToday: false,
        isOverdue: true,
      };
    } else {
      return {
        statusText: `مستحق بعد ${diffDays} يوم`,
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
        isToday: false,
        isOverdue: false,
      };
    }
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

  // Helper to find attendance record for a course on an exact date & time
  const getLectureAttendance = (courseId: string, dateStr: string, timeStr?: string) => {
    if (!lectures || lectures.length === 0) return null;
    return lectures.find(l => {
      if (l.courseId !== courseId || l.date !== dateStr) return false;
      if (timeStr && l.time && l.time !== "00:00") {
        return l.time === timeStr;
      }
      return true;
    }) || null;
  };

  // Helper to determine the lecture topic / title for a scheduled course session
  const getLectureDisplayTitle = (course: Course, day: { dateStr: string; name: string }, time: string) => {
    const attendance = getLectureAttendance(course.id, day.dateStr, time);
    if (attendance && attendance.title && attendance.title.trim()) {
      return attendance.title;
    }
    
    // Check if there is another lecture for this course on this day
    const sameDayLec = (lectures || []).find(l => l.courseId === course.id && l.date === day.dateStr);
    if (sameDayLec && sameDayLec.title && sameDayLec.title.trim()) {
      return sameDayLec.title;
    }

    // Calculate smart lecture number sequence based on past dates in semester
    const courseLectures = (lectures || []).filter(l => l.courseId === course.id);
    const priorLecturesCount = courseLectures.filter(l => l.date < day.dateStr).length;
    const lectureNum = priorLecturesCount + 1;

    return `محاضرة ${day.name} #${lectureNum}`;
  };

  // Open quick modal to edit lecture title and notes
  const handleOpenQuickLectureEdit = (
    e: React.MouseEvent,
    course: Course,
    day: { dateStr: string; name: string },
    time: string,
    currentTitle: string,
    existingAttendance: Lecture | null
  ) => {
    e.stopPropagation();
    setEditingLectureModal({
      course,
      day,
      time,
      existingId: existingAttendance?.id,
      title: existingAttendance?.title || currentTitle,
      status: existingAttendance?.status || 'attended',
      notes: existingAttendance?.notes || ''
    });
  };

  const handleSaveQuickLectureModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLectureModal) return;

    const { course, day, time, existingId, title, status, notes } = editingLectureModal;
    const finalTitle = title.trim() || `محاضرة ${course.name} - ${day.name}`;

    if (existingId) {
      const existing = (lectures || []).find(l => l.id === existingId);
      if (existing && onUpdateLecture) {
        onUpdateLecture({
          ...existing,
          title: finalTitle,
          status,
          notes
        });
      }
    } else {
      if (onAddLecture) {
        const newLec: Lecture = {
          id: `lec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          courseId: course.id,
          title: finalTitle,
          date: day.dateStr,
          time: time || "00:00",
          status,
          notes
        };
        onAddLecture(newLec);
      }
    }

    setEditingLectureModal(null);
  };

  // Toggle or record attendance directly from Weekly Schedule
  const handleToggleAttendance = (
    e: React.MouseEvent,
    course: Course,
    day: { dateStr: string; name: string },
    time: string,
    targetStatus: 'attended' | 'missed'
  ) => {
    e.stopPropagation();
    const existing = getLectureAttendance(course.id, day.dateStr, time);

    if (existing) {
      if (existing.status === targetStatus) {
        // Clicking same status again unsets / cancels it
        if (onDeleteLecture) {
          onDeleteLecture(existing.id);
        }
      } else {
        // Toggle from attended to missed or vice versa
        if (onUpdateLecture) {
          onUpdateLecture({
            ...existing,
            status: targetStatus,
            notes: existing.notes || `تم رصد الحالة من الجدول الأسبوعي (${day.name} ${day.dateStr})`
          });
        }
      }
    } else {
      // Create new lecture attendance record with truthful display title
      if (onAddLecture) {
        const defaultTitle = getLectureDisplayTitle(course, day, time);
        const newLec: Lecture = {
          id: `lec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          courseId: course.id,
          title: defaultTitle,
          date: day.dateStr,
          time: time || "00:00",
          status: targetStatus,
          notes: `تم رصد الحضور من الجدول الأسبوعي (${day.name} ${day.dateStr})`
        };
        onAddLecture(newLec);
      }
    }
  };

  // Calculate attendance for active viewed week
  const activeWeekDates = displayedDays.map(d => d.dateStr);
  const weekLectures = (lectures || []).filter(l => activeWeekDates.includes(l.date));
  const weekAttendedCount = weekLectures.filter(l => l.status === "attended").length;
  const weekMissedCount = weekLectures.filter(l => l.status === "missed").length;

  // Google Calendar/External Calendar Sync (.ics export)
  const handleExportICS = () => {
    const escapeICS = (str: string) =>
      (str || "")
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");

    const nowUTC = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Masirati Platform//Academic Schedule//AR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:جدولي الدراسي - منصة مسيرتي",
      "X-WR-TIMEZONE:Asia/Riyadh",
      "BEGIN:VTIMEZONE",
      "TZID:Asia/Riyadh",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0300",
      "TZOFFSETTO:+0300",
      "TZNAME:+03",
      "DTSTART:19700101T000000",
      "END:STANDARD",
      "END:VTIMEZONE"
    ];

    const dayIndexMap: Record<string, { byDay: string; dayOffset: number }> = {
      [normalizeDay("الأحد")]: { byDay: "SU", dayOffset: 0 },
      [normalizeDay("الاثنين")]: { byDay: "MO", dayOffset: 1 },
      [normalizeDay("الثلاثاء")]: { byDay: "TU", dayOffset: 2 },
      [normalizeDay("الأربعاء")]: { byDay: "WE", dayOffset: 3 },
      [normalizeDay("الخميس")]: { byDay: "TH", dayOffset: 4 },
      [normalizeDay("الجمعة")]: { byDay: "FR", dayOffset: 5 },
      [normalizeDay("السبت")]: { byDay: "SA", dayOffset: 6 }
    };

    const formatICSDateOnly = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${dayNum}`;
    };

    // Use the start of the currently viewed week so events appear immediately on the user's current calendar view
    const baseWeekSunday = new Date(weekStart);
    baseWeekSunday.setHours(0, 0, 0, 0);

    // 1. Add recurring lecture sessions
    courses.forEach(course => {
      (course.schedule || []).forEach((s, idx) => {
        const dayInfo = dayIndexMap[normalizeDay(s.day)];
        if (!dayInfo) return;

        // Safely extract HH:MM pairs from time string (e.g., "09:00 - 10:30" or "9:00 - 10:30")
        const timeMatches = Array.from((s.time || "").matchAll(/(\d{1,2}):(\d{2})/g));
        let startH = 9, startM = 0, endH = 10, endM = 30;
        if (timeMatches.length >= 1) {
          startH = Math.min(23, Math.max(0, parseInt(timeMatches[0][1], 10)));
          startM = Math.min(59, Math.max(0, parseInt(timeMatches[0][2], 10)));
          if (timeMatches.length >= 2) {
            endH = Math.min(23, Math.max(0, parseInt(timeMatches[1][1], 10)));
            endM = Math.min(59, Math.max(0, parseInt(timeMatches[1][2], 10)));
          } else {
            endH = Math.min(23, startH + 1);
            endM = startM;
          }
        }

        // Ensure end time is after start time
        if (endH < startH || (endH === startH && endM <= startM)) {
          endH = Math.min(23, startH + 1);
          endM = startM;
        }

        const eventDate = new Date(baseWeekSunday);
        eventDate.setDate(baseWeekSunday.getDate() + dayInfo.dayOffset);
        const dateStr = formatICSDateOnly(eventDate);

        const startHourStr = String(startH).padStart(2, "0");
        const startMinStr = String(startM).padStart(2, "0");
        const endHourStr = String(endH).padStart(2, "0");
        const endMinStr = String(endM).padStart(2, "0");

        const dtStart = `${dateStr}T${startHourStr}${startMinStr}00`;
        const dtEnd = `${dateStr}T${endHourStr}${endMinStr}00`;

        const eventDateStr = formatLocalDateStr(eventDate);
        const lectureTitle = getLectureDisplayTitle(course, { dateStr: eventDateStr, name: s.day }, s.time);
        const attendance = getLectureAttendance(course.id, eventDateStr, s.time);
        const statusLabel = attendance?.status === 'attended' ? 'تم الحضور ✓' : attendance?.status === 'missed' ? 'غائب ✕' : 'مجدولة';

        lines.push("BEGIN:VEVENT");
        lines.push(`UID:masirati-course-${course.id}-${idx}@masirati.app`);
        lines.push(`DTSTAMP:${nowUTC}`);
        lines.push(`SUMMARY:${escapeICS(`محاضرة: ${lectureTitle} - ${course.name} (${course.code}) 📚`)}`);
        lines.push(`DESCRIPTION:${escapeICS(`موضوع وعنوان المحاضرة: ${lectureTitle}\nالمقرر: ${course.name}\nالرمز: ${course.code}\nحالة الحضور: ${statusLabel}\nالمحاضر: ${course.instructor || "غير محدد"}\nالوقت: ${s.time}${attendance?.notes ? `\nالملاحظات: ${attendance.notes}` : ''}`)}`);
        lines.push(`DTSTART;TZID=Asia/Riyadh:${dtStart}`);
        lines.push(`DTEND;TZID=Asia/Riyadh:${dtEnd}`);
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${dayInfo.byDay};COUNT=18`);
        lines.push("STATUS:CONFIRMED");
        lines.push("END:VEVENT");
      });
    });

    // 2. Add assignments deadlines (RFC 5545 requires exclusive DTEND = next day for VALUE=DATE)
    assignments.forEach(assign => {
      if (!assign.dueDate) return;
      const parts = assign.dueDate.split("-").map(Number);
      if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return;

      const startDateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const endDateObj = new Date(parts[0], parts[1] - 1, parts[2] + 1); // Next day (non-inclusive DTEND)

      const dtStartDate = formatICSDateOnly(startDateObj);
      const dtEndDate = formatICSDateOnly(endDateObj);

      const course = courses.find(c => c.id === assign.courseId);
      const coursePrefix = course ? `${course.name} - ` : "";
      const typeLabel = assign.type === "quiz" ? "اختبار قصير (كويز)" : assign.type === "project" ? "مشروع" : "تسليم واجب";

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:masirati-assign-${assign.id}@masirati.app`);
      lines.push(`DTSTAMP:${nowUTC}`);
      lines.push(`SUMMARY:${escapeICS(`${typeLabel}: ${coursePrefix}${assign.title} 📝`)}`);
      lines.push(`DESCRIPTION:${escapeICS(`الوصف: ${assign.description || "لا يوجد تفاصيل"}\nالأولوية: ${assign.priority === "high" ? "عالية جداً" : assign.priority === "medium" ? "متوسطة" : "منخفضة"}\nالحالة: ${assign.status === "pending" ? "قيد الإنجاز" : "تم التسليم"}`)}`);
      lines.push(`DTSTART;VALUE=DATE:${dtStartDate}`);
      lines.push(`DTEND;VALUE=DATE:${dtEndDate}`);
      lines.push("STATUS:CONFIRMED");
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

  // High-fidelity custom printable PDF generator - optimized for Landscape calendar view
  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Build the 7-day calendar columns (matching displayed week)
    const calendarHeadersHtml = displayedDays.map(d => `
      <th style="width: 14.28%; padding: 8px 6px; text-align: center; vertical-align: top; background: ${d.isToday ? '#4338ca' : '#4f46e5'}; color: white; border: 1px solid #cbd5e1;">
        <div style="font-weight: 800; font-size: 13px;">${d.name}</div>
        <div style="font-size: 10px; opacity: 0.9; font-family: monospace; margin-top: 2px;">${d.displayDate}</div>
        <div style="font-size: 9px; opacity: 0.8; margin-top: 1px;">${d.hijriDate}</div>
        ${d.isToday ? '<div style="background: #fbbf24; color: #1e1b4b; font-size: 9px; font-weight: bold; border-radius: 4px; padding: 1px 4px; margin-top: 3px; display: inline-block;">اليوم الحالي</div>' : ''}
      </th>
    `).join('');

    const calendarCellsHtml = displayedDays.map(d => {
      const dayCourses = getCoursesForDay(d.name);
      const dayAssigns = getAssignmentsForDate(d.dateStr);

      const totalItemsCount = dayAssigns.length + dayCourses.length;
      const MAX_PDF_ITEMS = 3;
      const hasExcess = totalItemsCount > MAX_PDF_ITEMS;

      // Select top items for clean print presentation
      let visibleAssigns = dayAssigns;
      let visibleCourses = dayCourses;

      if (hasExcess) {
        if (dayAssigns.length >= MAX_PDF_ITEMS) {
          visibleAssigns = dayAssigns.slice(0, MAX_PDF_ITEMS);
          visibleCourses = [];
        } else {
          visibleAssigns = dayAssigns;
          const remainingSlots = MAX_PDF_ITEMS - dayAssigns.length;
          visibleCourses = dayCourses.slice(0, remainingSlots);
        }
      }

      const excessCount = totalItemsCount - MAX_PDF_ITEMS;

      const coursesHtml = visibleCourses.length === 0 ? '' : visibleCourses.map(({ course, time }) => {
        const attendance = getLectureAttendance(course.id, d.dateStr, time);
        const isAttended = attendance?.status === 'attended';
        const isMissed = attendance?.status === 'missed';
        const lectureTitle = getLectureDisplayTitle(course, d, time);

        return `
        <div style="background: ${isAttended ? '#f0fdf4' : isMissed ? '#fff1f2' : '#f8fafc'}; border: 1px solid ${isAttended ? '#bbf7d0' : isMissed ? '#fecdd3' : '#e2e8f0'}; border-right: 3px solid ${isAttended ? '#16a34a' : isMissed ? '#e11d48' : '#6366f1'}; border-radius: 6px; padding: 5px 6px; margin-bottom: 5px; text-align: right;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <span style="font-family: monospace; font-size: 8px; font-weight: 800; background: #e0e7ff; color: #3730a3; padding: 1px 3px; border-radius: 3px;">${course.code}</span>
            ${isAttended ? '<span style="font-size: 8px; font-weight: 800; background: #dcfce7; color: #15803d; padding: 1px 4px; border-radius: 3px;">حاضر ✓</span>' : isMissed ? '<span style="font-size: 8px; font-weight: 800; background: #ffe4e6; color: #be123c; padding: 1px 4px; border-radius: 3px;">غائب ✕</span>' : '<span style="font-size: 8px; color: #64748b; background: #f1f5f9; padding: 1px 3px; border-radius: 3px;">مجدولة</span>'}
          </div>

          <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; line-height: 1.25; margin-bottom: 2px;">
            <span style="color: #4f46e5; font-size: 8px; font-weight: 800; display: block;">📌 موضوع المحاضرة:</span>
            ${lectureTitle}
          </div>

          <div style="font-size: 8.5px; color: #475569; font-weight: 600; margin-top: 1px;">
            المقرر: ${course.name}
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; font-size: 8px; color: #64748b;">
            <span>${course.instructor ? `👨‍🏫 ${course.instructor}` : ''}</span>
            <span style="font-family: monospace; color: #4338ca; font-weight: 700;">🕒 ${time}</span>
          </div>
        </div>
      `;
      }).join('');

      const assignsHtml = visibleAssigns.length === 0 ? '' : visibleAssigns.map(assign => {
        const typeBg = assign.type === 'quiz' ? '#fef3c7' : assign.type === 'project' ? '#f3e8ff' : '#e0e7ff';
        const typeColor = assign.type === 'quiz' ? '#92400e' : assign.type === 'project' ? '#6b21a8' : '#3730a3';
        const typeLabel = assign.type === 'quiz' ? 'كويز' : assign.type === 'project' ? 'مشروع' : 'واجب';
        const isDone = assign.status === 'submitted';

        return `
          <div style="background: ${isDone ? '#f0fdf4' : '#fff7ed'}; border: 1px solid ${isDone ? '#bbf7d0' : '#fed7aa'}; border-right: 3px solid ${isDone ? '#22c55e' : '#f97316'}; border-radius: 5px; padding: 4px 5px; margin-bottom: 4px; text-align: right;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 3px; margin-bottom: 1px;">
              <span style="font-size: 8.5px; font-weight: 800; background: ${typeBg}; color: ${typeColor}; padding: 1px 3px; border-radius: 3px;">${typeLabel}</span>
              ${isDone ? '<span style="font-size: 8.5px; color: #15803d; font-weight: bold;">تم ✓</span>' : ''}
            </div>
            <div style="font-size: 9.5px; font-weight: 800; color: #0f172a; line-height: 1.2;">${assign.title}</div>
            ${assign.grade ? `<div style="font-size: 8.5px; color: #047857; font-weight: bold; margin-top: 1px;">الدرجة: ${assign.grade}</div>` : ''}
          </div>
        `;
      }).join('');

      const excessPillHtml = hasExcess ? `
        <div style="background: #eef2ff; border: 1px dashed #6366f1; border-radius: 4px; padding: 2px 4px; text-align: center; font-size: 8.5px; font-weight: 800; color: #4338ca; margin-top: 2px;">
          +${excessCount} مهام أخرى (مفصلة بالجدول أدناه)
        </div>
      ` : '';

      const isEmpty = dayCourses.length === 0 && dayAssigns.length === 0;

      return `
        <td style="width: 14.28%; padding: 5px; vertical-align: top; border: 1px solid #e2e8f0; background: ${d.isToday ? '#faf5ff' : 'white'};">
          ${isEmpty ? '<div style="color: #cbd5e1; font-size: 9.5px; text-align: center; padding: 20px 2px; font-style: italic;">لا توجد محاضرات أو تسليمات</div>' : ''}
          ${coursesHtml}
          ${assignsHtml}
          ${excessPillHtml}
        </td>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>الجدول الدراسي والتقويم الأسبوعي - ${weekRangeLabel}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');
          
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 12px;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }

          .title-area h1 {
            font-size: 19px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 0 0 3px 0;
          }

          .title-area p {
            font-size: 11px;
            color: #4f46e5;
            margin: 0;
            font-weight: 700;
          }

          .meta-info {
            display: flex;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 11px;
            align-items: center;
          }

          .meta-item strong {
            color: #0f172a;
            margin-left: 3px;
          }

          .calendar-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 12px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            overflow: hidden;
          }

          .section-subhead {
            font-size: 13px;
            font-weight: 800;
            color: #1e1b4b;
            margin: 12px 0 6px 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .assignments-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            table-layout: fixed;
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
          }

          .assignments-table th {
            background: #f1f5f9;
            color: #334155;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            text-align: right;
            font-weight: 800;
            font-size: 11px;
          }

          .assignments-table td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            text-align: right;
            vertical-align: middle;
          }

          .footer-note {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
            font-size: 10px;
            color: #64748b;
          }

          @media print {
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div class="title-area" style="display: flex; align-items: center; gap: 12px;">
            <img src="/logo.png" alt="مسيرتي" style="width: 40px; height: 40px; object-fit: contain;" />
            <div>
              <h1 style="margin: 0; font-size: 16px;">التقويم الأكاديمي والجدول الأسبوعي – مسيرتي</h1>
              <p style="margin: 2px 0 0 0;">${weekRangeLabel}</p>
            </div>
          </div>
          <div class="meta-info">
            <div class="meta-item"><strong>الطالب:</strong> ${profile.name || 'طالب جامعي'}</div>
            <div class="meta-item"><strong>التخصص:</strong> ${profile.major || 'جامعي'}</div>
            <div class="meta-item"><strong>الجامعة:</strong> ${profile.university || 'الجامعة'}</div>
            <div class="meta-item"><strong>اليوم:</strong> ${realTodayName} (${todayHijriStr})</div>
          </div>
        </div>

        <!-- 1. The Real Calendar Grid in Landscape -->
        <table class="calendar-table">
          <thead>
            <tr>
              ${calendarHeadersHtml}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${calendarCellsHtml}
            </tr>
          </tbody>
        </table>

        <!-- 2. Weekly Lecture Topics & Attendance Table -->
        ${displayedDays.some(day => getCoursesForDay(day.name).length > 0) ? `
          <div class="section-subhead">📚 سجل عناوين ومواضيع المحاضرات ورصد الحضور للأسبوع</div>
          <table class="assignments-table">
            <thead>
              <tr>
                <th style="width: 14%;">اليوم والتاريخ</th>
                <th style="width: 20%;">المقرر الدراسي</th>
                <th style="width: 28%;">عنوان وموضوع المحاضرة</th>
                <th style="width: 14%; text-align: center;">الوقت</th>
                <th style="width: 12%; text-align: center;">حالة الحضور</th>
                <th style="width: 12%;">المحاضر</th>
              </tr>
            </thead>
            <tbody>
              ${displayedDays.flatMap(day => {
                const dayCourses = getCoursesForDay(day.name);
                return dayCourses.map(({ course, time }) => {
                  const attendance = getLectureAttendance(course.id, day.dateStr, time);
                  const isAttended = attendance?.status === 'attended';
                  const isMissed = attendance?.status === 'missed';
                  const lectureTitle = getLectureDisplayTitle(course, day, time);
                  const statusLabel = isAttended ? 'حاضر ✓' : isMissed ? 'غائب ✕' : 'مجدولة';
                  const statusColor = isAttended ? '#15803d' : isMissed ? '#be123c' : '#64748b';
                  const statusBg = isAttended ? '#dcfce7' : isMissed ? '#ffe4e6' : '#f1f5f9';

                  return `
                    <tr style="${isAttended ? 'background: #f0fdf4;' : isMissed ? 'background: #fff1f2;' : ''}">
                      <td style="font-weight: 700; color: #1e293b;">
                        ${day.name} <span style="font-family: monospace; font-size: 8.5px; color: #64748b; display: block;">${day.dateStr}</span>
                      </td>
                      <td style="font-weight: 700; color: #1e293b;">
                        <span style="font-family: monospace; font-size: 8.5px; background: #e0e7ff; color: #3730a3; padding: 1px 4px; border-radius: 3px; margin-left: 3px;">${course.code}</span>
                        ${course.name}
                      </td>
                      <td style="font-weight: 800; color: #0f172a;">
                        <span style="color: #4f46e5; font-size: 8.5px; display: block;">📌 الموضوع:</span>
                        ${lectureTitle}
                      </td>
                      <td style="text-align: center; font-family: monospace; font-weight: bold; color: #4338ca;">
                        ${time}
                      </td>
                      <td style="text-align: center;">
                        <span style="font-size: 8.5px; font-weight: 800; background: ${statusBg}; color: ${statusColor}; padding: 2px 6px; border-radius: 4px;">
                          ${statusLabel}
                        </span>
                      </td>
                      <td style="font-size: 9px; color: #475569;">
                        ${course.instructor || '-'}
                      </td>
                    </tr>
                  `;
                });
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <!-- 3. Compact Assignment Details Table (if any assignments exist) -->
        ${assignments.length > 0 ? `
          <div class="section-subhead">📋 تفاصيل الواجبات والتكاليف المسجلة (${assignments.length})</div>
          <table class="assignments-table">
            <thead>
              <tr>
                <th style="width: 20%;">المقرر الدراسي</th>
                <th style="width: 25%;">عنوان التكليف / الواجب</th>
                <th style="width: 12%; text-align: center;">النوع</th>
                <th style="width: 15%; text-align: center;">تاريخ الاستحقاق</th>
                <th style="width: 12%; text-align: center;">الأولوية</th>
                <th style="width: 16%; text-align: center;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${assignments.map(assign => {
                const course = courses.find(c => c.id === assign.courseId);
                const typeLabel = assign.type === 'quiz' ? 'كويز' : assign.type === 'project' ? 'مشروع' : 'واجب';
                const prioLabel = assign.priority === 'high' ? 'عالية ⚠️' : assign.priority === 'medium' ? 'متوسطة' : 'منخفضة';
                const statusLabel = assign.status === 'submitted' ? 'تم التسليم ✓' : assign.status === 'graded' ? 'تم رصد الدرجة' : 'قيد الانتظار ⏳';
                const isOverdue = assign.dueDate && assign.dueDate < realTodayStr && assign.status !== 'submitted';

                return `
                  <tr style="${isOverdue ? 'background: #fff1f2;' : ''}">
                    <td style="font-weight: 700; color: #1e293b;">
                      ${course ? `<span style="font-family: monospace; font-size: 9px; background: #e2e8f0; padding: 1px 4px; border-radius: 3px; margin-left: 4px;">${course.code}</span> ${course.name}` : 'عام'}
                    </td>
                    <td style="font-weight: 700; color: #0f172a;">${assign.title}</td>
                    <td style="text-align: center; font-weight: bold;">${typeLabel}</td>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: ${isOverdue ? '#b91c1c' : '#4338ca'};">
                      ${assign.dueDate || '-'} ${isOverdue ? '(متأخر)' : ''}
                    </td>
                    <td style="text-align: center;">${prioLabel}</td>
                    <td style="text-align: center; font-weight: 700; color: ${assign.status === 'submitted' ? '#15803d' : '#334155'};">
                      ${statusLabel}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer-note">
          <div>تم التصدير من منصة مسيرتي الأكاديمية • تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</div>
          <div>صفحة تقويم دراسي معتمدة ومحدثة</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
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
      {/* Tab Header with View Switcher & Export utilities */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 justify-end" id="schedule-title">
            التقويم الدراسي الموحد
            <CalendarDays className="w-5 h-5 text-indigo-500" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            جدول زمني يجمع محاضراتك الأسبوعية مع مواعيد تسليم الواجبات والكويزات القادمة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto" dir="rtl">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/70">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>جدول الأسبوع</span>
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              <span>الأجندة السريعة</span>
            </button>
          </div>

          {courses.length > 0 && (
            <>
              {/* Export as PDF */}
              <button
                onClick={handlePrintPDF}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 border border-indigo-100 shadow-3xs"
                title="تصدير للطباعة"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden md:inline">تصدير (PDF)</span>
              </button>
              
              {/* Sync to Google Calendar / ICS */}
              <button
                onClick={handleExportICS}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs shadow-emerald-100"
                title="مزامنة التقويم الخارجي"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden md:inline">مزامنة التقويم</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Week Navigator & Today Banner */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5" dir="rtl">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {/* Previous Week Button (Right arrow in RTL) */}
          <button
            onClick={handlePrevWeek}
            className="p-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200/70 flex items-center gap-1.5 text-xs font-bold"
            title="الأسبوع السابق"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">الأسبوع السابق</span>
          </button>

          {/* Today / Current Week Button */}
          <button
            onClick={handleGoToCurrentWeek}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              isCurrentWeek
                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs shadow-indigo-100"
                : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-2xs"
            }`}
            title="الانتقال إلى الأسبوع الحالي"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isCurrentWeek ? 'text-white' : 'text-indigo-500'}`} />
            <span>الأسبوع الحالي</span>
          </button>

          {/* Next Week Button (Left arrow in RTL) */}
          <button
            onClick={handleNextWeek}
            className="p-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer border border-slate-200/70 flex items-center gap-1.5 text-xs font-bold"
            title="الأسبوع التالي"
          >
            <span className="hidden sm:inline">الأسبوع التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Center / Right: Prominent Today & Week Range display */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 text-right">
          {/* Today's Badge with Gregorian & Hijri */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="text-slate-500 font-normal">اليوم:</span>
              <span className="text-indigo-900 font-extrabold">{realTodayName} {realToday.getDate()} {monthNamesArabic[realToday.getMonth()]} {realToday.getFullYear()}م</span>
              <span className="text-indigo-600 font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-indigo-100 font-bold">
                {todayHijriStr}
              </span>
            </div>
          </div>

          {/* Viewed Week Range */}
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <CalendarRange className="w-4 h-4 text-indigo-500 shrink-0" />
            <span className="font-mono">{weekRangeLabel}</span>
          </div>
        </div>
      </div>

      {/* Overdue Notice for assignments from previous weeks */}
      {overdueOutsideView.length > 0 && (
        <div className="bg-amber-50/90 rounded-2xl p-3.5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs" dir="rtl">
          <div className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-bold">
              تنبيه: لديك {overdueOutsideView.length} تسليمات قديمة تجاوزت مواعيد استحقاقها في أسابيع سابقة لم تنجز بعد!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowOverdueDrawer(!showOverdueDrawer)}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 text-amber-800 font-bold border border-amber-300 transition text-[11px] self-start sm:self-auto flex items-center gap-1 cursor-pointer"
          >
            <span>{showOverdueDrawer ? "إخفاء التفاصيل" : "عرض التسليمات السابقة"}</span>
            {showOverdueDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* Expandable Overdue Drawer if toggled */}
      {showOverdueDrawer && overdueOutsideView.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2.5" dir="rtl">
          <h4 className="font-black text-xs text-amber-900 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            قائمة التسليمات السابقة المتأخرة ({overdueOutsideView.length}):
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {overdueOutsideView.map((assign) => {
              const dueInfo = getAssignmentDueStatus(assign.dueDate, assign.status);
              return (
                <div key={assign.id} className="p-2.5 rounded-xl border border-red-200 bg-red-50/50 flex items-center justify-between gap-2 text-right">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                      {assign.type === 'quiz' ? 'كويز' : assign.type === 'project' ? 'مشروع' : 'واجب'}
                    </span>
                    <h5 className="font-bold text-xs text-slate-800 truncate mt-1">{assign.title}</h5>
                    <span className="text-[10px] text-slate-500 font-mono block">تاريخه: {assign.dueDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] shrink-0 ${dueInfo.badgeClass}`}>
                    {dueInfo.statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Summary Pill Bar for Assignments & Attendance */}
      {(assignments.length > 0 || courses.length > 0 || weekAttendedCount > 0 || weekMissedCount > 0) && (
        <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs" dir="rtl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <span className="font-extrabold text-slate-800">
              ملخص الأسبوع الحالي:
            </span>
            <span className="text-slate-500 font-medium">
              متابعة حضور المحاضرات وتسليمات الواجبات
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {weekAttendedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {weekAttendedCount} محاضرة حضرتها ✓
              </span>
            )}
            {weekMissedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1">
                <X className="w-3 h-3 text-rose-600" />
                {weekMissedCount} غياب
              </span>
            )}
            {assignments.filter(a => a.status !== 'submitted').length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-extrabold text-[11px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                {assignments.filter(a => a.status !== 'submitted').length} تسليم قيد الإنجاز
              </span>
            )}
            {assignments.filter(a => a.status === 'submitted').length > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px] flex items-center gap-1">
                <Check className="w-3 h-3 text-indigo-600" />
                {assignments.filter(a => a.status === 'submitted').length} واجب منجز
              </span>
            )}
          </div>
        </div>
      )}

      {courses.length === 0 && assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">الجدول الدراسي فارغ</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            قم بإضافة مقررات دراسية أو واجبات جديدة مع تحديد مواعيدها ليتم رسم جدولك الأسبوعي تلقائياً هنا.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ================= 1. WEEKLY GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5" dir="rtl">
          {displayedDays.map((day) => {
            const dayCourses = getCoursesForDay(day.name);
            const dayAssigns = getAssignmentsForDate(day.dateStr);
            const isToday = day.isToday;

            // Merge items into a structured list so we can cap display to 3 or 4
            // Item order: Assignments first (immediate deadlines), then Lectures
            const totalItemsCount = dayAssigns.length + dayCourses.length;
            const isExpanded = !!expandedDays[day.dateStr];
            const MAX_COMPACT_ITEMS = 3;
            const hasExcess = totalItemsCount > MAX_COMPACT_ITEMS;

            // Determine visible items when compact
            // If assignments >= MAX_COMPACT_ITEMS, take first MAX_COMPACT_ITEMS assignments, courses 0
            // Otherwise, take all assignments, and fill remaining slots with courses
            let visibleAssigns = dayAssigns;
            let visibleCourses = dayCourses;

            if (hasExcess && !isExpanded) {
              if (dayAssigns.length >= MAX_COMPACT_ITEMS) {
                visibleAssigns = dayAssigns.slice(0, MAX_COMPACT_ITEMS);
                visibleCourses = [];
              } else {
                visibleAssigns = dayAssigns;
                const remainingSlots = MAX_COMPACT_ITEMS - dayAssigns.length;
                visibleCourses = dayCourses.slice(0, remainingSlots);
              }
            }

            const hiddenCount = totalItemsCount - MAX_COMPACT_ITEMS;

            return (
              <div 
                key={day.dateStr} 
                className={`bg-white rounded-2xl border transition flex flex-col shadow-3xs ${
                  isToday 
                    ? "border-indigo-500/70 ring-2 ring-indigo-500/10 shadow-md" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {/* Day Header */}
                <div className={`p-3 border-b text-center rounded-t-2xl font-bold ${
                  isToday 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-50 text-slate-700"
                }`}>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-sm font-extrabold">{day.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isToday ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                    }`}>
                      {day.displayDate}
                    </span>
                  </div>
                  {/* Hijri date badge */}
                  <div className={`text-[10px] font-mono mt-0.5 ${
                    isToday ? 'text-indigo-100 font-bold' : 'text-slate-500 font-medium'
                  }`}>
                    {day.hijriDate}
                  </div>
                  {isToday ? (
                    <span className="text-[10px] font-extrabold text-amber-300 block mt-0.5">اليوم الحالي 📍</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                      {dayCourses.length} محاضرة {dayAssigns.length > 0 ? `• ${dayAssigns.length} تسليم` : ''}
                    </span>
                  )}
                </div>

                {/* Content Container */}
                <div className="p-3 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* Deadlines / Assignments Section if any */}
                    {visibleAssigns.length > 0 && (
                      <div className="space-y-1.5 pb-1 border-b border-dashed border-slate-200">
                        <div className={`text-[10px] font-extrabold flex items-center justify-between gap-1 ${
                          isToday ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            {isToday ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>تسليمات اليوم ({dayAssigns.length})</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>تسليمات {day.name} ({dayAssigns.length})</span>
                              </>
                            )}
                          </span>
                        </div>
                        {visibleAssigns.map((assign) => {
                          const dueInfo = getAssignmentDueStatus(assign.dueDate, assign.status);
                          return (
                            <div
                              key={assign.id}
                              onClick={() => onSelectAssignment && onSelectAssignment(assign.id)}
                              title="انقر لفتح تفاصيل الواجب وإدارته مباشرة"
                              className={`p-2 rounded-xl border text-right transition cursor-pointer hover:shadow-xs hover:-translate-y-0.5 ${
                                dueInfo.isOverdue
                                  ? 'bg-red-50/70 border-red-200 text-red-950 ring-1 ring-red-400/20'
                                  : dueInfo.isToday
                                  ? 'bg-rose-50/80 border-rose-300 text-rose-950 ring-1 ring-rose-400/20'
                                  : assign.type === 'quiz'
                                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                                  : 'bg-slate-50/70 border-slate-200 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                                <span className="px-1.5 py-0.5 rounded bg-white/90 border border-slate-200/60 shadow-2xs">
                                  {assign.type === 'quiz' ? 'كويز' : assign.type === 'project' ? 'مشروع' : 'واجب'}
                                </span>
                                {assign.subtasks && assign.subtasks.length > 0 && (() => {
                                  const total = assign.subtasks.length;
                                  const done = assign.subtasks.filter(s => s.isCompleted).length;
                                  const allDone = total > 0 && done === total;
                                  const pct = Math.round((done / total) * 100);
                                  return (
                                    <span className={`px-1 py-0.2 rounded text-[8px] font-bold border ${
                                      allDone 
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                    }`}>
                                      {allDone ? "✅ 100%" : `📋 ${total}${done > 0 ? ` (${pct}%)` : ""}`}
                                    </span>
                                  );
                                })()}
                                <span className={`px-1.5 py-0.5 rounded border text-[9px] ${dueInfo.badgeClass}`}>
                                  {dueInfo.statusText}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold mt-1 line-clamp-1">
                                {assign.title}
                              </p>
                              {assign.dueDate && (
                                <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                                  📅 {assign.dueDate}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Day Lectures list */}
                    {visibleCourses.length > 0 && (
                      visibleCourses.map(({ course, time }) => {
                        const colors = getColorClasses(course.color);
                        const attendance = getLectureAttendance(course.id, day.dateStr, time);
                        const isAttended = attendance?.status === "attended";
                        const isMissed = attendance?.status === "missed";
                        const isPastOrToday = day.dateStr <= realTodayStr;
                        const lectureTitle = getLectureDisplayTitle(course, day, time);

                        return (
                          <div
                            key={`${course.id}-${time}`}
                            onClick={() => setSelectedDetailCourse(course)}
                            title={`انقر لفتح تفاصيل مقرر ${course.name} وسجل المحاضرات`}
                            className={`p-2.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 hover:-translate-y-0.5 group ${
                              isAttended
                                ? "bg-emerald-50/75 border-emerald-300 ring-1 ring-emerald-400/50 shadow-2xs"
                                : isMissed
                                ? "bg-rose-50/65 border-rose-300 ring-1 ring-rose-400/50 shadow-2xs"
                                : `${colors.bg} ${colors.border} hover:shadow-xs`
                            }`}
                          >
                            <div className="flex justify-between items-center gap-1.5">
                              <span className="text-[10px] font-extrabold uppercase font-mono tracking-tight bg-white px-1.5 py-0.5 rounded-md text-slate-600 border border-slate-100 shrink-0">
                                {course.code}
                              </span>

                              {isAttended && (
                                <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  تم الحضور ✓
                                </span>
                              )}
                              {isMissed && (
                                <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                  <X className="w-2.5 h-2.5 text-rose-600" />
                                  غائب ✕
                                </span>
                              )}
                            </div>

                            {/* Lecture Topic & Title Header */}
                            <div className="bg-white/95 p-2 rounded-lg border border-slate-200/70 shadow-3xs flex items-start justify-between gap-1 mt-0.5">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 text-[9px] font-extrabold text-indigo-600 mb-0.5">
                                  <Bookmark className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                  <span>موضوع المحاضرة:</span>
                                </div>
                                <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">
                                  {lectureTitle}
                                </h4>
                              </div>
                              <button
                                type="button"
                                title="تعديل عنوان المحاضرة وملاحظاتها"
                                onClick={(e) => handleOpenQuickLectureEdit(e, course, day, time, lectureTitle, attendance)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition shrink-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Course Details Sub-row */}
                            <div className="space-y-0.5 text-[10px] mt-0.5">
                              <p className="font-semibold text-slate-700 truncate">
                                المقرر: <span className="font-bold">{course.name}</span>
                              </p>
                              <div className="flex items-center justify-between text-slate-500">
                                <span className="truncate flex items-center gap-1">
                                  <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{course.instructor}</span>
                                </span>
                                <span className="font-mono font-bold flex items-center gap-0.5 shrink-0 bg-white/80 px-1.5 py-0.5 rounded border border-slate-100">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />
                                  {time}
                                </span>
                              </div>
                            </div>

                            {/* Quick Attendance Confirmation Section for Today & Past Days */}
                            {isPastOrToday ? (
                              <div 
                                className="pt-1.5 mt-0.5 border-t border-slate-200/70 flex items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  title={isAttended ? "إلغاء رصد الحضور (انقر لإلغائه)" : "تأكيد الحضور ✓"}
                                  onClick={(e) => handleToggleAttendance(e, course, day, time, "attended")}
                                  className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition flex items-center justify-center gap-1 cursor-pointer ${
                                    isAttended
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                      : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300"
                                  }`}
                                >
                                  <Check className="w-3 h-3 shrink-0" />
                                  <span>{isAttended ? "حاضر ✓" : "تأكيد الحضور ✓"}</span>
                                </button>

                                <button
                                  type="button"
                                  title={isMissed ? "إلغاء رصد الغياب (انقر لإلغائه)" : "تسجيل غياب ✕"}
                                  onClick={(e) => handleToggleAttendance(e, course, day, time, "missed")}
                                  className={`py-1 px-2 rounded-lg text-[10px] font-extrabold transition flex items-center justify-center gap-1 cursor-pointer ${
                                    isMissed
                                      ? "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                                      : "bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300"
                                  }`}
                                >
                                  <X className="w-3 h-3 shrink-0" />
                                  <span>{isMissed ? "غائب ✕" : "غائب"}</span>
                                </button>
                              </div>
                            ) : (
                              <div className="pt-1 mt-0.5 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-medium">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-slate-300" />
                                  محاضرة مجدولة
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Empty Day State */}
                    {totalItemsCount === 0 && (
                      <div className="py-10 flex flex-col items-center justify-center text-slate-300">
                        <Clock className="w-5 h-5 opacity-40 mb-1" />
                        <span className="text-[11px] font-medium text-slate-400">لا توجد محاضرات أو مهام</span>
                      </div>
                    )}
                  </div>

                  {/* Inline Expand / Collapse Button if day exceeds compact limit */}
                  {hasExcess && (
                    <div className="pt-2 border-t border-slate-100 mt-2">
                      <button
                        onClick={() => toggleDayExpansion(day.dateStr)}
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isExpanded
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 shadow-3xs"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <span>إخفاء العناصر الزائدة ▲</span>
                          </>
                        ) : (
                          <>
                            <span>+{hiddenCount} مهام ومحاضرات أخرى ▼</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= 2. TIMELINE / AGENDA VIEW ================= */
        <div className="space-y-4 max-w-3xl mx-auto" dir="rtl">
          {displayedDays.map((day) => {
            const dayCourses = getCoursesForDay(day.name);
            const dayAssigns = getAssignmentsForDate(day.dateStr);
            const isToday = day.isToday;

            return (
              <div 
                key={day.dateStr}
                className={`bg-white rounded-2xl border transition p-4 md:p-5 shadow-3xs ${
                  isToday 
                    ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-md bg-indigo-50/10" 
                    : "border-slate-100"
                }`}
              >
                {/* Day Header Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="font-black text-sm text-slate-900">{day.name}</h3>
                    <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                      {day.displayDate}
                    </span>
                    <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-bold">
                      {day.hijriDate}
                    </span>
                    {isToday && (
                      <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
                        اليوم الحالي 📍
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {dayCourses.length} محاضرات • {dayAssigns.length} تسليمات
                  </span>
                </div>

                {/* Day Events Sequence */}
                <div className="pt-3 space-y-2.5">
                  {/* Assignments due on this day */}
                  {dayAssigns.map((assign) => {
                    const dueInfo = getAssignmentDueStatus(assign.dueDate, assign.status);
                    return (
                      <div
                        key={assign.id}
                        onClick={() => onSelectAssignment && onSelectAssignment(assign.id)}
                        title="انقر لفتح تفاصيل الواجب وإدارته مباشرة"
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-right cursor-pointer hover:shadow-xs hover:-translate-y-0.5 transition ${
                          dueInfo.isOverdue
                            ? 'bg-red-50/80 border-red-200 text-red-950'
                            : dueInfo.isToday
                            ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                            : assign.type === 'quiz'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-slate-50/80 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                            dueInfo.isOverdue
                              ? 'bg-red-200 text-red-950'
                              : assign.type === 'quiz'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-rose-200 text-rose-900'
                          }`}>
                            {dueInfo.isOverdue ? '⚠️ تجاوز موعده' : assign.type === 'quiz' ? 'كويز' : '🔴 موعد تسليم'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-xs truncate">{assign.title}</h4>
                              {assign.subtasks && assign.subtasks.length > 0 && (() => {
                                const total = assign.subtasks.length;
                                const done = assign.subtasks.filter(s => s.isCompleted).length;
                                const allDone = total > 0 && done === total;
                                const pct = Math.round((done / total) * 100);
                                return (
                                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold border ${
                                    allDone ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  }`}>
                                    {allDone ? "✅ 100%" : `📋 ${total} مهام${done > 0 ? ` (${pct}%)` : ""}`}
                                  </span>
                                );
                              })()}
                            </div>
                            <span className="text-[10px] opacity-75">
                              {assign.dueDate ? `تاريخ التسليم: ${assign.dueDate} • ` : ''}
                              {assign.priority === 'high' ? 'أولوية قصوى' : 'أولوية عادية'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {assign.status === 'submitted' ? (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              تم الإنجاز
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 ${dueInfo.badgeClass}`}>
                              {dueInfo.statusText}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Lectures scheduled on this day */}
                  {dayCourses.map(({ course, time }) => {
                    const colors = getColorClasses(course.color);
                    const attendance = getLectureAttendance(course.id, day.dateStr, time);
                    const isAttended = attendance?.status === "attended";
                    const isMissed = attendance?.status === "missed";
                    const isPastOrToday = day.dateStr <= realTodayStr;
                    const lectureTitle = getLectureDisplayTitle(course, day, time);

                    return (
                      <div
                        key={`${course.id}-${time}`}
                        onClick={() => setSelectedDetailCourse(course)}
                        title={`انقر لفتح تفاصيل مقرر ${course.name} وسجل المحاضرات`}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-xs group ${
                          isAttended
                            ? "bg-emerald-50/75 border-emerald-300 ring-1 ring-emerald-400/50 shadow-2xs"
                            : isMissed
                            ? "bg-rose-50/65 border-rose-300 ring-1 ring-rose-400/50 shadow-2xs"
                            : `${colors.bg} ${colors.border}`
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-md text-slate-600 border border-slate-100 shrink-0">
                            {course.code}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <Bookmark className="w-2.5 h-2.5 text-indigo-600" />
                                المحاضرة:
                              </span>
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {lectureTitle}
                              </h4>
                              <button
                                type="button"
                                title="تعديل عنوان المحاضرة وملاحظاتها"
                                onClick={(e) => handleOpenQuickLectureEdit(e, course, day, time, lectureTitle, attendance)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-md transition shrink-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>

                              {isAttended && (
                                <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  تم الحضور ✓
                                </span>
                              )}
                              {isMissed && (
                                <span className="text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                                  <X className="w-2.5 h-2.5 text-rose-600" />
                                  غائب ✕
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              المقرر: <span className="font-semibold text-slate-700">{course.name}</span> • المحاضر: <span className="font-medium text-slate-600">{course.instructor}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-700 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{time}</span>
                          </div>

                          {isPastOrToday ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                title={isAttended ? "إلغاء رصد الحضور (انقر لإلغائه)" : "تأكيد الحضور ✓"}
                                onClick={(e) => handleToggleAttendance(e, course, day, time, "attended")}
                                className={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isAttended
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                                    : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isAttended ? "حاضر ✓" : "تأكيد الحضور ✓"}</span>
                              </button>

                              <button
                                type="button"
                                title={isMissed ? "إلغاء رصد الغياب (انقر لإلغائه)" : "تسجيل غياب ✕"}
                                onClick={(e) => handleToggleAttendance(e, course, day, time, "missed")}
                                className={`py-1 px-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isMissed
                                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
                                    : "bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300"
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>{isMissed ? "غائب ✕" : "غائب"}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg font-medium">
                              مجدولة قادمة
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {dayCourses.length === 0 && dayAssigns.length === 0 && (
                    <p className="text-center py-4 text-slate-300 text-xs font-medium">
                      يوم فارغ من المحاضرات والتسليمات ✨
                    </p>
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

      {/* Quick Lecture Title & Notes Edit Modal */}
      {editingLectureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 sm:backdrop-blur-xs">
          <div 
            className="fixed inset-0"
            onClick={() => setEditingLectureModal(null)}
          />
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden relative z-10 p-6 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  تعديل عنوان المحاضرة وملاحظاتها
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingLectureModal.course.name} ({editingLectureModal.course.code}) • {editingLectureModal.day.name} {editingLectureModal.time}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setEditingLectureModal(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickLectureModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان وموضوع المحاضرة:
                </label>
                <input 
                  type="text"
                  required
                  value={editingLectureModal.title}
                  onChange={(e) => setEditingLectureModal({ ...editingLectureModal, title: e.target.value })}
                  placeholder="مثال: مقدمة في React و JSX أو شرح الخوارزميات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  حالة الحضور:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLectureModal({ ...editingLectureModal, status: 'attended' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingLectureModal.status === 'attended'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    تم الحضور (حاضر)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingLectureModal({ ...editingLectureModal, status: 'missed' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      editingLectureModal.status === 'missed'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    غائب عن المحاضرة
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات أو مذكرات سريعة من المحاضرة:
                </label>
                <textarea 
                  rows={3}
                  value={editingLectureModal.notes}
                  onChange={(e) => setEditingLectureModal({ ...editingLectureModal, notes: e.target.value })}
                  placeholder="اكتب النقاط المهمة، الواجبات المطلوبة أو تذكيرات المحاضر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLectureModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  حفظ وتأكيد المحاضرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Detail Modal directly accessible from Weekly Schedule */}
      {selectedDetailCourse && (
        <CourseDetailModal
          course={selectedDetailCourse}
          onClose={() => setSelectedDetailCourse(null)}
          onUpdateCourse={(updatedCourse) => {
            onUpdateCourse?.(updatedCourse);
            setSelectedDetailCourse(updatedCourse);
          }}
          onNavigateToCoursePage={(courseId) => onSelectCourse(courseId)}
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
