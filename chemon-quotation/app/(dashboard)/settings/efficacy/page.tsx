'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Database } from 'lucide-react';

export default function EfficacySettingsPage() {
  const [activeTab, setActiveTab] = useState('price');

  return (
    <div>
      <PageHeader 
        title="유효성 설정" 
        description="유효성 견적 관련 마스터 데이터를 관리합니다" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="price" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>단가 마스터</span>
          </TabsTrigger>
          <TabsTrigger value="model" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span>모델 아이템 풀</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price">
          <Card>
            <CardHeader>
              <CardTitle>단가 마스터</CardTitle>
              <CardDescription>
                유효성 견적에 사용되는 단가 항목을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                단가 마스터 관리 기능이 준비 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <Card>
            <CardHeader>
              <CardTitle>모델 아이템 풀</CardTitle>
              <CardDescription>
                유효성 모델별 아이템 구성을 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                모델 아이템 풀 관리 기능이 준비 중입니다.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
