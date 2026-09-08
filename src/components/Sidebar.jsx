// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BarChart3, 
  Users, 
  Settings,
  Tag, 
  Menu,
  X,
  Eye,
  LogOut,
  ChevronRight,
    Database  // ✅ ADD THIS

} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/categories', label: 'Categories', icon: Tag },
    { path: '/products', label: 'Products', icon: Package },
    { path: '/orders', label: 'Orders', icon: ClipboardList },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
        // { path: '/backup', label: 'Backup', icon: Database }, // ✅ ADD THIS

  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openWebsite = () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;
    window.open(frontendUrl, '_blank');
    closeMobileMenu();
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  // Handle mouse enter - expand sidebar
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
    }
  };

  // Handle mouse leave - collapse sidebar
  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
    }
  };

  // Handle link click - DO NOTHING to isHovered, keep it as is
  const handleLinkClick = () => {
    closeMobileMenu();
    // IMPORTANT: Do NOT change isHovered here
    // The sidebar should stay expanded after clicking
  };

  return (
    <>
      {/* Mobile Header */}
      {isMobile && (
        <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-semibold text-gray-800">Admin</span>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && isMobile && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Collapsible on hover */}
      <div 
        className={`
          ${isMobile 
            ? 'fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out' 
            : 'sticky top-0 h-screen transition-all duration-300 ease-in-out'
          }
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isMobile ? 'w-64' : (isHovered ? 'w-56' : 'w-16')}
          bg-white shadow-lg flex flex-col
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Sidebar Header - Collapsible */}
        <div className={`flex-shrink-0 px-4 py-4 border-b border-gray-100 transition-all duration-300 ${isMobile ? 'block' : (isHovered ? 'block' : 'flex justify-center')}`}>
          <div className={`flex items-center ${isMobile ? 'gap-2.5' : (isHovered ? 'gap-2.5' : 'justify-center')}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className={`min-w-0 transition-all duration-300 ${isMobile ? 'block' : (isHovered ? 'block' : 'hidden')}`}>
              <h2 className="text-xl font-bold text-gray-800 truncate">Admin</h2>
              <p className="text-xs text-gray-500 truncate">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation - Collapsible */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/blogs' && location.pathname.startsWith('/blogs'));
              const Icon = item.icon;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={handleLinkClick}
                    className={`
                      group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-base
                      ${isMobile ? 'justify-start' : (isHovered ? 'justify-start' : 'justify-center')}
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    title={!isHovered && !isMobile ? item.label : ''}
                  >
                    <Icon 
                      size={25} 
                      className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`}
                    />
                    <span className={`ml-3 font-medium flex-1 truncate transition-all duration-300 ${isMobile ? 'inline' : (isHovered ? 'inline' : 'hidden')}`}>
                      {item.label}
                    </span>
                    {isActive && isHovered && !isMobile && (
                      <ChevronRight size={14} className="text-blue-600 flex-shrink-0" />
                    )}
                    {isActive && isMobile && (
                      <ChevronRight size={14} className="text-blue-600 flex-shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className={`my-4 border-t border-gray-100 transition-all duration-300 ${isMobile ? 'block' : (isHovered ? 'block' : 'hidden')}`}></div>

          {/* View Website Button - Collapsible */}
          <button
            onClick={openWebsite}
            className={`
              w-full flex items-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-200 text-base
              ${isMobile ? 'justify-start gap-2' : (isHovered ? 'justify-start gap-2' : 'justify-center')}
            `}
            title={!isHovered && !isMobile ? 'View Website' : ''}
          >
            <Eye size={16} className="flex-shrink-0" />
            <span className={`font-medium truncate transition-all duration-300 ${isMobile ? 'inline' : (isHovered ? 'inline' : 'hidden')}`}>
              View Website
            </span>
          </button>
        </nav>

        {/* Footer - Collapsible */}
        <div className={`flex-shrink-0 px-3 py-4 border-t border-gray-100 transition-all duration-300 ${isMobile ? 'block' : (isHovered ? 'block' : 'flex justify-center')}`}>
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-base
              ${isMobile ? 'justify-start gap-2' : (isHovered ? 'justify-start gap-2' : 'justify-center')}
            `}
            title={!isHovered && !isMobile ? 'Logout' : ''}
          >
            <LogOut size={16} className="flex-shrink-0" />
            <span className={`font-medium truncate transition-all duration-300 ${isMobile ? 'inline' : (isHovered ? 'inline' : 'hidden')}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Spacer */}
      {isMobile && <div className="md:hidden h-14" />}
    </>
  );
};

export default Sidebar;