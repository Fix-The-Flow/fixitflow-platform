import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserDebug = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 max-w-sm z-50 shadow-lg">
      <h3 className="font-bold text-red-600 mb-2">🐛 USER DEBUG INFO</h3>
      <div className="text-xs space-y-1">
        <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
        <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
        <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
        <div><strong>Username:</strong> {user?.username || 'N/A'}</div>
        <div><strong>Role:</strong> <span className={user?.role === 'admin' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{user?.role || 'N/A'}</span></div>
        <div><strong>User ID:</strong> {user?.id || 'N/A'}</div>
        <div><strong>First Name:</strong> {user?.profile?.firstName || 'N/A'}</div>
        <div><strong>Admin Check:</strong> {user?.role === 'admin' ? '✅ IS ADMIN' : '❌ NOT ADMIN'}</div>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        This debug info will help identify the issue.
      </div>
    </div>
  );
};

export default UserDebug;
