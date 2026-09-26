import React, { useState } from 'react';
import { X, Check, Bookmark, AlertCircle, Sparkles } from 'lucide-react';
import { QuestionProgress } from '../types';

interface QuestionGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  currentQuestionNumber: number;
  setId: string;
  answers: Record<string, QuestionProgress>;
  bookmarkedIds: string[];
  onSelectQuestion: (questionNumber: number) => void;
}

export const QuestionGridModal: React.FC<QuestionGridModalProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  currentQuestionNumber,
  setId,
  answers,
  bookmarkedIds,
  onSelectQuestion,
}) => {
  const [filter, setFilter] = useState<'all' | 'unanswered' | 'correct' | 'wrong' | 'bookmarked'>('all');

  if (!isOpen) return null;

  const questions = Array.from({ length: totalQuestions }, (_, i) => {
    const num = i + 1;
    const qId = `${setId}-q${String(num).padStart(3, '0')}`;
    const p = answers[qId];
    const isBookmarked = bookmarkedIds.includes(qId);
    return {
      num,
      qId,
      progress: p,
      isCorrect: p?.isCorrect,
      isAnswered: !!p,
      isBookmarked,
    };
  });

  const correctCount = questions.filter(q => q.isCorrect === true).length;
  const wrongCount = questions.filter(q => q.isAnswered && !q.isCorrect).length;
  const unansweredCount = questions.filter(q => !q.isAnswered).length;
  const bookmarkCount = questions.filter(q => q.isBookmarked).length;

  const filtered = questions.filter(q => {
    if (filter === 'correct') return q.isCorrect === true;
    if (filter === 'wrong') return q.isAnswered && !q.isCorrect;
    if (filter === 'unanswered') return !q.isAnswered;
    if (filter === 'bookmarked') return q.isBookmarked;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Bảng mục lục 200 câu hỏi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chọn câu hỏi để chuyển đến ngay lập tức
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tất cả ({totalQuestions})
          </button>
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'unanswered'
                ? 'bg-slate-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Chưa làm ({unansweredCount})
          </button>
          <button
            onClick={() => setFilter('correct')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'correct'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Đúng ({correctCount})
          </button>
          <button
            onClick={() => setFilter('wrong')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'wrong'
                ? 'bg-rose-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Sai ({wrongCount})
          </button>
          <button
            onClick={() => setFilter('bookmarked')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filter === 'bookmarked'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Đã lưu ({bookmarkCount})
          </button>
        </div>

        {/* 200 Questions Grid */}
        <div className="p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {filtered.map((q) => {
              const isCurrent = q.num === currentQuestionNumber;
              let btnClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400';

              if (q.isAnswered) {
                if (q.isCorrect) {
                  btnClass = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                } else {
                  btnClass = 'bg-rose-500 text-white border-rose-600 font-bold';
                }
              }

              if (isCurrent) {
                btnClass += ' ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900 font-extrabold';
              }

              return (
                <button
                  key={q.num}
                  onClick={() => {
                    onSelectQuestion(q.num);
                    onClose();
                  }}
                  className={`h-11 rounded-xl border flex flex-col items-center justify-center relative text-xs font-mono transition-all active:scale-95 ${btnClass}`}
                >
                  <span>{q.num}</span>
                  {q.isBookmarked && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer legend */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span> Làm đúng
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block"></span> Làm sai
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 inline-block"></span> Chưa làm
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span> Đã đánh dấu
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
