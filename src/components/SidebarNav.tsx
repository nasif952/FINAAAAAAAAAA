import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Gauge, 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Users, 
  FolderClosed, 
  Diamond, 
  ChevronRight, 
  ChevronLeft,
  Presentation,
  ClipboardCheck,
  PieChart,
  Home,
  Calculator,
  Table,
  FolderOpen,
  Settings,
  LineChart
} from 'lucide-react';

interface SidebarNavProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function SidebarNav({ collapsed, setCollapsed }: SidebarNavProps) {
  const location = useLocation();
  
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
    },
    {
      name: 'LeadsValuation',
      href: '/valuation',
      icon: <Calculator className="h-4 w-4" />,
    },
    {
      name: 'Financial Overview',
      href: '/financial-overview',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      name: 'Cap Table',
      href: '/cap-table',
      icon: <Table className="h-4 w-4" />,
    },
    {
      name: 'Pitch Deck Analysis',
      href: '/pitch-deck-analysis',
      icon: <Presentation className="h-4 w-4" />,
    },
    {
      name: 'Data',
      href: '/data',
      icon: <FolderOpen className="h-4 w-4" />,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
  ];
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <>
      {/* Desktop sidebar */}
      <div className={`bg-diamond-black text-white fixed inset-y-0 left-0 z-10 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        collapsed ? 'w-16' : 'w-64'
      } ${
        collapsed ? '-translate-x-full lg:translate-x-0' : ''
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-diamond-darkGray">
            <Link to="/" className="flex items-center space-x-2 overflow-hidden">
              <Diamond className="h-8 w-8 text-diamond-gold" />
              {!collapsed && <span className="text-lg font-bold whitespace-nowrap">DBook</span>}
            </Link>
            <button 
              className="lg:flex hidden items-center justify-center h-6 w-6 rounded-full text-white hover:bg-white/10"
              onClick={toggleSidebar}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href === '/' && location.pathname === '/dashboard');
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`flex items-center ${
                        collapsed ? 'justify-center' : 'justify-start'
                      } px-3 py-2 rounded-md ${
                        isActive
                          ? 'bg-diamond-gold text-diamond-black font-medium'
                          : 'text-white hover:bg-white/10'
                      } transition-colors`}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-diamond-darkGray">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="h-8 w-8 rounded-full bg-diamond-gold flex items-center justify-center text-diamond-black">
                <span className="font-bold">A</span>
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">Admin User</p>
                  <p className="text-xs text-gray-400 truncate">admin@diamondai.tech</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 z-0 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Mobile toggle button */}
      <button
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full bg-diamond-gold text-diamond-black shadow-lg flex items-center justify-center lg:hidden z-20"
        onClick={toggleSidebar}
      >
        {collapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
      </button>
    </>
  );
}
