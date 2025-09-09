import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate">
              Welcome back, {user?.name || 'Admin'}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your group buying platform
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <span className="text-sm text-gray-700">{user?.phone_number}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;