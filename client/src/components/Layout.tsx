import React from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Shield, LogOut, Menu } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col bg-base-200 min-h-screen">
        {/* Navbar for mobile */}
        <div className="w-full navbar bg-base-100 lg:hidden shadow-sm">
          <div className="flex-none">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
              <Menu />
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 text-xl font-bold">LLDAP 管理系统</div>
        </div>
        
        {/* Page Content */}
        <div className="p-6 md:p-10 fade-in">
          <Outlet />
        </div>
      </div> 
      
      <div className="drawer-side z-20">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-80 min-h-full bg-base-100 text-base-content shadow-xl">
          <div className="mb-6 px-4">
            <h1 className="text-2xl font-bold text-primary">LLDAP 管理系统</h1>
            <p className="text-sm text-gray-500 mt-1">欢迎, {user?.cn}</p>
          </div>

          <li>
            <Link to="/" className={isActive('/')}>
              <User className="w-5 h-5" /> 个人资料
            </Link>
          </li>
          
          {user?.isAdmin && (
            <li>
              <Link to="/admin" className={isActive('/admin')}>
                <Shield className="w-5 h-5" /> 管理控制台
              </Link>
            </li>
          )}

          <div className="divider"></div>
          
          <li>
            <button onClick={logout} className="text-error">
              <LogOut className="w-5 h-5" /> 退出登录
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
