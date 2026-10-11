// Masirati Academic Platform - Main Application
import { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, LayoutDashboard,
  BookOpen,
  UserCheck,
  CheckSquare,
  Layers,
  Calendar,
  Sparkles,
  Loader2,
  Edit2,
  School,
  Save,
  X,
  LogOut,
  Cloud,
  CloudOff,
  LogIn,
  Settings,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Info,
  Key,
  Sun,
  Moon,
  CheckCircle2
} from "lucide-react";
import { useUser as useClerkUser, useClerk } from "@clerk/clerk-react";

import {
  StorageService,
  INITIAL_COURSES,
  INITIAL_LECTURES,
  INITIAL_ASSIGNMENTS,
  INITIAL_PROFILE,
  LOCAL_COURSES_KEY,
  LOCAL_LECTURES_KEY,
  LOCAL_ASSIGNMENTS_KEY,
  LOCAL_PROFILE_KEY,
  LOCAL_USER_KEY
} from "./lib/storage";
import { Course, Lecture, Assignment, UserProfile } from "./types";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  syncLocalDataToCloud,
  loadCloudData,
  saveCourseToCloud,
  deleteCourseFromCloud,
  saveAssignmentToCloud,
  deleteAssignmentFromCloud,
  saveLectureToCloud,
  deleteLectureFromCloud
} from "./services/supabaseSync";

interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  provider?: string;
}

