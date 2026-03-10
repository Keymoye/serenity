export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-7 w-32 rounded-xl
                      bg-slate-100
                      animate-pulse" />
      {[1,2,3].map((i) => (
        <div key={i}
             className="h-32 rounded-2xl
                        bg-slate-100
                        animate-pulse" />
      ))}
    </div>
  )
}
