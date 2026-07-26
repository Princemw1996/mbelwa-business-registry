import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">🏛️ Mbelwa District Council</span>
          <span className="text-sm bg-blue-500 px-2 py-1 rounded">Business Registry</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm hidden md:inline">
            👤 {user?.name} ({user?.role})
          </span>
          <button
            onClick={handleLogout}
            className="btn-danger"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md h-[calc(100vh-4rem)] sticky top-0">
          <nav className="p-4 space-y-2">
            <Link to="/" className="sidebar-link">
              📊 Dashboard
            </Link>
            <Link to="/businesses" className="sidebar-link">
              📋 Businesses
            </Link>
            <Link to="/businesses/register" className="sidebar-link">
              ➕ Register Business
            </Link>
            <Link to="/wards" className="sidebar-link">
              🗺️ Wards
            </Link>
            <Link to="/reports" className="sidebar-link">
              📊 Reports
            </Link>
            
            {/* Admin-only links */}
            {user?.role === 'admin' && (
              <>
                <Link to="/wards/manage" className="sidebar-link">
                  ⚙️ Manage Wards
                </Link>
                <Link to="/users" className="sidebar-link">
                  👥 Users
                </Link>
                <Link to="/audit" className="sidebar-link">
                  📋 System Logs
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;