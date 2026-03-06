export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 bg-muted rounded w-40" />
          <div className="h-4 bg-muted rounded w-56 mt-2" />
        </div>
        <div className="h-9 bg-muted rounded w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-lg" />
      <div className="h-48 bg-muted rounded-lg" />
    </div>
  );
}
