/**
 * PWA 아이콘 생성 스크립트
 * 
 * 이 스크립트는 SVG 아이콘을 다양한 크기의 PNG 파일로 변환합니다.
 * sharp 패키지가 필요합니다: npm install sharp --save-dev
 * 
 * 사용법: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// 아이콘 크기 목록
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// SVG 템플릿 (각 크기에 맞게 생성)
const generateSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}" fill="url(#grad)"/>
  <text x="${size / 2}" y="${size * 0.625}" font-family="Arial, sans-serif" font-size="${Math.round(size * 0.39)}" font-weight="bold" fill="white" text-anchor="middle">C</text>
  <circle cx="${size * 0.742}" cy="${size * 0.273}" r="${Math.round(size * 0.078)}" fill="#22c55e"/>
</svg>`;

const iconsDir = path.join(__dirname, '../public/icons');

// icons 디렉토리 확인
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 각 크기별 SVG 파일 생성
sizes.forEach(size => {
  const svgContent = generateSvg(size);
  const filename = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(filename, svgContent);
  console.log(`Generated: icon-${size}x${size}.svg`);
});

console.log('\\nSVG 아이콘이 생성되었습니다.');
console.log('PNG 변환을 위해서는 sharp 패키지를 설치하고 별도 스크립트를 실행하세요.');
console.log('또는 온라인 SVG to PNG 변환 도구를 사용하세요.');
