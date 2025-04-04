// src/pages/LandingPage.jsx
import React, { useState } from 'react';
// --- STEP 1: Add useNavigate import ---
import { Link, useNavigate } from 'react-router-dom';
import Dither from '../components/Dither'; // Adjust path if needed
// --- STEP 2: Import useAuth ---
import { useAuth } from '../context/AuthContext'; // Adjust path if needed
import AlertModal from '../components/AlertModal';

function LandingPage() {
  // --- STEP 3: Get auth state and functions ---
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);
  const [alertMessageContent, setAlertMessageContent] = useState('');

  const mainTitle = "Novel Scribe";
  const subText = "The ultimate workspace for novelists. Organize your thoughts, build your world, develop characters, and write your masterpiece – all in one place.";

  // Logout handler function
  const handleLogout = () => {
    logout();
    // Optional: navigate('/login');
  };

  const handleMainButtonClick = (e) => {
    if (authState.isAuthenticated) {
      if (authState.user?.isVerified) {
        navigate('/workspace');
      } else {
        e.preventDefault();
        setAlertMessageContent("Please check your email inbox (and spam folder)) to verify your account before accessing the workspace.")
        setShowVerifyAlert(true);
      }
    } else {
      navigate('/signup');
    }
  }


  return (
    // Make the ROOT div relative to position the background absolutely within it
    <div className="relative min-h-screen flex flex-col bg-[var(--color-cyber-bg)] text-[var(--color-text-base)]">
      <AlertModal
        alert_message={showVerifyAlert ? alertMessageContent : null}
        onClose={() => setShowVerifyAlert(false)}
        title="Account Verification Required"
      />
      {/* Dither background */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <Dither
          colorA={[1.0, 0.0, 1.0]} // Pink
          colorB={[0.0, 1.0, 1.0]} // Cyan
          disableAnimation={false}
          enableMouseInteraction={false}
          mouseRadius={0.3}
          colorNum={4}
          waveAmplitude={0.3}
          waveFrequency={3}
          waveSpeed={0.05}
        />
      </div>

      {/* --- Navigation --- */}
      {/* Ensure nav has relative positioning and higher z-index */}
      {/* NOTE: Removed backdrop-blur, shadow, border, bg from NAV based on your provided code */}
      <nav className="sticky top-0 z-50 py-2">
        {/* NOTE: Removed container, bg, border, rounded from INNER DIV based on your provided code */}
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1>
            <Link to="/" className="text-xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 font-[var(--font-display)]">
              {mainTitle}
            </Link>
          </h1>
          {/* --- STEP 4: Conditional Navbar Content --- */}
          <div>
            {authState.isAuthenticated ? (
              // --- Logged In View ---
              <div className="flex items-center">
                <span className="text-gray-300 mr-4 font-[var(--font-body)]">
                  {/* Display name or email */}
                  {authState.user?.name || authState.user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  // Style similarly to your Sign Up button but maybe different color
                  className="bg-red-600 text-white text-sm px-4 py-1.5 rounded hover:bg-red-700 transition font-[var(--font-display)]"
                >
                  Log Out
                </button>
              </div>
            ) : (
              // --- Logged Out View (using your provided structure) ---
              <>
                <Link to="/login" className="text-gray-300 hover:text-[var(--color-neon-cyan)] px-3 py-2 mr-2 rounded transition duration-200 font-[var(--font-body)]">
                  Log In
                </Link>
                <Link to="/signup" className="btn-primary-pink text-sm px-4 py-1.5"> {/* Assuming btn-primary-pink is defined in your CSS */}
                   Sign Up
                </Link>
              </>
            )}
          </div>
          {/* --- End Conditional Content --- */}
        </div>
      </nav>

      {/* --- Main Content Area --- */}
      <div className="flex-grow flex flex-col items-center justify-center text-center px-4 overflow-hidden z-10">
        {/* Content container */}
        {/* NOTE: Adjusted max-w based on your code */}
        <div className="w-full max-w-3xl flex flex-col items-center pt-16 pb-16">
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-10 leading-tight uppercase tracking-wider text-white drop-shadow-lg">
            {mainTitle}
          </h1>
          {/* Subtext */}
           {/* NOTE: Adjusted max-w and bg opacity based on your code */}
          <p className="text-lg text-gray-200 mb-12 font-[var(--font-body)] bg-black/25 backdrop-blur-sm p-4 rounded-md shadow-lg max-w-2xl">
            {subText}
          </p>

          {/* --- STEP 5: Conditional Button --- */}
          <Link
             // Change link based on auth state
            to={authState.isAuthenticated ? "/workspace" : "/signup"}
            // NOTE: Using class from your code, assuming btn-primary-cyan defined in CSS
            className="btn-primary-cyan text-lg py-3 px-8 inline-block transform hover:-translate-y-1"
          >
             {/* Change text based on auth state */}
            {/* NOTE: Using text from your code */}
            {authState.isAuthenticated ? "[ Start Writing Now ]" : "[ Start Writing Now ]"}
            {/* Correction: Should probably be different text if not logged in */}
            {/* {authState.isAuthenticated ? "[ Start Writing Now ]" : "[ Get Started Now ]"} */}
          </Link>
          {/* --- End Conditional Button --- */}
        </div>
      </div>

      {/* --- Footer --- */}
      <footer className="py-4 relative z-10">
         {/* NOTE: Styling based on your code (no bg/border/rounding on inner div) */}
        <div className="container mx-auto px-4 py-4 text-center text-black text-xs font-mono bg-none"> {/* Careful: text-black might be hard to read */}
          &copy; {new Date().getFullYear()} Novel Scribe. All rights reserved.
          <div className="mt-2 space-x-4">
            <Link to="/about" className="hover:text-[var(--color-neon-cyan)] transition">About</Link>
            <span className="text-gray-600">|</span>
            <Link to="/privacy" className="hover:text-[var(--color-neon-cyan)] transition">Privacy Policy</Link>
            <span className="text-gray-600">|</span>
            <Link to="/contact" className="hover:text-[var(--color-neon-cyan)] transition">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;