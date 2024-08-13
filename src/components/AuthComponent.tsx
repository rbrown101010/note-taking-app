import React, { useState } from 'react';
import { registerUser, loginUser, signInWithGoogle } from '../firebase';
import { User } from '../types';

interface AuthComponentProps {
  onLogin: (user: User) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let user;
      if (isRegistering) {
        user = await registerUser(email, password);
      } else {
        user = await loginUser(email, password);
      }
      onLogin({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      onLogin({
        id: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
        <h3 className="text-2xl font-bold text-center">
          {isRegistering ? 'Register' : 'Login'} to your account
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="password">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-baseline justify-between">
              <button
                type="submit"
                className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              >
                {isRegistering ? 'Register' : 'Login'}
              </button>
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>
          </div>
        </form>
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Sign in with Google
          </button>
        </div>
        {error && <p className="mt-4 text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default AuthComponent;