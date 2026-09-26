import React, { useState, useEffect } from 'react';
import { Question, UserProgress, UserSettings } from '../types';
import { Bookmark, Play, Search, Trash2, Volume2 } from 'lucide-react';
import { speakEnglish } from '../utils/sound';
import { loadQuestionSet } from '../utils/dataLoader';
import { cleanQuestionText, formatAnswerDisplay } from '../utils/answerChecker';
import { getQuestionVietnameseTranslation, getQuestionCompleteSentence } from '../utils/sentenceReconstructor';

interface BookmarksViewProps {
  progress: UserProgress;
  onToggleBookmark: (questionId: string) => void;
  onPracticeQuestion: (setId: string, questionNumber: number) => void;
  settings: UserSettings;
}

export const BookmarksView: React.FC<BookmarksViewProps> = ({
  progress,
  onToggleBookmark,
  onPracticeQuestion,
  settings,
}) => {
  const [loadedQuestions, setLoadedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchQuestions = async () => {
      if (progress.bookmarkedIds.length === 0) {
        setLoadedQuestions([]);
        return;
      }

      setLoading(true);
      const bySet: Record<string, number[]> = {};
      progress.bookmarkedIds.forEach(id => {
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
  }, [progress.bookmarkedIds]);

  const filtered = loadedQuestions.filter(q => {
    if (searchTerm.trim() && !q.question.toLowerCase().includes(searchTerm.toLowerCase()) && !q.answer.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold bg-amber-500/30 px-2 py-0.5 rounded border border-amber-400/30">
              Bộ sưu tập câu hay
            </span>
            <span className="text-xs text-amber-200">Ôn tập chuyên sâu</span>
          </div>
          <h2 className="text-2xl font-black">Danh sách câu hỏi đã lưu</h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            Lưu giữ các câu hỏi khó, hiện tượng ngữ pháp quan trọng hoặc từ vựng mới để xem lại trước ngày thi.
          </p>
        </div>

        <div className="bg-white/10 px-5 py-3 rounded-xl border border-white/15 text-center">
          <div className="text-3xl font-extrabold font-mono text-amber-300">
            {progress.bookmarkedIds.length}
          </div>
          <div className="text-2xs text-amber-200 uppercase font-semibold">Câu đã lưu</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm trong danh sách câu đã lưu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Đang tải câu hỏi đã lưu...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Chưa có câu hỏi nào được lưu
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Khi đang luyện tập, bạn có thể bấm biểu tượng ngôi sao/bookmark ở góc trên câu hỏi để lưu lại vào đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => {
            const sId = q.id.split('-q')[0];
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-amber-300 dark:hover:border-amber-800 transition-all space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-bold uppercase px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-mono">
                        {sId.toUpperCase()} • CÂU {q.number}
                      </span>
                      <button
                        onClick={() => speakEnglish(q.question)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
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
                      <span>Luyện tập</span>
                    </button>

                    <button
                      onClick={() => onToggleBookmark(q.id)}
                      title="Bỏ lưu câu này"
                      className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Bookmark className="w-4 h-4 fill-amber-500" />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-500">Đáp án: </span>
                      <strong className="text-indigo-600 dark:text-indigo-400 font-mono font-bold text-sm">
                        {formatAnswerDisplay(q.answer, q.options)}
                      </strong>
                    </div>
                    <button
                      onClick={() => speakEnglish(getQuestionCompleteSentence(q))}
                      title="Nghe phát âm cả câu"
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
