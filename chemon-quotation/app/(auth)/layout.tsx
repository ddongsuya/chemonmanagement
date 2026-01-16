export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">CHEMON</h1>
          <p className="text-gray-500 mt-1">견적관리시스템</p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {children}
        </div>

        {/* 푸터 */}
        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 CHEMON. All rights reserved.
        </p>
      </div>
    </div>
  );
}
