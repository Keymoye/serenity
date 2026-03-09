export default function BookingsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 rounded-xl
                      bg-slate-100
                      animate-pulse" />
      <div className="h-10 rounded-xl
                      bg-slate-100
                      animate-pulse" />
      {[1,2,3,4,5].map((i) => (
        <div key={i}
             className="h-16 rounded-xl
                        bg-slate-100
                        animate-pulse" />
      ))}
    </div>
  )
}
