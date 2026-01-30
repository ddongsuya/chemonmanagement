'use client';

import React from 'react';
import { Page, Text, View, StyleSheet, Svg, Line, Rect, Polygon } from '@react-pdf/renderer';
import type { StudyDesign, SchedulePhase } from '@/types/efficacy';

/**
 * EfficacyStudyDesignPDF Component
 * PDF version of the study design diagram for inclusion in quotation PDF
 */

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: 'white',
  },
  // Header
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  // Info Cards Grid
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  infoCard: {
    flex: 1,
    padding: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  infoCardLabel: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  infoCardSubtext: {
    fontSize: 8,
    color: '#6b7280',
  },
  // Section
  section: {
    marginBottom: 15,
    padding: 15,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  // Timeline
  timelineContainer: {
    marginTop: 40,
    marginBottom: 30,
    position: 'relative',
  },
  timelineBar: {
    height: 30,
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  timelinePhase: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePhaseText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  // Day Labels
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 8,
    color: '#6b7280',
  },
  // Group Timeline
  groupContainer: {
    marginBottom: 30,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  groupBadge: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: 'white',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  groupDetails: {
    fontSize: 8,
    color: '#6b7280',
  },
  groupTimelineBar: {
    height: 24,
    flexDirection: 'row',
    borderRadius: 4,
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    marginBottom: 20,
  },
  // Legend
  legend: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1px solid #e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendMarker: {
    width: 8,
    height: 8,
  },
  legendText: {
    fontSize: 8,
    color: '#6b7280',
  },
  // Observation Grid
  observationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  observationCard: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  observationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  observationText: {
    fontSize: 8,
    color: '#6b7280',
  },
});

// Helper functions
function getPhaseDurationInDays(phase: SchedulePhase): number {
  switch (phase.durationUnit) {
    case 'day': return phase.duration;
    case 'week': return phase.duration * 7;
    case 'month': return phase.duration * 30;
    default: return phase.duration;
  }
}

function calculateTotalDays(phases: SchedulePhase[]): number {
  return phases.reduce((sum, phase) => sum + getPhaseDurationInDays(phase), 0);
}

function formatPhaseDuration(phase: SchedulePhase): string {
  const days = getPhaseDurationInDays(phase);
  return `${phase.name} ${days}일`;
}

// Group colors
const groupColors = [
  { bg: '#f3f4f6', badge: '#6b7280' },
  { bg: '#fff7ed', badge: '#f97316' },
  { bg: '#fff7ed', badge: '#ea580c' },
  { bg: '#ffedd5', badge: '#c2410c' },
  { bg: '#fef3c7', badge: '#d97706' },
  { bg: '#fee2e2', badge: '#dc2626' },
];

interface EfficacyStudyDesignPDFProps {
  studyDesign: StudyDesign;
  testName?: string;
  testCode?: string;
  guideline?: string;
  administrationRoute?: string;
  administrationFrequency?: string;
  administrationTime?: string;
}

