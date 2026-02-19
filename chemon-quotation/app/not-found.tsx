import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center max-w-sm space-y-4">
        <p className="text-5xl font-bold text-muted-foreground/30">404</p>
        <div>
          <h2 className="text-lg font-semibold text-foreground">페이지를 찾을 수 없습니다</h2>
          <p className="text-sm text-muted-foreground mt-1">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-9 px-4 hover:bg-primary/90 transition-colors"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
