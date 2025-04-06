// ---> FILE: ./novel-editor-frontend/src/App.jsx <---
import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransitionWrapper from './components/PageTransitionWrapper'; // Import the wrapper
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotFoundPage from './pages/NotFoundPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PleaseVerifyPage from './pages/PleaseVerifyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { useAuth } from './context/AuthContext';

// Workspace specific imports
import WorkspaceLayout from './components/WorkspaceLayout';
import NovelsListPage from './pages/NovelsListPage';
import NovelInfoFormPage from './pages/NovelInfoFormPage';
import WorkspaceEditorPage from './pages/WorkspaceEditorPage';
import CharactersPage from './pages/CharactersPage';
import CharacterDetailPage from './pages/CharacterDetailPage';
import WorldPage from './pages/WorldPage';
import OutlinePage from './pages/OutlinePage';
import NotesPage from './pages/NotesPage';
import WorkbenchPage from './pages/WorkbenchPage';

import './index.css';

// Protected Route Component (no changes)
function ProtectedRoute({ children }) {
  /* ... */
  const { authState } = useAuth();
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)]">
        Loading...
      </div>
    );
  }
  if (!authState.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!authState.user?.isVerified) {
    return <Navigate to="/please-verify" replace />;
  }
  return children;
}

// Child component containing Routes
function AppRoutes() {
  const location = useLocation();
  const { authState } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ---> CHANGE START <--- */}
        {/* Public & Auth Routes - Wrap elements with default (fixed) wrapper */}
        <Route
          path="/"
          element={
            <PageTransitionWrapper>
              <LandingPage />
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransitionWrapper>
              {authState.isAuthenticated ? (
                <Navigate to="/workspace/novels" replace />
              ) : (
                <LoginPage />
              )}
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/signup"
          element={
            <PageTransitionWrapper>
              {authState.isAuthenticated ? (
                <Navigate to="/workspace/novels" replace />
              ) : (
                <SignupPage />
              )}
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/verify-email/:token"
          element={
            <PageTransitionWrapper>
              <VerifyEmailPage />
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/please-verify"
          element={
            <PageTransitionWrapper>
              <PleaseVerifyPage />
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PageTransitionWrapper>
              <ForgotPasswordPage />
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PageTransitionWrapper>
              <ResetPasswordPage />
            </PageTransitionWrapper>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <PageTransitionWrapper>
              <AuthCallbackPage />
            </PageTransitionWrapper>
          }
        />
        {/* ---> CHANGE END <--- */}

        {/* Protected Workspace Routes - Layout handles internal wrapper */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          {/* Nested routes - Elements here are rendered by Outlet in WorkspaceLayout */}
          <Route index element={<Navigate to="novels" replace />} />
          <Route path="novels" element={<NovelsListPage />} />
          <Route
            path="novel/:novelId/details"
            element={<NovelInfoFormPage />}
          />
          <Route
            path="novel/:novelId/editor"
            element={<WorkspaceEditorPage />}
          />
          <Route path="novel/:novelId/workbench" element={<WorkbenchPage />} />
          <Route
            path="novel/:novelId/characters"
            element={<CharactersPage />}
          />
          <Route
            path="novel/:novelId/characters/:characterId"
            element={<CharacterDetailPage />}
          />
          {/* Placeholder routes */}
          {/* <Route path="novel/:novelId/world" element={<WorldPage />} /> */}
          {/* <Route path="novel/:novelId/outline" element={<OutlinePage />} /> */}
          {/* <Route path="novel/:novelId/notes" element={<NotesPage />} /> */}
        </Route>

        {/* Catch-all Route */}
        <Route
          path="*"
          element={
            <PageTransitionWrapper>
              <NotFoundPage />
            </PageTransitionWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Main App component (no changes)
function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
