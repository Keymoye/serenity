import Image from 'next/image';
import React from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  className?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ name, src, size = 'md', alt, className = '' }, ref) => {
  const sizes: Record<string,string> = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div ref={ref} aria-label={alt ?? name} className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-stone-100 text-xs font-semibold text-stone-700 ${sizes[size]} ${className}`}>
      {src ? <Image src={src} alt={alt ?? name} width={56} height={56} className="object-cover" /> : <span aria-hidden>{initials}</span>}
    </div>
  );
});

Avatar.displayName = 'Avatar';
