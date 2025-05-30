import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  RotateCcw,
  Home,
  BarChart3,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthProvider";
import PermissionGate from "../../components/PermissionGate";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link-active" : "nav-link-inactive";

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[280px] transition-transform transform bg-white border-r border-gray-200 lg:translate-x-0 lg:relative lg:flex lg:flex-col safe-top safe-bottom ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-7 h-7 text-primary-600" />
            <h1 className="text-lg font-bold truncate">Prestige Library</h1>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full lg:hidden hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex flex-col flex-1 py-4 overflow-y-auto hide-scrollbar">
          <NavLink to="/" className={navLinkClass} end>
            <Home className="w-6 h-6 mr-3" />
            Home
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard className="w-6 h-6 mr-3" />
            Dashboard
          </NavLink>
          <PermissionGate resource="members" action="view">
            <NavLink to="/members" className={navLinkClass}>
              <Users className="w-6 h-6 mr-3" />
              Members
            </NavLink>
          </PermissionGate>
          <NavLink to="/books" className={navLinkClass}>
            <BookOpen className="w-6 h-6 mr-3" />
            Books
          </NavLink>
          <PermissionGate resource="circulation" action="manage">
            <NavLink to="/circulation" className={navLinkClass}>
              <RotateCcw className="w-6 h-6 mr-3" />
              Circulation
            </NavLink>
          </PermissionGate>
          <PermissionGate resource="reports" action="view">
            <NavLink to="/reports" className={navLinkClass}>
              <BarChart3 className="w-6 h-6 mr-3" />
              Reports
            </NavLink>
          </PermissionGate>
          <PermissionGate resource="members" action="create">
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          </PermissionGate>
        </nav>

        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold">PT</span>
            </div>
            <div>
              <p className="font-medium">Library Volunteer</p>
              <p className="text-sm text-gray-500">Today's Shift</p>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user.email} ({user.member?.role || "Loading..."})
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-indigo-600 hover:text-indigo-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
