import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.tsx';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Deals', href: '/deals', icon: '🛍️' },
    { name: 'Users', href: '/users', icon: '👥' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="flex flex-col w-64 bg-gray-800 min-h-screen">
      <div className="flex items-center h-16 px-4 bg-gray-900">
        <h1 className="text-xl font-bold text-white">Group Buy Admin</h1>
      </div>
      
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${
                isActive(item.href)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
        <div className="flex items-center w-full">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{user?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">{user?.phone_number}</p>
          </div>
          <button
            onClick={logout}
            className="ml-3 text-gray-400 hover:text-white transition-colors"
            title="Logout"
          >
            <span className="text-lg">🚪</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;