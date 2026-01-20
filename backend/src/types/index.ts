// Re-export auth types
export * from './auth';

// Re-export quotation types
export * from './quotation';

// Re-export customer types
export * from './customer';

// Re-export admin types
export * from './admin';

// Re-export announcement types
export * from './announcement';

// Re-export notification types
export * from './notification';

// Re-export settings types
export * from './settings';

// Re-export backup types
export * from './backup';

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Express extended types
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'USER' | 'ADMIN';
        canViewAllSales?: boolean;
        canViewAllData?: boolean;
      };
    }
  }
}
