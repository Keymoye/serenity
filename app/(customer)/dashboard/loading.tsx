export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto
                    px-4 py-8 space-y-4">
      <div className="h-7 w-48 rounded-xl
                      bg-slate-100
                      animate-pulse" />
      <div className="space-y-3">
        {[1,2,3].map((i) => (
          <div key={i}
               className="h-24 rounded-2xl
                          bg-slate-100
                          animate-pulse" />
        ))}
      </div>
    </div>
  )
}
