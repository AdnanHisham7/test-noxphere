// src/components/layout/MainLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { RootState } from '../../store';

export const MainLayout: React.FC = () => {
  const collapsed = useSelector((s: RootState) => s.ui.sidebarCollapsed);

  return (
    <div className="h-screen bg-pitch-950 flex overflow-hidden">
      <Sidebar />
      <div className={clsx('flex-1 flex flex-col min-h-screen transition-all duration-300', collapsed ? 'ml-16' : 'ml-60')}>
        <TopBar />
        <main className="flex-1 overflow-y-auto min-h-0 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

