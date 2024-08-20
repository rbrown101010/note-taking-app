import React, { useState, useEffect, ErrorInfo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, signInWithGoogle } from './firebase';
import AuthComponent from './components/AuthComponent';
import LibraryLayout from './components/LibraryLayout';
import Profile from './components/Profile';
import CalendarView from './components/CalendarView';
import { User } from './types';

interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Uncaught error:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please check the console for more information.</h1>;
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log("App component mounted");
    const unsubscribe = auth.onAuthStateChanged((authUser: FirebaseUser | null) => {
      console.log("Auth state changed", authUser);
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

  const handleSignOut = (): void => {
    setUser(null);
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      const googleUser = await signInWithGoogle();
      setUser({
        id: googleUser.uid,
        email: googleUser.email || '',
        displayName: googleUser.displayName || '',
        createdAt: new Date(googleUser.metadata.creationTime || Date.now()),
        lastLoginAt: new Date(googleUser.metadata.lastSignInTime || Date.now()),
      });
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  console.log("Rendering App component", { user });

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          {user === null ? (
            <AuthComponent onLogin={setUser} onGoogleSignIn={handleGoogleSignIn} />
          ) : (
            <Routes>
              <Route path="/" element={<LibraryLayout user={user} onSignOut={handleSignOut} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="/calendar" element={<CalendarView user={user} notes={[]} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;