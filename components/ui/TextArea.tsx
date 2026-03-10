"use client";

import React, { useState, useId } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  maxLength?: number;
  hint?: string;
  error?: string | null;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, maxLength = 500, hint, error, id, className = '', ...rest }, ref) => {
    const generatedId = useId();
    const aid = id ?? generatedId;
    const hintId = `${aid}-hint`;
    const errorId = `${aid}-error`;
    const describedBy = [] as string[];
    if (hint) describedBy.push(hintId);
    if (error) describedBy.push(errorId);

    const isControlled = rest.value !== undefined;
    const [internalValue, setInternalValue] = useState(() => (rest.defaultValue ?? '') as string);
    const currentValue = isControlled ? (rest.value as string) : internalValue;

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      if (!isControlled) setInternalValue(e.target.value);
      if (rest.onChange) rest.onChange(e);
    };

    return (
      <div>
        {label && <label htmlFor={aid} className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-700">{label}</label>}
        <textarea
          id={aid}
          ref={ref}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
          className={`block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
          value={currentValue}
          onChange={handleChange}
          {...rest}
        />
        <div className="mt-1 flex items-center justify-between text-xs">
          {error ? <span id={errorId} className="text-red-700">{error}</span> : hint ? <span id={hintId} className="text-slate-600">{hint}</span> : <span className="text-slate-600">{currentValue?.length ?? 0}/{maxLength}</span>}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
