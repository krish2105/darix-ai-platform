export default function AdminLoading() {
  return (
    <section className="min-h-screen py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="h-9 w-40 rounded-lg bg-glass-panel animate-pulse mb-12" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="space-y-4">
              <div className="h-6 w-32 rounded bg-glass-panel animate-pulse" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card h-28 animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
