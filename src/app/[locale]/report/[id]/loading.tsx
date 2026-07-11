export default function ReportLoading() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16 space-y-4">
          <div className="h-8 w-48 rounded-full bg-glass-panel animate-pulse mx-auto" />
          <div className="h-10 w-96 max-w-full rounded-lg bg-glass-panel animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="glass-card h-72 animate-pulse" />
          <div className="glass-card h-72 animate-pulse lg:col-span-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="glass-card h-48 animate-pulse" />
          <div className="glass-card h-48 animate-pulse" />
        </div>
        <div className="glass-card h-64 animate-pulse" />
      </div>
    </section>
  );
}
