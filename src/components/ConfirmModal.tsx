import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Trash2, X } from 'lucide-react';

export interface ConfirmDetailRow {
  label: string;
  value: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  variant?: 'danger' | 'approve' | 'warning';
  title: string;
  message: string;
  details?: ConfirmDetailRow[];
  confirmLabel?: string;
  cancelLabel?: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  defaultInputValue?: string;
  isLoading?: boolean;
  onConfirm: (inputValue: string) => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  variant = 'warning',
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  inputLabel,
  inputPlaceholder,
  inputRequired = false,
  defaultInputValue = '',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [inputValue, setInputValue] = useState(defaultInputValue);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultInputValue);
      setValidationError('');
    }
  }, [isOpen, defaultInputValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputLabel && inputRequired && !inputValue.trim()) {
      setValidationError(`${inputLabel} is required before proceeding.`);
      return;
    }
    setValidationError('');
    void onConfirm(inputValue.trim());
  };

  const theme = {
    danger: {
      iconBg: 'bg-rose-100 text-rose-600',
      button: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white',
      Icon: Trash2,
    },
    approve: {
      iconBg: 'bg-emerald-100 text-emerald-700',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white',
      Icon: CheckCircle2,
    },
    warning: {
      iconBg: 'bg-amber-100 text-amber-700',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
      Icon: AlertTriangle,
    },
  }[variant];

  const Icon = theme.Icon;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-[2px]">
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
              aria-label="Close confirmation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {details && details.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs">
              {details.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-500">{row.label}</span>
                  <span className="text-right font-semibold text-slate-900">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {inputLabel && (
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {inputLabel} {inputRequired && <span className="text-rose-600">*</span>}
              </label>
              <textarea
                rows={2}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder={inputPlaceholder}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              {validationError && <p className="mt-1 text-xs font-medium text-rose-600">{validationError}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${theme.button}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
