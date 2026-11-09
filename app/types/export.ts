// types/export.ts

// صيغ التصدير
export type ExportFormat = 'excel' | 'csv' | 'pdf';

// حالة التصدير
export type ExportStatus = 'processing' | 'completed' | 'failed';

// سجل التصدير
export interface ExportLog {
  _id: string;
  tenantId: string;
  userId: string;
  type: 'payments' | 'clients' | 'invoices' | 'products' | 'reports';
  format: ExportFormat;
  fileName: string;
  status: ExportStatus;
  totalRows: number;
  fileSize: number;
  filters: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
  startedAt: string;
  completedAt?: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    source: 'web' | 'api' | 'mobile';
  };
  createdAt: string;
  updatedAt: string;
}

// خيارات التصدير
export interface ExportOptions {
  format: ExportFormat;
  filters?: Record<string, any>;
  includeSummary?: boolean;
  fileName?: string;
}

// استجابة التصدير
export interface ExportResponse {
  success: boolean;
  message?: string;
  data?: {
    exportId: string;
    fileName: string;
    fileSize: number;
    downloadUrl: string;
  };
}

// تاريخ التصدير
export interface ExportHistoryResponse {
  data: ExportLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}