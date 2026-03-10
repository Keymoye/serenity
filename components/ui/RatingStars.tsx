interface RatingStarsProps {
  value: number; // 0-5
}

export function RatingStars({ value }: RatingStarsProps) {
  const stars = Array.from({ length: 5 }).map((_, i) => i < Math.round(value));
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {stars.map((filled, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" className="inline-block">
          <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.402 8.173L12 18.896l-7.336 3.871 1.402-8.173L.132 9.21l8.2-1.192z"></path>
        </svg>
      ))}
    </div>
  );
}
