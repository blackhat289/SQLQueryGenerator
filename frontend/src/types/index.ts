export interface QueryHistoryItem {
  id: string;
  timestamp: string;
  nl_query: string;
  sql_query: string;
  explanation: string;
  complexity: string;
  optimization_score: number;
  tables_used: string[];
}

export interface ComplexityDetails {
  joins_count: number;
  has_group_by: boolean;
  subqueries_count: number;
  indicators: string[];
}

export interface ComplexityResponse {
  level: string;
  details: ComplexityDetails;
}

export interface OptimizationResponse {
  score: number;
  suggestions: string[];
}

export interface ExplanationStep {
  step: string;
  action: string;
  description: string;
}

export interface GenerateResponse {
  sql: string;
  complexity: ComplexityResponse;
  optimization: OptimizationResponse;
  explanation: ExplanationStep[];
  rag_status: string;
  tables_used: string[];
}

export interface SchemaStatus {
  rag_status: string;
  filename: string | null;
  tables_count: number;
  tables: Record<string, string[]>;
}

export interface SchemaUploadResponse {
  success: boolean;
  message: string;
  tables_found: string[];
  details: Record<string, string[]>;
}

export interface ExplainResponse {
  explanation: ExplanationStep[];
  complexity: ComplexityResponse;
}

export interface OptimizeResponse {
  original_sql: string;
  optimized_sql: string;
  optimization_score: number;
  suggestions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    widgets: {
      totalQueries: number;
      executedQueries: number;
      successRate: number;
      avgResponseTimeMs: number;
    };
    usageTrend: { date: string; queries: number }[];
    tableUsage: { name: string; value: number }[];
    complexityDistribution: { name: string; value: number }[];
  };
}

