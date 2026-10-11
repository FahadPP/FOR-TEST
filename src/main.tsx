import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_bGVhcm5pbmctZ2Vja28tMzE5OC5jbGVyay5hY2NvdW50cy5kZXYk";

const clerkArabicLocalization = {
  locale: 'ar-SA',
  socialButtonsBlockButton: 'المتابعة باستخدام {{provider|titleize}}',
  socialButtonsBlockButtonManyInView: '{{provider|titleize}}',
  dividerText: 'أو المتابعة بالبريد الإلكتروني',
  formFieldLabel__emailAddress: 'البريد الإلكتروني',
  formFieldLabel__emailAddress_username: 'البريد الإلكتروني أو اسم المستخدم',
  formFieldLabel__username: 'اسم المستخدم',
  formFieldLabel__password: 'كلمة المرور',
  formFieldLabel__firstName: 'الاسم الأول',
  formFieldLabel__lastName: 'الاسم الأخير',
  formFieldInputPlaceholder__emailAddress: 'أدخل بريدك الإلكتروني',
  formFieldInputPlaceholder__emailAddress_username: 'أدخل بريدك الإلكتروني أو اسم المستخدم',
  formFieldInputPlaceholder__password: 'أدخل كلمة المرور',
  formFieldInputPlaceholder__firstName: 'الاسم الأول',
  formFieldInputPlaceholder__lastName: 'الاسم الأخير',
  formFieldAction__forgotPassword: 'نسيت كلمة المرور؟',
  formButtonPrimary: 'متابعة',
  formButtonPrimary__verify: 'تأكيد الرمز',
  backButton: 'رجوع',
  footerActionLink__useAnotherMethod: 'استخدام طريقة أخرى',
  signIn: {
    start: {
      title: 'تسجيل الدخول إلى مسيرتي',
      subtitle: 'أهلاً بعودتك! سجل دخولك للمتابعة وحفظ مسيرتك الدراسية',
      actionText: 'ليس لديك حساب؟',
      actionLink: 'إنشاء حساب جديد',
    },
    password: {
      title: 'أدخل كلمة المرور',
      subtitle: 'يرجى إدخال كلمة المرور الخاصة بحسابك في مسيرتي',
      actionLink: 'استخدام طريقة أخرى للدخول',
    },
    forgotPasswordAlternativeMethods: {
      title: 'هل نسيت كلمة المرور؟',
      label__alternativeMethods: 'أو سجل الدخول بطريقة أخرى',
      blockButton__resetPassword: 'إعادة تعيين كلمة المرور',
    },
    emailCode: {
      title: 'تحقق من بريدك الإلكتروني',
      subtitle: 'للمتابعة إلى منصة مسيرتي',
      formTitle: 'رمز التحقق',
      formSubtitle: 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني',
      resendButton: 'لم يصلك الرمز؟ إعادة الإرسال',
    },
    emailLink: {
      title: 'تحقق من بريدك الإلكتروني',
      subtitle: 'للمتابعة إلى منصة مسيرتي',
      formSubtitle: 'اضغط على رابط التحقق المرسل إلى بريدك الإلكتروني',
      resendButton: 'لم يصلك الرابط؟ إعادة الإرسال',
    },
  },
  signUp: {
    start: {
      title: 'إنشاء حساب في مسيرتي',
      subtitle: 'أهلاً بك! أنشئ حسابك مجاناً لحفظ جدولك وموادك والوصول لها من أي جهاز',
      actionText: 'لديك حساب بالفعل؟',
      actionLink: 'تسجيل الدخول',
    },
    emailCode: {
      title: 'تحقق من بريدك الإلكتروني',
      subtitle: 'لإكمال التسجيل في منصة مسيرتي',
      formTitle: 'رمز التحقق',
      formSubtitle: 'أدخل رمز التحقق المرسل إلى بريدك الإلكتروني',
      resendButton: 'لم يصلك الرمز؟ إعادة الإرسال',
    },
    continue: {
      title: 'إكمال بيانات الحساب',
      subtitle: 'يرجى إكمال البيانات المتبقية للمتابعة إلى مسيرتي',
      actionText: 'لديك حساب بالفعل؟',
      actionLink: 'تسجيل الدخول',
    },
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      localization={clerkArabicLocalization as any}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);
