import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 인증이 필요한 경로들
const protectedPaths = [
  '/dashboard',
  '/quotations',
  '/efficacy-quotations',
  '/clinical-pathology',
  '/contracts',
  '/consultations',
  '/customers',
  '/leads',
  '/pipeline',
  '/packages',
  '/reports',
  '/settings',
  '/calendar',
  '/calculators',
  '/studies',
  '/sales',
  '/contract',
  '/consultation',
];

// 관리자 전용 경로
const adminPaths = ['/admin'];

// 인증 없이 접근 가능한 경로
const publicPaths = ['/', '/login', '/register', '/welcome'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 정적 파일 및 API 경로는 무시
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/fonts') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 토큰 확인 (쿠키 또는 로컬스토리지 - 서버에서는 쿠키만 확인 가능)
  const token = request.cookies.get('access_token')?.value;
  
  // 공개 경로는 통과
  if (publicPaths.some(path => pathname === path)) {
    // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
    if (token && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 보호된 경로 체크
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  if (isProtectedPath || isAdminPath) {
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    // 참고: 클라이언트 측에서 localStorage의 토큰도 확인하므로
    // 여기서는 쿠키 기반 체크만 수행 (SSR 호환성)
    // 실제 인증은 API 호출 시 수행됨
    
    // 쿠키에 토큰이 없어도 클라이언트에서 localStorage 체크하므로 통과
    // 단, 완전한 SSR 보호가 필요하면 쿠키 기반 인증으로 전환 필요
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
