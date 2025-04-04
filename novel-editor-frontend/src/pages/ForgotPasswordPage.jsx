// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AlertModal from '../components/AlertModal'; // Reuse alert modal

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(''); // For success/info messages
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false); // For modal

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    setShowAlert(false);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      // Call backend endpoint
      const response = await axios.post('http://localhost:5001/api/auth/forgotpassword', { email });

      // Show success message from backend (generic one)
      setMessage(response.data.message || 'Password reset instructions sent if account exists.');
      setLoading(false);
      setEmail(''); // Clear field on success

    } catch (err) {
      console.error('Forgot password error:', err);
      // Show generic error or backend error if available
      const errMsg = err.response?.data?.message || 'Failed to send password reset request.';
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
      {/* Reusing AlertModal for potential future use, not strictly needed for this page's flow */}
      <AlertModal
         alert_message={showAlert ? message || error : null}
         onClose={() => setShowAlert(false)}
         title={error ? "Error" : "Info"}
      />

      <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
         Novel Scribe
      </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-text-heading)]">Forgot Password</h1>
        {/* Display Messages Directly */}
        {error && <p className="mb-4 text-center text-red-500 text-sm">{error}</p>}
        {message && <p className="mb-4 text-center text-green-500 text-sm">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="form-label">
              Enter Your Account Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="you@example.com"
              required
              className="form-input focus:ring-[var(--color-neon-cyan)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary-cyan" // Use component class
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-400">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-[var(--color-neon-cyan)] hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;