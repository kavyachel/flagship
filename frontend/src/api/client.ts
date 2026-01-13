import type {
  FeatureFlag,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
  ApiResponse,
  Environment,
} from '../types/featureFlag';
import type {
  Experiment,
  CreateExperimentDTO,
  ExperimentMetrics,
} from '../types/experiment';

// In development, Vite proxies /api to localhost:3000
// In production, set VITE_API_URL to the backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'An error occurred');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Feature Flags
  async getFlags(environment?: Environment): Promise<FeatureFlag[]> {
    const query = environment ? `?environment=${environment}` : '';
    const response = await this.request<ApiResponse<FeatureFlag[]>>(`/flags${query}`);
    return response.data;
  }

  async getFlag(id: string): Promise<FeatureFlag> {
    const response = await this.request<ApiResponse<FeatureFlag>>(`/flags/${id}`);
    return response.data;
  }

  async createFlag(dto: CreateFeatureFlagDTO): Promise<FeatureFlag> {
    const response = await this.request<ApiResponse<FeatureFlag>>('/flags', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return response.data;
  }

  async updateFlag(id: string, dto: UpdateFeatureFlagDTO): Promise<FeatureFlag> {
    const response = await this.request<ApiResponse<FeatureFlag>>(`/flags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return response.data;
  }

  async deleteFlag(id: string): Promise<void> {
    await this.request(`/flags/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFlag(id: string): Promise<FeatureFlag> {
    const response = await this.request<ApiResponse<FeatureFlag>>(`/flags/${id}/toggle`, {
      method: 'POST',
    });
    return response.data;
  }

  // Experiments
  async getExperiments(flagId?: string): Promise<Experiment[]> {
    const query = flagId ? `?flagId=${flagId}` : '';
    const response = await this.request<ApiResponse<Experiment[]>>(`/experiments${query}`);
    return response.data;
  }

  async getExperiment(id: string): Promise<Experiment> {
    const response = await this.request<ApiResponse<Experiment>>(`/experiments/${id}`);
    return response.data;
  }

  async createExperiment(dto: CreateExperimentDTO): Promise<Experiment> {
    const response = await this.request<ApiResponse<Experiment>>('/experiments', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return response.data;
  }

  async startExperiment(id: string): Promise<Experiment> {
    const response = await this.request<ApiResponse<Experiment>>(`/experiments/${id}/start`, {
      method: 'POST',
    });
    return response.data;
  }

  async stopExperiment(id: string): Promise<Experiment> {
    const response = await this.request<ApiResponse<Experiment>>(`/experiments/${id}/stop`, {
      method: 'POST',
    });
    return response.data;
  }

  async deleteExperiment(id: string): Promise<void> {
    await this.request(`/experiments/${id}`, {
      method: 'DELETE',
    });
  }

  async getExperimentMetrics(experimentId: string, eventType = 'conversion'): Promise<ExperimentMetrics> {
    const response = await this.request<ApiResponse<ExperimentMetrics>>(
      `/events/metrics/${experimentId}?eventType=${eventType}`
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
