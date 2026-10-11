import { Course, Lecture, Assignment, StickyNote, UserProfile } from "../types";

// Local storage backup keys
export const LOCAL_COURSES_KEY = "academic_tracker_courses";
export const LOCAL_LECTURES_KEY = "academic_tracker_lectures";
export const LOCAL_ASSIGNMENTS_KEY = "academic_tracker_assignments";
export const LOCAL_NOTES_KEY = "academic_tracker_notes";
export const LOCAL_PROFILE_KEY = "academic_tracker_profile";
export const LOCAL_USER_KEY = "academic_tracker_user";

// Initial Mock Data to bootstrap the application with a highly polished feel
export const INITIAL_COURSES: Course[] = [
  {
    id: "course-1",
    name: "برمجة الويب المتقدمة",
    code: "CS-311",
    instructor: "د. أحمد القحطاني",
    color: "sky",
    schedule: [
      { day: "الاثنين", time: "09:00 - 10:30" },
      { day: "الأربعاء", time: "09:00 - 10:30" }
    ],
    studyMaterial: {
      summary: "### ملخص مادة برمجة الويب المتقدمة (React & Modern Web)\n\n- **Virtual DOM**: تمثيل خفيف لـ DOM الفعلي في الذاكرة لتسريع عمليات التصيير (Rendering) وتقليل إعادة رسم الصفحة.\n- **React Hooks**: دوال تتيح استخدام الحالة (State) وميزات دورة حياة المكون دون الحاجة لكتابة Class Components.\n- **State vs Props**: الـ State حالة داخلية قابلة للتعديل داخل المكون، بينما الـ Props خصائص تُمرر من المكون الأب إلى المكون الابن للقراءة فقط (Read-only).\n- **SPA Architecture**: تحميل الصفحة مرة واحدة وإعادة جلب البيانات عبر APIs دون إعادة تحميل المتصفح بالكامل.",
      flashcards: [
        {
          front: "ما هو الـ Virtual DOM وما فائدته؟",
          back: "هو نسخة خفيفة ومحاكية لـ DOM الفعلي في الذاكرة، يقوم React بمقارنتها (Diffing Algorithm) وتحديث العناصر المتغيرة فقط لرفع الأداء وسرعة الاستجابة.",
          isTeacherHighlighted: true,
          status: "learned"
        },
        {
          front: "ما الفرق الأساسي بين Props و State؟",
          back: "الـ Props بيانات للقراءة فقط تُمرر من الأب للابن، بينما الـ State حالة داخلية يتحكم بها المكون ذاته وتؤدي إعادة تعيينها إلى Re-render.",
          isTeacherHighlighted: true,
          status: "review"
        },
        {
          front: "ما هي وظيفة Hook المسمى useEffect؟",
          back: "يُستخدم لإجراء التأثيرات الجانبية (Side Effects) مثل جلب البيانات من الخادم، الاشتراكات، والتعامل المباشر مع الـ DOM بعد اكتمال التصيير.",
          isTeacherHighlighted: false,
          status: "new"
        },
        {
          front: "ما معنى One-Way Data Flow في React؟",
          back: "أن البيانات تتدفق في اتجاه واحد فقط من المكونات العليا (الأب) إلى المكونات الفرعية (الأبناء) عبر الـ Props لضمان سهولة التتبع واكتشاف الأخطاء.",
          isTeacherHighlighted: false,
          status: "new"
        }
      ],
      quizzes: [
        {
          question: "أي من الـ Hooks التالية يُستخدم لتخزين حالة متغيرة تؤدي لتحديث واجهة المستخدم عند تغيرها؟",
          options: ["useEffect", "useState", "useRef", "useMemo"],
          answerIndex: 1,
          isTeacherHighlighted: true
        },
        {
          question: "ما الذي يحدث عند استدعاء دالة تحديث الحالة في React؟",
          options: [
            "يتم إعادة تحميل الصفحة بالكامل من الخادم",
            "يتم حذف المكون من الذاكرة",
            "يقوم React بجدولة إعادة تصيير (Re-render) للمكون وتحديث الـ Virtual DOM",
            "يتم مسح الـ LocalStorage تلقائياً"
          ],
          answerIndex: 2,
          isTeacherHighlighted: true
        },
        {
          question: "ما نوع البيانات التي تمثلها الـ Props داخل المكون المستقبِل؟",
          options: [
            "بيانات قابلة للتعديل المباشر (Mutable)",
            "بيانات للقراءة فقط (Read-only / Immutable)",
            "متغيرات عامة في نافذة المتصفح",
            "دوال خلفية في قاعدة البيانات"
          ],
          answerIndex: 1,
          isTeacherHighlighted: false
        }
      ],
      mindMap: {
        topic: "أساسيات React الحديثة",
        branches: [
          {
            title: "المكونات (Components)",
            subpoints: ["Functional Components", "JSX Syntax", "Conditional Rendering"]
          },
          {
            title: "إدارة الحالة (State & Hooks)",
            subpoints: ["useState", "useEffect", "Custom Hooks"]
          },
          {
            title: "الأداء والتصيير (Rendering)",
            subpoints: ["Virtual DOM", "Reconciliation", "Memoization"]
          }
        ]
      }
    }
  },
  {
    id: "course-2",
    name: "الذكاء الاصطناعي",
    code: "CS-442",
    instructor: "د. سارة الدوسري",
    color: "emerald",
    schedule: [
      { day: "الاحد", time: "11:00 - 12:30" },
      { day: "الثلاثاء", time: "11:00 - 12:30" }
    ],
    studyMaterial: {
      summary: "### ملخص الذكاء الاصطناعي وخوارزميات البحث\n\n- **A* Search**: خوارزمية بحث في الرسم البياني تعتمد على التكلفة الفعلية g(n) والتكلفة التقديرية h(n).\n- **Heuristic Function**: دالة تقديرية لتقريب المسافة المتبقية إلى الهدف، ويجب أن تكون Admissible لضمان الحل الأمثل.\n- **Neural Networks**: شبكات مستوحاة من الخلايا العصبية الحيوية وتتكون من طبقات دخل، طبقات خفية، وطبقة خرج.",
      flashcards: [
        {
          front: "ما هي معادلة تقييم العقدة f(n) في خوارزمية A* Search؟",
          back: "f(n) = g(n) + h(n)، حيث g(n) هي التكلفة الفعلية من نقطة البداية، و h(n) هي التكلفة التقديرية (Heuristic) للوصول إلى الهدف.",
          isTeacherHighlighted: true,
          status: "learned"
        },
        {
          front: "ما هو شرط أن تكون دالة الـ Heuristic مقبولة (Admissible)؟",
          back: "أن لا تُبالغ أبداً في تقدير التكلفة الحقيقية للوصول للهدف، أي h(n) <= h*(n) لجميع العقد.",
          isTeacherHighlighted: true,
          status: "review"
        },
        {
          front: "ما هي وظيفة خوارزمية Backpropagation في الشبكات العصبية؟",
          back: "حساب مشتقات دالة الخسارة بالنسبة للأوزان والتحيزات، ثم نشر الخطأ من طبقة الخرج إلى طبقات الدخل لتحديث الأوزان عبر Gradient Descent.",
          isTeacherHighlighted: false,
          status: "new"
        }
      ],
      quizzes: [
        {
          question: "في خوارزمية A*، ماذا يمثل الرمز g(n)؟",
          options: [
            "التكلفة التقديرية من العقدة n إلى الهدف",
            "التكلفة الفعلية المحسوبة من نقطة البداية إلى العقدة n",
            "عدد العقد المتبقية في قائمة الانتظار",
            "نسبة دقة النموذج العصبي"
          ],
          answerIndex: 1,
          isTeacherHighlighted: true
        },
        {
          question: "ماذا يضمن شرط Admissible Heuristic في خوارزمية A* Search؟",
          options: [
            "ضمان إيجاد المسار الأقصر والأمثل (Optimal Solution)",
            "تقليل استهلاك الذاكرة إلى الصفر",
            "تسريع البحث العشوائي",
            "إلغاء الحاجة لطبقة الخرج"
          ],
          answerIndex: 0,
          isTeacherHighlighted: true
        }
      ]
    }
  },
  {
    id: "course-3",
    name: "رياضيات متقطعة",
    code: "MATH-202",
    instructor: "أ.د. محمد العتيبي",
    color: "indigo",
    schedule: [
      { day: "الاثنين", time: "13:00 - 14:30" },
      { day: "الأربعاء", time: "13:00 - 14:30" }
    ]
  }
];

