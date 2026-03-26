'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Settings, 
  LayoutGrid, 
  List,
  User,
  Calendar,
  GripVertical,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import WonSign from '@/components/icons/WonSign';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  fields: Record<string, any>;
  assignee?: { id: string; name: string };
  dueDate?: string;
  priority?: string;
  tags?: string[];
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  items: KanbanItem[];
  count: number;
  totalAmount?: number;
}

interface KanbanBoardProps {
  entityType: 'lead' | 'quotation' | 'contract' | 'study';
  columns: KanbanColumn[];
  onItemClick?: (item: KanbanItem) => void;
  onItemMove?: (itemId: string, targetColumn: string) => void;
  onViewChange?: (view: 'kanban' | 'table') => void;
  currentView?: 'kanban' | 'table';
  isLoading?: boolean;
}

// 금액 포맷팅
const formatAmount = (amount: number) => {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
};

// 날짜 포맷팅
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 칸반 카드 컴포넌트
const KanbanCard: React.FC<{
  item: KanbanItem;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}> = ({ item, onClick, onDragStart }) => {
  return (
    <div 
      className="bg-white rounded-xl p-3 cursor-pointer hover:translate-y-[-2px] shadow-ambient transition-all duration-200 mb-2 group"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
    >
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-slate-900 truncate">{item.title}</h4>
            {item.subtitle && (
              <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
            )}
            
            <div className="flex flex-wrap gap-1 mt-2">
              {item.fields.totalAmount && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-flex items-center">
                  <WonSign className="w-3 h-3 mr-1" />
                  {formatAmount(Number(item.fields.totalAmount))}
                </span>
              )}
              {item.fields.expectedAmount && (
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-flex items-center">
                  <WonSign className="w-3 h-3 mr-1" />
                  {formatAmount(Number(item.fields.expectedAmount))}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              {item.assignee && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{item.assignee.name}</span>
                </div>
              )}
              {item.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(item.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

// 칸반 컬럼 컴포넌트
const KanbanColumnComponent: React.FC<{
  column: KanbanColumn;
  onItemClick?: (item: KanbanItem) => void;
  onDrop?: (itemId: string) => void;
}> = ({ column, onItemClick, onDrop }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('itemId');
    if (itemId && onDrop) {
      onDrop(itemId);
    }
  };

  return (
    <div 
      className={`flex-shrink-0 w-72 bg-[#FAF2E9] rounded-xl ${
        isDragOver ? 'ring-2 ring-primary' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 컬럼 헤더 */}
      <div 
        className="p-3 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: column.color }}
            />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{column.name}</span>
            <span className="text-xs font-bold text-slate-600 bg-[#F5EDE3] px-2 py-0.5 rounded-full">
              {column.count}
            </span>
          </div>
        </div>
        {column.totalAmount !== undefined && column.totalAmount > 0 && (
          <div className="text-xs text-slate-500 mt-1 ml-6">
            {formatAmount(column.totalAmount)}
          </div>
        )}
      </div>

      {/* 컬럼 내용 */}
      {!isCollapsed && (
        <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {column.items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={() => onItemClick?.(item)}
              onDragStart={(e) => {
                e.dataTransfer.setData('itemId', item.id);
              }}
            />
          ))}
          {column.items.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-8">
              항목 없음
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 메인 칸반 보드 컴포넌트
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  entityType,
  columns,
  onItemClick,
  onItemMove,
  onViewChange,
  currentView = 'kanban',
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredColumns, setFilteredColumns] = useState(columns);

  useEffect(() => {
    if (searchQuery) {
      const filtered = columns.map(col => ({
        ...col,
        items: col.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        count: col.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
        ).length
      }));
      setFilteredColumns(filtered);
    } else {
      setFilteredColumns(columns);
    }
  }, [searchQuery, columns]);

  const entityLabels: Record<string, string> = {
    lead: '리드',
    quotation: '견적서',
    contract: '계약',
    study: '시험'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 툴바 */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>담당자별</DropdownMenuItem>
              <DropdownMenuItem>기간별</DropdownMenuItem>
              <DropdownMenuItem>유형별</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            설정
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-[#F5EDE3] rounded-xl p-1">
          <Button
            variant={currentView === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange?.('table')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={currentView === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewChange?.('kanban')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 칸반 보드 */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 pb-4 min-w-max">
          {filteredColumns.map((column) => (
            <KanbanColumnComponent
              key={column.id}
              column={column}
              onItemClick={onItemClick}
              onDrop={(itemId) => onItemMove?.(itemId, column.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
