import type {
  FeatureFlag,
  CreateFeatureFlagDTO,
  UpdateFeatureFlagDTO,
  ApiResponse,
  Environment,
} from '../types/featureFlag';

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
}

export const apiClient = new ApiClient();
