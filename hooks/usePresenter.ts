import { useContext } from 'react';
import { PresenterContext } from '../contexts/PresenterContext';
import { Presenter } from '../presenter';

export const usePresenter = (): Presenter => {
  const context = useContext(PresenterContext);
  if (!context) {
    throw new Error('usePresenter must be used within a PresenterProvider');
  }
  return context;
};