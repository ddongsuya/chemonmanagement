import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4 bg-[#FFF8F1]">
      <div className="text-center max-w-sm space-y-6">
        <p className="text-7xl font-black tracking-tighter text-[#EFE7DD]">404</p>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">NOT FOUND</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">페이지를 찾을 수 없습니다</h2>
          <p className="text-sm text-slate-500 mt-2">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-xl text-sm font-bold bg-gradient-to-r from-primary to-orange-400 text-white h-10 px-6 hover:opacity-90 transition-opacity"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
