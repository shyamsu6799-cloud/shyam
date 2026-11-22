import React from 'react';
import { X } from 'lucide-react';

interface ReceiptPreviewModalProps {
  imageSrc: string | null;
  title?: string;
  onClose: () => void;
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  imageSrc,
  title = 'Receipt Photo',
  onClose,
}) => {
  if (!imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100 truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800"
            aria-label="Close receipt preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-slate-950 max-h-[75vh] overflow-auto">
          <img
            src={imageSrc}
            alt={title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[68vh] rounded-lg object-contain"
          />
        </div>
      </div>
    </div>
  );
};
