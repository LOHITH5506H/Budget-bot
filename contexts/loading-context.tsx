'use client';

import React from 'react';
import { createContext, useState, useContext, ReactNode, useCallback } from 'react'; // Added useCallback
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Verify this path

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  // Wrap state setters in useCallback to ensure stable function references
  const showLoading = useCallback(() => {
    console.log("%cCONTEXT: Setting isLoading to TRUE", "color: blue; font-weight: bold;");
    setIsLoading(prevState => {
        if (prevState) {
             console.log("%cCONTEXT: showLoading called but already loading.", "color: gray;");
             return true; // Already true
        }
        return true; // Set to true
    });
  }, []); // Empty dependency array

  const hideLoading = useCallback(() => {
    console.log("%cCONTEXT: Attempting to set isLoading to FALSE", "color: orange; font-weight: bold;");
    setIsLoading(prevState => {
        if (!prevState) {
            console.log("%cCONTEXT: hideLoading called, but state was already false.", "color: gray;");
            return false; // State is already false
        }
        console.log("%cCONTEXT: State was true, setting to FALSE now.", "color: orange; font-weight: bold;");
        return false; // Set state to false
    });
  }, []); // Empty dependency array


  console.log("CONTEXT: LoadingProvider rendering, isLoading:", isLoading);

  // Memoize the context value
  const contextValue = React.useMemo(() => ({ isLoading, showLoading, hideLoading }), [isLoading, showLoading, hideLoading]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {/* Conditionally render the overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-150 ease-in-out animate-in fade-in"> {/* Added animation */}
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" className="text-white" />
            <p className="mt-4 text-white text-lg font-medium">Loading...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

// Custom hook for easy context access
export function useLoading() {
  const context = useContext(LoadingContext);
  // Ensure the hook is used within the provider
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}