import React, { useState, useEffect, useRef } from 'react';
import { 
  Question, 
  QuestionProgress, 
  UserSettings 
} from '../types';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  RotateCcw, 
  Bookmark, 
  Check, 
  X, 
  Lightbulb, 
  Languages, 
  BookMarked, 
  GraduationCap, 
  ArrowLeft, 
  ArrowRight, 
  LayoutGrid,
  Sparkles,
  HelpCircle,
  Undo2
} from 'lucide-react';
import { playCorrectSound, playWrongSound, speakEnglish } from '../utils/sound';
import { 
  isAnswerCorrect, 
  isOptionCorrect, 
  isOptionSelected, 
  formatOptionDisplay, 
  formatAnswerDisplay,
  cleanQuestionText 
} from '../utils/answerChecker';
import { 
  getQuestionVietnameseTranslation 
} from '../utils/sentenceReconstructor';
import { getQuestionHints } from '../utils/hintGenerator';

interface QuestionCardProps {
  question: Question;
  totalQuestions: number;
  progress?: QuestionProgress;
  isBookmarked: boolean;
  onAnswer: (userAnswer: string, isCorrect: boolean) => void;
  onToggleBookmark: () => void;
  onClearAnswer?: () => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenGrid: () => void;
  settings: UserSettings;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  totalQuestions,
  progress,
  isBookmarked,
  onAnswer,
  onToggleBookmark,
  onClearAnswer,
  onNext,
  onPrev,
  onOpenGrid,
  settings,
}) => {
  // Input states
  const [fillInput, setFillInput] = useState('');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [activeHintLevel, setActiveHintLevel] = useState<number>(0);
  const [showLearningPanel, setShowLearningPanel] = useState<boolean>(false);
  const [activeLearningTab, setActiveLearningTab] = useState<'explanation' | 'translation' | 'grammar' | 'vocab' | 'hints'>('explanation');

  const hints = getQuestionHints(question);

  // Audio player states
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState<number>(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize word order pools
  useEffect(() => {
    if (question.type === 'word_order') {
      const parts = question.question
        .split('/')
        .map(w => w.trim())
        .filter(w => w.length > 0);
      setAvailableWords(parts);
      setSelectedWords([]);
    }
    setFillInput('');
    setActiveHintLevel(0);
    setShowLearningPanel(!!progress); // automatically open explanation if already answered
  }, [question.id, question.type, question.question, progress]);

  // Audio setup
  useEffect(() => {
    if (question.audio && audioRef.current) {
      audioRef.current.playbackRate = audioPlaybackRate;
    }
  }, [question.audio, audioPlaybackRate]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing into text input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'ArrowRight') {
        onNext();
      } else if (e.key === 'ArrowLeft') {
        onPrev();
      } else if (question.options && question.options.length > 0 && !progress) {
        const key = e.key.toUpperCase();
        const optionIndex = ['A', 'B', 'C', 'D'].indexOf(key);
        if (optionIndex !== -1 && question.options[optionIndex]) {
          handleSelectOption(question.options[optionIndex], optionIndex);
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          const numIdx = parseInt(e.key, 10) - 1;
          if (question.options[numIdx]) {
            handleSelectOption(question.options[numIdx], numIdx);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, progress, onNext, onPrev]);

  const handleSelectOption = (opt: string, optIndex?: number) => {
    const isCorrect = isOptionCorrect(opt, question, optIndex);
    if (isCorrect) {
      playCorrectSound(settings.soundEnabled);
    } else {
      playWrongSound(settings.soundEnabled);
    }
    onAnswer(formatOptionDisplay(opt), isCorrect);
    setShowLearningPanel(true);
  };

  const handleFillSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fillInput.trim()) return;

    const userAns = fillInput.trim();
    const isCorrect = isAnswerCorrect(userAns, question);

    if (isCorrect) {
      playCorrectSound(settings.soundEnabled);
    } else {
      playWrongSound(settings.soundEnabled);
    }
    onAnswer(userAns, isCorrect);
    setShowLearningPanel(true);
  };

  const handleWordOrderClickWord = (word: string, indexInAvailable: number) => {
    const newAvail = [...availableWords];
    newAvail.splice(indexInAvailable, 1);
    setAvailableWords(newAvail);
    setSelectedWords([...selectedWords, word]);
  };

  const handleWordOrderRemoveWord = (word: string, indexInSelected: number) => {
    const newSelected = [...selectedWords];
    newSelected.splice(indexInSelected, 1);
    setSelectedWords(newSelected);
    setAvailableWords([...availableWords, word]);
  };

  const handleWordOrderReset = () => {
    const parts = question.question
      .split('/')
      .map(w => w.trim())
      .filter(w => w.length > 0);
    setAvailableWords(parts);
    setSelectedWords([]);
  };

  const handleWordOrderSubmit = () => {
    if (selectedWords.length === 0) return;
    const userSentence = selectedWords.join(' ');
    const isCorrect = isAnswerCorrect(userSentence, question);

    if (isCorrect) {
      playCorrectSound(settings.soundEnabled);
    } else {
      playWrongSound(settings.soundEnabled);
    }
    onAnswer(userSentence, isCorrect);
    setShowLearningPanel(true);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => console.error('Audio play error:', err));
    }
  };

  const replayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setIsPlayingAudio(true);
    }).catch(err => console.error('Audio play error:', err));
  };

  // Font size multiplier
  const textClass = settings.fontSize === 'huge' ? 'text-xl' : settings.fontSize === 'large' ? 'text-lg' : 'text-base';
  const headingClass = settings.fontSize === 'huge' ? 'text-2xl' : settings.fontSize === 'large' ? 'text-xl' : 'text-lg';

  const isAnswered = !!progress;
  const isCorrectAnswer = progress ? (progress.isCorrect || isAnswerCorrect(progress.userAnswer, question)) : false;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      
      {/* Top Question Status Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenGrid}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Câu {question.number} / {totalQuestions}</span>
          </button>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize hidden sm:inline">
            {question.type === 'word_order' ? 'Sắp xếp từ' : 
             question.type === 'fill_blank' ? 'Điền vào chỗ trống' : 
             question.type === 'listening_multiple_choice' || question.type === 'listening_fill' ? 'Bài nghe' :
             question.type === 'pronunciation' ? 'Phát âm' :
             question.type === 'stress' ? 'Trọng âm' :
             question.type === 'odd_one_out' ? 'Tìm từ khác biệt' : 'Trắc nghiệm'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Retry/Clear question answer button if already answered */}
          {isAnswered && onClearAnswer && (
            <button
              onClick={onClearAnswer}
              title="Làm lại câu này"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-400 rounded-lg shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại</span>
            </button>
          )}

          {/* Quick Translation Button */}
          <button
            onClick={() => {
              setShowLearningPanel(true);
              setActiveLearningTab('translation');
            }}
            title="Xem dịch nghĩa tiếng Việt của câu này"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-2xs transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Dịch nghĩa</span>
          </button>

          {/* Quick Hint Button */}
          {!isAnswered && (
            <button
              onClick={() => {
                setActiveHintLevel(prev => (prev >= 3 ? 0 : prev + 1));
              }}
              title="Gợi ý 3 cấp độ giúp tự làm bài"
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors border ${
                activeHintLevel > 0
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{activeHintLevel > 0 ? `Gợi ý (Bậc ${activeHintLevel})` : 'Gợi ý'}</span>
            </button>
          )}

          {/* TTS Question Pronounce */}
          <button
            onClick={() => speakEnglish(question.question)}
            title="Nghe đọc đề bài"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleBookmark}
            title={isBookmarked ? 'Bỏ lưu câu hỏi' : 'Lưu câu hỏi này'}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Question Body */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Audio Player if present */}
        {question.audio && (
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> Âm thanh nghe IOE
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  onClick={() => setAudioPlaybackRate(r => r === 1.0 ? 0.8 : r === 0.8 ? 1.2 : 1.0)}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                >
                  {audioPlaybackRate}x tốc độ
                </button>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={question.audio}
              onEnded={() => setIsPlayingAudio(false)}
              onError={(e) => console.warn('Could not load audio:', e)}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={toggleAudio}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xs transition-colors shrink-0"
              >
                {isPlayingAudio ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>
              <button
                onClick={replayAudio}
                title="Nghe lại từ đầu"
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isPlayingAudio ? 'Đang phát âm thanh...' : 'Bấm Play để nghe đoạn băng'}
              </div>
            </div>
          </div>
        )}

        {/* Question Text */}
        <div className="space-y-2">
          {question.type === 'word_order' ? (
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Hãy sắp xếp các cụm từ sau thành câu hoàn chỉnh:
              </div>
              <div className={`font-mono font-semibold text-slate-800 dark:text-slate-200 ${headingClass} p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 leading-relaxed`}>
                {cleanQuestionText(question.question, question.options)}
              </div>
            </div>
          ) : (
            <h2 className={`font-bold text-slate-900 dark:text-white ${headingClass} leading-relaxed`}>
              {cleanQuestionText(question.question, question.options)}
            </h2>
          )}
        </div>

        {/* ======================= ANSWER INTERFACES ======================= */}

        {/* Case 1: Multiple Choice Options */}
        {question.options && question.options.length > 0 && question.type !== 'word_order' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {question.options.map((opt, idx) => {
              const optionLetter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
              const isSelected = isOptionSelected(opt, idx, progress?.userAnswer);
              const isCorrectOpt = isOptionCorrect(opt, question, idx);
              
              let cardStyle = 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
              let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

              if (isAnswered) {
                if (isCorrectOpt) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                  badgeStyle = 'bg-emerald-500 text-white font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  cardStyle = 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-semibold ring-1 ring-rose-500';
                  badgeStyle = 'bg-rose-500 text-white font-bold';
                } else {
                  cardStyle = 'opacity-50 border-slate-200 dark:border-slate-800';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt, idx)}
                  className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${cardStyle} disabled:cursor-default`}
                >
                  <span className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${badgeStyle}`}>
                    {optionLetter}
                  </span>
                  <span className={`pt-0.5 leading-normal ${textClass}`}>
                    {formatOptionDisplay(opt)}
                  </span>
                  {isAnswered && isCorrectOpt && (
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
                  )}
                  {isAnswered && isSelected && !isCorrectOpt && (
                    <X className="w-5 h-5 text-rose-600 dark:text-rose-400 ml-auto shrink-0" />
                  )}
                </button>
              );
            })}

            {isAnswered && (
              <div className={`col-span-1 sm:col-span-2 p-3.5 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 ${
                isCorrectAnswer 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div>
                  <span className="font-bold">{isCorrectAnswer ? 'Chính xác! ' : 'Chưa đúng! '}</span>
                  <span>Đáp án đúng là: </span>
                  <span className="font-mono font-bold underline ml-1">{formatAnswerDisplay(question.answer, question.options)}</span>
                </div>
                {onClearAnswer && (
                  <button
                    onClick={onClearAnswer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Case 2: Fill in the blank */}
        {(!question.options || question.options.length === 0) && question.type !== 'word_order' && (
          <form onSubmit={handleFillSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Nhập đáp án vào ô dưới đây (hoặc các chữ cái còn thiếu):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  disabled={isAnswered}
                  value={isAnswered ? progress.userAnswer : fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  placeholder="Gõ đáp án của bạn tại đây..."
                  className={`flex-1 px-4 py-3 rounded-xl border text-slate-900 dark:text-white font-mono font-medium focus:outline-none transition-all ${
                    isAnswered
                      ? isCorrectAnswer
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 ring-1 ring-rose-500'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600'
                  }`}
                  autoFocus
                />
                {!isAnswered && (
                  <button
                    type="submit"
                    disabled={!fillInput.trim()}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors whitespace-nowrap"
                  >
                    Kiểm tra
                  </button>
                )}
              </div>
            </div>

            {isAnswered && (
              <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 ${
                isCorrectAnswer 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div>
                  <span className="font-bold">{isCorrectAnswer ? 'Chính xác! ' : 'Chưa đúng! '}</span>
                  <span>Đáp án đúng là: </span>
                  <span className="font-mono font-bold underline text-base ml-1">{formatAnswerDisplay(question.answer, question.options)}</span>
                </div>
                {onClearAnswer && (
                  <button
                    type="button"
                    onClick={onClearAnswer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>
            )}
          </form>
        )}

        {/* Case 3: Word order / Sentence unscramble */}
        {question.type === 'word_order' && (
          <div className="space-y-4 pt-2">
            {/* Target Constructed Sentence Row */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                <span>Câu bạn đã ghép ({selectedWords.length} cụm từ):</span>
                {!isAnswered && selectedWords.length > 0 && (
                  <button
                    onClick={handleWordOrderReset}
                    className="flex items-center gap-1 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>

              <div className={`min-h-[64px] p-3.5 rounded-xl border-2 border-dashed flex flex-wrap items-center gap-2 transition-all ${
                isAnswered
                  ? isCorrectAnswer
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30'
                  : 'border-indigo-300 dark:border-indigo-800/80 bg-slate-50/60 dark:bg-slate-800/40'
              }`}>
                {selectedWords.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    Bấm vào các từ bên dưới theo thứ tự để ghép thành câu...
                  </span>
                ) : (
                  selectedWords.map((word, idx) => (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleWordOrderRemoveWord(word, idx)}
                      title={isAnswered ? '' : 'Bấm để trả từ lại'}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-semibold text-sm shadow-xs hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                    >
                      <span>{word}</span>
                      {!isAnswered && <X className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Source Word Bank */}
            {!isAnswered && (
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  Ngân hàng từ:
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableWords.map((word, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWordOrderClickWord(word, idx)}
                      className="px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-2xs transition-all active:scale-95"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Check button for Word Order */}
            {!isAnswered && (
              <div className="pt-2">
                <button
                  onClick={handleWordOrderSubmit}
                  disabled={availableWords.length > 0}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm shadow-xs transition-colors"
                >
                  {availableWords.length > 0 ? `Còn ${availableWords.length} từ chưa ghép` : 'Kiểm tra câu'}
                </button>
              </div>
            )}

            {/* Answer verdict */}
            {isAnswered && (
              <div className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between gap-3 ${
                isCorrectAnswer 
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div>
                  <div className="font-bold mb-1">{isCorrectAnswer ? 'Chính xác!' : 'Chưa đúng!'}</div>
                  <div>Đáp án đúng: <span className="font-bold underline ml-1">{formatAnswerDisplay(question.answer, question.options)}</span></div>
                </div>
                {onClearAnswer && (
                  <button
                    type="button"
                    onClick={onClearAnswer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================= 3-LEVEL HINT SYSTEM ======================= */}
        {!isAnswered && (
          <div className="border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Hệ thống gợi ý 3 cấp độ
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setActiveHintLevel(lvl === activeHintLevel ? 0 : lvl)}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                      activeHintLevel >= lvl
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    Bậc {lvl}
                  </button>
                ))}
                {activeHintLevel > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveHintLevel(0)}
                    title="Thu gọn gợi ý"
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {activeHintLevel > 0 ? (
              <div className="space-y-2 pt-1">
                {[1, 2, 3].slice(0, activeHintLevel).map((lvl) => (
                  <div
                    key={lvl}
                    className="text-xs text-amber-950 dark:text-amber-200 p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/80 bg-white/80 dark:bg-slate-900/80 space-y-1 shadow-2xs"
                  >
                    <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                      <span>⭐ Gợi ý bậc {lvl}:</span>
                      <span className="text-2xs font-normal text-slate-500 dark:text-slate-400">
                        {lvl === 1 ? '(Định hướng & Ngữ cảnh)' : lvl === 2 ? '(Ngữ pháp & Cấu trúc)' : '(Manh mối tiệm cận đáp án)'}
                      </span>
                    </div>
                    <p className="leading-relaxed">{hints[lvl - 1]}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Bấm nút <strong>Gợi ý</strong> hoặc chọn <strong>Bậc 1, 2, 3</strong> ở trên để nhận manh mối từng bước mà không làm lộ đáp án trước.
              </p>
            )}
          </div>
        )}

        {/* ======================= LEARNING & EXPLANATION PANEL ======================= */}
        {(showLearningPanel || isAnswered) && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Tabs Header */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setActiveLearningTab('explanation')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeLearningTab === 'explanation'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giải thích</span>
              </button>

              <button
                onClick={() => setActiveLearningTab('translation')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeLearningTab === 'translation'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>Dịch nghĩa</span>
              </button>

              <button
                onClick={() => setActiveLearningTab('grammar')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeLearningTab === 'grammar'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Ngữ pháp</span>
              </button>

              <button
                onClick={() => setActiveLearningTab('vocab')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeLearningTab === 'vocab'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>Từ vựng ({question.vocabulary?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveLearningTab('hints')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  activeLearningTab === 'hints'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Gợi ý</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm leading-relaxed">
              
              {/* Tab 1: Detailed Explanation */}
              {activeLearningTab === 'explanation' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" /> Phân tích đáp án chuẩn
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {question.explanation || 'Đáp án chính xác dựa theo quy chuẩn chương trình Tiếng Anh THCS và thể lệ thi Olympic IOE.'}
                  </p>
                  {isAnswered ? (
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/80 font-mono text-xs text-slate-800 dark:text-slate-200">
                      <span className="text-slate-500 font-sans">Đáp án ghi nhận: </span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{formatAnswerDisplay(question.answer, question.options)}</strong>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Hãy chọn hoặc điền đáp án của bạn trước khi xem đáp án chi tiết nhé!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Vietnamese Translation */}
              {activeLearningTab === 'translation' && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                        <Languages className="w-4 h-4" /> Dịch nghĩa tiếng Việt
                      </div>
                      <span className="text-2xs font-medium text-emerald-700 dark:text-emerald-400">
                        Hiểu câu hỏi để tự suy nghĩ đáp án
                      </span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 font-medium text-base leading-relaxed">
                      "{getQuestionVietnameseTranslation(question)}"
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Grammar Focus */}
              {activeLearningTab === 'grammar' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <GraduationCap className="w-4 h-4" /> Điểm ngữ pháp trọng tâm
                  </div>
                  <p className="text-slate-700 dark:text-slate-300">
                    {question.grammarPoint || 'Quy tắc ngữ pháp tiếng Anh trọng tâm lớp 7.'}
                  </p>
                </div>
              )}

              {/* Tab 4: Key Vocabulary */}
              {activeLearningTab === 'vocab' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                    <BookMarked className="w-4 h-4" /> Từ vựng cần nhớ
                  </div>
                  {question.vocabulary && question.vocabulary.length > 0 ? (
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {question.vocabulary.map((v, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{v.word}</span>
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 italic">({v.pos})</span>
                            {v.ipa && <span className="text-xs text-slate-400 font-mono hidden sm:inline">/{v.ipa}/</span>}
                            <span className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm">— {v.meaning}</span>
                          </div>
                          <button
                            onClick={() => speakEnglish(v.word)}
                            title="Nghe phát âm từ này"
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs">Chưa có bảng từ vựng chi tiết cho câu hỏi này.</p>
                  )}
                </div>
              )}

              {/* Tab 5: 3-Level Hints */}
              {activeLearningTab === 'hints' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <Lightbulb className="w-4 h-4" /> Hệ thống gợi ý 3 cấp độ
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setActiveHintLevel(lvl === activeHintLevel ? 0 : lvl)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            activeHintLevel >= lvl
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
                          }`}
                        >
                          Bậc {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    {activeHintLevel === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200/60 dark:border-amber-900/60">
                        Chọn một bậc gợi ý bên trên hoặc bấm nút <strong>Gợi ý</strong> bên dưới để mở khóa manh mối giúp bạn tự suy nghĩ đáp án.
                      </p>
                    ) : (
                      [1, 2, 3].slice(0, activeHintLevel).map((lvl) => (
                        <div
                          key={lvl}
                          className="text-xs text-amber-950 dark:text-amber-200 p-3 rounded-lg border border-amber-200/80 dark:border-amber-900/80 bg-white/80 dark:bg-slate-900/80 space-y-1 shadow-2xs"
                        >
                          <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                            <span>⭐ Gợi ý bậc {lvl}:</span>
                            <span className="text-2xs font-normal text-slate-500 dark:text-slate-400">
                              {lvl === 1 ? '(Định hướng & Ngữ cảnh)' : lvl === 2 ? '(Ngữ pháp & Cấu trúc)' : '(Manh mối tiệm cận đáp án)'}
                            </span>
                          </div>
                          <p className="leading-relaxed">{hints[lvl - 1]}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={onPrev}
          disabled={question.number <= 1}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-2">
          {!showLearningPanel && !isAnswered && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowLearningPanel(true);
                  setActiveLearningTab('translation');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-colors"
              >
                <Languages className="w-4 h-4" />
                <span>Dịch nghĩa</span>
              </button>

              <button
                onClick={() => {
                  setActiveHintLevel(prev => (prev >= 3 ? 0 : prev + 1));
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  activeHintLevel > 0
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>{activeHintLevel > 0 ? `Gợi ý (Bậc ${activeHintLevel}/3)` : 'Gợi ý làm bài'}</span>
              </button>
            </div>
          )}

          <button
            onClick={onNext}
            disabled={question.number >= totalQuestions}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-indigo-600 dark:hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white dark:text-slate-900 text-xs font-bold shadow-xs transition-colors"
          >
            <span>Câu tiếp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
