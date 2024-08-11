import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import AuthComponent from './components/AuthComponent';
import LibraryLayout from './components/LibraryLayout';
import Profile from './components/Profile';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser({
          id: authUser.uid,
          email: authUser.email || '',
          displayName: authUser.displayName || '',
          createdAt: new Date(authUser.metadata.creationTime || Date.now()),
          lastLoginAt: new Date(authUser.metadata.lastSignInTime || Date.now()),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    setUser(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {user ? (
          <Routes>
            <Route path="/" element={<LibraryLayout user={user} onSignOut={handleSignOut} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <AuthComponent onLogin={setUser} />
        )}
      </div>
    </Router>
  );
};

export default App;