import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  role?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '', role = 'region', ...rest }, ref) => {
  return (
    <div ref={ref} role={role} className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';
