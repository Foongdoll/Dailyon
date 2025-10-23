export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
  } | null;
  traceId?: string;
};