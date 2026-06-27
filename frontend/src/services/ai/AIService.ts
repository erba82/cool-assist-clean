import axios from 'axios';

// تنظیمات پیش‌فرض
const DEFAULT_API_URL = 'https://api.openai.com/v1';

export interface AIServiceConfig {
  apiKey: string;
  apiUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class AIService {
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    this.config = {
      apiUrl: DEFAULT_API_URL,
      model: 'gpt-4-turbo',
      maxTokens: 2048,
      temperature: 0.7,
      ...config
    };
  }

  async generateResponse(
    prompt: string, 
    options?: { 
      temperature?: number; 
      maxTokens?: number; 
      model?: string;
    }
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.config.apiUrl}/chat/completions`,
        {
          model: options?.model || this.config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || this.config.maxTokens,
          temperature: options?.temperature || this.config.temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  // فانکشن برای تحلیل پارامترهای سیستم تهویه مطبوع
  async analyzeHVACParameters(parameters: Record<string, any>): Promise<any> {
    const prompt = `Analyze these HVAC system parameters and provide optimization recommendations: ${JSON.stringify(parameters)}`;
    const response = await this.generateResponse(prompt);
    
    try {
      // تلاش برای استخراج JSON از پاسخ
      return JSON.parse(response);
    } catch {
      // اگر JSON نبود، پاسخ متنی برگردان
      return { recommendations: response };
    }
  }

  // فانکشن برای محاسبه بار حرارتی
  async calculateHeatLoad(buildingData: any): Promise<any> {
    const prompt = `Calculate the heat load for a building with these specifications: ${JSON.stringify(buildingData)}`;
    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return { result: response };
    }
  }

  // فانکشن برای عیب‌یابی سیستم
  async troubleshootSystem(symptoms: string[]): Promise<any> {
    const prompt = `Diagnose potential issues for an HVAC system with the following symptoms: ${symptoms.join(', ')}`;
    const response = await this.generateResponse(prompt);
    
    try {
      return JSON.parse(response);
    } catch {
      return { diagnosis: response };
    }
  }
}