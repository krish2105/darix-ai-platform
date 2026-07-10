export default function DashboardLoading() {
  return (
    <section className="min-h-screen py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-12">
          <div className="space-y-3">
            <div className="h-9 w-64 rounded-lg bg-glass-panel animate-pulse" />
            <div className="h-4 w-40 rounded bg-glass-panel animate-pulse" />
          </div>
          <div className="h-9 w-24 rounded-lg bg-glass-panel animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-40 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}
