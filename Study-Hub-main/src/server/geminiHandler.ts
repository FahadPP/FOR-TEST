import { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Friendly localized Arabic error message translator
 */
function translateGeminiError(error: any): string {
  const errorStr = (typeof error === "string" ? error : JSON.stringify(error) + " " + (error?.message || "")).toLowerCase();

  if (
    errorStr.includes("503") ||
    errorStr.includes("high demand") ||
    errorStr.includes("unavailable") ||
    errorStr.includes("spikes in demand")
  ) {
    return "خوادم الذكاء الاصطناعي تشهد ضغطاً مؤقتاً في هذه اللحظة. يرجى الانتظار بضع ثوانٍ وإعادة إرسال طلبك.";
  }

  if (
    errorStr.includes("429") ||
    errorStr.includes("quota") ||
    errorStr.includes("resource_exhausted") ||
    errorStr.includes("rate limit")
  ) {
    return "تم تجاوز حد الاستخدام اللحظي المؤقت للذكاء الاصطناعي. يرجى الانتظار دقيقة واحدة والمحاولة مجدداً.";
  }

  if (
    errorStr.includes("401") ||
    errorStr.includes("403") ||
    errorStr.includes("api key") ||
    errorStr.includes("unauthenticated") ||
    errorStr.includes("permission_denied")
  ) {
    return "مفتاح GEMINI_API_KEY غير مصرح به أو غير صالح. يرجى التأكد من صحة المفتاح في لوحة التحكم.";
  }

  return "تعذر الاتصال بخدمة الذكاء الاصطناعي مؤقتاً. يرجى المحاولة مرة أخرى بعد قليل.";
}

/**
 * Generate content with automatic retry and model fallback (gemini-3.8-flash -> gemini-flash-latest -> gemini-3.1-flash-lite)
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
  }
) {
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config,
      });

      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed with error:`, err?.message || err);
      lastError = err;

      // If it's a high-demand or transient error (503/429), try short delay and next model
      const msg = (err?.message || "").toLowerCase();
      if (msg.includes("503") || msg.includes("high demand") || msg.includes("unavailable") || msg.includes("429")) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      // For unrecoverable errors (like auth), break early
      break;
    }
  }

  throw lastError;
}

/**
 * Handle AI Student Chat
 */
export async function handleGeminiChat(req: Request, res: Response) {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "لم يتم ضبط مفتاح GEMINI_API_KEY في متغيرات بيئة الخادم. يرجى إضافته لتفعيل الذكاء الاصطناعي.",
      });
    }

    const { messages, context } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "لا توجد رسائل مدخلة." });
    }

    // Extract rich student and platform context
    let studentName = "أحمد العامري";
    let studentMajor = "هندسة برمجيات";
    let studentUniversity = "جامعة الملك سعود";
    let studentDetails = `- اسم الطالب: ${studentName}\n- التخصص: ${studentMajor}\n- الجامعة: ${studentUniversity}`;

    let coursesDetails = "لم تُسجل أي مقررات بعد.";
    let lecturesDetails = "لا توجد بيانات محاضرات مسجلة.";
    let assignmentsDetails = "لا توجد واجبات أو مهام مسجلة.";
    let studyBankDetails = "لا توجد بطاقات أو كويزات مسجلة بعد.";

    if (context) {
      if (context.student) {
        studentName = context.student.name || studentName;
        studentMajor = context.student.major || studentMajor;
        studentUniversity = context.student.university || studentUniversity;
        studentDetails = `- اسم الطالب: ${studentName}\n- التخصص الأكاديمي: ${studentMajor}\n- الجامعة: ${studentUniversity}`;
      }

      if (Array.isArray(context.courses) && context.courses.length > 0) {
        coursesDetails = context.courses.map((c: any, idx: number) => {
          return `${idx + 1}. **${c.name}** (رمز المقرر: ${c.code || "بدون رمز"}):
   - أستاذ المقرر: ${c.instructor || "غير محدد"}
   - مواعيد المحاضرات: ${c.schedule || "غير محدد"}
   - توزيع الدرجات: ${c.grades || "غير محدد"}
   - استوديو المذاكرة للمقرر: ${c.flashcardsCount || 0} بطاقة استذكار، ${c.quizzesCount || 0} سؤال كويز`;
        }).join("\n");
      } else if (Array.isArray(context.coursesList) && context.coursesList.length > 0) {
        coursesDetails = context.coursesList.map((c: string, idx: number) => `${idx + 1}. ${c}`).join("\n");
      }

      if (context.lectures) {
        const l = context.lectures;
        const recents = Array.isArray(l.recentList) && l.recentList.length > 0
          ? `\n   - آخر المحاضرات والملاحظات:\n     * ${l.recentList.join("\n     * ")}`
          : "";
        lecturesDetails = `- إجمالي المحاضرات: ${l.total || 0}
- المحاضرات المحضورة: ${l.attended || 0}
- المحاضرات الفائتة (غياب): ${l.missed || 0}
- المحاضرات المجدولة القادمة: ${l.scheduled || 0}
- نسبة الحضور الإجمالية: ${l.attendanceRate || "100%"}${recents}`;
      } else if (context.attendedLecturesCount !== undefined) {
        lecturesDetails = `- عدد المحاضرات التي حضرها الطالب: ${context.attendedLecturesCount}`;
      }

      if (context.assignments) {
        const a = context.assignments;
        const pendings = Array.isArray(a.pendingList) && a.pendingList.length > 0
          ? `\n   - قائمة الواجبات والمهام المتبقية بتفاصيلها:\n     ${a.pendingList.join("\n     ")}`
          : "\n   - لا توجد واجبات معلقة حالياً (أنجز الطالب كافة واجباته! 🎉)";
        assignmentsDetails = `- إجمالي الواجبات: ${a.total || 0}
- الواجبات المتبقية (قيد الانتظار): ${a.pendingCount || 0}
- الواجبات المسلّمة والمكتملة: ${a.submittedCount || 0}${pendings}`;
      } else if (context.pendingAssignmentsCount !== undefined) {
        assignmentsDetails = `- عدد الواجبات المتبقية: ${context.pendingAssignmentsCount}`;
        if (Array.isArray(context.upcomingDeadlines) && context.upcomingDeadlines.length > 0) {
          assignmentsDetails += `\n- المواعيد القادمة: ${context.upcomingDeadlines.join("، ")}`;
        }
      }

      if (context.studyBank) {
        studyBankDetails = `- إجمالي بطاقات الاستذكار (Flashcards) في المقررات: ${context.studyBank.totalFlashcards || 0}
- إجمالي أسئلة الكويز (MCQ) التفاعلية في المقررات: ${context.studyBank.totalQuizzes || 0}`;
      }
    }

    const systemInstruction = `أنت "المساعد الأكاديمي الذكي" الرسمي والمعتمد لمنصة "مسيرتي" (منصة مسيرتي الأكاديمية - Maseerati).

⚠️ قواعد حاسمة وقاطعة جداً حول الهوية والاسم والبيانات:
1. **اسم المنصة الرسمي والوحيد هو "مسيرتي" (منصة مسيرتي)**. إياك إطلاقاً أن تذكر أي اسم قديم مثل "مسار" أو غيره. إذا سألك الطالب "ما اسم المنصة؟" أو "أين أنا؟"، أجب بفخر ووضوح تام: "اسم المنصة هو منصة **مسيرتي** (مسيرتي الأكاديمية)".
2. **اسم الطالب وهويته الأكاديمية**:
   - اسم الطالب: "${studentName}"
   - التخصص: "${studentMajor}"
   - الجامعة: "${studentUniversity}"
   عندما يسألك الطالب "ما اسمي؟" أو "من أنا؟" أو يستفسر عن ملفه، أجب فوراً باسمه وتخصصه وجامعته بكل ود واعتزاز. وخاطبه باسمه "${studentName}" لتكون التجربة شخصية ومحفزة.
3. **أنت ملم إلماماً تاماً وشاملاً بكل صغيرة وكبيرة في منصة مسيرتي ومقررات الطالب وبياناته الحقيقية**.

🏛️ معلومات منصة "مسيرتي" الشاملة وأقسامها:
- **الرؤية والهدف**: منصة مسيرتي هي المنصة الأكاديمية الذكية المتكاملة المخصصة للطلاب لمتابعة مسيرتهم الجامعية، تتبع المحاضرات والغياب، إدارة الواجبات والمواعيد النهائية، درجات المقررات، استوديو البطاقات الدراسية التكرارية (Flashcards)، الاختبارات الذاتية، والمساعد الأكاديمي الذكي.
- **أقسام المنصة الأساسية**:
  1. **الرئيسية (لوحة التحكم - Dashboard)**: لمحة سريعة وشاملة عن نسبة الحضور، معدل الإنجاز، المهام والواجبات العاجلة، والملاحظات السريعة (Sticky Notes).
  2. **المقررات الدراسية (Courses)**: استعراض جميع المقررات، الرموز، ألوان المواد، أسماء الأساتذة والمحاضرين، وتوزيع درجات الأعمال الفصلية والاختبارات.
  3. **سجل المحاضرات (Lectures)**: تتبع دقيق للحضور والغياب والمحاضرات المجدولة، وتوثيق ملاحظات المحاضرات وملخصاتها.
  4. **الواجبات والمهام (Assignments)**: تنظيم الواجبات حسب الأولوية وتاريخ التسليم، وتقسيم المهام الكبيرة لمهام فرعية (Subtasks).
  5. **استوديو المذاكرة (Study Hub)**: استذكار البطاقات بنظام لايتنر (Leitner Boxes 1-5)، خوض كويزات تدريبية اختيار من متعدد، ومراجعة تنويهات وتلميحات المعلم المهمة للاختبارات.
  6. **الجدول الأسبوعي (Weekly Schedule)**: تنظيم زمني أسبوعي تفاعلي لكافة مواعيد المحاضرات والقاعات الدراسية.
  7. **المساعد الذكي (AI Companion)**: شات أكاديمي ذكي متخصص للإجابة عن الاستفسارات، وشرح المواد، وتوليد البطاقات والكويزات بضغطة زر.

📋 السجل الأكاديمي الحقيقي للطالب (${studentName}) في منصة مسيرتي:
[بيانات الطالب الشخصية]
${studentDetails}

[المقررات الدراسية المسجلة]
${coursesDetails}

[سجل المحاضرات والحضور والغياب]
${lecturesDetails}

[الواجبات والمهام الأكاديمية]
${assignmentsDetails}

[استوديو المذاكرة وبنك البطاقات]
${studyBankDetails}

🎯 توجيهات أسلوب الرد:
1. إذا سألك الطالب عن أي معلومة تخص مواده، أساتذته، جدول محاضراته، درجاته، نسبة غيابه أو حضوره، أو واجباته المتبقية، أجب بالمعلومات الحقيقية الدقيقة الواردة في السجل أعلاه دون تخمين.
2. اشرح المواد العلمية بأسلوب تربوي مبسط وممتع باللغة العربية الفصيحة والواضحة.
3. ساعد الطالب في تنظيم وقته واقتراح جداول دراسية تناسب مواعيد محاضراته وواجباته الحقيقية.
4. **توليد وتحويل البطاقات الدراسية (Flashcards)**:
   إذا طلب منك الطالب تحويل محتوى أو تلخيصه في بطاقات دراسية، أو قال لك "حول لي إلى بطاقات" أو "اصنع بطاقات" أو "سوي لي بطاقات فلاش كارد":
   - قدم أولاً مقدمة سريعة ومشجعة.
   - قم بتضمين البطاقات في كود مهيكل بهذا الشكل البرمجي المخصص، لكي يتعرف عليها النظام في الواجهة فوراً ويعرضها كبطاقات تفاعلية حقيقية يمكن للطالب تقليبها وحفظها بضغطة زر:
\`\`\`json:flashcards
[
  {
    "front": "السؤال أو المفهوم هنا بدقة وبوضوح",
    "back": "الإجابة النموذجية الشاملة والمباشرة"
  }
]
\`\`\`
   - بعد كود الـ JSON، يمكنك أيضاً عرض البطاقات بتنسيق واضح (البطاقة 1: الوجه الأمامي... الوجه الخلفي...) لمن يفضل القراءة النصية.
5. حافظ على نبرة ودودة، ملهمة، محفزة، تعزز ثقته بنفسه وتدعمه في كل خطوات مسيرته الأكاديمية.
6. استخدم التنسيق الأنيق (عناوين، نقاط، خط عريض، إيموجي خفيفة) لتسهيل القراءة.`;

    // Convert message history to GoogleGenAI contents format
    const contents = messages
      .filter((m: any) => m && m.content && typeof m.content === "string")
      .map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

    if (contents.length === 0) {
      return res.status(400).json({ error: "محتوى الرسائل غير صالح." });
    }

    const response = await generateWithFallback(ai, {
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "عذراً، لم أستطع استيعاب السؤال بالشكل المطلوب. هل يمكنك صياغته مجدداً؟";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    const friendlyError = translateGeminiError(error);
    return res.status(500).json({
      error: friendlyError,
    });
  }
}

