import { AIService, AIServiceConfig } from './AIService';

// رابط مشترک برای همه سرویس‌های هوش مصنوعی
export interface AIProvider {
  generateResponse(prompt: string, options?: any): Promise<string>;
  analyzeHVACParameters(parameters: Record<string, any>): Promise<any>;
  calculateHeatLoad(buildingData: any): Promise<any>;
  troubleshootSystem(symptoms: string[]): Promise<any>;
}

// کلاس انطباقی برای OpenAI
export class OpenAIProvider implements AIProvider {
  private service: AIService;

  constructor(config: AIServiceConfig) {
    this.service = new AIService(config);
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    return this.service.generateResponse(prompt, options);
  }

  async analyzeHVACParameters(parameters: Record<string, any>): Promise<any> {
    return this.service.analyzeHVACParameters(parameters);
  }

  async calculateHeatLoad(buildingData: any): Promise<any> {
    return this.service.calculateHeatLoad(buildingData);
  }

  async troubleshootSystem(symptoms: string[]): Promise<any> {
    return this.service.troubleshootSystem(symptoms);
  }
}

// کلاس انطباقی برای Google AI
export class GoogleAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    // پیاده‌سازی اتصال به Google AI
    console.log(`Using Google AI (${this.model}) to generate response`);
    // پیاده‌سازی واقعی نیاز به استفاده از API Google دارد
    return `Response from Google AI: ${prompt}`;
  }

  async analyzeHVACParameters(parameters: Record<string, any>): Promise<any> {
    const prompt = `Analyze these HVAC parameters: ${JSON.stringify(parameters)}`;
    const response = await this.generateResponse(prompt);
    return { recommendations: response };
  }

  async calculateHeatLoad(buildingData: any): Promise<any> {
    const prompt = `Calculate heat load: ${JSON.stringify(buildingData)}`;
    const response = await this.generateResponse(prompt);
    return { result: response };
  }

  async troubleshootSystem(symptoms: string[]): Promise<any> {
    const prompt = `Troubleshoot HVAC issues: ${symptoms.join(', ')}`;
    const response = await this.generateResponse(prompt);
    return { diagnosis: response };
  }
}

// کلاس انطباقی برای Claude AI
export class ClaudeAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'claude-3-opus') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateResponse(prompt: string, options?: any): Promise<string> {
    // پیاده‌سازی اتصال به Claude AI (Anthropic)
    console.log(`Using Claude AI (${this.model}) to generate response`);
    // پیاده‌سازی واقعی نیاز به استفاده از API Anthropic دارد
    return `Response from Claude AI: ${prompt}`;
  }

  async analyzeHVACParameters(parameters: Record<string, any>): Promise<any> {
    const prompt = `Analyze these HVAC parameters: ${JSON.stringify(parameters)}`;
    const response = await this.generateResponse(prompt);
    return { recommendations: response };
  }

  async calculateHeatLoad(buildingData: any): Promise<any> {
    const prompt = `Calculate heat load: ${JSON.stringify(buildingData)}`;
    const response = await this.generateResponse(prompt);
    return { result: response };
  }

  async troubleshootSystem(symptoms: string[]): Promise<any> {
    const prompt = `Troubleshoot HVAC issues: ${symptoms.join(', ')}`;
    const response = await this.generateResponse(prompt);
    return { diagnosis: response };
  }
}

// کارخانه برای ایجاد نمونه‌های مناسب ارائه‌دهنده هوش مصنوعی
export class AIProviderFactory {
  static createProvider(type: 'openai' | 'google' | 'claude', config: any): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'google':
        return new GoogleAIProvider(config.apiKey, config.model);
      case 'claude':
        return new ClaudeAIProvider(config.apiKey, config.model);
      default:
        throw new Error(`Unsupported AI provider type: ${type}`);
    }
  }
}