export const INITIAL_LECTURES: Lecture[] = [
  {
    id: "lec-1",
    courseId: "course-1",
    title: "مقدمة في React و JSX",
    date: "2026-06-29",
    time: "09:00",
    status: "attended",
    notes: "في هذه المحاضرة تم شرح أساسيات React وكيفية بناء المكونات Components واستخدام JSX لعرض العناصر. تم التطرق أيضاً لمفهوم الـ Virtual DOM وكيف يعمل في الخلفية لتسريع التحديثات."
  },
  {
    id: "lec-2",
    courseId: "course-1",
    title: "إدارة الحالة المستمرة ومفهوم Hooks",
    date: "2026-07-01",
    time: "09:00",
    status: "attended",
    notes: "شرح الـ State والإدارة الذكية باستخدام useState و useEffect. قمنا ببناء تطبيق مصغر للمهام لإثبات المفهوم. الواجب الأول تم الإعلان عنه وموعد التسليم الأسبوع القادم."
  },
  {
    id: "lec-3",
    courseId: "course-2",
    title: "خوارزميات البحث الذكي والـ A* Search",
    date: "2026-06-30",
    time: "11:00",
    status: "attended",
    notes: "محاضرة قيمة جداً حول خوارزميات البحث الأعمى والبحث الموجه. تم شرح خوارزمية A* بالتفصيل وكيف تستخدم Heuristics لتقليل عدد العقد المستكشفة في الرسم البياني."
  },
  {
    id: "lec-4",
    courseId: "course-2",
    title: "شبكات العصب الاصطناعية Neural Networks",
    date: "2026-07-02",
    time: "11:00",
    status: "missed",
    notes: "فاتتني هذه المحاضرة بسبب موعد طبي. يجب الحصول على ملخص من الزملاء لمراجعة موضوع الـ Backpropagation والوزن والتحيز في الشبكة."
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "assign-1",
    courseId: "course-1",
    title: "تصميم صفحة هبوط تفاعلية",
    description: "بناء صفحة هبوط كاملة باستخدام React و Tailwind CSS. يجب أن تحتوي على 3 أقسام على الأقل (البطل، الخدمات، تواصل معنا) وتكون متجاوبة بالكامل مع الأجهزة المحمولة.",
    dueDate: "2026-07-08",
    priority: "medium",
    status: "pending",
    type: "assignment",
    subtasks: [
      { id: "st-1-1", title: "تصميم واجهة الهيدر وقسم البطل", isCompleted: true },
      { id: "st-1-2", title: "برمجة قسم الخدمات والميزات", isCompleted: false },
      { id: "st-1-3", title: "اختبار التجاوب مع شاشات الجوال", isCompleted: false }
    ]
  },
  {
    id: "assign-2",
    courseId: "course-2",
    title: "مناقشة الأسبوع: تطبيقات الذكاء الاصطناعي الأخلاقية",
    description: "طرح مشاركة أساسية حول التحديات الأخلاقية للذكاء الاصطناعي التوليدي والرد على مشاركتين من الزملاء في منتدى المناقشات (Blackboard).",
    dueDate: "2026-07-09",
    priority: "high",
    status: "pending",
    type: "discussion"
  },
  {
    id: "assign-3",
    courseId: "course-2",
    title: "تطبيق خوارزمية البحث A*",
    description: "كتابة برنامج بلغة بايثون يحل لغز 8-Puzzle باستخدام خوارزمية A* وحساب الهيوريستك بطريقتين: عدد القطع في غير مكانها، ومسافة مانهاتن للقطع.",
    dueDate: "2026-07-10",
    priority: "high",
    status: "pending",
    type: "project",
    subtasks: [
      { id: "st-3-1", title: "كتابة دالة حساب مسافة مانهاتن", isCompleted: true },
      { id: "st-3-2", title: "تطبيق هيكل طابور الأولويات Priority Queue", isCompleted: true },
      { id: "st-3-3", title: "اختبار حل لغز 8-Puzzle وطباعة المسار", isCompleted: true }
    ]
  },
  {
    id: "assign-4",
    courseId: "course-3",
    title: "حل مسائل مجموعات وجدول الحقيقة",
    description: "حل تمارين الواجب الأول في الكتاب صفحة 45 المتعلقة بتبسيط العبارات المنطقية وإنشاء جداول الحقيقة للأقوال المركبة وإثبات التكافؤ المنطقي.",
    dueDate: "2026-07-05",
    priority: "low",
    status: "submitted",
    type: "assignment"
  }
];

