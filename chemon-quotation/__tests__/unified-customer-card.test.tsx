/**
 * Unit Tests for UnifiedCustomerCard Component
 * 
 * **Feature: unified-customer-management**
 * **Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 8.1, 8.2**
 * 
 * These tests verify:
 * 1. Entity type badge displays correctly (리드/고객)
 * 2. Pipeline stage badge displays with correct color
 * 3. Company name, contact name, and contact info display correctly
 * 4. Click event handler is called with correct entity
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import UnifiedCustomerCard, { UnifiedCustomerCardSkeleton } from '@/components/customer/UnifiedCustomerCard';
import type { UnifiedEntity } from '@/types/unified-customer';

// Mock entity data for testing
const mockLeadEntity: UnifiedEntity = {
  id: 'lead-123',
  entityType: 'LEAD',
  companyName: '테스트 회사',
  contactName: '홍길동',
  contactEmail: 'hong@test.com',
  contactPhone: '010-1234-5678',
  displayStage: '문의접수',
  stageColor: '#3B82F6',
  stageOrder: 1,
  leadNumber: 'L-2024-001',
  leadStatus: 'NEW',
  stageId: 'stage-1',
  expectedAmount: 5000000,
  source: 'WEBSITE',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockCustomerEntity: UnifiedEntity = {
  id: 'customer-456',
  entityType: 'CUSTOMER',
  companyName: '고객사 주식회사',
  contactName: '김철수',
  contactEmail: 'kim@customer.com',
  contactPhone: '02-1234-5678',
  displayStage: '계약완료',
  stageColor: '#10B981',
  stageOrder: 100,
  grade: 'CUSTOMER',
  quotationCount: 5,
  totalAmount: 15000000,
  createdAt: '2024-01-10T09:00:00Z',
  updatedAt: '2024-01-14T15:00:00Z',
};

const mockEntityWithoutContact: UnifiedEntity = {
  id: 'lead-789',
  entityType: 'LEAD',
  companyName: '연락처 없는 회사',
  contactName: '이영희',
  contactEmail: null,
  contactPhone: null,
  displayStage: '검토',
  stageColor: '#F59E0B',
  stageOrder: 2,
  leadNumber: 'L-2024-002',
  leadStatus: 'NEW',
  stageId: 'stage-2',
  createdAt: '2024-01-16T11:00:00Z',
  updatedAt: '2024-01-16T11:00:00Z',
};

describe('UnifiedCustomerCard Component', () => {
  /**
   * Requirements 1.2: 각 항목에 유형 배지(리드/고객)를 표시
   */
  describe('Entity Type Badge Display', () => {
    it('should display "리드" badge for LEAD entity type', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('리드')).toBeInTheDocument();
    });

    it('should display "고객" badge for CUSTOMER entity type', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      expect(screen.getByText('고객')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for LEAD badge', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const badge = screen.getByText('리드');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700');
    });

    it('should apply correct CSS classes for CUSTOMER badge', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      const badge = screen.getByText('고객');
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });
  });

  /**
   * Requirements 2.1, 2.2, 2.3: 파이프라인 단계 배지 표시
   */
  describe('Pipeline Stage Badge Display', () => {
    it('should display pipeline stage name for LEAD', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('문의접수')).toBeInTheDocument();
    });

    it('should display grade-based stage name for CUSTOMER', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      expect(screen.getByText('계약완료')).toBeInTheDocument();
    });

    it('should apply stage color to badge', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const stageBadge = screen.getByText('문의접수');
      // Check that the badge has inline style with the stage color
      expect(stageBadge).toHaveStyle({ color: '#3B82F6' });
    });
  });

  /**
   * Requirements 1.3, 1.4: 회사명, 담당자, 연락처 정보 표시
   */
  describe('Contact Information Display', () => {
    it('should display company name', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('테스트 회사')).toBeInTheDocument();
    });

    it('should display contact name', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('홍길동')).toBeInTheDocument();
    });

    it('should display contact phone when available', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('010-1234-5678')).toBeInTheDocument();
    });

    it('should display contact email when available', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('hong@test.com')).toBeInTheDocument();
    });

    it('should display "연락처 없음" when no contact info is available', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockEntityWithoutContact} onClick={onClick} />);
      
      expect(screen.getByText('연락처 없음')).toBeInTheDocument();
    });

    it('should display lead number for LEAD entity', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      expect(screen.getByText('L-2024-001')).toBeInTheDocument();
    });
  });

  /**
   * Requirements 8.1, 8.2: 클릭 이벤트 핸들러
   */
  describe('Click Event Handler', () => {
    it('should call onClick with entity when card is clicked', () => {
      const onClick = jest.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.click(card);
      
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(mockLeadEntity);
    });

    it('should call onClick when Enter key is pressed', () => {
      const onClick = jest.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(mockLeadEntity);
    });

    it('should call onClick when Space key is pressed', () => {
      const onClick = jest.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const card = screen.getByRole('button');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledWith(mockLeadEntity);
    });

    it('should have correct aria-label for accessibility', () => {
      const onClick = jest.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', '테스트 회사 - 리드');
    });

    it('should have correct aria-label for customer entity', () => {
      const onClick = jest.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label', '고객사 주식회사 - 고객');
    });
  });

  /**
   * Additional Information Display
   */
  describe('Additional Information Display', () => {
    it('should display expected amount for LEAD with expectedAmount', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockLeadEntity} onClick={onClick} />);
      
      // Check for formatted currency (₩5,000,000)
      expect(screen.getByText(/예상.*₩5,000,000/)).toBeInTheDocument();
    });

    it('should display quotation count for CUSTOMER', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      expect(screen.getByText('견적 5건')).toBeInTheDocument();
    });

    it('should display total amount for CUSTOMER with totalAmount', () => {
      const onClick = vi.fn();
      render(<UnifiedCustomerCard entity={mockCustomerEntity} onClick={onClick} />);
      
      // Check for formatted currency (₩15,000,000)
      expect(screen.getByText('₩15,000,000')).toBeInTheDocument();
    });
  });
});

describe('UnifiedCustomerCardSkeleton Component', () => {
  it('should render skeleton with animation', () => {
    render(<UnifiedCustomerCardSkeleton />);
    
    // Check that the skeleton container has animate-pulse class
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('should render placeholder elements', () => {
    render(<UnifiedCustomerCardSkeleton />);
    
    // Check for placeholder divs with bg-gray-200 class
    const placeholders = document.querySelectorAll('.bg-gray-200');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
