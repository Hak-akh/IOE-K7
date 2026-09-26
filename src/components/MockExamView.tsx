import React, { useState, useEffect, useRef } from 'react';
import { 
  QuestionSetData, 
  SetMeta, 
  Question, 
  ExamRecord, 
  UserSettings 
} from '../types';
import { 
  Clock, 
  AlertCircle, 
  Award, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Play,
  Volume2
} from 'lucide-react';
import { playCorrectSound, playWrongSound, playVictorySound, speakEnglish } from '../utils/sound';
import { loadQuestionSet } from '../utils/dataLoader';
import { 
  isAnswerCorrect, 
  formatOptionDisplay, 
  formatAnswerDisplay,
  cleanQuestionText 
} from '../utils/answerChecker';
import { getQuestionVietnameseTranslation } from '../utils/sentenceReconstructor';

interface MockExamViewProps {
  sets: SetMeta[];
  defaultSetId?: string;
  onFinishExam: (record: ExamRecord) => void;
  onBackToPractice: () => void;
  settings: UserSettings;
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  sets,
  defaultSetId = 'bo01',
  onFinishExam,
  onBackToPractice,
  settings,
}) => {
  // Exam setup states
  const [selectedSetId, setSelectedSetId] = useState(defaultSetId);
  const [examDurationMinutes, setExamDurationMinutes] = useState(30);
  const [examQuestionCount, setExamQuestionCount] = useState<number>(200);
  const [examState, setExamState] = useState<'setup' | 'running' | 'finished'>('setup');

  // Running exam states
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(30 * 60);

  // Finished review states
  const [examRecord, setExamRecord] = useState<ExamRecord | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start Exam
  const handleStartExam = async () => {
    setLoading(true);
    try {
      const data = await loadQuestionSet(selectedSetId);
      
      let examQs = [...data.questions];
      if (examQuestionCount < examQs.length) {
        examQs = examQs.slice(0, examQuestionCount);
      }

      setQuestions(examQs);
      setCurrentIdx(0);
      setUserAnswers({});
      setTimeLeftSeconds(examDurationMinutes * 60);
      setExamState('running');
    } catch (e) {
      alert('Không thể tải đề thi. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (examState !== 'running') return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleFinishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examState, questions, userAnswers]);

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Finish exam & compute score
  const handleFinishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    const answerDetails: Record<string, { userAnswer: string; isCorrect: boolean }> = {};

    questions.forEach((q, idx) => {
      const userAns = userAnswers[idx] || '';
      const isCorrect = isAnswerCorrect(userAns, q);
      if (isCorrect) correctCount++;
      answerDetails[q.id] = { userAnswer: userAns, isCorrect };
    });

    const score = correctCount * 10; // 10 points per question
    const timeSpent = (examDurationMinutes * 60) - timeLeftSeconds;

    const record: ExamRecord = {
      id: `exam-${Date.now()}`,
      setId: selectedSetId,
      title: sets.find(s => s.setId === selectedSetId)?.title || `Bộ đề ${selectedSetId}`,
      score,
      correctCount,
      totalQuestions: questions.length,
      timeSpentSeconds: timeSpent,
      date: new Date().toLocaleDateString('vi-VN'),
      answers: answerDetails,
    };

    setExamRecord(record);
    setExamState('finished');
    onFinishExam(record);

    if (score >= questions.length * 8) {
      playVictorySound(settings.soundEnabled);
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ===================== SETUP SCREEN =====================
  if (examState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              <Clock className="w-3.5 h-3.5" /> Chế độ thi thử IOE chuẩn
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Cài đặt bài thi thử Olympic tiếng Anh K7
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mô phỏng chân thực bài thi IOE cấp trường, cấp huyện và cấp tỉnh với đồng hồ đếm ngược và hệ thống tính điểm chuẩn 2000 điểm.
            </p>
          </div>

          {/* Select Set */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Chọn bộ đề thi
            </label>
            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {sets.map((s) => (
                <option key={s.setId} value={s.setId}>
                  {s.title} ({s.totalQuestions} câu)
                </option>
              ))}
            </select>
          </div>

          {/* Select Number of Questions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Số lượng câu hỏi
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { count: 50, label: '50 câu (Khởi động)' },
                { count: 100, label: '100 câu (Rút gọn)' },
                { count: 200, label: '200 câu (Chuẩn IOE)' },
              ].map((opt) => (
                <button
                  key={opt.count}
                  type="button"
                  onClick={() => {
                    setExamQuestionCount(opt.count);
                    setExamDurationMinutes(opt.count === 50 ? 10 : opt.count === 100 ? 15 : 30);
                  }}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    examQuestionCount === opt.count
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div>{opt.count} câu</div>
                  <div className="text-2xs font-normal opacity-70 mt-0.5">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Select Duration */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Thời gian làm bài (Phút)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[10, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setExamDurationMinutes(mins)}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                    examDurationMinutes === mins
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <button
              onClick={handleStartExam}
              disabled={loading}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{loading ? 'Đang tải đề thi...' : 'Bắt đầu làm bài thi'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== RUNNING EXAM SCREEN =====================
  if (examState === 'running') {
    const currentQ = questions[currentIdx];
    const isUrgent = timeLeftSeconds <= 180; // under 3 minutes

    return (
      <div className="space-y-6">
        {/* Sticky Exam Progress & Timer Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-4 sticky top-18 z-30">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Câu {currentIdx + 1} / {questions.length}
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              (Đã trả lời: {Object.keys(userAnswers).length}/{questions.length})
            </span>
          </div>

          {/* Countdown Clock */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
            isUrgent 
              ? 'bg-rose-500 text-white animate-pulse' 
              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={() => {
              if (confirm('Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?')) {
                handleFinishExam();
              }
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            Nộp bài
          </button>
        </div>

        {/* Current Question */}
        {currentQ && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
            
            {/* Audio player if present */}
            {currentQ.audio && (
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <audio controls src={currentQ.audio} className="w-full" />
              </div>
            )}

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Câu hỏi {currentIdx + 1}:
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                {cleanQuestionText(currentQ.question, currentQ.options)}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            {currentQ.options && currentQ.options.length > 0 && currentQ.type !== 'word_order' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const letter = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                  const isSelected = userAnswers[currentIdx] === opt || userAnswers[currentIdx] === formatOptionDisplay(opt);
                  return (
                    <button
                      key={optIdx}
                      onClick={() => setUserAnswers({ ...userAnswers, [currentIdx]: opt })}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left font-medium transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-600'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {letter}
                      </span>
                      <span className="pt-0.5">{formatOptionDisplay(opt)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill blank in exam mode */}
            {(!currentQ.options || currentQ.options.length === 0) && currentQ.type !== 'word_order' && (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={userAnswers[currentIdx] || ''}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [currentIdx]: e.target.value })}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
            )}

            {/* Word order in exam mode */}
            {currentQ.type === 'word_order' && (
              <div className="space-y-2 pt-2">
                <input
                  type="text"
                  value={userAnswers[currentIdx] || ''}
                  onChange={(e) => setUserAnswers({ ...userAnswers, [currentIdx]: e.target.value })}
                  placeholder="Gõ hoặc ghép câu hoàn chỉnh tại đây..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 disabled:opacity-30 font-bold text-xs text-slate-700 dark:text-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-bold text-xs"
              >
                <span>Câu sau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Question Selector Palette */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
            Mục lục câu hỏi ({questions.length} câu):
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
            {questions.map((_, i) => {
              const answered = !!userAnswers[i];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-8 rounded text-xs font-mono font-bold transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : answered
                      ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ===================== FINISHED SCORE & REVIEW SCREEN =====================
  if (examState === 'finished' && examRecord) {
    const accuracy = Math.round((examRecord.correctCount / examRecord.totalQuestions) * 100);

    return (
      <div className="space-y-6">
        {/* Scorecard Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold bg-white/10 px-2.5 py-1 rounded">
                Kết quả thi thử IOE K7
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold">{examRecord.title}</h2>
              <p className="text-slate-300 text-sm">
                Thời gian làm: {Math.floor(examRecord.timeSpentSeconds / 60)} phút {examRecord.timeSpentSeconds % 60} giây
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                  {examRecord.score}
                </div>
                <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  / {examRecord.totalQuestions * 10} điểm
                </div>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-black font-mono text-indigo-300">
                  {accuracy}%
                </div>
                <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                  {examRecord.correctCount}/{examRecord.totalQuestions} câu đúng
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setExamState('setup')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi lại đề khác</span>
            </button>

            <button
              onClick={onBackToPractice}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-colors"
            >
              <span>Về màn hình luyện tập</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Chi tiết câu trả lời
            </h3>
            
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setReviewFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  reviewFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'text-slate-500'
                }`}
              >
                Tất cả ({questions.length})
              </button>
              <button
                onClick={() => setReviewFilter('wrong')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  reviewFilter === 'wrong' ? 'bg-rose-600 text-white' : 'text-slate-500'
                }`}
              >
                Câu sai ({questions.length - examRecord.correctCount})
              </button>
              <button
                onClick={() => setReviewFilter('correct')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  reviewFilter === 'correct' ? 'bg-emerald-600 text-white' : 'text-slate-500'
                }`}
              >
                Câu đúng ({examRecord.correctCount})
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => {
              const ansInfo = examRecord.answers[q.id];
              const isCorrect = ansInfo?.isCorrect;

              if (reviewFilter === 'wrong' && isCorrect) return null;
              if (reviewFilter === 'correct' && !isCorrect) return null;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                      : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {cleanQuestionText(q.question, q.options)}
                      </span>
                    </div>

                    <span className="text-xs font-bold">
                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> +10đ
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> 0đ
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300 pl-8">
                    <div>
                      <span>Câu trả lời của bạn: </span>
                      <strong className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {ansInfo?.userAnswer ? formatOptionDisplay(ansInfo.userAnswer) : '(Bỏ trống)'}
                      </strong>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span>Đáp án đúng: </span>
                        <strong className="text-emerald-600 underline">{formatAnswerDisplay(q.answer, q.options)}</strong>
                      </div>
                    )}
                    <div className="text-emerald-700 dark:text-emerald-300 font-medium italic pt-0.5">
                      🇻🇳 "{getQuestionVietnameseTranslation(q)}"
                    </div>
                    <div className="text-slate-500 italic pt-1">
                      💡 {q.explanation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
