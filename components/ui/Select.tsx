"use client";

import React, { useId } from 'react';

interface Option { value: string; label: string }

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  hint?: string;
  error?: string | null;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, hint, error, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const aid = id ?? generatedId;
    const hintId = `${aid}-hint`;
    const errorId = `${aid}-error`;
    const describedBy = [] as string[];
    if (hint) describedBy.push(hintId);
    if (error) describedBy.push(errorId);

    return (
      <div>
        {label && <label htmlFor={aid} className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">{label}</label>}
        <select
          id={aid}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
          className={`block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
          {...rest}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hint && !error && <p id={hintId} className="mt-1 text-xs text-slate-600">{hint}</p>}
        {error && <p id={errorId} className="mt-1 text-xs text-red-700">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
