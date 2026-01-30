'use client';

import { useState } from 'react';
import { useEfficacyQuotationStore } from '@/stores/efficacyQuotationStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Users,
  Calendar,
  MousePointer2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ScheduleTimeline from './ScheduleTimeline';
import EfficacyStudyDesignDiagram from './EfficacyStudyDesignDiagram';

/**
 * StepStudyDesign Component
 * Step 4 of efficacy quotation wizard - Study Design (Groups & Schedule)
 */

// Phase color options
const phaseColors = [
  { value: '#3B82F6', label: '파랑', class: 'bg-blue-500' },
  { value: '#10B981', label: '초록', class: 'bg-emerald-500' },
  { value: '#6366F1', label: '인디고', class: 'bg-indigo-500' },
  { value: '#F59E0B', label: '주황', class: 'bg-amber-500' },
  { value: '#EF4444', label: '빨강', class: 'bg-red-500' },
  { value: '#8B5CF6', label: '보라', class: 'bg-violet-500' },
  { value: '#EC4899', label: '핑크', class: 'bg-pink-500' },
  { value: '#6B7280', label: '회색', class: 'bg-gray-500' },
];

// Event color options
const eventColors = [
  { value: '#EF4444', label: '빨강', class: 'bg-red-500' },
  { value: '#F59E0B', label: '주황', class: 'bg-amber-500' },
  { value: '#10B981', label: '초록', class: 'bg-emerald-500' },
  { value: '#3B82F6', label: '파랑', class: 'bg-blue-500' },
  { value: '#8B5CF6', label: '보라', class: 'bg-violet-500' },
];

