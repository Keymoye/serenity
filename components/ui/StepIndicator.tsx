"use client";

import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  current: number; // 0-based
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${i === current ? 'border-brand-500 bg-brand-500 text-white' : i < current ? 'border-brand-500 bg-white text-brand-500' : 'border-slate-300 bg-white text-slate-500'}`}>
              {i+1}
            </div>
            {i < steps.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${i < current ? 'bg-brand-500' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        {steps.map((s) => <span key={s}>{s}</span>)}
      </div>
    </div>
  );
}
