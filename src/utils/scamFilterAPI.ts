// src/utils/scamFilterAPI.ts

export interface ScamFilterResponse {
  prediction: boolean;
  confidence: number;
}

export interface APIHealthResponse {
  status: string;
  model_loaded: boolean;
}

export type SafetyStatus = 'safe' | 'suspicious' | 'spam' | 'checking';

class ScamFilterAPI {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = '/api', timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  async checkHealth(): Promise<{ isOnline: boolean; details?: APIHealthResponse }> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseURL}/health`);
      
      if (response.ok) {
        const data: APIHealthResponse = await response.json();
        return { isOnline: true, details: data };
      } else {
        return { isOnline: false };
      }
    } catch (error) {
      console.error('Health check failed:', error);
      return { isOnline: false };
    }
  }

  async checkMessage(text: string): Promise<{
    status: SafetyStatus;
    confidence: number;
    error?: string;
  }> {
    try {
      if (!text.trim()) {
        return { status: 'safe', confidence: 1.0 };
      }

      const response = await this.fetchWithTimeout(`${this.baseURL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }

      const data: ScamFilterResponse = await response.json();
      
      // Convert API response to safety status
      let status: SafetyStatus;
      if (data.prediction) {
        // Scam detected - determine severity based on confidence
        status = data.confidence > 0.8 ? 'spam' : 'suspicious';
      } else {
        // Not a scam
        status = 'safe';
      }

      return {
        status,
        confidence: data.confidence,
      };
    } catch (error) {
      console.error('Message check failed:', error);
      return {
        status: 'safe', // Default to safe on error
        confidence: 0.5,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Batch check multiple messages (useful for loading historical messages)
  async checkMessages(messages: string[]): Promise<Array<{
    text: string;
    status: SafetyStatus;
    confidence: number;
    error?: string;
  }>> {
    const results = await Promise.allSettled(
      messages.map(async (text) => {
        const result = await this.checkMessage(text);
        return { text, ...result };
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          text: messages[index],
          status: 'safe' as SafetyStatus,
          confidence: 0.5,
          error: result.reason?.message || 'Check failed',
        };
      }
    });
  }
}

// Export a singleton instance
export const scamFilterAPI = new ScamFilterAPI();

// Export utility functions
export const convertToSafetyStatus = (prediction: boolean, confidence: number): SafetyStatus => {
  if (prediction) {
    return confidence > 0.8 ? 'spam' : 'suspicious';
  }
  return 'safe';
};

export const getSafetyStatusColor = (status: SafetyStatus): string => {
  switch (status) {
    case 'safe':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'suspicious':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'spam':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'checking':
      return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};

export const getSafetyStatusLabel = (status: SafetyStatus, confidence?: number): string => {
  const baseLabel = status.charAt(0).toUpperCase() + status.slice(1);
  if (status === 'checking') return 'Checking...';
  if (confidence && confidence > 0) {
    return `${baseLabel} (${Math.round(confidence * 100)}%)`;
  }
  return baseLabel;
};

export default ScamFilterAPI;