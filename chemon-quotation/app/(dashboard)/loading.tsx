export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse bg-[#FFF8F1]">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-3 bg-[#EFE7DD] rounded-full w-20 mb-3" />
          <div className="h-7 bg-[#EFE7DD] rounded-xl w-40" />
          <div className="h-4 bg-[#EFE7DD] rounded-lg w-56 mt-2" />
        </div>
        <div className="h-9 bg-[#EFE7DD] rounded-xl w-24" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-[#FAF2E9] rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-[#FAF2E9] rounded-xl" />
      <div className="h-48 bg-[#FAF2E9] rounded-xl" />
    </div>
  );
}
