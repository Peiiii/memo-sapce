import React, { createContext, ReactNode, useRef } from 'react';
import { Presenter } from '../presenter';

export const PresenterContext = createContext<Presenter | null>(null);

export const PresenterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use ref to ensure singleton per component tree lifecycle
  const presenterRef = useRef<Presenter>(new Presenter());

  return (
    <PresenterContext.Provider value={presenterRef.current}>
      {children}
    </PresenterContext.Provider>
  );
};