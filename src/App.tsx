import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import AuthComponent from './components/AuthComponent';
import LibraryLayout from './components/LibraryLayout';
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
          createdAt: new Date(),
          lastLoginAt: new Date(),
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
    <div className="App">
      {user ? (
        <LibraryLayout user={user} onSignOut={handleSignOut} />
      ) : (
        <AuthComponent onLogin={setUser} />
      )}
    </div>
  );
};

export default App;