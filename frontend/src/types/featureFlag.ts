export type Environment = 'prod' | 'staging' | 'development';

export interface FeatureFlag {
  id: string;
  key: string;
  description: string | null;
  enabled: boolean;
  rolloutPercentage: number;
  environment: Environment;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeatureFlagDTO {
  key: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: Environment;
}

export interface UpdateFeatureFlagDTO {
  key?: string;
  description?: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: Environment;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

export interface ApiError {
  error: {
    message: string;
    statusCode: number;
  };
}
