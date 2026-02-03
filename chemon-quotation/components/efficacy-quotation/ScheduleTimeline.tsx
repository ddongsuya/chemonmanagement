'use client';

import { useMemo } from 'react';
import type { SchedulePhase, ScheduleEvent, StudyDesign, StudyGroup } from '@/types/efficacy';
import { cn } from '@/lib/utils';

/**
 * ScheduleTimeline Component
 * Visual timeline representation of study schedule
 * Updated to match the HTML reference design
 */

interface ScheduleTimelineProps {
  phases: SchedulePhase[];
  events: ScheduleEvent[];
  animalInfo: StudyDesign['animalInfo'];
  groups?: StudyGroup[];
  showGroupTimelines?: boolean;
}

// Convert duration to days for consistent display
function toDays(duration: number, unit: 'day' | 'week' | 'month'): number {
  switch (unit) {
    case 'day':
      return duration;
    case 'week':
      return duration * 7;
    case 'month':
      return duration * 30;
    default:
      return duration;
  }
}

// Format duration for display
function formatDuration(duration: number, unit: 'day' | 'week' | 'month'): string {
  const days = toDays(duration, unit);
  return `${days}일`;
}

// Get group color based on index
function getGroupColor(index: number): { bg: string; border: string; badge: string; barBg: string } {
  const colors = [
    { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', barBg: 'bg-gray-200' },
    { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white', barBg: 'bg-orange-200' },
    { bg: 'bg-orange-50', border: 'border-orange-300', badge: 'bg-orange-600 text-white', barBg: 'bg-orange-300' },
    { bg: 'bg-orange-100', border: 'border-orange-400', badge: 'bg-orange-700 text-white', barBg: 'bg-orange-400' },
  ];
  return colors[index % colors.length];
}

export default function ScheduleTimeline({
  phases,
  events,
  animalInfo,
  groups = [],
  showGroupTimelines = false,
}: ScheduleTimelineProps) {
  // Sort phases by order
  const sortedPhases = useMemo(
    () => [...phases].sort((a, b) => a.order - b.order),
    [phases]
  );

  // Calculate total duration in days
  const totalDays = useMemo(
    () =>
      sortedPhases.reduce(
        (sum, phase) => sum + toDays(phase.duration, phase.durationUnit),
        0
      ),
    [sortedPhases]
  );

  // Calculate phase widths as percentages
  const phaseWidths = useMemo(() => {
    if (totalDays === 0) return [];
    return sortedPhases.map((phase) => ({
      ...phase,
      days: toDays(phase.duration, phase.durationUnit),
      widthPercent: (toDays(phase.duration, phase.durationUnit) / totalDays) * 100,
    }));
  }, [sortedPhases, totalDays]);

  // Calculate cumulative positions
  const getPhaseStartPercent = (phaseIndex: number): number => {
    return phaseWidths.slice(0, phaseIndex).reduce((sum, p) => sum + p.widthPercent, 0);
  };

  if (sortedPhases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        스케쥴 단계를 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Animal info */}
      {(animalInfo.species || animalInfo.sex || animalInfo.age) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{animalInfo.species || 'Animal'}</span>
          {animalInfo.sex && <span>({animalInfo.sex}</span>}
          {animalInfo.age && <span>, {animalInfo.age})</span>}
        </div>
      )}

      {/* Main Timeline */}
      <div className="relative pt-16 pb-8">
        {/* Event Markers (above timeline) */}
        {events.map((event) => {
          const phaseIndex = sortedPhases.findIndex(p => p.id === event.phaseId);
          if (phaseIndex === -1) return null;
          
          const phaseStart = getPhaseStartPercent(phaseIndex);
          const phaseWidth = phaseWidths[phaseIndex]?.widthPercent || 0;
          const position = phaseStart + (phaseWidth * event.position / 100);
          
          return (
            <div
              key={event.id}
              className="absolute bottom-full mb-2 flex flex-col items-center z-10"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            >
              <span className="text-xs font-medium text-gray-900 whitespace-nowrap mb-1">
                {event.name}
              </span>
              <span className="text-xs text-gray-600 font-medium mb-1">
                Day {Math.round((position / 100) * totalDays)}
              </span>
              <div className="w-0.5 h-5 bg-gray-400" />
              <div className="text-gray-400 text-[10px]">▼</div>
            </div>
          );
        })}

        {/* Timeline bar */}
        <div className="flex h-12 rounded-lg overflow-hidden bg-gray-50">
          {phaseWidths.map((phase, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === phaseWidths.length - 1;
            const isMainPhase = idx > 0 && idx < phaseWidths.length - 1;
            
            return (
              <div
                key={phase.id}
                className={cn(
                  'flex items-center justify-center text-xs font-medium relative',
                  isMainPhase ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700',
                  isFirst && 'rounded-l-lg',
                  isLast && 'rounded-r-lg'
                )}
                style={{ width: `${phase.widthPercent}%` }}
              >
                <span>{phase.name} {formatDuration(phase.duration, phase.durationUnit)}</span>
                
                {/* Phase divider */}
                {!isLast && (
                  <div className="absolute right-0 top-0 w-px h-full bg-white/30" />
                )}
              </div>
            );
          })}
        </div>

        {/* Day labels (below timeline) */}
        <div className="relative mt-2 text-xs text-gray-600 font-medium">
          <span className="absolute left-0">
            Day -{phaseWidths[0]?.days || 0}
          </span>
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
          <span className="absolute right-0">
            Day {totalDays - (phaseWidths[0]?.days || 0)}
          </span>
        </div>
      </div>

      {/* Group Timelines (optional) */}
      {showGroupTimelines && groups.length > 0 && (
        <div className="space-y-4 mt-8">
          <h4 className="text-sm font-medium text-gray-700">군별 타임라인</h4>
          
          {groups.map((group, groupIdx) => {
            const colors = getGroupColor(groupIdx);
            
            return (
              <div key={group.id}>
                {/* Group Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    'w-7 h-7 rounded flex items-center justify-center text-xs font-medium',
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
                  'relative h-10 rounded-md mb-8 border overflow-hidden',
                  colors.bg,
                  colors.border
                )}>
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
                          className="absolute top-[-12px] w-0.5 h-12 bg-orange-500 opacity-60"
                          style={{ left: `${position}%` }}
                        >
                          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 text-orange-500 text-[10px]">
                            ▼
                          </div>
                        </div>
                      );
                    });
                  })}

                  {/* Observation Markers */}
                  {events.slice(0, 2).map((event) => {
                    const phaseIndex = sortedPhases.findIndex(p => p.id === event.phaseId);
                    if (phaseIndex === -1) return null;
                    
                    const phaseStart = getPhaseStartPercent(phaseIndex);
                    const phaseWidth = phaseWidths[phaseIndex]?.widthPercent || 0;
                    const position = phaseStart + (phaseWidth * event.position / 100);
                    
                    return (
                      <div
                        key={`obs-${group.id}-${event.id}`}
                        className="absolute bottom-[-24px] text-center"
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

          {/* Legend */}
          <div className="flex gap-4 text-xs text-gray-500 mt-4 pt-4 border-t">
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
      )}
    </div>
  );
}
