import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from '../constants/categories';
import type { ExpenseCategory } from '../types/expense';
import { generateId } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  editingCategory: ExpenseCategory | null;
  existingNames: string[];
  onClose: () => void;
  onSave: (category: ExpenseCategory) => Promise<void>;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  editingCategory,
  existingNames,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('Sparkles');
  const [color, setColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingCategory) {
      setName(editingCategory.name);
      setIcon(editingCategory.icon);
      setColor(editingCategory.color);
    } else {
      setName('');
      setIcon('Sparkles');
      setColor(CATEGORY_COLOR_OPTIONS[0]);
    }
    setError('');
  }, [isOpen, editingCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter a category name.');
      return;
    }
    const duplicate = existingNames.some(
      (n) =>
        n.toLowerCase() === trimmed.toLowerCase() &&
        (!editingCategory || editingCategory.name.toLowerCase() !== trimmed.toLowerCase())
    );
    if (duplicate) {
      setError('A category with this name already exists.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave({
        id: editingCategory ? editingCategory.id : generateId('cat_custom'),
        name: trimmed,
        icon,
        color,
        isCustom: editingCategory ? editingCategory.isCustom : true,
        createdAt: editingCategory ? editingCategory.createdAt : Date.now(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingCategory ? 'Edit Category' : 'Create Custom Category'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: color }}
            >
              <CategoryIcon name={icon} className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <label
                htmlFor="cat-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1"
              >
                Category Name *
              </label>
              <input
                id="cat-name"
                type="text"
                maxLength={40}
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Gym, Travel, Maintenance"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Choose Color
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-lg border-2 transition-transform ${
                    color === c
                      ? 'border-slate-900 dark:border-white scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Choose Icon
            </span>
            <div className="grid grid-cols-6 gap-2">
              {CATEGORY_ICON_OPTIONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`min-h-[42px] rounded-xl border flex items-center justify-center transition-colors ${
                    icon === ic
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  aria-label={`Icon ${ic}`}
                >
                  <CategoryIcon name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-3 text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-h-[46px] rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
