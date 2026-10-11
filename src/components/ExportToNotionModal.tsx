import { useState, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Loader2, 
  Layers, 
  BookOpen, 
  CheckSquare, 
  Network, 
  AlertCircle, 
  Key, 
  Unlink, 
  ChevronDown
} from "lucide-react";
import { Course } from "../types";

interface ExportToNotionModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
}

interface NotionPage {
  id: string;
  title: string;
  url?: string;
  icon?: string;
}

export default function ExportToNotionModal({ course, isOpen, onClose }: ExportToNotionModalProps) {
  const [token, setToken] = useState<string>(() => localStorage.getItem("notion_access_token") || "");
  const [workspaceName, setWorkspaceName] = useState<string>(() => localStorage.getItem("notion_workspace_name") || "");
  
  const [isConfiguredOnServer, setIsConfiguredOnServer] = useState<boolean>(true);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [manualTokenMode, setManualTokenMode] = useState<boolean>(false);
  const [manualTokenInput, setManualTokenInput] = useState<string>("");

  // Export options
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeFlashcards, setIncludeFlashcards] = useState(true);
  const [includeQuizzes, setIncludeQuizzes] = useState(true);
  const [includeMindMap, setIncludeMindMap] = useState(true);

  // Pages selection
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("");
  const [loadingPages, setLoadingPages] = useState(false);

  // Export action state
  const [exporting, setExporting] = useState(false);
  const [exportSuccessUrl, setExportSuccessUrl] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Helper for resilient JSON response parsing
  const safeParseResponse = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { 
        error: res.status === 404 
          ? "لم يتم العثور على خادم Notion API. يرجى التأكد من نشر أحدث نسخة على Vercel."
          : `استجابة الخادم غير متوقعة (رمز الحالة: ${res.status}). يرجى التحقق من إعدادات المفاتيح.` 
      };
    }
  };

  // 1. Check Server Notion OAuth Status on Open
  useEffect(() => {
    if (!isOpen) return;
    setExportSuccessUrl(null);
    setExportError(null);

    const checkStatus = async () => {
      try {
        setLoadingStatus(true);
        const res = await fetch("/api/notion/status");
        const data = await safeParseResponse(res);
        if (res.ok && data) {
          setIsConfiguredOnServer(data.configured ?? true);
        }
      } catch (e) {
        console.error("Failed to check notion status:", e);
      } finally {
        setLoadingStatus(false);
      }
    };
    checkStatus();
  }, [isOpen]);

  // 2. Fetch accessible Notion pages if token exists
  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchPages = async () => {
      try {
        setLoadingPages(true);
        const res = await fetch("/api/notion/search-pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ accessToken: token })
        });
        const data = await safeParseResponse(res);
        if (res.ok && data.pages) {
          setPages(data.pages || []);
          if (data.pages && data.pages.length > 0) {
            setSelectedPageId(data.pages[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to fetch Notion pages:", e);
      } finally {
        setLoadingPages(false);
      }
    };
    fetchPages();
  }, [isOpen, token]);

  // 3. Listen for OAuth popup completion postMessage
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "NOTION_AUTH_SUCCESS") {
        const { accessToken, workspaceName: wsName } = event.data;
        if (accessToken) {
          setToken(accessToken);
          setWorkspaceName(wsName || "Notion Workspace");
          localStorage.setItem("notion_access_token", accessToken);
          if (wsName) localStorage.setItem("notion_workspace_name", wsName);
          setConnecting(false);
        }
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  if (!isOpen) return null;

  // Handle OAuth Launch
  const handleConnectOAuth = async () => {
    try {
      setConnecting(true);
      setExportError(null);
      const res = await fetch("/api/notion/auth-url");
      const data = await safeParseResponse(res);
      if (res.ok && data.url) {
        const width = 600;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        window.open(
          data.url,
          "notion_oauth_window",
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
        );
      } else {
        setExportError(data.error || "تعذر إنشاء رابط المصادقة مع Notion");
        setConnecting(false);
      }
    } catch (err: any) {
      setExportError(err.message || "حدث خطأ أثناء الاتصال");
      setConnecting(false);
    }
  };

  // Handle Manual Token Submission
  const handleSaveManualToken = () => {
    if (!manualTokenInput.trim()) return;
    const cleanToken = manualTokenInput.trim();
    setToken(cleanToken);
    setWorkspaceName("مساحة عمل مخصصة (Token)");
    localStorage.setItem("notion_access_token", cleanToken);
    localStorage.setItem("notion_workspace_name", "مساحة عمل مخصصة");
    setManualTokenMode(false);
  };

  // Handle Disconnect
  const handleDisconnect = () => {
    setToken("");
    setWorkspaceName("");
    setPages([]);
    setSelectedPageId("");
    setExportSuccessUrl(null);
    localStorage.removeItem("notion_access_token");
    localStorage.removeItem("notion_workspace_name");
  };

  // Handle Export to Notion
  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    setExportError(null);
    setExportSuccessUrl(null);

    const studyMaterial = course.studyMaterial;

    try {
      const res = await fetch("/api/notion/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          accessToken: token,
          parentPageId: selectedPageId || undefined,
          courseName: course.name,
          courseCode: course.code,
          instructor: course.instructor,
          summary: includeSummary ? studyMaterial?.summary : undefined,
          flashcards: includeFlashcards ? studyMaterial?.flashcards : undefined,
          quizzes: includeQuizzes ? studyMaterial?.quizzes : undefined,
          mindMap: includeMindMap ? studyMaterial?.mindMap : undefined,
        })
      });

      const data = await safeParseResponse(res);
      if (res.ok && data.success) {
        setExportSuccessUrl(data.pageUrl);
      } else {
        setExportError(data.error || "تعذر إنشاء وتصدير المستند إلى Notion");
      }
    } catch (err: any) {
      setExportError(err.message || "حدث خطأ غير متوقع أثناء التصدير");
    } finally {
      setExporting(false);
    }
  };

  const flashcardCount = course.studyMaterial?.flashcards?.length || 0;
  const quizCount = course.studyMaterial?.quizzes?.length || 0;
  const hasSummary = Boolean(course.studyMaterial?.summary);
  const hasMindMap = Boolean(course.studyMaterial?.mindMap);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]" dir="rtl">
        
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg shadow-xs">
              N
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                تصدير إلى مساحة Notion الذكية
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold">
                  {course.code}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">
                احفظ الملخص، والبطاقات، وبنك الأسئلة كصفحة منظمة في مساحة عملك على Notion.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* SUCCESS BANNER */}
          {exportSuccessUrl && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-fade-in text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto text-xl shadow-md shadow-emerald-600/20">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                  تم تصدير المقرر وبنك الأسئلة إلى Notion بنجاح! 🎉
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                  تم إنشاء الصفحة بجميع الجداول، والبطاقات المنطوية (Toggles)، ومفاتيح الحلول.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <a
                  href={exportSuccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <span>فتح الصفحة في Notion الآن</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

          {/* ERROR BANNER */}
          {exportError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-bold">{exportError}</div>
            </div>
          )}

          {/* 1. AUTHENTICATION SECTION */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                حالة الربط مع حساب Notion:
              </span>

              {token && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Unlink className="w-3 h-3" />
                  إلغاء الربط
                </button>
              )}
            </div>

            {token ? (
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                      متصل بحساب Notion
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      مساحة العمل: {workspaceName || "مساحتك الخاصة"}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  جاهز للمزامنة
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  قم بربط مساحة عملك على Notion بضغطة زر واحدة لتتمكن من تصدير ملخصاتك واختباراتك فورياً.
                </p>

                {!manualTokenMode ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleConnectOAuth}
                      disabled={connecting || loadingStatus}
                      className="w-full py-3 bg-black hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>جاري فتح نافذة المصادقة في Notion...</span>
                        </>
                      ) : (
                        <>
                          <span className="w-4 h-4 bg-white text-black rounded-sm flex items-center justify-center text-[10px] font-black">N</span>
                          <span>تسجيل الدخول وربط Notion (OAuth 2.0) 🚀</span>
                        </>
                      )}
                    </button>

                    {!isConfiguredOnServer && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 font-semibold space-y-1">
                        <p>💡 ملاحظة: تذكر حفظ <code>NOTION_CLIENT_ID</code> و <code>NOTION_CLIENT_SECRET</code> في إعدادات Secrets لتفعيل الـ OAuth التلقائي للطلاب.</p>
                      </div>
                    )}

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setManualTokenMode(true)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold underline cursor-pointer"
                      >
                        أو استخدم رمز وصول مخصص (Internal Integration Token)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                      أدخل رمز الوصول الخاص بك (Internal Secret):
                    </label>
                    <input
                      type="password"
                      value={manualTokenInput}
                      onChange={(e) => setManualTokenInput(e.target.value)}
                      placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
                    />
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setManualTokenMode(false)}
                        className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs font-bold"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveManualToken}
                        disabled={!manualTokenInput.trim()}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        حفظ ومتابعة
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. CHOOSE TARGET NOTION PAGE */}
          {token && (
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                الصفحة المستهدفة في Notion (مكان الحفظ):
              </label>

              {loadingPages ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>جاري جلب صفحات Notion الخاصة بك...</span>
                </div>
              ) : pages.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedPageId}
                    onChange={(e) => setSelectedPageId(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 appearance-none cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.icon || "📄"} {p.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-3.5 pointer-events-none text-slate-400" />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-semibold">
                  سيتم إنشاء الصفحة في أعلى مساحة العمل المتاحة لك.
                </div>
              )}
            </div>
          )}

          {/* 3. CONTENT TO EXPORT CHECKLIST */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
              العناصر المراد تصديرها:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                includeSummary && hasSummary 
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 text-purple-950 dark:text-purple-200" 
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="checkbox"
                  checked={includeSummary && hasSummary}
                  disabled={!hasSummary}
                  onChange={(e) => setIncludeSummary(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded-sm cursor-pointer"
                />
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>الملخص والمفاهيم</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                includeFlashcards && flashcardCount > 0 
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-950 dark:text-amber-200" 
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="checkbox"
                  checked={includeFlashcards && flashcardCount > 0}
                  disabled={flashcardCount === 0}
                  onChange={(e) => setIncludeFlashcards(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded-sm cursor-pointer"
                />
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>البطاقات ({flashcardCount})</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                includeQuizzes && quizCount > 0 
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-950 dark:text-emerald-200" 
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="checkbox"
                  checked={includeQuizzes && quizCount > 0}
                  disabled={quizCount === 0}
                  onChange={(e) => setIncludeQuizzes(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm cursor-pointer"
                />
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>بنك الأسئلة ({quizCount})</span>
                </div>
              </label>

              <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition ${
                includeMindMap && hasMindMap 
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-950 dark:text-blue-200" 
                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
              }`}>
                <input
                  type="checkbox"
                  checked={includeMindMap && hasMindMap}
                  disabled={!hasMindMap}
                  onChange={(e) => setIncludeMindMap(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                />
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>الخريطة الذهنية</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex justify-between items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={!token || exporting}
            className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-black/20 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري بناء وتصدير الصفحة إلى Notion...</span>
              </>
            ) : (
              <>
                <span className="w-4 h-4 bg-white text-black rounded-sm flex items-center justify-center text-[10px] font-black">N</span>
                <span>تصدير الآن إلى Notion 🚀</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
