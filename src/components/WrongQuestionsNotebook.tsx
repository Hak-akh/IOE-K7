import React, { useState, useEffect } from 'react';
import { Question, UserProgress, UserSettings } from '../types';
import { 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  Play, 
  Search, 
  RotateCcw,
  BookOpen,
  Volume2
} from 'lucide-react';
import { speakEnglish } from '../utils/sound';
import { loadQuestionSet } from '../utils/dataLoader';
import { cleanQuestionText, formatAnswerDisplay } from '../utils/answerChecker';
import { getQuestionVietnameseTranslation, getQuestionCompleteSentence } from '../utils/sentenceReconstructor';

interface WrongQuestionsNotebookProps {
  progress: UserProgress;
  onRemoveFromWrong: (questionId: string) => void;
  onClearAllWrong: () => void;
  onPracticeQuestion: (setId: string, questionNumber: number) => void;
  settings: UserSettings;
}

export const WrongQuestionsNotebook: React.FC<WrongQuestionsNotebookProps> = ({
  progress,
  onRemoveFromWrong,
  onClearAllWrong,
  onPracticeQuestion,
  settings,
}) => {
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSetFilter, setSelectedSetFilter] = useState<string>('all');

  // Load question objects for wrong question IDs
  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      if (progress.wrongQuestionIds.length === 0) {
        setLoadedQuestions([]);
        return;
      }

      setLoading(true);
      const bySet: Record<string, number[]> = {};
      progress.wrongQuestionIds.forEach(id => {
        const parts = id.split('-q');
        if (parts.length === 2) {
          const sId = parts[0];
          const qNum = parseInt(parts[1], 10);
          if (!bySet[sId]) bySet[sId] = [];
          bySet[sId].push(qNum);
        }
      });

      const collected: Question[] = [];
      for (const sId of Object.keys(bySet)) {
        try {
          const data = await loadQuestionSet(sId);
          const targetNums = bySet[sId];
          const found = data.questions.filter((q: Question) => targetNums.includes(q.number));
          collected.push(...found);
        } catch (e) {
          console.error(`Failed to load ${sId}:`, e);
        }
      }

      if (isMounted) {
        setLoadedQuestions(collected);
        setLoading(false);
      }
    };

    fetchQuestions();
    return () => { isMounted = false; };
  }, [progress.wrongQuestionIds]);

  const uniqueSets = Array.from(new Set(loadedQuestions.map(q => q.id.split('-q')[0])));

  const filtered = loadedQuestions.filter(q => {
    const sId = q.id.split('-q')[0];
    if (selectedSetFilter !== 'all' && sId !== selectedSetFilter) return false;
    if (searchTerm.trim() && !q.question.toLowerCase().includes(searchTerm.toLowerCase()) && !q.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold bg-rose-500/30 px-2 py-0.5 rounded border border-rose-400/30">
              Sổ tay thông minh
            </span>
            <span className="text-xs text-rose-200">Ôn tập lặp lại ngắt quãng</span>
          </div>
          <h2 className="text-2xl font-black">Sổ tay các câu đã làm sai</h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl">
            Tổng hợp toàn bộ các câu bạn từng trả lời sai trong 51 bộ đề. Làm lại các câu này đến khi thành thạo để không bao giờ mất điểm trong kỳ thi thật.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-3 rounded-xl border border-white/15 text-center">
            <div className="text-3xl font-extrabold font-mono text-rose-300">
              {progress.wrongQuestionIds.length}
            </div>
            <div className="text-2xs text-rose-200 uppercase font-semibold">Câu cần ôn</div>
          </div>

          {progress.wrongQuestionIds.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn dọn dẹp sạch sổ tay câu sai?')) {
                  onClearAllWrong();
                }
              }}
              className="p-3 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-colors"
              title="Xoá tất cả câu trong sổ tay"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSetFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedSetFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả bộ ({loadedQuestions.length})
          </button>
          {uniqueSets.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSetFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedSetFilter === s
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Bộ {s.replace('bo', '')}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm trong câu sai..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Đang tải danh sách câu sai...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Tuyệt vời! Không có câu sai nào trong mục này.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Khi bạn làm bài thi hoặc luyện tập và trả lời chưa chính xác, hệ thống sẽ tự động lưu lại vào đây để bạn ôn luyện.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const sId = q.id.split('-q')[0];
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-rose-300 dark:hover:border-rose-800 transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-mono">
                        {sId.toUpperCase()} • CÂU {q.number}
                      </span>
                      <button
                        onClick={() => speakEnglish(q.question)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Nghe đọc"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {cleanQuestionText(q.question, q.options)}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onPracticeQuestion(sId, q.number)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Làm lại câu này</span>
                    </button>

                    <button
                      onClick={() => onRemoveFromWrong(q.id)}
                      title="Đã hiểu câu này, xoá khỏi sổ tay"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500">Đáp án đúng: </span>
                      <strong className="text-emerald-600 dark:text-emerald-400 underline font-mono font-bold text-sm">
                        {formatAnswerDisplay(q.answer, q.options)}
                      </strong>
                    </div>
                    <button
                      onClick={() => speakEnglish(getQuestionCompleteSentence(q))}
                      title="Nghe đọc câu chuẩn"
                      className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe câu</span>
                    </button>
                  </div>

                  {/* Full Sentence if different from prompt */}
                  {q.type !== 'word_order' && (
                    <div className="text-slate-800 dark:text-slate-200 font-semibold text-xs bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-400 font-normal">Câu chuẩn: </span>
                      {getQuestionCompleteSentence(q)}
                    </div>
                  )}

                  {/* Vietnamese translation */}
                  <div className="text-emerald-800 dark:text-emerald-300 font-medium italic bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60">
                    🇻🇳 "{getQuestionVietnameseTranslation(q)}"
                  </div>

                  {q.explanation && (
                    <div className="text-slate-500 pt-0.5">
                      💡 {q.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
