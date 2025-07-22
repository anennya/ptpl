import React from 'react';
import { Menu } from 'lucide-react';
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
          <h1 className="text-xl font-bold md:text-2xl line-clamp-1">Welcome to Prestige Tranquility People's Library</h1>
          <p className="text-sm md:text-base text-gray-500">{today} | 5:00 PM - 7:00 PM</p>
        </div>
      </div>
      

    </header>
  );
};

export default Header;