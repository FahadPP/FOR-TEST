import type { Request, Response } from "express";

export async function handleNotionStatus(req: Request, res: Response) {
  const apiKey = process.env.NOTION_API_KEY;
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  
  res.json({
    configured: Boolean(apiKey || (clientId && clientSecret)),
    hasApiKey: Boolean(apiKey),
    hasOAuth: Boolean(clientId && clientSecret)
  });
}

export async function handleNotionAuthUrl(req: Request, res: Response) {
  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) {
    const apiKey = process.env.NOTION_API_KEY;
    if (apiKey) {
      return res.status(400).json({
        error: "تم ضبط NOTION_API_KEY الثابت في السيرفر. يمكنك استخدامه مباشرة عبر خيار رمز الوصول."
      });
    }
    return res.status(400).json({
      error: "لم يتم ضبط NOTION_CLIENT_ID في متغيرات البيئة. يرجى إضافته في إعدادات المنصة أو استخدام رمز الوصول المباشر."
    });
  }

  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  const redirectUri = process.env.NOTION_REDIRECT_URI || `${protocol}://${host}/api/notion/callback`;
  
  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&owner=user&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  res.json({ url: notionAuthUrl });
}

export async function handleNotionCallback(req: Request, res: Response) {
  const { code, error } = req.query;
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;

  if (error) {
    return res.send(`
      <html>
        <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff1f2; color: #9f1239;" dir="rtl">
          <h2>فشلت عملية المصادقة مع Notion</h2>
          <p>${String(error)}</p>
          <script>setTimeout(() => window.close(), 4000);</script>
        </body>
      </html>
    `);
  }

  if (!code || typeof code !== "string") {
    return res.status(400).send("Missing code parameter");
  }

  try {
    const host = req.get("host") || "localhost:3000";
    const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const redirectUri = process.env.NOTION_REDIRECT_URI || `${protocol}://${host}/api/notion/callback`;

    const encodedCreds = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${encodedCreds}`,
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData: any = await tokenRes.json();

    if (!tokenRes.ok) {
      return res.send(`
        <html>
          <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #fff1f2; color: #9f1239;" dir="rtl">
            <h2>خطأ أثناء استبدال رمز Notion</h2>
            <p>${tokenData.message || JSON.stringify(tokenData)}</p>
          </body>
        </html>
      `);
    }

    const accessToken = tokenData.access_token;
    const workspaceName = tokenData.workspace_name || "Notion Workspace";

    return res.send(`
      <html>
        <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #f0fdf4; color: #166534;" dir="rtl">
          <h2>تم ربط حساب Notion بنجاح! 🎉</h2>
          <p>مساحة العمل: <b>${workspaceName}</b></p>
          <p>جاري إغلاق هذه النافذة ومتابعة التصدير...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: "NOTION_AUTH_SUCCESS",
                accessToken: "${accessToken}",
                workspaceName: "${workspaceName}"
              }, "*");
            }
            setTimeout(() => window.close(), 1200);
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    return res.status(500).send(`Server Error: ${err.message}`);
  }
}

export async function handleNotionSearchPages(req: Request, res: Response) {
  const token = req.body?.accessToken || (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "") || process.env.NOTION_API_KEY;

  if (!token) {
    return res.status(401).json({ error: "Missing Notion Token" });
  }

  try {
    const notionRes = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: {
          value: "page",
          property: "object",
        },
        page_size: 20,
      }),
    });

    const data: any = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data.message || "فشل جلب صفحات Notion" });
    }

    const pages = (data.results || []).map((page: any) => {
      let title = "صفحة بدون عنوان";
      if (page.properties) {
        for (const key of Object.keys(page.properties)) {
          const prop = page.properties[key];
          if (prop.type === "title" && Array.isArray(prop.title) && prop.title.length > 0) {
            title = prop.title.map((t: any) => t.plain_text).join("") || title;
            break;
          }
        }
      }
      return {
        id: page.id,
        title: title,
        url: page.url,
        icon: page.icon?.emoji || "📄",
      };
    });

    return res.json({ pages });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

