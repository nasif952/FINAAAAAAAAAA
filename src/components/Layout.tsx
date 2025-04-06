import { ReactNode, useState } from 'react';
import { SidebarNav } from './SidebarNav';
import { TopBar } from './TopBar';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      <SidebarNav collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className={`flex-1 ${collapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'} transition-all duration-300 flex flex-col`}>
        <TopBar />
        <main className="flex-1 p-6 overflow-auto animate-fade-in">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
