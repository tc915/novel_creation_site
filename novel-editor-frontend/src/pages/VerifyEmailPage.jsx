// src/pages/VerifyEmailPage.jsx
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const { token } = useParams();
  // --- STEP 1: Create a ref to track if verification was attempted ---
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // --- STEP 2: Check the ref before making the API call ---
      // Only proceed if verification hasn't been attempted for this mount/token
      if (!verificationAttempted.current) {
          // --- STEP 3: Mark verification as attempted ---
          verificationAttempted.current = true; // Set flag immediately

          setIsLoading(true);
          setIsError(false);
          setMessage('');

          if (!token) {
            setMessage('Verification token missing.');
            setIsError(true);
            setIsLoading(false);
            return;
          }

          try {
            console.log(`Attempting verification with token: ${token}`); // Added log
            const response = await axios.get(`http://localhost:5001/api/auth/verify-email/${token}`);
            console.log('Verification API response:', response); // Added log

            setMessage(response.data.message || 'Email successfully verified!');
            setIsError(false);

          } catch (err) {
            console.error('Email verification error:', err);
            // Log the specific error response if available
            if (err.response) {
                console.error("Error response data:", err.response.data);
                console.error("Error response status:", err.response.status);
            }
            const errMsg = err.response?.data?.message || 'Email verification failed. The link may be invalid or expired.';
            setMessage(errMsg);
            setIsError(true);
          } finally {
            setIsLoading(false);
          }
      } else {
          console.log("Skipping duplicate verification attempt due to StrictMode.");
          // If the effect runs again, do nothing if already attempted
          // The state (message, isError, isLoading) from the *first* run will persist.
      }
    };

    verifyEmail();

    // Note: No cleanup function needed here as we want the state from the first run to persist.

  }, [token]); // Dependency array remains [token]

  return (
    // Use theme styles
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
       <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
         Novel Scribe
       </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-text-heading)]">Email Verification</h1>

        {isLoading ? (
          <p className="text-lg text-[var(--color-text-muted)]">Verifying...</p>
        ) : (
          <div>
            <p className={`text-lg mb-6 ${isError ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
            {!isError && (
              <Link
                to="/login"
                className="btn-primary-cyan text-base py-2 px-6 inline-block" // Use component class
              >
                Proceed to Login
              </Link>
            )}
             {isError && (
              <Link
                to="/signup" // Or login, depending on desired flow for failed verification
                className="btn-primary-pink text-base py-2 px-6 inline-block" // Use component class
              >
                Back to Signup
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;