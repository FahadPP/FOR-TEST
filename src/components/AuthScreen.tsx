import { useState } from "react";
import { SignIn } from "@clerk/clerk-react";
import { Check, Globe, AlertTriangle, LogIn, ArrowLeft } from "lucide-react";

interface AuthScreenProps {
  onSuccess: () => void;
  onGuest: () => void;
}

export default function AuthScreen({ 
  onGuest,
}: AuthScreenProps) {
  const [showGuestAlert, setShowGuestAlert] = useState<boolean>(false);
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8" dir="rtl">
      {/* Dynamic Ambient Background */}
      <div className="absolute inset-0 bg-radial-at-t from-indigo-50/60 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[640px]">
        
        {/* Right Side - Visual / Marketing Panel */}
        <div className="md:w-1/2 bg-slate-900 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -right-24 -bottom-24 w-72 h-72 rounded-full bg-indigo-500/20 pointer-events-none" />
          <div className="absolute -left-12 top-12 w-48 h-48 rounded-full bg-emerald-500/10 pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
              <img src="/logo.png" alt="مسيرتي" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-normal font-thmanyah-sans">مسيرتي</h2>
              <span className="text-[10px] text-indigo-400 font-bold block">منصتك الدراسية المتكاملة</span>
            </div>
          </div>

          {/* Content & Motivation */}
          <div className="my-12 space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 px-2.5 py-1 bg-indigo-500/10 rounded-full inline-block">
                منصة دراسية متكاملة 🎓
              </span>
              <h1 className="text-2xl md:text-3.5xl font-black leading-tight">
                احفظ تقدمك الأكاديمي، ونظم دراستك بسهولة!
              </h1>
            </div>
            
            <p className="text-slate-400 text-sm leading-relaxed">
              مساحتك المتكاملة لتنظيم المحاضرات، متابعة المهام، والاستعداد للاختبارات بكل سهولة وتركيز.
            </p>

            {/* List Features */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                تنظيم جدولك الأكاديمي ومتابعة حضورك وغيابك تلقائياً
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                استوديو البطاقات الدراسية (Flashcards) والاختبارات الذاتية
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
                تتبع دقيق للمعدل التراكمي وتنبيهات مواعيد التسليم
              </div>
            </div>
          </div>

          {/* Footer of Visual Column */}
          <div className="text-[10px] text-slate-500 font-medium">
            جميع الحقوق محفوظة لمنصة مسيرتي © {new Date().getFullYear()}
          </div>
        </div>

        {/* Left Side - Clerk Official SignIn & Guest Option */}
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col justify-center items-center bg-white" dir="rtl">
          <div className="w-full flex flex-col items-center space-y-4">
            {/* Official Clerk SignIn Component */}
            <SignIn 
              routing="hash"
              appearance={{
                layout: {
                  socialButtonsPlacement: "top",
                },
                elements: {
                  rootBox: "w-full max-w-md font-sans",
                  card: "shadow-none border-0 p-0 w-full font-sans",
                  header: "text-center",
                  headerTitle: "text-slate-900 font-black text-xl font-sans",
                  headerSubtitle: "text-slate-500 text-xs font-semibold font-sans mt-1",
                  socialButtonsBlockButton: "rounded-2xl border-slate-200 hover:bg-slate-50 font-bold text-xs py-3 font-sans",
                  socialButtonsBlockButtonText: "font-bold font-sans",
                  dividerText: "text-slate-400 text-xs font-bold font-sans",
                  formFieldLabel: "text-slate-700 font-bold text-xs font-sans text-right block",
                  formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 rounded-2xl text-xs font-bold py-3 shadow-md shadow-indigo-100 font-sans",
                  formFieldInput: "rounded-2xl border-slate-200 bg-slate-50 focus:bg-white text-xs font-bold py-2.5 text-right font-sans",
                  footerActionLink: "text-indigo-600 font-extrabold hover:underline font-sans",
                  footerActionText: "text-slate-500 font-semibold text-xs font-sans",
                }
              }}
            />

            {/* Guest Entry Option */}
            <div className="w-full max-w-sm pt-3 border-t border-slate-100 flex justify-center" dir="rtl">
              <button
                type="button"
                onClick={() => setShowGuestAlert(true)}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 hover:underline cursor-pointer py-1 px-3 rounded-xl transition"
              >
                <Globe className="w-4 h-4" />
                <span>تجربة المنصة كزائر بدون تسجيل</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Guest Warning Modal */}
      {showGuestAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-right space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-slate-900">
                تنبيه وضع الزائر
              </h3>
              <p className="text-xs md:text-sm text-slate-600 font-bold leading-relaxed">
                تنبيه: في وضع الزائر بياناتك لن تُحفظ بشكل دائم. سجّل دخولك لحفظ بياناتك وموادك في حسابك والوصول لها من أي جهاز.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowGuestAlert(false);
                  onGuest();
                }}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>أنا مدرك لهذا</span>
                <ArrowLeft className="w-4 h-4 text-slate-500" />
              </button>

              <button
                type="button"
                onClick={() => setShowGuestAlert(false)}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-indigo-100"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل الدخول</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
