import React, { useState } from 'react';
import { Search, X, Play, ArrowRight } from 'lucide-react';
import { Question } from '../types';
import { loadQuestionSet } from '../utils/dataLoader';
import { cleanQuestionText, formatAnswerDisplay } from '../utils/answerChecker';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (setId: string, questionNumber: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Array<{ setId: string; question: Question }>>([]);
  const [searching, setSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim().toLowerCase();
    if (!term || term.length < 2) return;

    setSearching(true);
    setResults([]);

    // Search across cached sets or load first several sets
    const found: Array<{ setId: string; question: Question }> = [];
    // We check sets 0 to 10 for fast interactive search, expanding as needed
    const setsToSearch = ['bo01', 'bo02', 'bo03', 'bo04', 'bo00', 'bo05', 'bo06', 'bo07', 'bo08', 'bo09', 'bo10'];

    for (const sId of setsToSearch) {
      try {
        const data = await loadQuestionSet(sId);
        const matches = data.questions.filter((q: Question) => 
          q.question.toLowerCase().includes(term) || 
          q.answer.toLowerCase().includes(term) ||
          (q.vietnameseTranslation && q.vietnameseTranslation.toLowerCase().includes(term))
        );
        matches.forEach((m: Question) => found.push({ setId: sId, question: m }));
        if (found.length >= 25) break; // cap results for clean UI
      } catch (err) {
        // Ignore
      }
    }

    setResults(found);
    setSearching(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo từ khoá tiếng Anh hoặc tiếng Việt (vd: dentist, vacation, bought)..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {searching ? (
            <div className="p-8 text-center text-xs text-slate-400">Đang tìm kiếm trong kho câu hỏi...</div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {searchTerm.trim().length >= 2 ? 'Không tìm thấy câu hỏi phù hợp. Hãy thử từ khoá khác.' : 'Nhập ít nhất 2 ký tự và bấm Enter để tìm kiếm.'}
            </div>
          ) : (
            results.map(({ setId, question }) => (
              <div
                key={question.id}
                onClick={() => {
                  onSelectResult(setId, question.number);
                  onClose();
                }}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xs font-bold font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                      {setId.toUpperCase()} • Câu {question.number}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Đáp án: {formatAnswerDisplay(question.answer, question.options)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {cleanQuestionText(question.question, question.options)}
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
