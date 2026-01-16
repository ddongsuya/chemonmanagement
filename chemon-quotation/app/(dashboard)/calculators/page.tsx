'use client';

import { Calculator, FlaskConical, Pill, Scale, Syringe, Activity, Beaker } from 'lucide-react';
import Link from 'next/link';

interface CalculatorCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  status: 'active' | 'coming-soon';
  color: string;
}

const calculators: CalculatorCardProps[] = [
  {
    title: 'MRSD 계산기',
    description: 'FDA 가이던스 기반 Maximum Recommended Starting Dose 계산. 다종 비교, 투여경로 보정, PAD 비교 지원.',
    href: '/calculators/mrsd',
    icon: Scale,
    status: 'active',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    title: '용량 환산 계산기',
    description: '동물 ↔ 사람 용량 환산, 체표면적(BSA) 기반 종간 변환',
    href: '/calculators/dose-conversion',
    icon: Calculator,
    status: 'active',
    color: 'from-purple-500 to-pink-500',
  },
  {
    title: 'TK 파라미터 계산기',
    description: 'AUC, Cmax, Tmax, T1/2 등 독성동태 파라미터 계산',
    href: '/calculators/tk-parameters',
    icon: Activity,
    status: 'active',
    color: 'from-green-500 to-emerald-500',
  },
  {
    title: '투여량 계산기',
    description: '체중 기반 투여량, 투여액량, 농도 계산',
    href: '/calculators/dosing',
    icon: Syringe,
    status: 'active',
    color: 'from-orange-500 to-amber-500',
  },
  {
    title: '희석 계산기',
    description: 'C1V1 = C2V2, 연속 희석, Stock solution 계산',
    href: '/calculators/dilution',
    icon: FlaskConical,
    status: 'active',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    title: '노출량 마진 계산기',
    description: 'Safety Margin, Exposure Margin, NOAEL 대비 임상용량 비교',
    href: '/calculators/exposure-margin',
    icon: Pill,
    status: 'active',
    color: 'from-rose-500 to-red-500',
  },
  {
    title: '시험물질 소요량 계산기',
    description: '비임상 독성시험별 시험물질 필요량 산출, 시험 템플릿 제공',
    href: '/calculators/test-material',
    icon: Beaker,
    status: 'active',
    color: 'from-indigo-500 to-violet-500',
  },
];

function CalculatorCard({ title, description, href, icon: Icon, status, color }: CalculatorCardProps) {
  const isActive = status === 'active';
  
  return (
    <Link 
      href={isActive ? href : '#'}
      className={`group relative block p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 transition-all duration-300 ${
        isActive 
          ? 'hover:shadow-lg hover:border-primary/30 cursor-pointer' 
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* 아이콘 */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 ${
        isActive ? 'group-hover:scale-110 transition-transform' : ''
      }`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      
      {/* 내용 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2">{description}</p>
      
      {/* 상태 배지 */}
      {!isActive && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded-full">
          준비중
        </span>
      )}
      
      {/* 화살표 */}
      {isActive && (
        <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </Link>
  );
}

export default function CalculatorsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calculator className="w-7 h-7" />
          계산기
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          비임상 시험에서 자주 사용하는 계산 도구 모음
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {calculators.map((calc) => (
          <CalculatorCard key={calc.href} {...calc} />
        ))}
      </div>
    </div>
  );
}
