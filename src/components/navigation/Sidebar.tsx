import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Users, BookOpen } from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Mobile header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/borrow" className={navLinkClass} onClick={onClose}>
          <ArrowRight className="h-5 w-5" />
          <span>Borrow</span>
        </NavLink>
        
        <NavLink to="/return" className={navLinkClass} onClick={onClose}>
          <ArrowLeft className="h-5 w-5" />
          <span>Return</span>
        </NavLink>
        
        <NavLink to="/manage-members" className={navLinkClass} onClick={onClose}>
          <Users className="h-5 w-5" />
          <span>Manage Members</span>
        </NavLink>
        
        <NavLink to="/manage-books" className={navLinkClass} onClick={onClose}>
          <BookOpen className="h-5 w-5" />
          <span>Manage Books</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
