import { UserProgress, ExamRecord, UserSettings } from '../types';

const STORAGE_KEY = 'ioe_k7_progress_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  autoSpeak: false,
  fontSize: 'normal',
  darkMode: false,
  instantFeedback: true,
};

export const DEFAULT_PROGRESS: UserProgress = {
  answers: {},
  bookmarkedIds: [],
  wrongQuestionIds: [],
  examHistory: [],
  settings: DEFAULT_SETTINGS,
};

function sanitizeAnswers(rawAnswers: any): Record<string, any> {
  const sanitized: Record<string, any> = {};
  if (!rawAnswers || typeof rawAnswers !== 'object') return sanitized;

  Object.entries(rawAnswers).forEach(([key, val]) => {
    // If key is a bare number (e.g. "1", "2") from legacy un-namespaced sets
    if (/^\d+$/.test(key)) {
      // Migrate to bo01-qXXX if not already present
      const migratedKey = `bo01-q${String(key).padStart(3, '0')}`;
      if (!sanitized[migratedKey]) {
        sanitized[migratedKey] = val;
      }
    } else if (typeof key === 'string' && key.includes('-q')) {
      sanitized[key] = val;
    }
  });

  return sanitized;
}

function sanitizeIds(ids: any[]): string[] {
  if (!Array.isArray(ids)) return [];
  const result: string[] = [];
  ids.forEach(id => {
    const str = String(id);
    if (/^\d+$/.test(str)) {
      const migrated = `bo01-q${str.padStart(3, '0')}`;
      if (!result.includes(migrated)) result.push(migrated);
    } else if (str.includes('-q') && !result.includes(str)) {
      result.push(str);
    }
  });
  return result;
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      answers: sanitizeAnswers(parsed.answers),
      bookmarkedIds: sanitizeIds(parsed.bookmarkedIds),
      wrongQuestionIds: sanitizeIds(parsed.wrongQuestionIds),
      examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.error('Failed to load progress from localStorage:', e);
    return DEFAULT_PROGRESS;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress to localStorage:', e);
  }
}

export function exportProgressToFile(progress: UserProgress) {
  const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `IOE_K7_TienDo_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importProgressFromFile(file: File): Promise<UserProgress> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Dữ liệu không đúng định dạng');
        }
        const validated: UserProgress = {
          answers: sanitizeAnswers(parsed.answers),
          bookmarkedIds: sanitizeIds(parsed.bookmarkedIds),
          wrongQuestionIds: sanitizeIds(parsed.wrongQuestionIds),
          examHistory: Array.isArray(parsed.examHistory) ? parsed.examHistory : [],
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        };
        saveProgress(validated);
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Lỗi khi đọc file'));
    reader.readAsText(file);
  });
}
