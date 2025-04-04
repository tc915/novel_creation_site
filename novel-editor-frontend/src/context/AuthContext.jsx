// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Import useCallback

// Create Context
const AuthContext = createContext(null);

// Create Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initial check on mount
  useEffect(() => {
    console.log("AuthProvider effect running: Checking local storage...");
    const token = localStorage.getItem('authToken');
    const userInfo = localStorage.getItem('userInfo');
    let authenticated = false;
    let currentUser = null;

    if (token && userInfo) {
      console.log("Token and user info found in storage.");
      try {
        authenticated = true;
        currentUser = JSON.parse(userInfo);
      } catch (error) {
        console.error("Error processing stored auth data:", error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
      }
    } else {
        console.log("No token/user info in storage.");
    }

    setAuthState({
      token: token,
      user: currentUser,
      isAuthenticated: authenticated,
      isLoading: false,
    });
    console.log("AuthProvider initial state set:", { token, user: currentUser, isAuthenticated: authenticated });

  }, []); // Empty dependency array - runs only once

  // --- Wrap login in useCallback ---
  const login = useCallback((token, userData) => {
    console.log("AuthContext login called.");
    try {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setAuthState({ // Update state using the setter function's previous state
            token: token,
            user: userData,
            isAuthenticated: true,
            isLoading: false,
        });
        console.log("AuthContext state updated by login:", { token, user: userData, isAuthenticated: true });
    } catch (error) {
        console.error("Error during login state update/localStorage:", error);
        // Clear potentially corrupted state
         localStorage.removeItem('authToken');
         localStorage.removeItem('userInfo');
         setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
    }
  }, []); // Empty dependency array: function reference is stable

  // --- Wrap logout in useCallback ---
  const logout = useCallback(() => {
    console.log("AuthContext logout called.");
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []); // Empty dependency array: function reference is stable

  // Memoize context value only if authState changes
   const contextValue = React.useMemo(() => ({
       authState,
       login,
       logout,
   }), [authState, login, logout]);


  return (
    <AuthContext.Provider value={contextValue}>
      {authState.isLoading ? <div>Loading Authentication...</div> : children}
    </AuthContext.Provider>
  );
};

// Custom hook (remains the same)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};