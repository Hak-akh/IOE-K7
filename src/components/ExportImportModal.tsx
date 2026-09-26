import React, { useState } from 'react';
import { X, FileDown, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProgress } from '../types';
import { exportProgressToFile, importProgressFromFile } from '../utils/storage';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  onProgressImported: (newProgress: UserProgress) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  progress,
  onProgressImported,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorStatus(null);
      const imported = await importProgressFromFile(file);
      setImportStatus('Khôi phục dữ liệu tiến độ thành công!');
      onProgressImported(imported);
      setTimeout(() => {
        onClose();
        setImportStatus(null);
      }, 1500);
    } catch (err: unknown) {
      setErrorStatus(err instanceof Error ? err.message : 'File không hợp lệ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            Sao lưu & Khôi phục dữ liệu
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Tiến độ học tập và câu hỏi đã lưu được lưu trữ trên trình duyệt của thiết bị này. 
          Bạn có thể xuất file sao lưu để chuyển sang máy tính hoặc điện thoại khác.
        </p>

        {/* Export action */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
            1. Xuất tiến độ hiện tại
          </div>
          <button
            onClick={() => exportProgressToFile(progress)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Tải về file sao lưu (JSON)</span>
          </button>
        </div>

        {/* Import action */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
            2. Khôi phục từ file có sẵn
          </div>
          <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Chọn file JSON để khôi phục</span>
            <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {errorStatus && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
};
