'use client';

import React from 'react';
import type { StudyDesign, StudyGroup, SchedulePhase, ScheduleEvent } from '@/types/efficacy';
import { cn } from '@/lib/utils';

/**
 * EfficacyStudyDesignDiagram Component
 * Visual study design diagram matching the HTML reference design
 * Features: Info cards, full timeline, group timelines, observation markers
 */

interface EfficacyStudyDesignDiagramProps {
  studyDesign: StudyDesign;
  testName?: string;
  testCode?: string;
  guideline?: string;
  administrationRoute?: string;
  administrationFrequency?: string;
  administrationTime?: string;
  className?: string;
}

// Calculate total days from phases
function calculateTotalDays(phases: SchedulePhase[]): number {
  return phases.reduce((sum, phase) => {
    switch (phase.durationUnit) {
      case 'day': return sum + phase.duration;
      case 'week': return sum + phase.duration * 7;
      case 'month': return sum + phase.duration * 30;
      default: return sum + phase.duration;
    }
  }, 0);
}

// Get phase duration in days
function getPhaseDurationInDays(phase: SchedulePhase): number {
  switch (phase.durationUnit) {
    case 'day': return phase.duration;
    case 'week': return phase.duration * 7;
    case 'month': return phase.duration * 30;
    default: return phase.duration;
  }
}

// Format duration for display
function formatPhaseDuration(phase: SchedulePhase): string {
  const days = getPhaseDurationInDays(phase);
  return `${phase.name} ${days}일`;
}

