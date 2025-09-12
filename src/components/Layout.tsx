import React from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Settings,
  LogOut,
  Store,
  Package
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onSync?: () => Promise<void>;
  syncing?: boolean;
  lastSyncTime?: Date | null;
}

const Layout: React.FC<LayoutProps> = ({ children, onSync, syncing, lastSyncTime }) => {
  const { user, logout } = useAuth();

  const location = useLocation();
  const currentPath = location.pathname;
  
  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: currentPath === '/dashboard' || currentPath === '/' },
    { icon: Users, label: 'Customers', href: '/customers', active: currentPath === '/customers' },
    { icon: ShoppingCart, label: 'Orders', href: '/orders', active: currentPath === '/orders' },
    { icon: Package, label: 'Products', href: '/products', active: currentPath === '/products' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Shopify Insights</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {currentPath === '/dashboard' || currentPath === '/' ? 'Dashboard' : 
               currentPath === '/customers' ? 'Customers' : 
               currentPath === '/orders' ? 'Orders' : 
               currentPath === '/products' ? 'Products' : 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={onSync} 
                disabled={syncing}
                className={`flex items-center space-x-2 px-3 py-1 ${syncing ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'} rounded-md transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium">{syncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
              <div className="text-sm text-gray-500">
                Last sync: {lastSyncTime ? format(lastSyncTime, 'MMM d, yyyy h:mm a') : 'Never'}
              </div>
              <div className={`w-2 h-2 ${syncing ? 'bg-yellow-500' : 'bg-green-500'} rounded-full`}></div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;