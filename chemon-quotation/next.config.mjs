/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  // 이미지 최적화 설정
  images: {
    domains: [],
  },
  // 빌드 최적화
  swcMinify: true,
  // ESLint 설정 - 빌드 시 오류 무시
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript 설정
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
