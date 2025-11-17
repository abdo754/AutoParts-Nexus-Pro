import React from 'react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onToggleAssistant: () => void;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  cartItemCount: number;
  isArabic: boolean; // New prop for current language
  onLanguageToggle: () => void; // New prop for toggling language
  isTranslating: boolean; // New prop for translation loading state
}

const Header: React.FC<HeaderProps> = ({ currentUser, onToggleAssistant, onLogout, onNavigate, cartItemCount, isArabic, onLanguageToggle, isTranslating }) => {
  const renderNavLinks = (role: UserRole | null) => {
    switch (role) {
      case 'retailer':
        return (
          <>
            <button onClick={() => onNavigate('retailerHome')} className="hover:text-blue-200 transition-colors duration-300">Home</button>
            <button onClick={() => onNavigate('basket')} className="relative hover:text-blue-200 transition-colors duration-300">
              My Cart
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </>
        );
      case 'supplier':
        return (
          <>
            <button onClick={() => onNavigate('supplierProducts')} className="hover:text-blue-200 transition-colors duration-300">My Products</button>
            {/* Sales History link removed as per user request */}
          </>
        );
      case 'admin':
        return (
          <>
            <button onClick={() => onNavigate('adminUsers')} className="hover:text-blue-200 transition-colors duration-300">Users</button>
            <button onClick={() => onNavigate('adminTransactions')} className="hover:text-blue-200 transition-colors duration-300">Transactions</button>
          </>
        );
      default:
        return (
          <>
            <button onClick={() => onNavigate('home')} className="hover:text-blue-200 transition-colors duration-300">Home</button>
            <a href="#" className="hover:text-blue-200 transition-colors duration-300">Categories</a>
          </>
        );
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-lg">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="text-3xl font-bold tracking-tight">
          <button onClick={() => onNavigate(currentUser ? (currentUser.role === 'retailer' ? 'retailerHome' : 'home') : 'home')} className="hover:text-blue-200 transition-colors duration-300 focus:outline-none">
            AutoParts <span className="text-orange-400">Nexus Pro</span>
          </button>
        </div>
        <nav className="hidden md:flex space-x-6 text-lg">
          {renderNavLinks(currentUser?.role || null)}
        </nav>
        <div className="flex items-center space-x-4">
          {/* Language Toggle Button */}
          <button
            onClick={onLanguageToggle}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-opacity-75 flex items-center justify-center"
            aria-label={isArabic ? "Translate to English" : "Translate to Arabic"}
            disabled={isTranslating}
          >
            {isTranslating ? (
              <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            {isArabic ? 'English' : 'العربية'}
          </button>
          {currentUser ? (
            <>
              <span className="hidden sm:inline text-blue-200">Hi, {currentUser.name}!</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-75"
                aria-label="Logout"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-75"
                aria-label="Login"
              >
                Login
              </button>
              <button
                onClick={() => onNavigate('signup')}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-75"
                aria-label="Sign Up"
              >
                Sign Up
              </button>
            </>
          )}
          <button
            onClick={onToggleAssistant}
            className="ml-4 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-opacity-75"
            aria-label="Open AI Assistant"
          >
            <span className="hidden sm:inline">AI Assistant </span>
            <span className="inline sm:hidden">AI</span>
            <svg className="inline-block ml-1 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;