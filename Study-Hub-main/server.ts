import "dotenv/config";
import express from "express";
import path from "path";
import {
  handleNotionStatus,
  handleNotionAuthUrl,
  handleNotionCallback,
  handleNotionSearchPages,
  handleNotionExport,
} from "./src/server/notionHandler.js";
import {
  handleGeminiChat,
  handleGenerateStudyMaterial,
} from "./src/server/geminiHandler.js";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "full-stack-notion" });
});

// Notion Endpoints
app.get("/api/notion/status", handleNotionStatus);
app.get("/api/notion/auth-url", handleNotionAuthUrl);
app.get("/api/notion/callback", handleNotionCallback);
app.post("/api/notion/search-pages", handleNotionSearchPages);
app.post("/api/notion/export", handleNotionExport);

// Gemini AI Endpoints
app.post("/api/gemini/chat", handleGeminiChat);
app.post("/api/gemini/generate-study-material", handleGenerateStudyMaterial);

export default app;

// Serve frontend assets with Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}
