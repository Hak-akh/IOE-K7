import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Bookmark, 
  AlertCircle, 
  BarChart3, 
  Search, 
  Volume2, 
  VolumeX, 
  Moon, 
  Sun, 
  Type,
  FileDown
} from 'lucide-react';
import { UserSettings } from '../types';

interface NavbarProps {
  currentTab: 'practice' | 'exam' | 'wrong' | 'bookmarks' | 'stats';
  onSelectTab: (tab: 'practice' | 'exam' | 'wrong' | 'bookmarks' | 'stats') => void;
  wrongCount: number;
  bookmarkCount: number;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onOpenSearch: () => void;
  onOpenExportImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  wrongCount,
  bookmarkCount,
  settings,
  onUpdateSettings,
  onOpenSearch,
  onOpenExportImport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & App Title */}
          <div 
            onClick={() => onSelectTab('practice')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-extrabold text-lg shadow-sm">
              7
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                  IOE K7 2024–2025
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  10.200 CÂU
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Chinh phục IOE K7 từng câu một
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('practice')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'practice'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>51 Bộ đề</span>
            </button>

            <button
              onClick={() => onSelectTab('exam')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'exam'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Thi thử</span>
            </button>

            <button
              onClick={() => onSelectTab('wrong')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'wrong'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-semibold border border-rose-200 dark:border-rose-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Sổ tay câu sai</span>
              {wrongCount > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-md bg-rose-500 text-white font-mono font-bold">
                  {wrongCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('bookmarks')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'bookmarks'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Đã lưu</span>
              {bookmarkCount > 0 && (
                <span className="text-xs px-1.5 py-0.2 rounded-md bg-amber-500 text-white font-mono font-bold">
                  {bookmarkCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('stats')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                currentTab === 'stats'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Thống kê</span>
            </button>
          </nav>

          {/* Quick Actions (Search, Sound, Font, Dark Mode, Backup) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSearch}
              title="Tìm kiếm câu hỏi (Ctrl+K)"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              title={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              onClick={() => {
                const nextSize = settings.fontSize === 'normal' ? 'large' : settings.fontSize === 'large' ? 'huge' : 'normal';
                onUpdateSettings({ fontSize: nextSize });
              }}
              title={`Cỡ chữ: ${settings.fontSize}`}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-0.5 text-xs font-bold"
            >
              <Type className="w-3.5 h-3.5" />
              <span>{settings.fontSize === 'huge' ? 'A++' : settings.fontSize === 'large' ? 'A+' : 'A'}</span>
            </button>

            <button
              onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
              title={settings.darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenExportImport}
              title="Sao lưu / Khôi phục tiến độ"
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <FileDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-200 dark:border-slate-800 py-2 px-2 bg-slate-50/70 dark:bg-slate-900/70">
        <button
          onClick={() => onSelectTab('practice')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded ${
            currentTab === 'practice' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>51 Bộ</span>
        </button>

        <button
          onClick={() => onSelectTab('exam')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded ${
            currentTab === 'exam' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Thi thử</span>
        </button>

        <button
          onClick={() => onSelectTab('wrong')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded relative ${
            currentTab === 'wrong' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Câu sai</span>
          {wrongCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('bookmarks')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded relative ${
            currentTab === 'bookmarks' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Đã lưu</span>
          {bookmarkCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('stats')}
          className={`flex flex-col items-center gap-1 text-xs py-1 px-2 rounded ${
            currentTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tiến độ</span>
        </button>
      </div>
    </header>
  );
};
