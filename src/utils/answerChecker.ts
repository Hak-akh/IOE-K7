import { Question } from '../types';

/**
 * Strips leading option prefixes such as "A. ", "B) ", "C: ", "D - " from option texts.
 * Preserves the actual content (e.g., "A. up" -> "up").
 */
export function stripOptionPrefix(str: string): string {
  if (!str) return '';
  return str.replace(/^[A-Da-d]\s*[\.\:\-\)]\s*/, '').trim();
}

/**
 * Removes embedded multiple-choice options accidentally concatenated into the question text
 * (e.g. "“Look ...” has similar meaning to “take care”. A. up B. at C. in D. after" -> "“Look ...” has similar meaning to “take care”.")
 */
export function cleanQuestionText(text: string, options?: string[] | null): string {
  if (!text) return '';
  if (options && options.length > 0) {
    const cleaned = text.replace(/\s+[A-D]\.\s+.*?\b[B-D]\.\s+.*$/i, '').trim();
    if (cleaned.length > 5) {
      return cleaned;
    }
  }
  return text;
}

/**
 * Normalizes text for lenient, accurate comparison:
 * - Strips option prefixes
 * - Converts curly quotes / apostrophes to standard ASCII
 * - Removes punctuation
 * - Collapses whitespace
 * - Converts to lower case
 */
export function normalizeText(str: string): string {
  if (!str) return '';
  return stripOptionPrefix(str)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"“”]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the 0-based index of the correct option for questions that have options.
 * Handles:
 * - Answer being single letter like 'A', 'B', 'C', 'D' or 'A.'
 * - Answer being 1-based digit '1', '2', '3', '4'
 * - Answer matching the option text (with or without 'A. ' prefix)
 */
export function getCorrectOptionIndex(
  question: Pick<Question, 'answer' | 'options'>
): number {
  if (!question || !question.options || question.options.length === 0 || !question.answer) {
    return -1;
  }

  const letters = ['A', 'B', 'C', 'D'];
  const ansTrimmed = question.answer.trim();
  const letterCandidate = ansTrimmed.toUpperCase().replace(/[\.\:\-\)]+$/, '');

  // 1. Is answer a single letter like 'A', 'B', 'C', 'D'?
  const letterIdx = letters.indexOf(letterCandidate);
  if (letterIdx !== -1 && letterIdx < question.options.length) {
    return letterIdx;
  }

  // 2. Is answer a number like '1', '2', '3', '4'?
  const num = parseInt(ansTrimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= question.options.length) {
    return num - 1;
  }

  // 3. Match normalized text (both stripped of prefix and punctuation)
  const normAns = normalizeText(question.answer);
  const matchedIdx = question.options.findIndex(
    opt => normalizeText(opt) === normAns
  );
  if (matchedIdx !== -1) {
    return matchedIdx;
  }

  // 4. Also check if raw trimmed text matches
  const rawAns = ansTrimmed.toLowerCase();
  const rawIdx = question.options.findIndex(
    opt => opt.trim().toLowerCase() === rawAns || stripOptionPrefix(opt).toLowerCase() === rawAns
  );
  if (rawIdx !== -1) {
    return rawIdx;
  }

  return -1;
}

/**
 * Returns true if the specific option in question.options is the correct choice.
 */
export function isOptionCorrect(
  option: string,
  question: Pick<Question, 'answer' | 'options'>,
  optionIndex?: number
): boolean {
  if (!option || !question || !question.answer) return false;

  if (question.options && question.options.length > 0) {
    const correctIdx = getCorrectOptionIndex(question);
    if (correctIdx !== -1) {
      if (optionIndex !== undefined && optionIndex >= 0) {
        return optionIndex === correctIdx;
      }
      const optIdx = question.options.indexOf(option);
      if (optIdx !== -1) {
        return optIdx === correctIdx;
      }
      return normalizeText(option) === normalizeText(question.options[correctIdx]);
    }
  }

  return normalizeText(option) === normalizeText(question.answer);
}

/**
 * Returns true if the option matches the user's recorded answer.
 */
export function isOptionSelected(
  option: string,
  optionIndex: number,
  userAnswer?: string | null
): boolean {
  if (!userAnswer) return false;
  const letters = ['A', 'B', 'C', 'D'];
  const userTrimmed = userAnswer.trim();

  // If user answer was recorded as letter 'A', 'B', etc.
  if (userTrimmed.toUpperCase().replace(/\.$/, '') === letters[optionIndex]) return true;

  // Exact match
  if (option === userTrimmed || stripOptionPrefix(option) === userTrimmed) return true;

  // Normalized match
  return normalizeText(option) === normalizeText(userTrimmed);
}

/**
 * Determines if a user's answer is correct for any given question.
 * Handles:
 * 1. Multiple-choice and listening questions with options (matching option text, stripped text, or letter)
 * 2. Fill-in-the-blank questions (handling curly apostrophes, punctuation, spacing)
 * 3. Word-order questions
 */
export function isAnswerCorrect(
  userAns: string,
  question: Pick<Question, 'answer' | 'options'>
): boolean {
  if (!userAns || !question || !question.answer) return false;

  const normUser = normalizeText(userAns);
  const normCorrect = normalizeText(question.answer);

  // Exact or normalized text match
  if (normUser === normCorrect) return true;

  // Multiple-choice options handling
  if (question.options && question.options.length > 0) {
    const letters = ['A', 'B', 'C', 'D'];
    const correctIdx = getCorrectOptionIndex(question);

    if (correctIdx !== -1) {
      const userUpper = userAns.trim().toUpperCase().replace(/[\.\:\-\)]+$/, '');
      // User pressed or submitted letter 'A', 'B', 'C', 'D'
      if (userUpper === letters[correctIdx]) return true;

      // User submitted full or stripped option text
      const correctOpt = question.options[correctIdx];
      if (normalizeText(correctOpt) === normUser) return true;
      if (stripOptionPrefix(correctOpt).toLowerCase().trim() === userAns.toLowerCase().trim()) return true;
    }

    // Check if user answer selects one of the options which matches correct option
    const userMatchedIdx = question.options.findIndex(
      (opt, idx) => isOptionSelected(opt, idx, userAns)
    );
    if (userMatchedIdx !== -1 && userMatchedIdx === correctIdx) {
      return true;
    }
  }

  return false;
}

/**
 * Formats option for display by removing redundant prefix letters
 * (e.g. "A. up" -> "up")
 */
export function formatOptionDisplay(opt: string): string {
  return stripOptionPrefix(opt);
}

/**
 * Formats the correct answer for display in result panels, notebooks, reviews.
 * If answer is single letter like 'A' and options exist, returns "A. <Option text>" or the option text.
 * If answer has redundant "A. ", strips it cleanly so it matches the option display.
 */
export function formatAnswerDisplay(answer: string, options?: string[] | null): string {
  if (!answer) return '';
  const trimmed = answer.trim();
  const letters = ['A', 'B', 'C', 'D'];
  const upper = trimmed.toUpperCase().replace(/[\.\:\-\)]+$/, '');
  const letterIdx = letters.indexOf(upper);

  if (letterIdx !== -1 && options && options[letterIdx]) {
    const cleanOpt = stripOptionPrefix(options[letterIdx]);
    return `${upper}. ${cleanOpt}`;
  }

  return stripOptionPrefix(trimmed);
}

