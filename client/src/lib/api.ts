import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sample,
  AnalysisRun,
  RegulatoryStandard,
  CreateSampleInput,
  LODHandlingStrategy,
} from '@metalsense/shared';

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    // If unauthorized, do not throw generic error if on login page
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
      // Trigger redirect to login if session expired
      // AuthContext will handle session state
    }
  }

  let body: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    body = await response.json();
  }

  if (!response.ok) {
    const errorMsg = body?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, body);
  }

  return body?.data !== undefined ? body.data : body;
}

// ----------------------------------------------------
// React Query Hooks
// ----------------------------------------------------

export function useWorkspaceSummary(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-summary', workspaceId],
    queryFn: () =>
      fetchApi<{
        kpis: {
          totalSamples: number;
          criticalCount: number;
          moderateCount: number;
          safeCount: number;
          missingGpsCount: number;
        };
        categoryDistribution: Record<string, number>;
        topExceededMetals: { symbol: string; count: number }[];
        recentSamples: { sample: Sample; analysis: AnalysisRun | null }[];
      }>(`/api/v1/workspaces/${workspaceId}/summary`),
    enabled: Boolean(workspaceId),
    staleTime: 30000,
  });
}

export function useWorkspaceAnalytics(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-analytics', workspaceId],
    queryFn: () =>
      fetchApi<{
        samplesCount: number;
        distributions: {
          hpi: Record<string, number>;
          hei: Record<string, number>;
          cd: Record<string, number>;
        };
        exceedanceFrequency: { symbol: string; count: number; name: string }[];
        samplesWithAnalysis: { sample: Sample; analysis: AnalysisRun }[];
      }>(`/api/v1/workspaces/${workspaceId}/analytics`),
    enabled: Boolean(workspaceId),
    staleTime: 30000,
  });
}

export interface SampleFilterParams {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useSamples(
  workspaceId: string | undefined,
  params: SampleFilterParams = {}
) {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set('search', params.search);
  if (params.category) queryParams.set('category', params.category);
  if (params.startDate) queryParams.set('startDate', params.startDate);
  if (params.endDate) queryParams.set('endDate', params.endDate);
  if (params.limit) queryParams.set('limit', String(params.limit));
  if (params.offset) queryParams.set('offset', String(params.offset));

  const qs = queryParams.toString();
  const url = `/api/v1/workspaces/${workspaceId}/samples${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: ['samples', workspaceId, params],
    queryFn: () =>
      fetchApi<{
        samples: { sample: Sample; analysis: AnalysisRun | null }[];
        total: number;
        offset: number;
        limit: number;
      }>(url),
    enabled: Boolean(workspaceId),
  });
}

export function useSample(workspaceId: string | undefined, sampleId: string | undefined) {
  return useQuery({
    queryKey: ['sample', workspaceId, sampleId],
    queryFn: () =>
      fetchApi<{
        sample: Sample;
        analysis: AnalysisRun | null;
        history: AnalysisRun[];
      }>(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`),
    enabled: Boolean(workspaceId && sampleId),
  });
}

export function useStandards() {
  return useQuery({
    queryKey: ['standards'],
    queryFn: () => fetchApi<RegulatoryStandard[]>('/api/v1/standards'),
    staleTime: Infinity,
  });
}

export function useCreateSample(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSampleInput) =>
      fetchApi<{ sample: Sample; analysis: AnalysisRun }>(
        `/api/v1/workspaces/${workspaceId}/samples`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
    },
  });
}

export function useUpdateSample(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sampleId, updates }: { sampleId: string; updates: Partial<Sample> }) =>
      fetchApi<Sample>(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sample', workspaceId, vars.sampleId] });
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
    },
  });
}

export function useDeleteSample(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sampleId: string) =>
      fetchApi(`/api/v1/workspaces/${workspaceId}/samples/${sampleId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
    },
  });
}

export function useRecalculateSample(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sampleId,
      standardCode,
      lodStrategy,
    }: {
      sampleId: string;
      standardCode?: string;
      lodStrategy?: LODHandlingStrategy;
    }) =>
      fetchApi<{ sample: Sample; analysis: AnalysisRun }>(
        `/api/v1/workspaces/${workspaceId}/samples/${sampleId}/analyze`,
        {
          method: 'POST',
          body: JSON.stringify({ standardCode, lodStrategy }),
        }
      ),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sample', workspaceId, vars.sampleId] });
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
    },
  });
}

export function usePreviewCsv(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: async (payload: FormData | { csvText: string; fileName?: string }) => {
      const isFormData = payload instanceof FormData;
      return fetchApi<{
        fileName: string;
        totalRows: number;
        validCount: number;
        errorCount: number;
        samples: Omit<Sample, 'id' | 'createdAt' | 'updatedAt'>[];
        errors: { rowNumber: number; sampleCode?: string; message: string }[];
        rawCsvText: string;
      }>(`/api/v1/imports/${workspaceId}/csv/preview`, {
        method: 'POST',
        body: isFormData ? payload : JSON.stringify(payload),
      });
    },
  });
}

export function useImportCsv(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | { csvText: string; fileName?: string }) => {
      const isFormData = payload instanceof FormData;
      return fetchApi<{
        totalRows: number;
        validCount: number;
        errorCount: number;
        createdSamples: { sample: Sample; analysis: AnalysisRun }[];
        errors: { rowNumber: number; sampleCode?: string; message: string }[];
      }>(`/api/v1/imports/${workspaceId}/csv`, {
        method: 'POST',
        body: isFormData ? payload : JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
    },
  });
}

export function useUploadDocument(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return fetchApi<{
        jobId: string;
        status: string;
        proposedData: any;
      }>(`/api/v1/imports/${workspaceId}/documents`, {
        method: 'POST',
        body: formData,
      });
    },
  });
}

export function useExtractionJob(workspaceId: string | undefined, jobId: string | undefined) {
  return useQuery({
    queryKey: ['extraction-job', workspaceId, jobId],
    queryFn: () =>
      fetchApi<any>(`/api/v1/imports/${workspaceId}/${jobId}`),
    enabled: Boolean(workspaceId && jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'processing' ? 1500 : false;
    },
  });
}

export function useConfirmExtraction(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: any }) =>
      fetchApi<{ sample: Sample; analysis: AnalysisRun; jobId: string }>(
        `/api/v1/imports/${workspaceId}/${jobId}/confirm`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics', workspaceId] });
    },
  });
}
