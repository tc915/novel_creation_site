// src/App.jsx
import React from 'react';
// Import useMatch along with other router components
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PleaseVerifyPage from './pages/PleaseVerifyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useAuth } from './context/AuthContext'; // Assuming path is correct

// Workspace specific imports
import WorkspaceLayout from './components/WorkspaceLayout'; // Assuming path
import NovelsListPage from './pages/NovelsListPage';       // Assuming path
import NovelInfoFormPage from './pages/NovelInfoFormPage'; // Assuming path
import WorkspaceEditorPage from './pages/WorkspaceEditorPage'; // Assuming path
import CharactersPage from './pages/CharactersPage';         // Assuming path
import WorldPage from './pages/WorldPage';               // Assuming path
import OutlinePage from './pages/OutlinePage';           // Assuming path
import NotesPage from './pages/NotesPage';             // Assuming path
import WorkbenchPage from './pages/WorkbenchPage';

import './index.css';

// Protected Route Component (remains the same)
function ProtectedRoute({ children }) {
  const { authState } = useAuth();
  if (authState.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)]">Loading...</div>; // Themed loading
  }
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  // Verification check remains - users must be verified to enter workspace
  if (!authState.user?.isVerified) {
    return <Navigate to="/please-verify" replace />;
  }
  return children;
}

function App() {
  const { authState } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Auth Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route
            path="/login"
            // Redirect logged-in users to the novels list
            element={authState.isAuthenticated ? <Navigate to="/workspace/novels" replace /> : <LoginPage />}
         />
        <Route
            path="/signup"
            // Redirect logged-in users to the novels list
            element={authState.isAuthenticated ? <Navigate to="/workspace/novels" replace /> : <SignupPage />}
        />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/please-verify" element={<PleaseVerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />


        {/* Protected Workspace Routes */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceLayout /> {/* The Layout contains sidebar and Outlet */}
            </ProtectedRoute>
          }
        >
           {/* Default nested route redirects to novels list */}
           <Route index element={<Navigate to="novels" replace />} />
           {/* Novels List Page */}
           <Route path="novels" element={<NovelsListPage />} />

           {/* --- Routes specific to a selected novel --- */}
           {/* These require a novelId parameter */}
           <Route path="novel/:novelId/details" element={<NovelInfoFormPage />} />
           <Route path="novel/:novelId/editor" element={<WorkspaceEditorPage />} />
           {/* --- Add Route for Workbench --- */}
           <Route path="novel/:novelId/workbench" element={<WorkbenchPage />} />
           {/* --- End Added Route --- */}
           {/* --- End novel-specific routes --- */}

           {/* Add other general workspace routes here if needed */}

        </Route>

        {/* Catch-all Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;