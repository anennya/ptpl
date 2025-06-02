import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');
  
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 md:py-4 bg-white border-b border-gray-200 safe-top">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 mr-2 rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 lg:hidden touch-manipulation"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div>
          <h1 className="text-xl font-bold md:text-2xl line-clamp-1">Welcome to Prestige Peoples Tranquility Library</h1>
          <p className="text-sm md:text-base text-gray-500">{today} | 5:00 PM - 7:00 PM</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 w-64"
          />
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
        </div>
        
        <button 
          className="p-2 rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 relative touch-manipulation"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;