export const INITIAL_NOTES: StickyNote[] = [
  {
    id: "note-1",
    content: "مراجعة شابتر 3 في مقرر الذكاء الاصطناعي قبل اختبار يوم الثلاثاء 📝",
    color: "yellow",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "note-2",
    content: "البدء في تصميم الواجهة الخلفية لواجب الويب المتقدمة 💻",
    color: "blue",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "note-3",
    content: "تذكير: شراء كتاب الرياضيات المتقطعة أو استعارته من المكتبة 📚",
    color: "pink",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const INITIAL_PROFILE: UserProfile = {
  name: "أحمد العامري",
  major: "السنة الثالثة - هندسة برمجيات",
  university: "جامعة الملك سعود"
};

// Helper to check if local storage is empty
const bootstrapLocalStorage = () => {
  if (!localStorage.getItem(LOCAL_COURSES_KEY)) {
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(INITIAL_COURSES));
  }
  if (!localStorage.getItem(LOCAL_LECTURES_KEY)) {
    localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(INITIAL_LECTURES));
  }
  if (!localStorage.getItem(LOCAL_ASSIGNMENTS_KEY)) {
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
  }
  if (!localStorage.getItem(LOCAL_NOTES_KEY)) {
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(INITIAL_NOTES));
  }
  if (!localStorage.getItem(LOCAL_PROFILE_KEY)) {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(INITIAL_PROFILE));
  }
};

