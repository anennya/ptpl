import React from 'react';
import { Menu } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const currentDate = format(new Date(), 'EEEE, MMMM d, yyyy');
  const currentTime = format(new Date(), 'h:mm a');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center px-2 py-1">
        <button
          onClick={onMenuClick}
          className="p-1 rounded-md hover:bg-gray-100 transition-colors mr-2"
        >
          <Menu className="h-4 w-4 text-gray-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm md:text-base font-semibold text-primary-600 leading-tight">
            Prestige Tranquility People's Library
          </h1>
          <p className="text-xs text-gray-500">
            {currentDate} | {currentTime}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;