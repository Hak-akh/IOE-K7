import { QuestionSetData, SetMeta, SetsIndexData } from '../types';

const setCache = new Map<string, QuestionSetData>();
let setsIndexCache: SetMeta[] | null = null;

// Fallback index in case fetch fails
export function getDefaultSetsIndex(): SetMeta[] {
  const list: SetMeta[] = [];
  for (let i = 0; i <= 14; i++) {
    const id = `bo${String(i).padStart(2, '0')}`;
    list.push({
      setId: id,
      examId: String(i).padStart(2, '0'),
      title: `IOE K7 2024–2025 - Bộ đề ${String(i).padStart(2, '0')}`,
      totalQuestions: 200,
      file: `./${id}.json`,
    });
  }
  return list;
}

export async function loadSetsIndex(): Promise<SetMeta[]> {
  if (setsIndexCache) return setsIndexCache;
  try {
    const res = await fetch('./sets_index.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: SetsIndexData = await res.json();
    setsIndexCache = data.sets;
    return data.sets;
  } catch (e) {
    console.warn('Could not load sets_index.json, using default index:', e);
    setsIndexCache = getDefaultSetsIndex();
    return setsIndexCache;
  }
}

export async function loadQuestionSet(setId: string): Promise<QuestionSetData> {
  if (setCache.has(setId)) {
    return setCache.get(setId)!;
  }

  const res = await fetch(`./${setId}.json`);
  if (!res.ok) {
    throw new Error(`Không thể tải dữ liệu ${setId}.json (mã lỗi ${res.status})`);
  }
  const data: QuestionSetData = await res.json();

  // Guarantee every question has a strictly scoped unique ID
  const finalSetId = data.setId || setId;
  if (data && Array.isArray(data.questions)) {
    data.questions.forEach((q, idx) => {
      const qNum = typeof q.number === 'number' ? q.number : idx + 1;
      q.number = qNum;
      q.id = `${finalSetId}-q${String(qNum).padStart(3, '0')}`;
      if (!q.hints || q.hints.length === 0) {
        q.hints = q.learning?.hints || [];
      }
    });
  }

  setCache.set(setId, data);
  return data;
}
