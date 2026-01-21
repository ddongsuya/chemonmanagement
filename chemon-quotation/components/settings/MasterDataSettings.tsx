'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, DollarSign, Package, FlaskConical, Microscope } from 'lucide-react';
import TestItemManager from './master/TestItemManager';
import PriceManager from './master/PriceManager';
import PackageManager from './master/PackageManager';
import EfficacyMasterManager from './master/EfficacyMasterManager';
import ClinicalPathologyMasterManager from './master/ClinicalPathologyMasterManager';

export default function MasterDataSettings() {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>마스터 데이터 관리</CardTitle>
          <CardDescription>
            독성시험, 효력시험, 임상병리 마스터 데이터를 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="tests" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                독성시험 항목
              </TabsTrigger>
              <TabsTrigger value="prices" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                독성시험 단가
              </TabsTrigger>
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                패키지
              </TabsTrigger>
              <TabsTrigger value="efficacy" className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                효력시험
              </TabsTrigger>
              <TabsTrigger value="clinical" className="flex items-center gap-2">
                <Microscope className="w-4 h-4" />
                임상병리
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tests">
              <TestItemManager />
            </TabsContent>

            <TabsContent value="prices">
              <PriceManager />
            </TabsContent>

            <TabsContent value="packages">
              <PackageManager />
            </TabsContent>

            <TabsContent value="efficacy">
              <EfficacyMasterManager />
            </TabsContent>

            <TabsContent value="clinical">
              <ClinicalPathologyMasterManager />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
