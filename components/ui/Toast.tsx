"use client";

import React, { useEffect, useState } from 'react';

type ToastKind = 'success' | 'error' | 'info' | 'warning';

interface ToastItem { id: string; kind: ToastKind; message: string }

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastItem;
      setToasts((t) => [...t, detail]);
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== detail.id));
      }, 4000);
    };
    window.addEventListener('serenity:toast', onToast as EventListener);
    return () => window.removeEventListener('serenity:toast', onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-md bg-white px-4 py-2 shadow">{t.message}</div>
      ))}
    </div>
  );
}

export function pushToast(kind: ToastKind, message: string) {
  const id = Math.random().toString(36).slice(2,9);
  window.dispatchEvent(new CustomEvent('serenity:toast', { detail: { id, kind, message } }));
}
