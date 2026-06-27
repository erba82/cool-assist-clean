// C:\Users\Erfan\cool-assist-clean\frontend\src\context\AIContext.tsx
// نسخه بازنویسی شده: activeCapability به کانتکست منتقل شد

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'; // useMemo اضافه شد
import axios from 'axios';

export type AICapability = 'deep_search' | 'engineering_calculations' | 'diagram_generation' | 'plc_design' | 'wiring_diagram' | null;
export interface DiagramData { layout: string; equipment: string; consumables: string; }

interface AIContextType {
  sendMessageToAPI: (message: string, context?: any) => Promise<string>;
  generateDiagramFromText: (message: string) => Promise<DiagramData | null>;
  isResponding: boolean;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isDiagramMode: boolean;
  toggleDiagramMode: () => void; // این تابع حالا capability را هم تنظیم می‌کند
  // --- activeCapability به کانتکست منتقل شد ---
  activeCapability: AICapability;
  setActiveCapability: (capability: AICapability) => void;
  // --------------------------------------------
  diagramData: DiagramData | null; // این همچنان null است و در localStorage مدیریت می‌شود
  setDiagramData: (data: DiagramData | null) => void; // برای سازگاری هوک
  clearDiagramData: () => void;
}

const CAPABILITY_PROMPTS: Record<string, string> = { /* ... پرامپت‌های شما ... */ };

const AIContext = createContext<AIContextType | undefined>(undefined);

interface AIProviderProps { children: ReactNode; }

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const [isResponding, setIsResponding] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDiagramMode, setIsDiagramMode] = useState<boolean>(false);
  // +++ state برای activeCapability +++
  const [activeCapabilityState, setActiveCapabilityState] = useState<AICapability>(null);
  // ++++++++++++++++++++++++++++++++++

  const clearError = useCallback(() => { setError(null); }, []);

  const getCombinedPrompt = useCallback((message: string, capability: AICapability = null): string => {
    const specialPrompt = capability ? CAPABILITY_PROMPTS[capability] : null;
    if (specialPrompt && capability !== 'diagram_generation') {
        return `${specialPrompt}

سوال کاربر: ${message}

پاسخ:`;
    }
    return message;
  }, []);

  const sendMessageToAPI = useCallback(async (message: string, context?: any): Promise<string> => {
    // ... (منطق تابع sendMessageToAPI بدون تغییر) ...
     if (context?.capability === 'diagram_generation') {
        console.warn("sendMessageToAPI called with diagram capability. Use generateDiagramFromText instead.");
        setError("Internal configuration error. Please use the Diagram Mode toggle.");
        return "Error: Invalid function call for diagram generation.";
     }
     setIsResponding(true); setError(null);
     try { const capability = context?.capability as AICapability; const finalPrompt = getCombinedPrompt(message, capability); console.log(`Sending message with capability: ${capability || 'general'} to /api/chat`); const response = await axios.post('/api/chat', { message: finalPrompt, context: { capability: capability || 'general' }, chatId: context?.chatId }); if (response.data && response.data.text) { return response.data.text; } else { console.warn('Unexpected API response format from /api/chat', response.data); return "متاسفانه پاسخی با فرمت مناسب دریافت نشد."; }
     } catch (err: any) { const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'خطای ناشناخته در ارتباط با سرور'; console.error('AI API Error (/api/chat):', errorMessage, err); setError(errorMessage); return `متأسفانه خطایی رخ داد: ${errorMessage}. لطفاً دوباره تلاش کنید.`; } finally { setIsResponding(false); }
  }, [getCombinedPrompt]);

  const generateDiagramFromText = useCallback(async (message: string): Promise<DiagramData | null> => {
    // ... (منطق تابع generateDiagramFromText بدون تغییر) ...
     setIsResponding(true); setError(null);
     try { console.log("Sending request to generate diagram from text to /api/diagram/generate-from-text"); const response = await axios.post<{ diagramData: DiagramData }>('/api/diagram/generate-from-text', { message: message }); if (response.data && response.data.diagramData) { console.log("Received diagram data:", response.data.diagramData); return response.data.diagramData; } else { console.error("Invalid response format from /api/diagram/generate-from-text", response.data); throw new Error("پاسخ معتبری برای داده‌های دیاگرام دریافت نشد."); }
     } catch (err: any) { const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'خطای ناشناخته در تولید دیاگرام.'; console.error('AI Diagram API Error:', errorMessage, err); setError(errorMessage); return null; } finally { setIsResponding(false); }
  }, []);

  // +++ تابع toggleDiagramMode حالا activeCapability را هم تنظیم می‌کند +++
  const toggleDiagramMode = useCallback(() => {
    setIsDiagramMode(prevMode => {
        const newMode = !prevMode;
        if (newMode) {
            // وقتی حالت دیاگرام روشن می‌شود، قابلیت را روی دیاگرام تنظیم کن
            setActiveCapabilityState('diagram_generation');
            console.log("Diagram Mode ON, Active Capability set to diagram_generation");
        } else {
            // وقتی خاموش می‌شود، قابلیت را null کن
            setActiveCapabilityState(null);
            console.log("Diagram Mode OFF, Active Capability set to null");
        }
        return newMode;
    });
  }, []); // دیگر به isDiagramMode وابسته نیست

   // +++ تابع setActiveCapability در کانتکست +++
  const setActiveCapability = useCallback((capability: AICapability) => {
      // اگر قابلیتی غیر از دیاگرام انتخاب شد، حالت دیاگرام را خاموش کن
      if (capability !== 'diagram_generation' && isDiagramMode) {
          setIsDiagramMode(false);
          console.log("Switched capability, Diagram Mode turned OFF");
      }
      // اگر قابلیت دیاگرام انتخاب شد، حالت دیاگرام را روشن کن
      if (capability === 'diagram_generation' && !isDiagramMode) {
          setIsDiagramMode(true);
           console.log("Selected diagram capability, Diagram Mode turned ON");
      }
      setActiveCapabilityState(capability);
      console.log("Active Capability set to:", capability);
  }, [isDiagramMode]); // به isDiagramMode وابسته است


  // توابع مدیریت diagramData (برای سازگاری با هوک، منطق اصلی در AIChatPage)
  const setDiagramData = useCallback((data: DiagramData | null) => { console.log("setDiagramData called (data handled by caller)", data ? "with data" : "with null"); }, []);
  const clearDiagramData = useCallback(() => { try { localStorage.removeItem('diagramData'); console.log("Diagram data cleared from localStorage."); } catch (e) { console.error("Error clearing diagram data from localStorage:", e); } }, []);

  const contextValue: AIContextType = useMemo(() => ({
    sendMessageToAPI,
    generateDiagramFromText,
    isResponding,
    isLoading: isResponding, // Alias for backward compatibility
    error,
    clearError,
    isDiagramMode,
    toggleDiagramMode, // تابع به‌روزشده
    activeCapability: activeCapabilityState, // state کانتکست
    setActiveCapability, // تابع کانتکست
    diagramData: null,
    setDiagramData,
    clearDiagramData,
  }), [
      sendMessageToAPI, generateDiagramFromText, isResponding, error, clearError,
      isDiagramMode, toggleDiagramMode, activeCapabilityState, setActiveCapability, // state و تابع جدید اضافه شدند
      setDiagramData, clearDiagramData
  ]);

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) { throw new Error('useAI must be used within an AIProvider'); }
  return context;
};

export default AIContext;