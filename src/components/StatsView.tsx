import React from 'react';
import { UserProgress, SetMeta } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileDown, 
  RotateCcw,
  Sparkles,
  Bookmark,
  AlertCircle
} from 'lucide-react';
import { exportProgressToFile } from '../utils/storage';

interface StatsViewProps {
  progress: UserProgress;
  sets: SetMeta[];
  onExport: () => void;
  onClearAllProgress: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  progress,
  sets,
  onExport,
  onClearAllProgress,
}) => {
  const totalQuestionsAllSets = 10200;
  const answeredCount = Object.keys(progress.answers).length;
  const correctCount = Object.values(progress.answers).filter(a => a.isCorrect).length;
  const wrongCount = answeredCount - correctCount;
  const overallAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const overallProgressPercent = Math.min(100, Math.round((answeredCount / totalQuestionsAllSets) * 100));

  // Count fully completed sets
  let completedSetsCount = 0;
  sets.forEach(s => {
    let setAnsCount = 0;
    for (let qNum = 1; qNum <= s.totalQuestions; qNum++) {
      const qId = `${s.setId}-q${String(qNum).padStart(3, '0')}`;
      if (progress.answers[qId]) setAnsCount++;
    }
    if (setAnsCount === s.totalQuestions) completedSetsCount++;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold bg-indigo-500/30 px-2 py-0.5 rounded border border-indigo-400/30">
              Tổng quan kết quả học tập
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Thống kê tiến độ IOE K7
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Theo dõi sự tiến bộ hàng ngày qua từng bộ đề, tỷ lệ trả lời đúng và kết quả các kỳ thi thử.
          </p>
        </div>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors shrink-0"
        >
          <FileDown className="w-4 h-4" />
          <span>Xuất file sao lưu (JSON)</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tổng câu đã làm
          </div>
          <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">
            {answeredCount} <span className="text-xs font-normal text-slate-400">/ 10.200</span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${overallProgressPercent}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Độ chính xác
          </div>
          <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {overallAccuracy}%
          </div>
          <div className="text-xs text-slate-500">
            {correctCount} câu đúng • {wrongCount} câu sai
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Bộ đề hoàn thành
          </div>
          <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {completedSetsCount} <span className="text-xs font-normal text-slate-400">/ 51 bộ</span>
          </div>
          <div className="text-xs text-slate-500">
            {Math.round((completedSetsCount / 51) * 100)}% toàn bộ kho đề
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Số lần thi thử
          </div>
          <div className="text-3xl font-black font-mono text-amber-500">
            {progress.examHistory.length}
          </div>
          <div className="text-xs text-slate-500">
            {progress.examHistory.length > 0
              ? `Điểm cao nhất: ${Math.max(...progress.examHistory.map(e => e.score))}đ`
              : 'Chưa làm bài thi thử nào'}
          </div>
        </div>
      </div>

      {/* Exam History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Lịch sử các lần thi thử IOE</span>
        </h3>

        {progress.examHistory.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            Bạn chưa làm bài thi thử nào. Hãy vào mục "Thi thử" trên thanh điều hướng để thử sức!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {progress.examHistory.map((exam, i) => (
              <div key={exam.id || i} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">{exam.title}</div>
                  <div className="text-slate-400">
                    Ngày thi: {exam.date} • Thời gian: {Math.floor(exam.timeSpentSeconds / 60)} phút {exam.timeSpentSeconds % 60} giây
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                      {exam.score}đ
                    </div>
                    <div className="text-slate-400">
                      {exam.correctCount}/{exam.totalQuestions} câu ({Math.round((exam.correctCount / exam.totalQuestions) * 100)}%)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-xs text-rose-900 dark:text-rose-300">Đặt lại toàn bộ tiến độ</h4>
          <p className="text-2xs text-rose-700 dark:text-rose-400">Xoá toàn bộ lịch sử câu trả lời, sổ tay câu sai và kết quả thi thử trên thiết bị này.</p>
        </div>
        <button
          onClick={() => {
            if (confirm('CẢNH BÁO: Thao tác này sẽ xoá sạch toàn bộ tiến độ học tập trên trình duyệt. Bạn có chắc chắn không?')) {
              onClearAllProgress();
            }
          }}
          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors"
        >
          Đặt lại dữ liệu
        </button>
      </div>
    </div>
  );
};