export async function handleNotionExport(req: Request, res: Response) {
  const token = req.body?.accessToken || (req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : "") || process.env.NOTION_API_KEY;

  if (!token) {
    return res.status(401).json({ error: "Missing Notion Token" });
  }

  const {
    parentPageId,
    courseName,
    courseCode,
    instructor,
    summary,
    flashcards,
    quizzes,
    mindMap
  } = req.body;

  try {
    const blocks: any[] = [];

    // Header info
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        rich_text: [
          {
            type: "text",
            text: {
              content: `📚 المقرر: ${courseName || ""} (${courseCode || ""})\n👨‍🏫 أستاذ المادة: ${instructor || "غير محدد"}\n📅 تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`
            }
          }
        ],
        icon: { emoji: "🎓" },
        color: "blue_background"
      }
    });

    // 1. Summary Block
    if (summary && summary.trim()) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "📝 الملخص الشامل للمقرر" } }]
        }
      });

      const summaryParagraphs = summary.split("\n\n").filter((p: string) => p.trim());
      for (const para of summaryParagraphs.slice(0, 30)) {
        blocks.push({
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ type: "text", text: { content: para.slice(0, 1950) } }]
          }
        });
      }
    }

    // 2. Flashcards
    if (Array.isArray(flashcards) && flashcards.length > 0) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: `🎯 بطاقات الاستذكار (${flashcards.length} بطاقة)` } }]
        }
      });

      for (const card of flashcards.slice(0, 50)) {
        blocks.push({
          object: "block",
          type: "toggle",
          toggle: {
            rich_text: [
              {
                type: "text",
                text: { content: `❓ ${card.front || "سؤال"}` },
                annotations: { bold: true }
              }
            ],
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content: `💡 الإجابة: ${card.back || ""}` } }]
                }
              }
            ]
          }
        });
      }
    }

    // 3. Quizzes
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: `🧪 بنك الاختبارات والتمارين (${quizzes.length} سؤال)` } }]
        }
      });

      for (let i = 0; i < quizzes.length; i++) {
        const q = quizzes[i];
        const optionsText = Array.isArray(q.options)
          ? q.options.map((opt: string, optIdx: number) => `• ${String.fromCharCode(65 + optIdx)}) ${opt}`).join("\n")
          : "";

        blocks.push({
          object: "block",
          type: "toggle",
          toggle: {
            rich_text: [
              {
                type: "text",
                text: { content: `سؤال ${i + 1}: ${q.question}` },
                annotations: { bold: true }
              }
            ],
            children: [
              ...(optionsText ? [{
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ type: "text", text: { content: optionsText } }]
                }
              }] : []),
              {
                object: "block",
                type: "callout",
                callout: {
                  rich_text: [
                    {
                      type: "text",
                      text: {
                        content: `الإجابة الصحيحة: ${typeof q.correctAnswer === 'number' && q.options ? q.options[q.correctAnswer] : q.correctAnswer}\n\nالتفسير: ${q.explanation || "لا يوجد تفسير إضافي"}`
                      }
                    }
                  ],
                  icon: { emoji: "✅" },
                  color: "green_background"
                }
              }
            ]
          }
        });
      }
    }

    // 4. MindMap
    if (mindMap && mindMap.trim()) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: "🗺️ خريطة المفاهيم والعلاقات" } }]
        }
      });

      blocks.push({
        object: "block",
        type: "code",
        code: {
          rich_text: [{ type: "text", text: { content: mindMap.slice(0, 1950) } }],
          language: "mermaid"
        }
      });
    }

    const parentConfig = parentPageId
      ? { page_id: parentPageId }
      : { workspace: true };

    const createPayload: any = {
      parent: parentConfig,
      properties: {
        title: {
          title: [
            {
              type: "text",
              text: { content: `📚 ${courseName || "مقرر"} (${courseCode || "دراسي"})` }
            }
          ]
        }
      },
      icon: {
        type: "emoji",
        emoji: "📖"
      },
      children: blocks.slice(0, 95)
    };

    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createPayload)
    });

    const createdData: any = await createRes.json();
    if (!createRes.ok) {
      return res.status(createRes.status).json({
        error: createdData.message || "فشل إنشاء الصفحة في Notion"
      });
    }

    return res.json({
      success: true,
      pageId: createdData.id,
      pageUrl: createdData.url
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "حدث خطأ أثناء الاتصال بـ Notion" });
  }
}
