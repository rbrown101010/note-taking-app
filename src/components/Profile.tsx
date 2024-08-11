import React from 'react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  user: User;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 p-8 bg-gray-900 text-white overflow-auto">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">User Profile</h1>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
            <p className="text-lg">{user.id}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
            <p className="text-lg">{user.displayName || 'Not set'}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Account Created</label>
            <p className="text-lg">{user.createdAt.toLocaleString()}</p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Last Login</label>
            <p className="text-lg">{user.lastLoginAt.toLocaleString()}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-8 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded transition-colors duration-200"
        >
          Back to Notes
        </button>
      </div>
    </div>
  );
};

export default Profile;