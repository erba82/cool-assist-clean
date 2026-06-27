/*
 * diagramStore.ts
 * State management for AI-powered diagram generation feature
 * Updated: 2025-04-27 15:30:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\store\diagramStore.ts
 */

import { create } from 'zustand';

export interface DiagramData {
  layout: string;
  equipment: string;
  consumables: string;
  // Professional P&ID fields
  specifications?: string;
  pidComponents?: any[];
  pidPipes?: any[];
  coldRoomLayouts?: any[];
  calculations?: any;
}

interface DiagramState {
  isLoading: boolean;
  error: string | null;
  diagramData: DiagramData | null;
  
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDiagramData: (data: DiagramData | null) => void;
  clearDiagram: () => void;
  generateDiagramFromAI: (prompt: string) => Promise<DiagramData | null>;
  generateProfessionalPID: (prompt: string) => Promise<DiagramData | null>;
}

export const useDiagramStore = create<DiagramState>((set, get) => ({
  isLoading: false,
  error: null,
  diagramData: null,
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setDiagramData: (data) => set({ diagramData: data }),
  clearDiagram: () => set({ diagramData: null, error: null }),
  
  generateDiagramFromAI: async (prompt) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log("Generating diagram from prompt:", prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""));
      
      // Check if this is a complex ammonia/industrial system that should use professional P&ID
      const isComplexSystem = prompt.toLowerCase().includes('ammonia') || 
                             prompt.toLowerCase().includes('cold storage') ||
                             prompt.toLowerCase().includes('screw compressor') ||
                             (prompt.toLowerCase().includes('room') && prompt.toLowerCase().includes('ton')) ||
                             prompt.toLowerCase().includes('danfoss') ||
                             prompt.toLowerCase().includes('multi-room');
      
      if (isComplexSystem) {
        console.log("Detected complex system - using professional P&ID API");
        return get().generateProfessionalPID(prompt);
      }
      
      // استفاده از API برای ارتباط با بک‌اند
      const response = await fetch('/api/diagram/generate-from-text', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ message: prompt })
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("API error response:", data);
        throw new Error(data.error || data.details || 'Error generating diagram');
      }
      
      console.log("Received diagram data from API:", data.diagramData ? "Success" : "Empty Data");
      
      if (!data.diagramData || !data.diagramData.layout) {
        throw new Error("Server returned invalid diagram data");
      }
      
      set({ diagramData: data.diagramData });
      return data.diagramData;
    } catch (error: any) {
      console.error("Diagram generation error:", error);
      set({ error: error.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
  
  generateProfessionalPID: async (prompt) => {
    try {
      set({ isLoading: true, error: null });
      
      console.log("Generating professional P&ID from prompt:", prompt.substring(0, 50) + (prompt.length > 50 ? "..." : ""));
      
      // استفاده از API جدید برای P&ID حرفه‌ای
      const response = await fetch('/api/diagram/professional-pid', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ 
          prompt: prompt,
          options: {
            includeCalculations: true,
            includeEquipmentSpecs: true,
            generateEngineRoom: true,
            generateColdRooms: true,
            professionalFormat: true,
            followISAStandards: true
          }
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("Professional P&ID API error response:", data);
        throw new Error(data.error || data.details || 'Error generating professional P&ID diagram');
      }
      
      console.log("Received professional P&ID data from API:", data.diagramData ? "Success" : "Empty Data");
      
      if (!data.diagramData || !data.diagramData.layout) {
        throw new Error("Server returned invalid professional P&ID data");
      }
      
      // Convert professional P&ID data to standard DiagramData format
      const diagramData: DiagramData = {
        layout: data.diagramData.layout,
        equipment: data.diagramData.equipment,
        consumables: data.diagramData.specifications,
        specifications: data.diagramData.specifications,
        pidComponents: data.diagramData.pidComponents,
        pidPipes: data.diagramData.pidPipes,
        coldRoomLayouts: data.diagramData.coldRoomLayouts,
        calculations: data.systemCalculation
      };
      
      set({ diagramData });
      return diagramData;
    } catch (error: any) {
      console.error("Professional P&ID generation error:", error);
      set({ error: error.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  }
}));