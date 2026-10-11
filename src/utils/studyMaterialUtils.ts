import { StudyMaterial, Flashcard, MCQ } from "../types";

/**
 * Normalizes text for comparison (removes diacritics, extra spaces, and punctuation).
 */
export function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "") // Remove Arabic diacritics (Tashkeel)
    .replace(/[^\w\s\u0600-\u06FF]/g, "") // Keep alphanumeric and Arabic letters
    .replace(/\s+/g, " ");
}

export interface MergeResult {
  mergedMaterial: StudyMaterial;
  stats: {
    newCardsCount: number;
    duplicateCardsSkipped: number;
    newQuizzesCount: number;
    duplicateQuizzesSkipped: number;
  };
}

/**
 * Unified function for merging study materials from AICompanion to StudyHub
 * ensuring no duplicate flashcards or quiz questions are created.
 */
export function mergeStudyMaterials(
  existingMaterial?: StudyMaterial,
  incomingMaterial?: StudyMaterial,
  mode: "merge" | "replace" = "merge"
): MergeResult {
  const incoming = incomingMaterial || {};
  const existing = existingMaterial || {};

  if (mode === "replace" || !existing || Object.keys(existing).length === 0) {
    const freshCards = incoming.flashcards || [];
    const freshQuizzes = incoming.quizzes || [];
    return {
      mergedMaterial: {
        summary: incoming.summary || "",
        flashcards: freshCards,
        quizzes: freshQuizzes,
        mindMap: incoming.mindMap,
        textContext: incoming.textContext,
      },
      stats: {
        newCardsCount: freshCards.length,
        duplicateCardsSkipped: 0,
        newQuizzesCount: freshQuizzes.length,
        duplicateQuizzesSkipped: 0,
      },
    };
  }

  // --- Flashcards Deduplication ---
  const existingCards = existing.flashcards || [];
  const incomingCards = incoming.flashcards || [];
  const existingCardKeys = new Set(
    existingCards.map((c) => normalizeText(c.front))
  );

  const newCards: Flashcard[] = [];
  let duplicateCardsSkipped = 0;

  incomingCards.forEach((card) => {
    const key = normalizeText(card.front);
    if (key && existingCardKeys.has(key)) {
      duplicateCardsSkipped++;
    } else {
      if (key) existingCardKeys.add(key);
      newCards.push(card);
    }
  });

  const mergedCards = [...existingCards, ...newCards];

  // --- Quizzes Deduplication ---
  const existingQuizzes = existing.quizzes || [];
  const incomingQuizzes = incoming.quizzes || [];
  const existingQuizKeys = new Set(
    existingQuizzes.map((q) => normalizeText(q.question))
  );

  const newQuizzes: MCQ[] = [];
  let duplicateQuizzesSkipped = 0;

  incomingQuizzes.forEach((quiz) => {
    const key = normalizeText(quiz.question);
    if (key && existingQuizKeys.has(key)) {
      duplicateQuizzesSkipped++;
    } else {
      if (key) existingQuizKeys.add(key);
      newQuizzes.push(quiz);
    }
  });

  const mergedQuizzes = [...existingQuizzes, ...newQuizzes];

  // --- Summary merging ---
  let combinedSummary = existing.summary || "";
  if (incoming.summary && incoming.summary.trim()) {
    if (combinedSummary.trim()) {
      combinedSummary += `\n\n---\n\n### 💡 ملخص إضافي (${new Date().toLocaleDateString('ar-SA')}):\n` + incoming.summary;
    } else {
      combinedSummary = incoming.summary;
    }
  }

  const mergedMaterial: StudyMaterial = {
    ...existing,
    summary: combinedSummary,
    flashcards: mergedCards,
    quizzes: mergedQuizzes,
    mindMap: incoming.mindMap || existing.mindMap,
  };

  return {
    mergedMaterial,
    stats: {
      newCardsCount: newCards.length,
      duplicateCardsSkipped,
      newQuizzesCount: newQuizzes.length,
      duplicateQuizzesSkipped,
    },
  };
}
