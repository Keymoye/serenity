export default function AdminDashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-8 w-48 bg-stone-100 
                      rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 
                      gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} 
               className="h-28 bg-stone-100 rounded-2xl 
                          animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-stone-100 rounded-2xl 
                      animate-pulse" />
    </div>
  )
}