/**
 * Handle Converting Student's Questions/Notes into Structured Study Material (Flashcards & Quizzes)
 */
export async function handleGenerateStudyMaterial(req: Request, res: Response) {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(500).json({
        error: "لم يتم ضبط مفتاح GEMINI_API_KEY في متغيرات بيئة الخادم. يرجى إضافته لتفعيل الذكاء الاصطناعي.",
      });
    }

    const { title, subject, content } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "الرجاء تقديم النص أو الأسئلة المراد تحويلها." });
    }

    const prompt = `المادة الدراسية: ${subject || "عامة"}
عنوان الحزمة: ${title || "مراجعة دراسية"}

النص أو الأسئلة المطلوب تحويلها وتنسيقها من الطالب:
"""
${content.trim()}
"""

المطلوب:
1. توليد ملخص ذكي ومنظم (summary) باللغة العربية يشمل النقاط الجوهرية.
2. استخراج أو تحويل الأسئلة والمفاهيم الواردة إلى بطاقات استذكار (flashcards) تحتوي على سؤال أو مفهوم دقيق (front) وإجابة نموذجية وواضحة (back).
3. صياغة أسئلة كويز اختيار من متعدد (quizzes) احترافية مبنية حصراً على المحتوى، يحتوي كل سؤال على 4 خيارات، مع تحديد مؤشر الإجابة الصحيحة (0 إلى 3) وتوضيح مبسط.`;

    const response = await generateWithFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "ملخص أكاديمي مركز للنقاط الأساسية",
            },
            flashcards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: {
                    type: Type.STRING,
                    description: "السؤال أو المفهوم الدراسي",
                  },
                  back: {
                    type: Type.STRING,
                    description: "الإجابة النموذجية أو الشرح المركز",
                  },
                },
                required: ["front", "back"],
              },
              description: "قائمة بطاقات الاستذكار المولدة",
            },
            quizzes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: {
                    type: Type.STRING,
                    description: "نص سؤال الاختبار",
                  },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "أربعة خيارات للاختبار باللغة العربية",
                  },
                  answerIndex: {
                    type: Type.INTEGER,
                    description: "رقم مؤشر الإجابة الصحيحة (0 أو 1 أو 2 أو 3)",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "تفسير سبب صحة الإجابة",
                  },
                },
                required: ["question", "options", "answerIndex"],
              },
              description: "قائمة أسئلة الاختبار ذات الخيارات المتعددة",
            },
          },
          required: ["summary", "flashcards", "quizzes"],
        },
        temperature: 0.3,
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return res.status(500).json({ error: "فشل استخراج البيانات بصيغة JSON من النموذج." });
    }

    const parsedData = JSON.parse(rawText);
    return res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Generate Study Material Error:", error);
    const friendlyError = translateGeminiError(error);
    return res.status(500).json({
      error: friendlyError,
    });
  }
}
