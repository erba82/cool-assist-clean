// src/context/LayoutContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  mainDrawerWidth: number;
  setMainDrawerWidth: (width: number) => void;
  isMainDrawerOpen: boolean;
  setIsMainDrawerOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType>({
  mainDrawerWidth: 72, // پیش‌فرض برای حالت بسته
  setMainDrawerWidth: () => {},
  isMainDrawerOpen: false,
  setIsMainDrawerOpen: () => {}
});

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mainDrawerWidth, setMainDrawerWidth] = useState<number>(72);
  const [isMainDrawerOpen, setIsMainDrawerOpen] = useState<boolean>(false);
  
  return (
    <LayoutContext.Provider value={{ 
      mainDrawerWidth, 
      setMainDrawerWidth,
      isMainDrawerOpen,
      setIsMainDrawerOpen
    }}>
      {children}
    </LayoutContext.Provider>
  );
};