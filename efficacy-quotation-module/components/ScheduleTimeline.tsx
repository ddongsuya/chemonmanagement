'use client';

import { useMemo } from 'react';
import type { SchedulePhase, ScheduleEvent, StudyDesign } from '@/types/efficacy';
import { cn } from '@/lib/utils';

/**
 * ScheduleTimeline Component
 * Visual timeline representation of study schedule
 */

interface ScheduleTimelineProps {
  phases: SchedulePhase[];
  events: ScheduleEvent[];
  animalInfo: StudyDesign['animalInfo'];
}

// Convert duration to weeks for consistent display
function toWeeks(duration: number, unit: 'day' | 'week' | 'month'): number {
  switch (unit) {
    case 'day':
      return duration / 7;
    case 'week':
      return duration;
    case 'month':
      return duration * 4;
    default:
      return duration;
  }
}

// Format duration for display
function formatDuration(duration: number, unit: 'day' | 'week' | 'month'): string {
  const unitLabels = { day: 'D', week: 'W', month: 'M' };
  return `${duration} ${unitLabels[unit]}`;
}

export default function ScheduleTimeline({
  phases,
  events,
  animalInfo,
}: ScheduleTimelineProps) {
  // Sort phases by order
  const sortedPhases = useMemo(
    () => [...phases].sort((a, b) => a.order - b.order),
    [phases]
  );

  // Calculate total duration in weeks
  const totalWeeks = useMemo(
    () =>
      sortedPhases.reduce(
        (sum, phase) => sum + toWeeks(phase.duration, phase.durationUnit),
        0
      ),
    [sortedPhases]
  );

  // Calculate phase widths as percentages
  const phaseWidths = useMemo(() => {
    if (totalWeeks === 0) return [];
    return sortedPhases.map((phase) => ({
      ...phase,
      widthPercent: (toWeeks(phase.duration, phase.durationUnit) / totalWeeks) * 100,
    }));
  }, [sortedPhases, totalWeeks]);

  // Group events by phase
  const eventsByPhase = useMemo(() => {
    const grouped: Record<string, ScheduleEvent[]> = {};
    events.forEach((event) => {
      if (!grouped[event.phaseId]) {
        grouped[event.phaseId] = [];
      }
      grouped[event.phaseId].push(event);
    });
    return grouped;
  }, [events]);

  if (sortedPhases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        스케쥴 단계를 추가해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Animal info */}
      {(animalInfo.species || animalInfo.sex || animalInfo.age) && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{animalInfo.species || 'Animal'}</span>
          {animalInfo.sex && <span>({animalInfo.sex}</span>}
          {animalInfo.age && <span>, {animalInfo.age})</span>}
          {!animalInfo.sex && !animalInfo.age && null}
        </div>
      )}

      {/* Timeline container */}
      <div className="relative">
        {/* Phase labels (top) */}
        <div className="flex mb-2">
          {phaseWidths.map((phase, idx) => (
            <div
              key={phase.id}
              className="text-center text-xs font-medium text-gray-700 px-1"
              style={{ width: `${phase.widthPercent}%` }}
            >
              {phase.name}
            </div>
          ))}
        </div>

        {/* Events (arrows pointing down) */}
        <div className="relative h-8 mb-1">
          {phaseWidths.map((phase) => {
            const phaseEvents = eventsByPhase[phase.id] || [];
            // Calculate cumulative width before this phase
            const prevWidth = phaseWidths
              .slice(0, phaseWidths.indexOf(phase))
              .reduce((sum, p) => sum + p.widthPercent, 0);

            return phaseEvents.map((event, eventIdx) => {
              // Position event within phase
              const eventPosition =
                prevWidth + (phase.widthPercent * (eventIdx + 1)) / (phaseEvents.length + 1);

              return (
                <div
                  key={event.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${eventPosition}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Event label */}
                  <span className="text-[10px] text-gray-600 whitespace-nowrap mb-1">
                    {event.name}
                  </span>
                  {/* Arrow */}
                  <div
                    className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px]"
                    style={{ borderTopColor: event.color }}
                  />
                </div>
              );
            });
          })}
        </div>

        {/* Timeline bar */}
        <div className="flex h-8 rounded-full overflow-hidden shadow-inner">
          {phaseWidths.map((phase, idx) => (
            <div
              key={phase.id}
              className={cn(
                'flex items-center justify-center text-white text-xs font-medium',
                idx === 0 && 'rounded-l-full',
                idx === phaseWidths.length - 1 && 'rounded-r-full'
              )}
              style={{
                width: `${phase.widthPercent}%`,
                backgroundColor: phase.color,
              }}
            >
              {formatDuration(phase.duration, phase.durationUnit)}
            </div>
          ))}
        </div>

        {/* Phase separators with labels */}
        <div className="flex mt-2">
          {phaseWidths.map((phase, idx) => {
            // Calculate cumulative width
            const cumWidth = phaseWidths
              .slice(0, idx + 1)
              .reduce((sum, p) => sum + p.widthPercent, 0);

            // Show milestone labels at phase boundaries
            const milestoneLabels: Record<number, string> = {
              0: 'Grouping &\nTest article',
              1: '',
              2: 'Sacrifice',
              3: 'Final report',
            };

            return (
              <div
                key={phase.id}
                className="relative"
                style={{ width: `${phase.widthPercent}%` }}
              >
                {/* Milestone marker at end of phase */}
                {idx < phaseWidths.length - 1 && (
                  <div className="absolute right-0 top-0 flex flex-col items-center transform translate-x-1/2">
                    <div
                      className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px]"
                      style={{ borderBottomColor: phaseWidths[idx + 1]?.color || '#6B7280' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
