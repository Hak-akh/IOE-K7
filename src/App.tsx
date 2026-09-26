import React, { useState, useEffect } from 'react';
import { 
  SetMeta, 
  QuestionSetData, 
  UserProgress, 
  UserSettings, 
  ExamRecord 
} from './types';
import { loadSetsIndex, loadQuestionSet, getDefaultSetsIndex } from './utils/dataLoader';
import { loadProgress, saveProgress, DEFAULT_PROGRESS } from './utils/storage';
import { Navbar } from './components/Navbar';
import { SetSelector } from './components/SetSelector';
import { QuestionCard } from './components/QuestionCard';
import { QuestionGridModal } from './components/QuestionGridModal';
import { MockExamView } from './components/MockExamView';
import { WrongQuestionsNotebook } from './components/WrongQuestionsNotebook';
import { BookmarksView } from './components/BookmarksView';
import { StatsView } from './components/StatsView';
import { SearchModal } from './components/SearchModal';
import { ExportImportModal } from './components/ExportImportModal';
import { ChevronLeft, BookOpen, Layers } from 'lucide-react';

export default function App() {
  // Navigation tabs
  const [currentTab, setCurrentTab] = useState<'practice' | 'exam' | 'wrong' | 'bookmarks' | 'stats'>('practice');

  // Metadata & sets
  const [sets, setSets] = useState<SetMeta[]>(getDefaultSetsIndex());
  const [currentSetId, setCurrentSetId] = useState<string>('bo01');
  const [currentSetData, setCurrentSetData] = useState<QuestionSetData | null>(null);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [loadingSet, setLoadingSet] = useState<boolean>(false);
  const [viewingSpecificSet, setViewingSpecificSet] = useState<boolean>(false);

  // User progress & storage
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  // Modals
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Apply dark mode to document element
  useEffect(() => {
    if (progress.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [progress.settings.darkMode]);

  // Load sets index on initial mount
  useEffect(() => {
    loadSetsIndex().then((loadedSets) => {
      setSets(loadedSets);
    });
  }, []);

  // Load question set data when currentSetId changes
  useEffect(() => {
    let isMounted = true;
    const fetchSet = async () => {
      setLoadingSet(true);
      try {
        const data = await loadQuestionSet(currentSetId);
        if (isMounted) {
          setCurrentSetData(data);
        }
      } catch (err) {
        console.error('Failed to load question set:', err);
      } finally {
        if (isMounted) setLoadingSet(false);
      }
    };

    fetchSet();
    return () => { isMounted = false; };
  }, [currentSetId]);

  // Update Settings
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = {
      ...progress,
      settings: { ...progress.settings, ...newSettings },
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Answer a question in Practice Mode
  const handleAnswerQuestion = (userAnswer: string, isCorrect: boolean) => {
    if (!currentSetData) return;
    const currentQ = currentSetData.questions[currentQuestionNumber - 1];
    if (!currentQ) return;

    const qId = currentQ.id;
    const newAnswers = {
      ...progress.answers,
      [qId]: {
        userAnswer,
        isCorrect,
        timestamp: Date.now(),
      },
    };

    // Update wrong questions list
    let newWrong = [...progress.wrongQuestionIds];
    if (!isCorrect) {
      if (!newWrong.includes(qId)) {
        newWrong.push(qId);
      }
    } else {
      // If already correct, remove from wrong list
      newWrong = newWrong.filter(id => id !== qId);
    }

    const updated = {
      ...progress,
      answers: newAnswers,
      wrongQuestionIds: newWrong,
    };

    setProgress(updated);
    saveProgress(updated);
  };

  // Toggle Bookmark
  const handleToggleBookmark = (targetQId?: string) => {
    const qId = targetQId || (currentSetData ? currentSetData.questions[currentQuestionNumber - 1]?.id : null);
    if (!qId) return;

    let newBookmarks = [...progress.bookmarkedIds];
    if (newBookmarks.includes(qId)) {
      newBookmarks = newBookmarks.filter(id => id !== qId);
    } else {
      newBookmarks.push(qId);
    }

    const updated = {
      ...progress,
      bookmarkedIds: newBookmarks,
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Remove from wrong notebook
  const handleRemoveFromWrong = (questionId: string) => {
    const updated = {
      ...progress,
      wrongQuestionIds: progress.wrongQuestionIds.filter(id => id !== questionId),
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Clear all wrong
  const handleClearAllWrong = () => {
    const updated = {
      ...progress,
      wrongQuestionIds: [],
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Clear single question answer so user can retry
  const handleClearQuestionAnswer = (targetQId?: string) => {
    const qId = targetQId || (currentQuestion ? currentQuestion.id : null);
    if (!qId) return;

    const newAnswers = { ...progress.answers };
    delete newAnswers[qId];

    const updated = {
      ...progress,
      answers: newAnswers,
      wrongQuestionIds: progress.wrongQuestionIds.filter(id => id !== qId),
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Reset all answers for a specific set
  const handleResetSetProgress = (setId: string) => {
    if (typeof window !== 'undefined' && !window.confirm(`Bạn có chắc muốn xoá kết quả luyện tập của bộ đề ${setId.toUpperCase()} để làm lại từ đầu?`)) {
      return;
    }
    const newAnswers = { ...progress.answers };
    Object.keys(newAnswers).forEach(id => {
      if (id.startsWith(`${setId}-`)) {
        delete newAnswers[id];
      }
    });

    const updated = {
      ...progress,
      answers: newAnswers,
      wrongQuestionIds: progress.wrongQuestionIds.filter(id => !id.startsWith(`${setId}-`)),
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Clear entire progress
  const handleClearAllProgress = () => {
    const updated = {
      ...DEFAULT_PROGRESS,
      settings: progress.settings,
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Select a set from SetSelector
  const handleSelectSet = (setId: string, questionNumber = 1) => {
    setCurrentSetId(setId);
    setCurrentQuestionNumber(questionNumber);
    setViewingSpecificSet(true);
    setCurrentTab('practice');
  };

  // Start exam for a set
  const handleStartExamForSet = (setId: string) => {
    setCurrentSetId(setId);
    setCurrentTab('exam');
  };

  // Handle finished exam
  const handleFinishExam = (record: ExamRecord) => {
    const updated = {
      ...progress,
      examHistory: [record, ...progress.examHistory],
    };

    // Also add wrong questions from this exam into wrongQuestionIds
    const newWrong = [...progress.wrongQuestionIds];
    Object.entries(record.answers).forEach(([qId, info]) => {
      if (!info.isCorrect && !newWrong.includes(qId)) {
        newWrong.push(qId);
      }
    });
    updated.wrongQuestionIds = newWrong;

    setProgress(updated);
    saveProgress(updated);
  };

  // Jump from search or bookmarks
  const handleJumpToQuestion = (setId: string, questionNumber: number) => {
    setCurrentSetId(setId);
    setCurrentQuestionNumber(questionNumber);
    setViewingSpecificSet(true);
    setCurrentTab('practice');
  };

  const currentQuestion = currentSetData?.questions[currentQuestionNumber - 1];
  const currentQProgress = currentQuestion ? progress.answers[currentQuestion.id] : undefined;
  const isCurrentBookmarked = currentQuestion ? progress.bookmarkedIds.includes(currentQuestion.id) : false;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'practice' && viewingSpecificSet) {
            // Keep viewing set or stay in set
          }
        }}
        wrongCount={progress.wrongQuestionIds.length}
        bookmarkCount={progress.bookmarkedIds.length}
        settings={progress.settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: PRACTICE MODE */}
        {currentTab === 'practice' && (
          <div>
            {!viewingSpecificSet ? (
              // All 51 Sets Grid View
              <SetSelector
                sets={sets}
                progress={progress}
                onSelectSet={handleSelectSet}
                onStartExamForSet={handleStartExamForSet}
                onResetSetProgress={handleResetSetProgress}
              />
            ) : (
              // Single Set Question View
              <div className="space-y-4">
                {/* Back to all sets header bar */}
                <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <button
                    onClick={() => setViewingSpecificSet(false)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại danh sách {sets.length} bộ đề</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentSetData?.title || `Bộ đề ${currentSetId}`}
                    </span>
                    <button
                      onClick={() => setIsGridOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Mục lục (200 câu)</span>
                    </button>
                  </div>
                </div>

                {/* Question Card */}
                {loadingSet || !currentQuestion ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-400">
                    Đang nạp dữ liệu câu hỏi...
                  </div>
                ) : (
                  <QuestionCard
                    question={currentQuestion}
                    totalQuestions={currentSetData.totalQuestions}
                    progress={currentQProgress}
                    isBookmarked={isCurrentBookmarked}
                    onAnswer={handleAnswerQuestion}
                    onToggleBookmark={() => handleToggleBookmark()}
                    onClearAnswer={() => handleClearQuestionAnswer()}
                    onNext={() => setCurrentQuestionNumber(prev => Math.min(currentSetData.totalQuestions, prev + 1))}
                    onPrev={() => setCurrentQuestionNumber(prev => Math.max(1, prev - 1))}
                    onOpenGrid={() => setIsGridOpen(true)}
                    settings={progress.settings}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MOCK EXAM MODE */}
        {currentTab === 'exam' && (
          <MockExamView
            sets={sets}
            defaultSetId={currentSetId}
            onFinishExam={handleFinishExam}
            onBackToPractice={() => setCurrentTab('practice')}
            settings={progress.settings}
          />
        )}

        {/* TAB 3: WRONG QUESTIONS NOTEBOOK */}
        {currentTab === 'wrong' && (
          <WrongQuestionsNotebook
            progress={progress}
            onRemoveFromWrong={handleRemoveFromWrong}
            onClearAllWrong={handleClearAllWrong}
            onPracticeQuestion={handleJumpToQuestion}
            settings={progress.settings}
          />
        )}

        {/* TAB 4: BOOKMARKED QUESTIONS */}
        {currentTab === 'bookmarks' && (
          <BookmarksView
            progress={progress}
            onToggleBookmark={handleToggleBookmark}
            onPracticeQuestion={handleJumpToQuestion}
            settings={progress.settings}
          />
        )}

        {/* TAB 5: STATS & OVERVIEW */}
        {currentTab === 'stats' && (
          <StatsView
            progress={progress}
            sets={sets}
            onExport={() => setIsExportImportOpen(true)}
            onClearAllProgress={handleClearAllProgress}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <strong>IOE K7 2024–2025</strong> • Chinh phục IOE K7 từng câu một ({sets.length} bộ đề × 200 câu = {(sets.length * 200).toLocaleString()} câu)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Tương thích 100% GitHub Pages</span>
            <span>•</span>
            <span>Offline-Ready (LocalStorage)</span>
          </div>
        </div>
      </footer>

      {/* 200 Question Palette Modal */}
      {currentSetData && (
        <QuestionGridModal
          isOpen={isGridOpen}
          onClose={() => setIsGridOpen(false)}
          totalQuestions={currentSetData.totalQuestions}
          currentQuestionNumber={currentQuestionNumber}
          setId={currentSetId}
          answers={progress.answers}
          bookmarkedIds={progress.bookmarkedIds}
          onSelectQuestion={(num) => setCurrentQuestionNumber(num)}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleJumpToQuestion}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        progress={progress}
        onProgressImported={(newProg) => setProgress(newProg)}
      />
    </div>
  );
}
