// frontend/src/pages/Users.tsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout/Layout';
import axios from 'axios';

interface User {
  id: string;
  name?: string;
  phone_number: string;
  email?: string;
  is_admin: boolean;
  blacklist?: boolean;
  created_at: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set axios baseURL once
  axios.defaults.baseURL = 'http://localhost:3000';

  const authHeaders = {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/api/users', { headers: authHeaders });
      if (response.data?.success) {
        setUsers(response.data.data || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlacklist = async (id: string, current: boolean) => {
    try {
      const response = await axios.patch(
        `/api/users/${id}/blacklist`,
        { blacklist: !current },
        { headers: authHeaders }
      );
      if (response.data?.success) {
        setUsers(prev =>
          prev.map(u => (u.id === id ? { ...u, blacklist: !current } : u))
        );
      } else {
        setError('Failed to update user status');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    (u.name?.toLowerCase().includes(search.toLowerCase()) || '') ||
    u.phone_number?.includes(search)
  );

  const totalUsers = users.length;
  const activeUsers = users.filter(u => !u.blacklist).length;
  const blacklistedUsers = users.filter(u => u.blacklist).length;
  const adminUsers = users.filter(u => u.is_admin).length;

  if (loading && users.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading users...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={fetchUsers}
            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <UserStatsCard label="Total Users" count={totalUsers} color="blue" />
          <UserStatsCard label="Active Users" count={activeUsers} color="green" />
          <UserStatsCard label="Blacklisted" count={blacklistedUsers} color="red" />
          <UserStatsCard label="Admin Users" count={adminUsers} color="purple" />
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">Users ({filteredUsers.length})</h3>
          </div>
          {filteredUsers.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['User', 'Phone Number', 'Role', 'Joined', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
                            {user.name?.charAt(0).toUpperCase() || user.phone_number.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.phone_number}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.blacklist ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.blacklist ? 'Blacklisted' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleBlacklist(user.id, user.blacklist || false)}
                          className={`px-3 py-1 rounded text-xs text-white ${
                            user.blacklist ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {user.blacklist ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const UserStatsCard = ({ label, count, color }: { label: string; count: number; color: string }) => (
  <div className={`bg-${color}-50 p-6 rounded-lg border border-${color}-200`}>
    <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
    <div className={`text-sm text-${color}-800`}>{label}</div>
  </div>
);

export default Users;
