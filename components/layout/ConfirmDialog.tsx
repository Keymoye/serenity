"use client";

import React from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title = 'Confirm', description, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div className="mx-4 max-w-lg rounded-xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mt-2 text-xs text-slate-600">{description}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded px-3 py-1 text-sm">Cancel</button>
          <button onClick={onConfirm} className="rounded bg-red-600 px-3 py-1 text-sm text-white">Confirm</button>
        </div>
      </div>
    </div>
  );
}
