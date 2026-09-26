import { Question } from '../types';
import translationsData from '../data/translations.json';

const translationsMap: Record<string, string> = translationsData || {};

/**
 * Strips leading option prefixes (e.g. "A. ", "B) ")
 */
function cleanOptionTail(text: string): string {
  if (!text) return '';
  return text.replace(/\s+[A-D]\.\s+.*?\b[B-D]\.\s+.*$/i, '').trim();
}

/**
 * Reconstructs the complete English sentence with the correct answer filled in.
 * Examples:
 * - "Minh was _ _ _ _ nt from school..." + "abse" => "Minh was absent from school..."
 * - "My school is at …." + "30 Hoang Hoa Tham Road" => "My school is at 30 Hoang Hoa Tham Road."
 * - Word order: "Where do the Browns often go for their summer vacation?"
 */
export function getQuestionCompleteSentence(question: Question): string {
  if (!question) return '';
  const { question: qText, answer, type } = question;
  const cleanAns = (answer || '').trim();

  // Case 1: Word-order questions
  if (type === 'word_order') {
    return cleanAns;
  }

  // Case 2: Prompt-only questions like "Listen and tick:"
  const isPromptOnly = /^(listen and|listen to|choose the|odd one out|find the|which word)/i.test(qText.trim());
  if (isPromptOnly) {
    if (cleanAns.length > 2 && !/^[A-D]$/i.test(cleanAns)) {
      return cleanAns;
    }
  }

  const cleanQ = cleanOptionTail(qText);

  // Case 3: Questions with blanks like "_ _ _ _" or "_ _ _ _ nt"
  if (cleanQ.includes('_')) {
    return cleanQ.replace(/(_\s*)+/g, cleanAns);
  }

  // Case 4: Questions with dots like "…" or "..."
  if (cleanQ.includes('…') || cleanQ.includes('...')) {
    return cleanQ.replace(/(\.{3,}|…)/g, cleanAns);
  }

  // If answer is meaningful sentence / phrase and prompt doesn't have blank
  if (isPromptOnly && cleanAns) {
    return cleanAns;
  }

  return cleanQ;
}

/**
 * Gets the accurate Vietnamese translation for the question's complete sentence.
 */
export function getQuestionVietnameseTranslation(question: Question): string {
  if (!question) return '';

  // 1. Direct property on question
  if (question.vietnameseTranslation && !question.vietnameseTranslation.includes('Bản dịch hỗ trợ học tập')) {
    return question.vietnameseTranslation;
  }

  // 2. Inside question.learning
  const learningTrans = question.learning?.vietnameseTranslation || question.learning?.translation;
  if (learningTrans && !learningTrans.includes('Bản dịch hỗ trợ học tập') && !learningTrans.startsWith('Dịch nghĩa: ')) {
    return learningTrans;
  }

  // 3. Match from translations map using full reconstructed sentence
  const fullSentence = getQuestionCompleteSentence(question);
  if (translationsMap[fullSentence]) {
    return translationsMap[fullSentence];
  }

  // 4. Match using clean answer
  const cleanAns = (question.answer || '').trim();
  if (translationsMap[cleanAns]) {
    return translationsMap[cleanAns];
  }

  // 5. Match using question text
  const cleanQ = cleanOptionTail(question.question);
  if (translationsMap[cleanQ]) {
    return translationsMap[cleanQ];
  }

  return 'Bản dịch chi tiết cho câu hỏi chuẩn trong đề thi.';
}
