import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  BookOpen, 
  Home, 
  UserCog 
} from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import PermissionGate from '../../components/PermissionGate';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-7 h-7 text-primary-600" />
          <h1 className="text-lg font-bold truncate">Prestige Library</h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors lg:hidden"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink to="/" className={navLinkClass} onClick={onClose}>
          <Home className="h-5 w-5" />
          <span>Home</span>
        </NavLink>
        
        <PermissionGate resource="circulation" action="manage">
          <NavLink to="/borrow" className={navLinkClass} onClick={onClose}>
            <ArrowRight className="h-5 w-5" />
            <span>Borrow</span>
          </NavLink>
          
          <NavLink to="/return" className={navLinkClass} onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
            <span>Return</span>
          </NavLink>
        </PermissionGate>
        
        <PermissionGate resource="members" action="view">
          <NavLink to="/manage-members" className={navLinkClass} onClick={onClose}>
            <Users className="h-5 w-5" />
            <span>Manage Members</span>
          </NavLink>
        </PermissionGate>
        
        <NavLink to="/manage-books" className={navLinkClass} onClick={onClose}>
          <BookOpen className="h-5 w-5" />
          <span>Manage Books</span>
        </NavLink>

        <PermissionGate resource="members" action="create">
          <NavLink to="/admin" className={navLinkClass} onClick={onClose}>
            <UserCog className="h-5 w-5" />
            <span>Admin</span>
          </NavLink>
        </PermissionGate>
      </nav>

      {/* User info and sign out */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-bold">
              {user?.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "PT"}
            </span>
          </div>
          <div>
            <p className="font-medium">{user?.name || "Library User"}</p>
            <p className="text-sm text-gray-500 capitalize">
              {user?.role || "Member"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-700">
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-indigo-600 hover:text-indigo-900 mt-1"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
