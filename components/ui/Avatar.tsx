import Image from 'next/image';
import React from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | number;
  alt?: string;
  className?: string;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ name, src, size = 'md', alt, className = '' }, ref) => {
  const sizeClasses = typeof size === 'number' 
    ? `h-${size} w-${size}` 
    : { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }[size];
  const initials = name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const imageSize = typeof size === 'number' ? size * 4 : 56;
  return (
    <div ref={ref} aria-label={alt ?? name} className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-stone-100 text-xs font-semibold text-stone-700 ${sizeClasses} ${className}`}>
      {src ? <Image src={src} alt={alt ?? name} width={imageSize} height={imageSize} className="object-cover" /> : <span aria-hidden>{initials}</span>}
    </div>
  );
});

Avatar.displayName = 'Avatar';