// Get group color based on index
function getGroupColor(index: number): { bg: string; border: string; badge: string } {
  const colors = [
    { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' },
    { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white' },
    { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-600 text-white' },
    { bg: 'bg-orange-100', border: 'border-orange-400', badge: 'bg-orange-700 text-white' },
    { bg: 'bg-amber-50', border: 'border-amber-300', badge: 'bg-amber-600 text-white' },
    { bg: 'bg-red-50', border: 'border-red-300', badge: 'bg-red-600 text-white' },
  ];
  return colors[index % colors.length];
}

// Get phase bar color based on index
function getPhaseBarColor(index: number, total: number): string {
  if (index === 0) return 'bg-gray-200'; // Acclimation
  if (index === total - 1) return 'bg-gray-200'; // Recovery
  return 'bg-orange-500'; // Main test period
}

export default function EfficacyStudyDesignDiagram({
  studyDesign,
  testName = '반복투여 독성시험',
  testCode = 'ABC-123',
  guideline = 'OECD 407',
  administrationRoute = '경구투여 (P.O.)',
  administrationFrequency = '1일 1회',
  administrationTime = '09:00-11:00',
  className,
}: EfficacyStudyDesignDiagramProps) {
  const { groups, phases, events, animalInfo, modelName } = studyDesign;
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  const totalDays = calculateTotalDays(sortedPhases);
  const totalAnimals = groups.reduce((sum, g) => sum + g.animalCount, 0);

  // Calculate phase widths as percentages
  const phaseWidths = sortedPhases.map(phase => ({
    ...phase,
    days: getPhaseDurationInDays(phase),
    widthPercent: (getPhaseDurationInDays(phase) / totalDays) * 100,
  }));

  // Calculate cumulative positions for markers
  const getPhaseStartPercent = (phaseIndex: number): number => {
    return phaseWidths.slice(0, phaseIndex).reduce((sum, p) => sum + p.widthPercent, 0);
  };

  if (sortedPhases.length === 0) {
    return (
      <div className={cn('text-center py-12 text-gray-400', className)}>
        스케쥴 단계를 추가해주세요.
      </div>
    );
  }

  return (
    <div className={cn('bg-white p-6 rounded-lg', className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-1">효력시험 디자인 다이어그램</h2>
        <p className="text-sm text-gray-500">비임상 CRO 효력시험 시각화</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {/* Test Info */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs text-gray-500 mb-2">시험 정보</div>
          <div className="text-sm font-medium mb-1">{modelName || testName}</div>
          <div className="text-xs text-gray-500">{testCode} · {guideline}</div>
        </div>

        {/* Animal Info */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs text-gray-500 mb-2">동물 정보</div>
          <div className="text-sm font-medium mb-1">
            {animalInfo.species || 'SD Rat'}, {animalInfo.sex || '수컷'}
          </div>
          <div className="text-xs text-gray-500">
            {totalAnimals}마리 · {animalInfo.age || '7주령'}
          </div>
        </div>

        {/* Administration Info */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs text-gray-500 mb-2">투여 정보</div>
          <div className="text-sm font-medium mb-1">{administrationRoute}</div>
          <div className="text-xs text-gray-500">{administrationFrequency} · {administrationTime}</div>
        </div>

        {/* Duration Info */}
        <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div className="text-xs text-gray-500 mb-2">시험 기간</div>
          <div className="text-sm font-medium mb-1">총 {totalDays}일</div>
          <div className="text-xs text-gray-500">
            {sortedPhases.map((p, i) => formatPhaseDuration(p)).join(' · ')}
          </div>
        </div>
      </div>

      {/* Full Timeline */}
      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <h3 className="text-base font-semibold mb-6">전체 시험 타임라인</h3>
        
        <div className="relative pt-16 pb-8">
          {/* Timeline Bar */}
          <div className="relative h-12 rounded-lg overflow-visible bg-gray-50">
            {phaseWidths.map((phase, idx) => {
              const startPercent = getPhaseStartPercent(idx);
              const isFirst = idx === 0;
              const isLast = idx === phaseWidths.length - 1;
              const isMainPhase = idx > 0 && idx < phaseWidths.length - 1;
              
              return (
                <div
                  key={phase.id}
                  className={cn(
                    'absolute top-0 h-full flex items-center justify-center',
                    isMainPhase ? 'bg-orange-500' : 'bg-gray-200',
                    isFirst && 'rounded-l-lg',
                    isLast && 'rounded-r-lg'
                  )}
                  style={{
                    left: `${startPercent}%`,
                    width: `${phase.widthPercent}%`,
                  }}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isMainPhase ? 'text-white' : 'text-gray-700'
                  )}>
                    {formatPhaseDuration(phase)}
                  </span>
                </div>
              );
            })}

            {/* Phase Dividers */}
            {phaseWidths.slice(0, -1).map((_, idx) => {
              const position = getPhaseStartPercent(idx + 1);
              return (
                <div
                  key={`divider-${idx}`}
                  className="absolute top-0 w-px h-full bg-white/30"
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </div>

          {/* Timeline Markers */}
          {events.map((event) => {
            const phaseIndex = sortedPhases.findIndex(p => p.id === event.phaseId);
            if (phaseIndex === -1) return null;
            
            const phaseStart = getPhaseStartPercent(phaseIndex);
            const phaseWidth = phaseWidths[phaseIndex]?.widthPercent || 0;
            const position = phaseStart + (phaseWidth * event.position / 100);
            
            return (
              <div
                key={event.id}
                className="absolute bottom-full mb-2 flex flex-col items-center"
                style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              >
                <div className="text-xs font-medium text-gray-900 mb-1 whitespace-nowrap">
                  {event.name}
                </div>
                <div className="text-xs text-gray-600 font-medium mb-1">
                  Day {Math.round((position / 100) * totalDays)}
                </div>
                <div className="w-0.5 h-5 bg-gray-400 mb-1" />
                <div className="text-gray-400 text-[10px]">▼</div>
              </div>
            );
          })}

          {/* Bottom Day Labels */}
          <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-600 font-medium">
            <span className="absolute left-0">Day -{getPhaseDurationInDays(sortedPhases[0])}</span>
            {phaseWidths.map((phase, idx) => {
              if (idx === 0) return null;
              const position = getPhaseStartPercent(idx);
              const dayNumber = phaseWidths.slice(1, idx).reduce((sum, p) => sum + p.days, 0);
              return (
                <span
                  key={`day-${idx}`}
                  className="absolute"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  Day {dayNumber}
                </span>
              );
            })}
            <span className="absolute right-0">Day {totalDays - getPhaseDurationInDays(sortedPhases[0])}</span>
          </div>
        </div>
      </div>

      {/* Group Timelines */}
      <div className="border border-gray-200 rounded-lg p-6 mb-4">
        <h3 className="text-base font-semibold mb-6">군별 상세 타임라인</h3>
        
        <div className="space-y-4">
          {groups.map((group, groupIdx) => {
            const colors = getGroupColor(groupIdx);
            
            return (
              <div key={group.id}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'w-8 h-8 rounded flex items-center justify-center text-xs font-medium',
                    colors.badge
                  )}>
                    G{group.groupNumber}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{group.treatment}</div>
                    <div className="text-xs text-gray-500">
                      {group.animalCount}마리 · {group.dose}
                    </div>
                  </div>
                </div>

                {/* Group Timeline Bar */}
                <div className={cn(
                  'relative h-10 rounded-md mb-10 border',
                  colors.bg,
                  colors.border
                )}>
                  {/* Phase segments */}
                  {phaseWidths.map((phase, idx) => {
                    const startPercent = getPhaseStartPercent(idx);
                    const isFirst = idx === 0;
                    const isLast = idx === phaseWidths.length - 1;
                    const isMainPhase = idx > 0 && idx < phaseWidths.length - 1;
                    
                    return (
                      <div
                        key={`${group.id}-${phase.id}`}
                        className={cn(
                          'absolute top-0 h-full',
                          groupIdx === 0 
                            ? (isMainPhase ? 'bg-gray-200' : 'bg-gray-100')
                            : (isMainPhase ? `bg-orange-${200 + groupIdx * 100}` : `bg-orange-${100 + groupIdx * 50}`),
                          isFirst && 'rounded-l-md',
                          isLast && 'rounded-r-md'
                        )}
                        style={{
                          left: `${startPercent}%`,
                          width: `${phase.widthPercent}%`,
                          backgroundColor: isMainPhase 
                            ? (groupIdx === 0 ? '#e5e7eb' : `rgba(249, 115, 22, ${0.2 + groupIdx * 0.15})`)
                            : (groupIdx === 0 ? '#f3f4f6' : `rgba(249, 115, 22, ${0.1 + groupIdx * 0.05})`),
                        }}
                      />
                    );
                  })}

                  {/* Dose Markers */}
                  {sortedPhases.map((phase, phaseIdx) => {
                    if (phaseIdx === 0 || phaseIdx === sortedPhases.length - 1) return null;
                    const phaseStart = getPhaseStartPercent(phaseIdx);
                    const phaseWidth = phaseWidths[phaseIdx]?.widthPercent || 0;
                    const doseCount = Math.min(6, Math.floor(phaseWidths[phaseIdx]?.days / 5) || 1);
                    
                    return Array.from({ length: doseCount }).map((_, doseIdx) => {
                      const position = phaseStart + (phaseWidth * (doseIdx + 1) / (doseCount + 1));
                      return (
                        <div
                          key={`dose-${group.id}-${phaseIdx}-${doseIdx}`}
                          className="absolute top-[-16px] w-0.5 h-14 bg-orange-500 opacity-60"
                          style={{ left: `${position}%` }}
                        >
                          <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 text-orange-500 text-[10px]">
                            ▼
                          </div>
                        </div>
                      );
                    });
                  })}

                  {/* Observation Markers */}
                  {events.filter(e => sortedPhases.some(p => p.id === e.phaseId)).slice(0, 2).map((event, eventIdx) => {
                    const phaseIndex = sortedPhases.findIndex(p => p.id === event.phaseId);
                    if (phaseIndex === -1) return null;
                    
                    const phaseStart = getPhaseStartPercent(phaseIndex);
                    const phaseWidth = phaseWidths[phaseIndex]?.widthPercent || 0;
                    const position = phaseStart + (phaseWidth * event.position / 100);
                    
                    return (
                      <div
                        key={`obs-${group.id}-${event.id}`}
                        className="absolute bottom-[-28px] text-center"
                        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                      >
                        <div className="text-xs text-gray-700 font-medium whitespace-nowrap">
                          {event.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-gray-500 mt-6 pt-4 border-t">
          <div className="flex items-center gap-1.5">
            <div className="text-orange-500">▼</div>
            <span>투여</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-3 bg-gray-300" />
            <span>관찰/측정</span>
          </div>
        </div>
      </div>

      {/* Observation Items */}
      {events.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-semibold mb-4">관찰 및 측정 항목</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-md">
                <div className="text-sm font-medium mb-2">{event.name}</div>
                <div className="text-xs text-gray-500 space-y-0.5">
                  <div>시점: Day {Math.round((event.position / 100) * totalDays)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
