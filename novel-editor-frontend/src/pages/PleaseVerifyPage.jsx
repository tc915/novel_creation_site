// src/pages/PleaseVerifyPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Assuming useAuth is in context

function PleaseVerifyPage() {
    const { authState, logout } = useAuth(); // Get user email and logout

    // Optional: Add function to call a backend resend verification endpoint
    // const handleResend = async () => { ... }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
       <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
         Novel Scribe
       </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-neon-cyan)]">Verification Required</h1>
        <p className="text-lg text-gray-300 mb-4 font-[var(--font-body)]">
          Thank you for signing up!
        </p>
        <p className="text-base text-gray-400 mb-8 font-[var(--font-body)]">
           A verification link has been sent to{' '}
           <strong className="text-[var(--color-neon-pink)]">{authState.user?.email || 'your email address'}</strong>.
           <br />
           Please check your inbox (and spam folder) and click the link to activate your account before logging in or accessing the workspace.
        </p>
        {/* Optional Resend Button - Requires backend endpoint */}
        {/* <button onClick={handleResend} className="btn-primary-cyan text-sm mb-4">Resend Verification Email</button> */}
        <div>
            <button onClick={logout} className="text-gray-400 hover:text-[var(--color-neon-cyan)] font-mono text-sm underline">
                Log Out
            </button>
        </div>
      </div>
    </div>
  );
}

export default PleaseVerifyPage;