// Ensure bootstrap on import
bootstrapLocalStorage();

export const StorageService = {
  // COURSES
  async getCourses(): Promise<Course[]> {
    const local = localStorage.getItem(LOCAL_COURSES_KEY);
    return local ? JSON.parse(local) : INITIAL_COURSES;
  },

  async saveCourse(course: Course): Promise<void> {
    const current = await this.getCourses();
    const index = current.findIndex(c => c.id === course.id);
    if (index >= 0) {
      current[index] = course;
    } else {
      current.push(course);
    }
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(current));
  },

  async deleteCourse(id: string): Promise<void> {
    const current = await this.getCourses();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(updated));

    // Also delete linked lectures and assignments for safety
    const lectures = await this.getLectures();
    const updatedLec = lectures.filter(l => l.courseId !== id);
    localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(updatedLec));

    const assigns = await this.getAssignments();
    const updatedAssigns = assigns.filter(a => a.courseId !== id);
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(updatedAssigns));
  },

  // LECTURES
  async getLectures(): Promise<Lecture[]> {
    const local = localStorage.getItem(LOCAL_LECTURES_KEY);
    return local ? JSON.parse(local) : INITIAL_LECTURES;
  },

  async saveLecture(lecture: Lecture): Promise<void> {
    const current = await this.getLectures();
    const index = current.findIndex(l => l.id === lecture.id);
    if (index >= 0) {
      current[index] = lecture;
    } else {
      current.push(lecture);
    }
    localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(current));
  },

  async deleteLecture(id: string): Promise<void> {
    const current = await this.getLectures();
    const updated = current.filter(l => l.id !== id);
    localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(updated));
  },

  // ASSIGNMENTS
  async getAssignments(): Promise<Assignment[]> {
    const local = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
    return local ? JSON.parse(local) : INITIAL_ASSIGNMENTS;
  },

  async saveAssignment(assignment: Assignment): Promise<void> {
    const current = await this.getAssignments();
    const index = current.findIndex(a => a.id === assignment.id);
    if (index >= 0) {
      current[index] = assignment;
    } else {
      current.push(assignment);
    }
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(current));
  },

  async deleteAssignment(id: string): Promise<void> {
    const current = await this.getAssignments();
    const updated = current.filter(a => a.id !== id);
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(updated));
  },

  // STICKY NOTES
  async getStickyNotes(): Promise<StickyNote[]> {
    const local = localStorage.getItem(LOCAL_NOTES_KEY);
    return local ? JSON.parse(local) : INITIAL_NOTES;
  },

  async saveStickyNote(note: StickyNote): Promise<void> {
    const current = await this.getStickyNotes();
    const index = current.findIndex(n => n.id === note.id);
    if (index >= 0) {
      current[index] = note;
    } else {
      current.push(note);
    }
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(current));
  },

  async deleteStickyNote(id: string): Promise<void> {
    const current = await this.getStickyNotes();
    const updated = current.filter(n => n.id !== id);
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(updated));
  },

  // USER PROFILE
  async getUserProfile(): Promise<UserProfile> {
    const local = localStorage.getItem(LOCAL_PROFILE_KEY);
    return local ? JSON.parse(local) : INITIAL_PROFILE;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
  },

  // Reset local storage back to pristine demo data
  resetToDefaults(): void {
    localStorage.setItem(LOCAL_COURSES_KEY, JSON.stringify(INITIAL_COURSES));
    localStorage.setItem(LOCAL_LECTURES_KEY, JSON.stringify(INITIAL_LECTURES));
    localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(INITIAL_ASSIGNMENTS));
    localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(INITIAL_NOTES));
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(INITIAL_PROFILE));
    localStorage.removeItem("masirati_has_guest_work");
  }
};
