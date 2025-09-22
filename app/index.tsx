import React from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import TaskManagerApp from './task-manager';

export default function Page() {
  return (
    <LanguageProvider>
      <TaskManagerApp />
    </LanguageProvider>
  );
}