export default function StepStudyDesign() {
  const {
    selectedModel,
    studyDesign,
    setStudyDesignModelName,
    setStudyDesignAnimalInfo,
    addGroup,
    updateGroup,
    removeGroup,
    addPhase,
    updatePhase,
    removePhase,
    addEvent,
    updateEvent,
    removeEvent,
    nextStep,
    prevStep,
  } = useEfficacyQuotationStore();

  const [activeTab, setActiveTab] = useState('groups');

  // Calculate total animals
  const totalAnimals = studyDesign.groups.reduce((sum, g) => sum + g.animalCount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MousePointer2 className="w-5 h-5" />
            시험 디자인
          </CardTitle>
          <CardDescription>
            군 구성과 스케쥴을 설계합니다. 이 정보는 견적서에 포함됩니다.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Animal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">동물 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>모델명</Label>
              <Input
                value={studyDesign.modelName || selectedModel?.model_name || ''}
                onChange={(e) => setStudyDesignModelName(e.target.value)}
                placeholder="예: Senile sarcopenia"
              />
            </div>
            <div className="space-y-2">
              <Label>동물 종</Label>
              <Input
                value={studyDesign.animalInfo.species}
                onChange={(e) =>
                  setStudyDesignAnimalInfo({
                    ...studyDesign.animalInfo,
                    species: e.target.value,
                  })
                }
                placeholder="예: C57BL/6J mice"
              />
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <Select
                value={studyDesign.animalInfo.sex}
                onValueChange={(value) =>
                  setStudyDesignAnimalInfo({
                    ...studyDesign.animalInfo,
                    sex: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>연령</Label>
              <Input
                value={studyDesign.animalInfo.age}
                onChange={(e) =>
                  setStudyDesignAnimalInfo({
                    ...studyDesign.animalInfo,
                    age: e.target.value,
                  })
                }
                placeholder="예: 18M, 8W"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Groups and Schedule */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="groups" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                군 구성
                <Badge variant="secondary">{studyDesign.groups.length}개</Badge>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                스케쥴
                <Badge variant="secondary">{studyDesign.phases.length}개</Badge>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-4">
            {/* Groups Tab */}
            <TabsContent value="groups" className="mt-0 space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  총 동물 수: <span className="font-bold text-gray-900">{totalAnimals}</span>마리
                </div>
                <Button onClick={addGroup} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  군 추가
                </Button>
              </div>

              {studyDesign.groups.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>군 구성이 없습니다.</p>
                  <p className="text-sm mt-1">"군 추가" 버튼을 클릭하여 시험군을 추가하세요.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-20 text-center">Group</TableHead>
                        <TableHead className="w-32">Model</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead className="w-32">Dose</TableHead>
                        <TableHead className="w-24 text-center">N</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studyDesign.groups.map((group, idx) => (
                        <TableRow key={group.id}>
                          <TableCell className="text-center font-medium">
                            {group.groupNumber}
                          </TableCell>
                          <TableCell>
                            {idx === 0 && (
                              <span className="text-sm text-gray-600">
                                {studyDesign.modelName || selectedModel?.model_name || '-'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={group.treatment}
                              onChange={(e) =>
                                updateGroup(group.id, { treatment: e.target.value })
                              }
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={group.dose}
                              onChange={(e) =>
                                updateGroup(group.id, { dose: e.target.value })
                              }
                              className="h-8"
                              placeholder="TBD"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={group.animalCount}
                              onChange={(e) =>
                                updateGroup(group.id, {
                                  animalCount: parseInt(e.target.value) || 1,
                                })
                              }
                              className="h-8 w-16 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={() => removeGroup(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow className="bg-gray-50 font-medium">
                        <TableCell colSpan={4} className="text-right">
                          Total
                        </TableCell>
                        <TableCell className="text-center">{totalAnimals}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="mt-0 space-y-4">
              {/* Full Diagram Preview */}
              <div className="border rounded-lg overflow-hidden">
                <EfficacyStudyDesignDiagram
                  studyDesign={studyDesign}
                  testName={selectedModel?.model_name}
                  className="bg-white"
                />
              </div>

              {/* Simple Timeline Preview */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">타임라인 미리보기</h4>
                <ScheduleTimeline
                  phases={studyDesign.phases}
                  events={studyDesign.events}
                  animalInfo={studyDesign.animalInfo}
                />
              </div>

              {/* Phase Editor */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">단계 설정</h4>
                  <Button onClick={addPhase} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    단계 추가
                  </Button>
                </div>

                <div className="space-y-2">
                  {studyDesign.phases
                    .sort((a, b) => a.order - b.order)
                    .map((phase) => (
                      <div
                        key={phase.id}
                        className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                      >
                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: phase.color }}
                        />

                        {/* Phase name */}
                        <Input
                          value={phase.name}
                          onChange={(e) =>
                            updatePhase(phase.id, { name: e.target.value })
                          }
                          className="h-8 flex-1"
                          placeholder="단계명"
                        />

                        {/* Duration */}
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={1}
                            value={phase.duration}
                            onChange={(e) =>
                              updatePhase(phase.id, {
                                duration: parseInt(e.target.value) || 1,
                              })
                            }
                            className="h-8 w-16 text-center"
                          />
                          <Select
                            value={phase.durationUnit}
                            onValueChange={(value: 'day' | 'week' | 'month') =>
                              updatePhase(phase.id, { durationUnit: value })
                            }
                          >
                            <SelectTrigger className="h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="day">일</SelectItem>
                              <SelectItem value="week">주</SelectItem>
                              <SelectItem value="month">월</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Color picker */}
                        <Select
                          value={phase.color}
                          onValueChange={(value) =>
                            updatePhase(phase.id, { color: value })
                          }
                        >
                          <SelectTrigger className="h-8 w-24">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: phase.color }}
                              />
                              <span className="text-xs">색상</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {phaseColors.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                <div className="flex items-center gap-2">
                                  <div className={cn('w-3 h-3 rounded-full', c.class)} />
                                  {c.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Add event button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => addEvent(phase.id)}
                          title="이벤트 추가"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>

                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => removePhase(phase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Event Editor */}
              {studyDesign.events.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">이벤트 마커</h4>
                  <div className="space-y-2">
                    {studyDesign.events.map((event) => {
                      const phase = studyDesign.phases.find((p) => p.id === event.phaseId);
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-3 p-3 border rounded-lg bg-white"
                        >
                          {/* Arrow indicator */}
                          <div
                            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] shrink-0"
                            style={{ borderBottomColor: event.color }}
                          />

                          {/* Event name */}
                          <Input
                            value={event.name}
                            onChange={(e) =>
                              updateEvent(event.id, { name: e.target.value })
                            }
                            className="h-8 flex-1"
                            placeholder="이벤트명"
                          />

                          {/* Phase */}
                          <Badge variant="outline" className="shrink-0">
                            {phase?.name || '-'}
                          </Badge>

                          {/* Color picker */}
                          <Select
                            value={event.color}
                            onValueChange={(value) =>
                              updateEvent(event.id, { color: value })
                            }
                          >
                            <SelectTrigger className="h-8 w-24">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: event.color }}
                                />
                                <span className="text-xs">색상</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              {eventColors.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  <div className="flex items-center gap-2">
                                    <div className={cn('w-3 h-3 rounded-full', c.class)} />
                                    {c.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Delete button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                            onClick={() => removeEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Navigation buttons */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전: 항목 구성
            </Button>
            <Button onClick={nextStep}>
              다음: 금액 계산
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
