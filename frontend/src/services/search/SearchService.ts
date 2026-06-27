import axios from 'axios';

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: 'web' | 'database';
}

export interface DatabaseSearchResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export class SearchService {
  private webSearchApiKey: string;
  private databaseUrl: string;

  constructor(webSearchApiKey: string, databaseUrl: string) {
    this.webSearchApiKey = webSearchApiKey;
    this.databaseUrl = databaseUrl;
  }

  // جستجو در وب
  async searchWeb(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      // در یک پروژه واقعی از API مانند Google Search یا Bing Search استفاده کنید
      const response = await axios.get('https://api.search-service.com/search', {
        params: {
          q: query,
          count: maxResults,
          api_key: this.webSearchApiKey
        }
      });

      // تبدیل نتایج به فرمت استاندارد
      return response.data.items.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        source: 'web' as const
      }));
    } catch (error) {
      console.error('Error searching web:', error);
      // در صورت خطا، نتایج نمونه برگردان
      return [
        {
          title: 'Web search unavailable',
          snippet: 'Could not perform web search at this time.',
          url: '#',
          source: 'web' as const
        }
      ];
    }
  }

  // جستجو در دیتابیس
  async searchDatabase(query: string, maxResults: number = 5): Promise<SearchResult[]> {
    try {
      const response = await axios.get(`${this.databaseUrl}/search`, {
        params: {
          q: query,
          limit: maxResults
        }
      });

      // تبدیل نتایج دیتابیس به فرمت استاندارد
      return response.data.results.map((result: DatabaseSearchResult) => ({
        title: result.title,
        snippet: result.content.substring(0, 150) + '...',
        url: `/database/articles/${result.id}`,
        source: 'database' as const
      }));
    } catch (error) {
      console.error('Error searching database:', error);
      // در صورت خطا، نتایج نمونه برگردان
      return [
        {
          title: 'Database search unavailable',
          snippet: 'Could not perform database search at this time.',
          url: '#',
          source: 'database' as const
        }
      ];
    }
  }

  // جستجوی ترکیبی (هم وب و هم دیتابیس)
  async searchCombined(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    // جستجوی همزمان در وب و دیتابیس
    const [webResults, dbResults] = await Promise.all([
      this.searchWeb(query, maxResults / 2),
      this.searchDatabase(query, maxResults / 2)
    ]);

    // ترکیب نتایج با اولویت به دیتابیس
    const combinedResults: SearchResult[] = [...dbResults, ...webResults];
    
    // محدود کردن تعداد نتایج به maxResults
    return combinedResults.slice(0, maxResults);
  }
}