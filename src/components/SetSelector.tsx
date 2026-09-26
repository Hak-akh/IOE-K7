import React, { useState } from 'react';
import { SetMeta, UserProgress } from '../types';
import { CheckCircle2, ChevronRight, Play, RotateCcw, Award, Filter, Search } from 'lucide-react';

interface SetSelectorProps {
  sets: SetMeta[];
  progress: UserProgress;
  onSelectSet: (setId: string, questionNumber?: number) => void;
  onStartExamForSet: (setId: string) => void;
  onResetSetProgress?: (setId: string) => void;
}

export const SetSelector: React.FC<SetSelectorProps> = ({
  sets,
  progress,
  onSelectSet,
  onStartExamForSet,
  onResetSetProgress,
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate stats for each set
  const setStats = sets.map((s) => {
    let answered = 0;
    let correct = 0;
    let lastAnsweredNum = 0;

    for (let qNum = 1; qNum <= s.totalQuestions; qNum++) {
      const qId = `${s.setId}-q${String(qNum).padStart(3, '0')}`;
      const p = progress.answers[qId];
      if (p) {
        answered++;
        if (p.isCorrect) correct++;
        lastAnsweredNum = qNum;
      }
    }

    const percent = Math.round((answered / s.totalQuestions) * 100);
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const isCompleted = answered === s.totalQuestions;
    const isStarted = answered > 0 && !isCompleted;

    return {
      ...s,
      answered,
      correct,
      percent,
      accuracy,
      isCompleted,
      isStarted,
      nextQuestionNum: answered === 0 ? 1 : Math.min(lastAnsweredNum + 1, s.totalQuestions),
    };
  });

  const filteredSets = setStats.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.setId.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'completed') return s.isCompleted;
    if (filter === 'in_progress') return s.isStarted;
    if (filter === 'not_started') return s.answered === 0;
    return true;
  });

  const totalAnsweredAcrossApp = Object.keys(progress.answers).length;
  const totalCorrectAcrossApp = Object.values(progress.answers).filter(a => a.isCorrect).length;
  const overallAccuracy = totalAnsweredAcrossApp > 0 ? Math.round((totalCorrectAcrossApp / totalAnsweredAcrossApp) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-400/30">
                Kho dữ liệu gốc 2024–2025
              </span>
              <span className="text-xs text-indigo-200">51 Bộ đề × 200 câu</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chinh phục IOE Tiếng Anh Lớp 7
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Toàn bộ 10.200 câu hỏi chuẩn Olympic tiếng Anh trên Internet dành cho học sinh lớp 7. 
              Luyện tập từng câu với gợi ý 3 cấp độ, dịch nghĩa tiếng Việt, phân tích ngữ pháp và âm thanh chuẩn.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-emerald-400">{totalAnsweredAcrossApp}</div>
              <div className="text-xs text-slate-300">Đã làm</div>
            </div>
            <div className="text-center border-x border-white/15 px-3">
              <div className="text-2xl font-bold font-mono text-indigo-300">{totalCorrectAcrossApp}</div>
              <div className="text-xs text-slate-300">Đúng</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-amber-300">{overallAccuracy}%</div>
              <div className="text-xs text-slate-300">Chính xác</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả (51)
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'in_progress'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Đang làm ({setStats.filter(s => s.isStarted).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Hoàn thành ({setStats.filter(s => s.isCompleted).length})
          </button>
          <button
            onClick={() => setFilter('not_started')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === 'not_started'
                ? 'bg-slate-700 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Chưa làm ({setStats.filter(s => s.answered === 0).length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo số bộ (vd: 01, 15)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Sets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSets.map((s) => (
          <div
            key={s.setId}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {s.examId}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {s.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      200 câu hỏi • 2000 điểm IOE
                    </p>
                  </div>
                </div>

                {s.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Xong
                  </span>
                ) : s.isStarted ? (
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60">
                    {s.percent}%
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Mới
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 my-3">
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Tiến độ: {s.answered}/200 câu</span>
                  <span>Đúng: {s.correct} ({s.accuracy}%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      s.isCompleted
                        ? 'bg-emerald-500'
                        : s.percent > 50
                        ? 'bg-indigo-600 dark:bg-indigo-500'
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${s.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-2">
              <button
                onClick={() => onSelectSet(s.setId, s.isStarted ? s.nextQuestionNum : 1)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{s.isStarted ? `Làm tiếp (câu ${s.nextQuestionNum})` : 'Luyện tập'}</span>
              </button>

              <button
                onClick={() => onStartExamForSet(s.setId)}
                title="Thi thử 30 phút bộ này"
                className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors whitespace-nowrap"
              >
                Thi thử
              </button>

              {s.answered > 0 && onResetSetProgress && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResetSetProgress(s.setId);
                  }}
                  title="Xoá kết quả của bộ này để luyện tập lại từ đầu"
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
