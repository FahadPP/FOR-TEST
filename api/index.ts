import express from "express";
import {
  handleNotionStatus,
  handleNotionAuthUrl,
  handleNotionCallback,
  handleNotionSearchPages,
  handleNotionExport,
} from "../src/server/notionHandler.js";
import {
  handleGeminiChat,
  handleGenerateStudyMaterial,
} from "../src/server/geminiHandler.js";

const app = express();

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "vercel-serverless" });
});

app.get("/api/notion/status", handleNotionStatus);
app.get("/api/notion/auth-url", handleNotionAuthUrl);
app.get("/api/notion/callback", handleNotionCallback);
app.post("/api/notion/search-pages", handleNotionSearchPages);
app.post("/api/notion/export", handleNotionExport);

// Gemini AI Endpoints
app.post("/api/gemini/chat", handleGeminiChat);
app.post("/api/gemini/generate-study-material", handleGenerateStudyMaterial);

export default app;