import Dashboard from "./components/Dashboard";
import Courses from "./components/Courses";
import Lectures from "./components/Lectures";
import Assignments from "./components/Assignments";
import QuickAddModal from "./components/QuickAddModal";
import WeeklySchedule from "./components/WeeklySchedule";
import AuthScreen from "./components/AuthScreen";
import StudyHub from "./components/StudyHub";
import AICompanion from "./components/AICompanion";
import ImportStudyBankModal, { SharedStudyPackageData } from "./components/ImportStudyBankModal";

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => localStorage.getItem("is_academic_guest") === "true");

  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL pathname
  const getTabFromPath = (pathname: string): string => {
    const clean = pathname.replace(/^\//, "");
    if (!clean || clean === "") return "dashboard";
    if (["dashboard", "courses", "assignments", "study", "schedule", "ai"].includes(clean)) {
      return clean;
    }
    return "dashboard";
  };

  const activeTab = getTabFromPath(location.pathname);

  const handleTabChange = (tabId: string) => {
    navigate(tabId === "dashboard" ? "/" : `/${tabId}`);
  };

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("masar_dark_mode");
      if (saved !== null) {
        return saved === "true";
      }
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("masar_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("masar_dark_mode", "false");
    }
  }, [isDarkMode]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    name: "أحمد العامري",
    major: "هندسة برمجيات",
    university: "جامعة الملك سعود"
  });
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [settingsModalTab, setSettingsModalTab] = useState<"profile" | "account">("profile");
  const [editName, setEditName] = useState<string>("");
  const [editMajor, setEditMajor] = useState<string>("");
  const [editUniversity, setEditUniversity] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Study Package Sharing & Importing State
  const [sharedStudyPackage, setSharedStudyPackage] = useState<SharedStudyPackageData | null>(null);
  const [studyImportToast, setStudyImportToast] = useState<string | null>(null);

  // Study Hub Cross Navigation States
  const [studyHubInitialCourseId, setStudyHubInitialCourseId] = useState<string>("");

  // Deep navigation states for opening specific items directly
  const [coursesInitialCourseId, setCoursesInitialCourseId] = useState<string | undefined>(undefined);
  const [assignmentsInitialAssignmentId, setAssignmentsInitialAssignmentId] = useState<string | undefined>(undefined);

  // Smart Contextual Nudge for Guest Mode & Account Merge Feedback
  const [guestNudgeToast, setGuestNudgeToast] = useState<boolean>(false);
  const [guestMergedToast, setGuestMergedToast] = useState<boolean>(false);

  const triggerGuestNudge = () => {
    if (!user && isGuest) {
      localStorage.setItem("masirati_has_guest_work", "true");
      setGuestNudgeToast(true);
    }
  };

  useEffect(() => {
    if (!guestNudgeToast) return;
    const timer = setTimeout(() => {
      setGuestNudgeToast(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [guestNudgeToast]);

  useEffect(() => {
    if (!guestMergedToast) return;
    const timer = setTimeout(() => {
      setGuestMergedToast(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [guestMergedToast]);

  const handleUpdateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const handleNavigateToStudyHub = (courseId?: string) => {
    if (courseId) {
      setStudyHubInitialCourseId(courseId);
    }
    handleTabChange("study");
  };

  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Clerk auth user integration
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const { signOut: clerkSignOut } = useClerk();

  useEffect(() => {
    if (isClerkLoaded && clerkUser) {
      const u: LocalUser = {
        uid: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        displayName: clerkUser.fullName || clerkUser.firstName || "طالب مسيرتي",
        provider: "clerk"
      };
      setUser(u);
      setIsGuest(false);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));

      // Update profile if default
      if (clerkUser.fullName) {
        setProfile(prev => ({
          ...prev,
          name: clerkUser.fullName || prev.name
        }));
      }
    }
  }, [clerkUser, isClerkLoaded]);

  // Check authentication on mount (Supabase + Clerk + Local)
  useEffect(() => {
    // 1. Read stored local user first
    const storedUser = localStorage.getItem(LOCAL_USER_KEY);
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setIsGuest(false);
      } catch (e) {
        setUser(null);
      }
    }

    // 2. If Supabase is configured, listen to auth state changes (e.g. Google OAuth redirect)
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const u: LocalUser = {
            uid: session.user.id,
            email: session.user.email || "",
            displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "طالب مسيرتي",
            provider: session.user.app_metadata?.provider || "supabase"
          };
          setUser(u);
          setIsGuest(false);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        }
        setAuthChecking(false);
      }).catch(() => {
        setAuthChecking(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const u: LocalUser = {
            uid: session.user.id,
            email: session.user.email || "",
            displayName: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "طالب مسيرتي",
            provider: session.user.app_metadata?.provider || "supabase"
          };
          setUser(u);
          setIsGuest(false);
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setAuthChecking(false);
    }
  }, []);

  // Load academic data (Local first, then Cloud sync if available)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // If in guest mode, always load fresh clean initial demo data into memory without reading mutated localStorage
        if (!user && isGuest) {
          StorageService.resetToDefaults();
          setCourses(INITIAL_COURSES);
          setLectures(INITIAL_LECTURES);
          setAssignments(INITIAL_ASSIGNMENTS);
          setProfile(INITIAL_PROFILE);
          setEditName(INITIAL_PROFILE.name);
          setEditMajor(INITIAL_PROFILE.major);
          setEditUniversity(INITIAL_PROFILE.university || "");
          setLoading(false);
          return;
        }

        const [c, l, a, p] = await Promise.all([
          StorageService.getCourses(),
          StorageService.getLectures(),
          StorageService.getAssignments(),
          StorageService.getUserProfile()
        ]);

        const hadGuestWork = localStorage.getItem("masirati_has_guest_work") === "true";

        // Helper to merge arrays by ID without losing guest items
        const mergeById = <T extends { id: string }>(cloudItems: T[], localItems: T[]): T[] => {
          const map = new Map<string, T>();
          cloudItems.forEach(item => map.set(item.id, item));
          localItems.forEach(item => {
            if (!map.has(item.id) || hadGuestWork) {
              map.set(item.id, item);
            }
          });
          return Array.from(map.values());
        };

        // If user is logged in with Supabase, attempt to merge with cloud
        if (user && isSupabaseConfigured) {
          try {
            const cloud = await loadCloudData(user.uid);
            if (cloud.data) {
              const cloudCoursesRaw = cloud.data.courses || [];
              const cloudAssignsRaw = cloud.data.assignments || [];
              const cloudLecsRaw = cloud.data.lectures || [];

              const mergedCourses = cloudCoursesRaw.length > 0
                ? (hadGuestWork ? mergeById(cloudCoursesRaw, c) : cloudCoursesRaw)
                : c;
              const mergedAssigns = cloudAssignsRaw.length > 0
                ? (hadGuestWork ? mergeById(cloudAssignsRaw, a) : cloudAssignsRaw)
                : a;
              const mergedLecs = cloudLecsRaw.length > 0
                ? (hadGuestWork ? mergeById(cloudLecsRaw, l) : cloudLecsRaw)
                : l;

              setCourses(mergedCourses);
              setLectures(mergedLecs);
              setAssignments(mergedAssigns);
              setProfile(p);
              setEditName(p.name);
              setEditMajor(p.major);
              setEditUniversity(p.university || "");

              // Persist merged data locally
              localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(mergedCourses));
              localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(mergedAssigns));
              localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(mergedLecs));

              // Push to cloud if cloud was empty or if guest work was merged
              if (hadGuestWork || (cloudCoursesRaw.length === 0 && c.length > 0)) {
                syncLocalDataToCloud(user.uid, {
                  courses: mergedCourses,
                  assignments: mergedAssigns,
                  lectures: mergedLecs,
                });
              }

              if (hadGuestWork) {
                localStorage.removeItem("masirati_has_guest_work");
                setGuestNudgeToast(false);
                setGuestMergedToast(true);
              }

              setLastSyncedTime("الآن");
              setLoading(false);
              return;
            }
          } catch (cloudErr) {
            console.error("Cloud load error, continuing with local:", cloudErr);
          }
        }

        if (user && hadGuestWork) {
          localStorage.removeItem("masirati_has_guest_work");
          setGuestNudgeToast(false);
          setGuestMergedToast(true);
        }

        setCourses(c);
        setLectures(l);
        setAssignments(a);
        setProfile(p);
        setEditName(p.name);
        setEditMajor(p.major);
        setEditUniversity(p.university || "");
      } catch (e) {
        console.error("Error loading data:", e);
      } finally {
        setLoading(false);
      }
    }

    if (user || isGuest) {
      loadData();
    }
  }, [user, isGuest]);

  // Listen for shared study package parameter (?studyShare=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const studyShare = params.get("studyShare");
    if (!studyShare) return;

    try {
      const jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(studyShare))));
      const parsed = JSON.parse(jsonStr) as SharedStudyPackageData;
      setSharedStudyPackage(parsed);
    } catch (err) {
      console.error("Error decoding shared study package:", err);
    }
  }, []);

  const handleImportSharedStudyPackage = async (
    targetCourseId: string,
    importMode: "merge" | "replace",
    newCourseData?: { name: string; code: string }
  ) => {
    if (!sharedStudyPackage) return;

    try {
      let finalCourse: Course | undefined;

      if (targetCourseId === "new" || newCourseData) {
        const newCourseId = `course-${Date.now()}`;
        const newCourse: Course = {
          id: newCourseId,
          name: newCourseData?.name || sharedStudyPackage.courseName,
          code: newCourseData?.code || sharedStudyPackage.courseCode || "GEN-101",
          instructor: "مدرس المقرر",
          color: "purple",
          schedule: [],
          studyMaterial: {
            summary: sharedStudyPackage.summary,
            flashcards: sharedStudyPackage.flashcards || [],
            quizzes: sharedStudyPackage.quizzes || [],
            mindMap: sharedStudyPackage.mindMap
          }
        };
        await handleAddCourse(newCourse);
        finalCourse = newCourse;
      } else {
        const existing = courses.find(c => c.id === targetCourseId);
        if (!existing) return;

        let mergedMaterial = { ...(existing.studyMaterial || {}) };
        if (importMode === "replace") {
          mergedMaterial = {
            summary: sharedStudyPackage.summary || existing.studyMaterial?.summary,
            flashcards: sharedStudyPackage.flashcards || [],
            quizzes: sharedStudyPackage.quizzes || [],
            mindMap: sharedStudyPackage.mindMap || existing.studyMaterial?.mindMap
          };
        } else {
          // Merge / Append
          const existingCards = existing.studyMaterial?.flashcards || [];
          const incomingCards = sharedStudyPackage.flashcards || [];
          const existingQuizzes = existing.studyMaterial?.quizzes || [];
          const incomingQuizzes = sharedStudyPackage.quizzes || [];

          mergedMaterial = {
            summary: sharedStudyPackage.summary 
              ? (existing.studyMaterial?.summary ? `${existing.studyMaterial.summary}\n\n---\n\n### ملخص مستورد إضافي:\n${sharedStudyPackage.summary}` : sharedStudyPackage.summary)
              : existing.studyMaterial?.summary,
            flashcards: [...existingCards, ...incomingCards],
            quizzes: [...existingQuizzes, ...incomingQuizzes],
            mindMap: sharedStudyPackage.mindMap || existing.studyMaterial?.mindMap
          };
        }

        const updatedCourse: Course = {
          ...existing,
          studyMaterial: mergedMaterial
        };
        await handleAddCourse(updatedCourse);
        finalCourse = updatedCourse;
      }

      setSharedStudyPackage(null);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Navigate to study hub for this course
      if (finalCourse) {
        setStudyHubInitialCourseId(finalCourse.id);
      }
      handleTabChange("study");
      setStudyImportToast("🎉 تم استيراد حزمة المذاكرة وحفظها بنجاح في ساحة المذاكرة!");
      setTimeout(() => setStudyImportToast(null), 5000);
    } catch (err) {
      console.error("Error importing study package:", err);
      alert("حدث خطأ أثناء استيراد حزمة المذاكرة. الرجاء المحاولة مرة أخرى.");
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      if (clerkSignOut) {
        await clerkSignOut().catch(() => { });
      }
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => { });
      }
      localStorage.removeItem(LOCAL_USER_KEY);
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem("is_academic_guest");
    } catch (err) {
      console.error("Logout Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    StorageService.resetToDefaults();
    setCourses(INITIAL_COURSES);
    setLectures(INITIAL_LECTURES);
    setAssignments(INITIAL_ASSIGNMENTS);
    setProfile(INITIAL_PROFILE);
    setEditName(INITIAL_PROFILE.name);
    setEditMajor(INITIAL_PROFILE.major);
    setEditUniversity(INITIAL_PROFILE.university || "");
    setIsGuest(true);
    localStorage.setItem("is_academic_guest", "true");
  };

  const handleManualSync = async () => {
    if (!user) return;
    setIsSyncingCloud(true);
    try {
      if (isSupabaseConfigured) {
        const res = await syncLocalDataToCloud(user.uid, {
          courses,
          assignments,
          lectures,
        });
        if (res.success) {
          setLastSyncedTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
        }
      } else {
        // Local timestamp update
        setLastSyncedTime(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.error("Manual sync error:", e);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Course operations
  const handleAddCourse = async (newCourse: Course) => {
    setCourses(prev => {
      const exists = prev.some(c => c.id === newCourse.id);
      if (exists) {
        return prev.map(c => c.id === newCourse.id ? newCourse : c);
      }
      return [...prev, newCourse];
    });

    if (user) {
      await StorageService.saveCourse(newCourse);
      if (isSupabaseConfigured) {
        saveCourseToCloud(user.uid, newCourse);
      }
    } else {
      triggerGuestNudge();
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId));
    // Remove linked assignments and lectures in state
    setLectures(prev => prev.filter(l => l.courseId !== courseId));
    setAssignments(prev => prev.filter(a => a.courseId !== courseId));

    if (user) {
      await StorageService.deleteCourse(courseId);
      if (isSupabaseConfigured) {
        deleteCourseFromCloud(user.uid, courseId);
      }
    } else {
      triggerGuestNudge();
    }
  };

  // Lecture operations
  const handleAddLecture = async (newLec: Lecture) => {
    setLectures(prev => {
      const exists = prev.some(l => l.id === newLec.id);
      if (exists) {
        return prev.map(l => l.id === newLec.id ? newLec : l);
      }
      return [...prev, newLec];
    });

    if (user) {
      await StorageService.saveLecture(newLec);
      if (isSupabaseConfigured) {
        saveLectureToCloud(user.uid, newLec);
      }
    } else {
      triggerGuestNudge();
    }
  };

  const handleUpdateLecture = (updatedLecture: Lecture) => {
    setLectures(prev => prev.map(l => l.id === updatedLecture.id ? updatedLecture : l));

    if (user) {
      StorageService.saveLecture(updatedLecture);
      if (isSupabaseConfigured) {
        saveLectureToCloud(user.uid, updatedLecture);
      }
    } else {
      triggerGuestNudge();
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    setLectures(prev => prev.filter(l => l.id !== lectureId));

    if (user) {
      await StorageService.deleteLecture(lectureId);
      if (isSupabaseConfigured) {
        deleteLectureFromCloud(user.uid, lectureId);
      }
    } else {
      triggerGuestNudge();
    }
  };

  // Assignment operations
  const handleAddAssignment = async (newAssign: Assignment) => {
    setAssignments(prev => {
      const exists = prev.some(a => a.id === newAssign.id);
      if (exists) {
        return prev.map(a => a.id === newAssign.id ? newAssign : a);
      }
      return [...prev, newAssign];
    });

    if (user) {
      await StorageService.saveAssignment(newAssign);
      if (isSupabaseConfigured) {
        saveAssignmentToCloud(user.uid, newAssign);
      }
    } else {
      triggerGuestNudge();
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));

    if (user) {
      await StorageService.deleteAssignment(assignmentId);
      if (isSupabaseConfigured) {
        deleteAssignmentFromCloud(user.uid, assignmentId);
      }
    } else {
      triggerGuestNudge();
    }
  };

  // Quick action from dashboard/schedule to open specific course details
  const handleSelectCourse = (courseId: string) => {
    setCoursesInitialCourseId(courseId);
    handleTabChange("courses");
  };

  // Quick action from dashboard/schedule to open specific assignment details
  const handleSelectAssignment = (assignmentId: string) => {
    setAssignmentsInitialAssignmentId(assignmentId);
    handleTabChange("assignments");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updatedProfile: UserProfile = {
      name: editName.trim(),
      major: editMajor.trim() || "هندسة برمجيات",
      university: editUniversity.trim() || "جامعة الملك سعود"
    };

    setProfile(updatedProfile);

    if (user) {
      const updatedUser = { ...user, displayName: editName.trim() };
      setUser(updatedUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updatedUser));
    }

    setIsEditingProfile(false);
    if (user) {
      await StorageService.saveUserProfile(updatedProfile);
    } else {
      triggerGuestNudge();
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-semibold animate-pulse text-sm">جاري التحقق من الهوية...</p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <AuthScreen
        onSuccess={() => { }}
        onGuest={handleGuestMode}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4" dir="rtl">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="text-slate-500 font-semibold animate-pulse text-sm">جاري تحميل بياناتك الدراسية بأمان...</p>
      </div>
    );
  }

  // Navigation Items
  const navItems = [
    { id: "dashboard", label: "لوحة التحكم", shortLabel: "الرئيسية", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "courses", label: "المقررات والمواد", shortLabel: "المقررات", icon: <BookOpen className="w-5 h-5" /> },
    { id: "assignments", label: "الواجبات والمهام", shortLabel: "الواجبات", icon: <CheckSquare className="w-5 h-5" /> },
    { id: "study", label: "ساحة المذاكرة والبطاقات", shortLabel: "المذاكرة", badge: "Flashcards", icon: <Layers className="w-5 h-5" /> },
    { id: "schedule", label: "الجدول الأسبوعي", shortLabel: "الجدول", icon: <Calendar className="w-5 h-5" /> },
    { id: "ai", label: "المساعد الذكي", shortLabel: "المساعد الذكي", badge: "AI", icon: <Sparkles className="w-5 h-5 text-indigo-500" /> }
  ];

  // Dynamic Semester Completion percentage
  const totalLecs = lectures.length;
  const attendedLecs = lectures.filter(l => l.status === "attended").length;
  const totalAssigns = assignments.length;
  const solvedAssigns = assignments.filter(a => a.status !== "pending").length;

  let semesterProgress = 65; // fallback
  if (totalLecs > 0 || totalAssigns > 0) {
    const totalItems = totalLecs + totalAssigns;
    const completedItems = attendedLecs + solvedAssigns;
    semesterProgress = Math.round((completedItems / totalItems) * 100);
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`} dir="rtl">

      {/* Top Banner Navigation */}
      <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-xs sticky top-0 z-40 transition-colors">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative shrink-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="مسيرتي" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -top-1.5 -left-1.5 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs select-none">
              beta
            </span>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black tracking-normal text-slate-800 dark:text-white flex items-center gap-1.5 md:gap-2 font-thmanyah-sans">
              مسيرتي
              <span className="hidden sm:inline-flex text-[10px] font-sans font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 px-2 py-0.5 rounded-full items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-indigo-100" /> المنظم الأكاديمي
              </span>
            </h1>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 font-medium">إدارة المقررات، المحاضرات، وبطاقات الاستذكار الفعالة</p>
          </div>
        </div>

        {/* Sync Status, Log Out, Profile Area */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Sync Status Badge */}
          {user ? (
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>مزامنة نشطة ومحفوظة</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("is_academic_guest");
                setIsGuest(false);
              }}
              className="hidden md:flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer"
              title="تنبيه: في وضع الزائر بياناتك لن تُحفظ بشكل دائم. سجّل دخولك لحفظ بياناتك وموادك في حسابك والوصول لها من أي جهاز."
            >
              <CloudOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden xl:inline">تنبيه: في وضع الزائر بياناتك لن تُحفظ بشكل دائم. سجّل دخولك لحفظ بياناتك وموادك في حسابك والوصول لها من أي جهاز</span>
              <span className="xl:hidden">وضع الزائر (بياناتك لن تُحفظ بشكل دائم)</span>
            </button>
          )}

          {/* User profile identifier (Clickable to Edit) */}
          <div
            onClick={() => {
              setEditName(profile.name);
              setEditMajor(profile.major);
              setEditUniversity(profile.university);
              setSettingsModalTab("profile");
              setIsEditingProfile(true);
            }}
            className="flex items-center gap-2 md:gap-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/80 px-2 md:px-2.5 py-1.5 rounded-xl transition-all duration-200 group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
            title="تعديل الملف الأكاديمي والإعدادات"
          >
            <div className="hidden sm:block text-right">
              <p className="text-xs md:text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 justify-end">
                {profile.name}
                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
              </p>
              <p className="text-[10px] md:text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{profile.major}</p>
              {profile.university && (
                <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5 justify-end">
                  <School className="w-2.5 h-2.5" />
                  {profile.university}
                </p>
              )}
            </div>
            <div className="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-slate-800 rounded-full border-2 border-indigo-100 dark:border-indigo-900 flex items-center justify-center overflow-hidden shrink-0 shadow-3xs group-hover:border-indigo-400 transition">
              <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-extrabold text-xs md:text-sm">
                {profile.name ? profile.name.charAt(0) : "أ"}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 text-slate-600 dark:text-amber-300 border border-slate-200 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs"
            title="تبديل المظهر"
          >
            {isDarkMode ? <Sun className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <Moon className="w-4 h-4 md:w-4.5 md:h-4.5" />}
          </button>

          {/* Settings / Account Button */}
          <button
            onClick={() => {
              setEditName(profile.name);
              setEditMajor(profile.major);
              setEditUniversity(profile.university);
              setSettingsModalTab("account");
              setIsEditingProfile(true);
            }}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-100 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl transition cursor-pointer flex items-center justify-center"
            title="إعدادات الحساب والمزامنة"
          >
            <Settings className="w-4 h-4 md:w-4.5 md:h-4.5" />
          </button>

          {/* Sign Out / Sign In Button */}
          {user ? (
            <button
              onClick={handleSignOut}
              className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-100 rounded-xl transition cursor-pointer flex items-center justify-center"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                localStorage.removeItem("is_academic_guest");
                setIsGuest(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-xs font-bold shadow-xs cursor-pointer"
              title="إنشاء حساب / تسجيل دخول"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
            </button>
          )}

        </div>
      </header>

      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 gap-2 shrink-0 transition-colors">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap ${isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs shadow-indigo-100 dark:shadow-none"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 tracking-wide shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Dynamic completion card */}
          <div className="mt-auto p-4 bg-slate-900 dark:bg-slate-800/80 rounded-2xl text-white shadow-md relative overflow-hidden border border-slate-800">
            <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-20 h-20 rounded-full bg-indigo-500/10 pointer-events-none" />
            <p className="text-[11px] font-semibold text-slate-400 mb-1">نسبة إنجاز الفصل الحالي</p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl font-extrabold">{semesterProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full transition-all duration-500"
                style={{ width: `${semesterProgress}%` }}
              />
            </div>
          </div>
        </aside>

        {/* Dynamic subviews container */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 pb-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="focus:outline-hidden h-full"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={
                    <Dashboard
                      user={user}
                      isGuest={isGuest}
                      courses={courses}
                      lectures={lectures}
                      assignments={assignments}
                      onNavigate={handleTabChange}
                      onSelectCourse={handleSelectCourse}
                      onSelectAssignment={handleSelectAssignment}
                      onUpdateAssignment={handleAddAssignment}
                      onGuestAction={triggerGuestNudge}
                    />
                  }
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/" replace />}
                />
                <Route
                  path="/courses"
                  element={
                    <Courses
                      courses={courses}
                      onAddCourse={handleAddCourse}
                      onDeleteCourse={handleDeleteCourse}
                      onNavigateToStudyHub={handleNavigateToStudyHub}
                      lectures={lectures}
                      onAddLecture={handleAddLecture}
                      onUpdateLecture={handleUpdateLecture}
                      onDeleteLecture={handleDeleteLecture}
                      initialCourseId={coursesInitialCourseId}
                      onClearInitialCourseId={() => setCoursesInitialCourseId(undefined)}
                    />
                  }
                />
                <Route
                  path="/lectures"
                  element={
                    <Lectures
                      lectures={lectures}
                      courses={courses}
                      onAddLecture={handleAddLecture}
                      onDeleteLecture={handleDeleteLecture}
                    />
                  }
                />
                <Route
                  path="/assignments"
                  element={
                    <Assignments
                      assignments={assignments}
                      courses={courses}
                      onAddAssignment={handleAddAssignment}
                      onDeleteAssignment={handleDeleteAssignment}
                      initialAssignmentId={assignmentsInitialAssignmentId}
                      onClearInitialAssignmentId={() => setAssignmentsInitialAssignmentId(undefined)}
                    />
                  }
                />
                <Route
                  path="/study"
                  element={
                    <StudyHub
                      courses={courses}
                      onUpdateCourse={handleAddCourse}
                      initialCourseId={studyHubInitialCourseId}
                    />
                  }
                />
                <Route
                  path="/schedule"
                  element={
                    <WeeklySchedule
                      courses={courses}
                      assignments={assignments}
                      lectures={lectures}
                      onAddLecture={handleAddLecture}
                      onUpdateLecture={handleUpdateLecture}
                      onDeleteLecture={handleDeleteLecture}
                      profile={profile}
                      onSelectCourse={handleSelectCourse}
                      onUpdateCourse={handleAddCourse}
                      onSelectAssignment={handleSelectAssignment}
                      onNavigateToStudyHub={handleNavigateToStudyHub}
                    />
                  }
                />
                <Route
                  path="/ai"
                  element={
                    <AICompanion
                      courses={courses}
                      lectures={lectures}
                      assignments={assignments}
                      profile={profile}
                      user={user}
                      onUpdateCourse={handleAddCourse}
                      onNavigateToStudyHub={handleNavigateToStudyHub}
                    />
                  }
                />
                {/* Fallback redirect */}
                <Route
                  path="*"
                  element={<Navigate to="/" replace />}
                />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditingProfile(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative z-10 flex flex-col"
              dir="rtl"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  الملف الشخصي والإعدادات
                </h3>
                <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">الاسم</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleUpdateProfile({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">الجامعة / التخصص</label>
                  <input
                    type="text"
                    value={profile.major}
                    onChange={(e) => handleUpdateProfile({ major: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Cloud className="w-4 h-4 text-slate-500" />
                    حالة الحساب والمزامنة
                  </h4>
                  {user ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          حساب نشط ومزامن
                        </div>
                        <button
                          type="button"
                          onClick={handleManualSync}
                          disabled={isSyncingCloud}
                          className="text-[10px] font-bold px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-60"
                        >
                          {isSyncingCloud ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>جارٍ المزامنة...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3 h-3" />
                              <span>مزامنة الآن</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 break-all leading-tight">
                        {user.email || user.uid}
                      </div>
                      {lastSyncedTime && (
                        <div className="text-[9px] text-emerald-700/60 dark:text-emerald-400/60">
                          آخر مزامنة: {lastSyncedTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between py-2.5 text-xs">
                      <span className="font-bold text-slate-500 flex items-center gap-1.5">
                        <CloudOff className="w-4 h-4 text-slate-400" /> غير مزامن (وضع الزائر)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2.5 text-xs">
                    <span className="font-bold text-slate-500 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-slate-400" /> معرّف الحساب (UID)
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg select-all">
                      {user?.uid || "LocalGuestStore"}
                    </span>
                  </div>
                </div>

                {/* Warning for guests */}
                {!user && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5 text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                    💡 <strong>تنبيه:</strong> في وضع الزائر بياناتك لن تُحفظ بشكل دائم. سجّل دخولك لحفظ بياناتك وموادك في حسابك والوصول لها من أي جهاز.
                  </div>
                )}

                {/* Settings Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
                  {!user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        localStorage.removeItem("is_academic_guest");
                        setIsGuest(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100"
                    >
                      <LogIn className="w-4 h-4" />
                      تسجيل الدخول / إنشاء حساب
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        handleSignOut();
                      }}
                      className="flex-1 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="w-4 h-4" />
                      تسجيل الخروج من الحساب
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Shared Study Package Modal */}
      {sharedStudyPackage && (
        <ImportStudyBankModal
          packageData={sharedStudyPackage}
          courses={courses}
          onImport={handleImportSharedStudyPackage}
          onClose={() => {
            setSharedStudyPackage(null);
            window.history.replaceState({}, document.title, window.location.pathname);
          }}
        />
      )}

      {/* Study Package Import Success Toast */}
      <AnimatePresence>
        {studyImportToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2 border border-emerald-500/30"
            dir="rtl"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span>{studyImportToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Smart Contextual Nudge Toast for Guest Mode & Account Merge Confirmation */}
      <AnimatePresence>
        {guestNudgeToast && !user && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-lg z-50 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5"
            dir="rtl"
          >
            <div className="flex items-start gap-3 text-right">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold leading-relaxed text-slate-100">
                  تنبيه: في وضع الزائر بياناتك لن تُحفظ بشكل دائم.
                </p>
                <p className="text-[11px] text-slate-300 leading-normal mt-0.5">
                  سجّل دخولك لحفظ بياناتك وموادك في حسابك والوصول لها من أي جهاز.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setGuestNudgeToast(false);
                  localStorage.removeItem("is_academic_guest");
                  setIsGuest(false);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                سجّل حسابك
              </button>
              <button
                type="button"
                onClick={() => setGuestNudgeToast(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {guestMergedToast && user && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 bg-emerald-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center justify-between gap-3"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 text-right">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold leading-relaxed text-emerald-50">
                🎉 تم ربط حسابك ونقل جميع موادك وواجباتك التي أضفتها كزائر بنجاح!
              </p>
            </div>
            <button
              type="button"
              onClick={() => setGuestMergedToast(false)}
              className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex justify-around items-center shadow-lg transition-colors" dir="rtl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${isActive ? "text-indigo-600 dark:text-indigo-400 font-bold scale-105" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? "bg-indigo-50 dark:bg-indigo-950/70" : ""}`}>
                {item.icon}
              </div>
              <span className="text-[10px] whitespace-nowrap mt-0.5">
                {item.shortLabel || item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