const EfficacyStudyDesignPDF: React.FC<EfficacyStudyDesignPDFProps> = ({
  studyDesign,
  testName = '반복투여 독성시험',
  testCode = 'ABC-123',
  guideline = 'OECD 407',
  administrationRoute = '경구투여 (P.O.)',
  administrationFrequency = '1일 1회',
  administrationTime = '09:00-11:00',
}) => {
  const { groups, phases, events, animalInfo, modelName } = studyDesign;
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
  const totalDays = calculateTotalDays(sortedPhases);
  const totalAnimals = groups.reduce((sum, g) => sum + g.animalCount, 0);

  // Calculate phase widths
  const phaseWidths = sortedPhases.map(phase => ({
    ...phase,
    days: getPhaseDurationInDays(phase),
    widthPercent: (getPhaseDurationInDays(phase) / totalDays) * 100,
  }));

  const getPhaseStartPercent = (phaseIndex: number): number => {
    return phaseWidths.slice(0, phaseIndex).reduce((sum, p) => sum + p.widthPercent, 0);
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>효력시험 디자인 다이어그램</Text>
        <Text style={styles.subtitle}>비임상 CRO 효력시험 시각화</Text>
      </View>

      {/* Info Cards */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>시험 정보</Text>
          <Text style={styles.infoCardTitle}>{modelName || testName}</Text>
          <Text style={styles.infoCardSubtext}>{testCode} · {guideline}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>동물 정보</Text>
          <Text style={styles.infoCardTitle}>
            {animalInfo.species || 'SD Rat'}, {animalInfo.sex || '수컷'}
          </Text>
          <Text style={styles.infoCardSubtext}>
            {totalAnimals}마리 · {animalInfo.age || '7주령'}
          </Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>투여 정보</Text>
          <Text style={styles.infoCardTitle}>{administrationRoute}</Text>
          <Text style={styles.infoCardSubtext}>{administrationFrequency} · {administrationTime}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>시험 기간</Text>
          <Text style={styles.infoCardTitle}>총 {totalDays}일</Text>
          <Text style={styles.infoCardSubtext}>
            {sortedPhases.map(p => `${p.name} ${getPhaseDurationInDays(p)}일`).join(' · ')}
          </Text>
        </View>
      </View>

      {/* Full Timeline Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>전체 시험 타임라인</Text>
        
        <View style={styles.timelineContainer}>
          {/* Timeline Bar */}
          <View style={styles.timelineBar}>
            {phaseWidths.map((phase, idx) => {
              const isMainPhase = idx > 0 && idx < phaseWidths.length - 1;
              return (
                <View
                  key={phase.id}
                  style={[
                    styles.timelinePhase,
                    {
                      width: `${phase.widthPercent}%`,
                      backgroundColor: isMainPhase ? '#f97316' : '#e5e7eb',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timelinePhaseText,
                      { color: isMainPhase ? 'white' : '#374151' },
                    ]}
                  >
                    {formatPhaseDuration(phase)}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabelsRow}>
            <Text style={styles.dayLabel}>Day -{getPhaseDurationInDays(sortedPhases[0])}</Text>
            <Text style={styles.dayLabel}>Day 0</Text>
            <Text style={styles.dayLabel}>Day {totalDays - getPhaseDurationInDays(sortedPhases[0])}</Text>
          </View>
        </View>
      </View>

      {/* Group Timelines Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>군별 상세 타임라인</Text>
        
        {groups.map((group, groupIdx) => {
          const colors = groupColors[groupIdx % groupColors.length];
          
          return (
            <View key={group.id} style={styles.groupContainer}>
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <View style={[styles.groupBadge, { backgroundColor: colors.badge }]}>
                  <Text style={styles.groupBadgeText}>G{group.groupNumber}</Text>
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.treatment}</Text>
                  <Text style={styles.groupDetails}>
                    {group.animalCount}마리 · {group.dose}
                  </Text>
                </View>
              </View>

              {/* Group Timeline Bar */}
              <View style={[styles.groupTimelineBar, { backgroundColor: colors.bg }]}>
                {phaseWidths.map((phase, idx) => {
                  const isMainPhase = idx > 0 && idx < phaseWidths.length - 1;
                  const opacity = isMainPhase ? 0.3 + groupIdx * 0.1 : 0.1 + groupIdx * 0.05;
                  
                  return (
                    <View
                      key={`${group.id}-${phase.id}`}
                      style={{
                        width: `${phase.widthPercent}%`,
                        height: '100%',
                        backgroundColor: groupIdx === 0 
                          ? (isMainPhase ? '#d1d5db' : '#f3f4f6')
                          : `rgba(249, 115, 22, ${opacity})`,
                      }}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Text style={[styles.legendMarker, { color: '#f97316' }]}>▼</Text>
            <Text style={styles.legendText}>투여</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendMarker, { backgroundColor: '#e5e7eb', width: 3, height: 10 }]} />
            <Text style={styles.legendText}>관찰/측정</Text>
          </View>
        </View>
      </View>

      {/* Observation Items */}
      {events.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관찰 및 측정 항목</Text>
          
          <View style={styles.observationGrid}>
            {events.map((event) => (
              <View key={event.id} style={styles.observationCard}>
                <Text style={styles.observationTitle}>{event.name}</Text>
                <Text style={styles.observationText}>
                  시점: Day {Math.round((event.position / 100) * totalDays)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </Page>
  );
};

export default EfficacyStudyDesignPDF;
