import './App.scss';
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './pages/Home';
import DeepJournal from './pages/DeepJournal';
import License from './pages/License';
import CreateDeepJournal from './pages/CreateDeepJournal';
import LoadingScreen from './components/LoadingScreen';
import LoginScreen from './components/LoginScreen';
import SecurityLockScreen from './components/SecurityLockScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { DeepJournalsContextProvider } from './context/DeepJournalsContext';
import { IndexContextProvider } from './context/IndexContext';
import { TagsContextProvider } from './context/TagsContext';
import { TimelineContextProvider } from './context/TimelineContext';
import { AIContextProvider } from './context/AIContext';
import { HighlightsContextProvider } from './context/HighlightsContext';
import { LinksContextProvider } from './context/LinksContext';
import { ToastsContextProvider } from './context/ToastsContext';
import { AutoUpdateContextProvider } from './context/AutoUpdateContext';

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
  duration: 0.1,
};

const AnimatedPage = ({ children, _key = '', down = false }) => {
  return (
    <motion.div
      key={_key}
      initial={{ opacity: 0, translateY: down ? 0 : 40 }}
      animate={{ opacity: 1, translateY: 0 }}
      exit={{ opacity: 0, translateY: down ? 0 : 140 }}
      transition={{ ...transition }}
    >
      {children}
    </motion.div>
  );
};

export default function App() {
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(true);

  const handleLoginComplete = React.useCallback(() => {
    try {
      setShowLogin(false);
    } catch (error) {
      console.error('Error in handleLoginComplete:', error);
    }
  }, []);

  return (
    <AuthProvider>
      <SecurityProvider>
        <AppContent
          location={location}
          showLogin={showLogin}
          onLoginComplete={handleLoginComplete}
        />
      </SecurityProvider>
    </AuthProvider>
  );
}

function AppContent({ location, showLogin, onLoginComplete }) {
  const { user, loading, isAuthenticated } = useAuth();
  const { isLocked, securitySettings } = useSecurity();
  const [localShowLogin, setLocalShowLogin] = useState(true);

  useEffect(() => {
    if (!loading) {
      // If user is authenticated, hide login screen
      if (isAuthenticated && user) {
        setLocalShowLogin(false);
        if (onLoginComplete) {
          onLoginComplete();
        }
      } else {
        // Show login screen if not authenticated
        setLocalShowLogin(true);
      }
    }
  }, [user, loading, isAuthenticated, onLoginComplete]);

  // Show loading screen while auth is initializing
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login screen if not authenticated or forced to show login
  if (localShowLogin || showLogin || !isAuthenticated) {
    return <LoginScreen onComplete={onLoginComplete} />;
  }

  // Show security lock screen if security is enabled and app is locked
  if (securitySettings?.enabled && isLocked) {
    return <SecurityLockScreen />;
  }

  return <AppRouter location={location} />;
}

function AppRouter({ location }) {
  return (
    <DeepJournalsContextProvider>
      <ToastsContextProvider>
        <AutoUpdateContextProvider>
          <AIContextProvider>
            <IndexContextProvider>
              <HighlightsContextProvider>
                <TagsContextProvider>
                  <TimelineContextProvider>
                    <LinksContextProvider>
                      <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                          <Route
                            path="/"
                            element={
                              <AnimatedPage _key="home">
                                <Home />
                              </AnimatedPage>
                            }
                          />
                          <Route
                            path="/license"
                            element={
                              <AnimatedPage _key="license">
                                <License />
                              </AnimatedPage>
                            }
                          />
                          <Route
                            path="/new-deep-journal"
                            element={
                              <AnimatedPage _key="new-deep-journal">
                                <CreateDeepJournal />
                              </AnimatedPage>
                            }
                          />
                          <Route path="/deep-journal">
                            <Route
                              path=":deepJournalName"
                              element={
                                <AnimatedPage down _key="deep-journal">
                                  <DeepJournal />
                                </AnimatedPage>
                              }
                            />
                          </Route>
                        </Routes>
                      </AnimatePresence>
                    </LinksContextProvider>
                  </TimelineContextProvider>
                </TagsContextProvider>
              </HighlightsContextProvider>
            </IndexContextProvider>
          </AIContextProvider>
        </AutoUpdateContextProvider>
      </ToastsContextProvider>
    </DeepJournalsContextProvider>
  );
}
