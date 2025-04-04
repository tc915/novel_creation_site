// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AlertModal from '../components/AlertModal';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyAlert, setShowVerifyAlert] = useState(false);
  const [alertMessageContent, setAlertMessageContent] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowVerifyAlert(false);
    setAlertMessageContent('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });

      console.log('Login successful:', response.data);
      if (response.data.token && response.data.isVerified) {
        const userData = {
           userId: response.data.userId,
           name: response.data.name,
           email: response.data.email,
           isVerified: response.data.isVerified
        };
        login(response.data.token, userData);
        navigate('/workspace');
      } else if (response.data.token && !response.data.isVerified) {
        setAlertMessageContent("Please check your email inbox (and spam folder) to verify your account before logging in.");
        setShowVerifyAlert(true);
      } else {
         setError('Login failed. Please try again.');
      }
      setLoading(false);

    } catch (err) {
      console.error('Login error:', err);
      const message = err.response?.data?.message || 'Login failed. Please check credentials or verify your email.';
      setError(message);
      setLoading(false);
    }
  };

  // Define backend URL (replace with env variable if preferred)
  const backendUrl = 'http://localhost:5001';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
       <AlertModal
          alert_message={showVerifyAlert ? alertMessageContent : null}
          onClose={() => setShowVerifyAlert(false)}
          title="Account Verification Required"
       />

       <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
         Novel Scribe // Auth
       </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-text-heading)]">Log In</h1>
        {error && <p className="mb-4 text-center text-red-500 bg-red-900/50 border border-red-500 p-2 rounded text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
           {/* Email Input */}
           <div>
             <label htmlFor="email" className="form-label">Email Address</label>
             <input type="email" id="email" name="email" placeholder="you@example.com" required className="form-input focus:ring-[var(--color-neon-cyan)]" value={email} onChange={(e) => setEmail(e.target.value)} />
           </div>
           {/* Password Input */}
           <div>
             <label htmlFor="password" className="form-label">Password</label>
             <input type="password" id="password" name="password" placeholder="••••••••" required className="form-input focus:ring-[var(--color-neon-cyan)]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="text-right mt-2">
                 <Link to="/forgot-password" className="text-xs text-[var(--color-accent-purple)] hover:underline font-mono">Forgot password?</Link>
              </div>
           </div>
          {/* Login Button */}
          <button type="submit" className="w-full btn-primary-cyan py-2" disabled={loading}>
            {loading ? 'Authenticating...' : '[ Log In ]'}
          </button>
        </form>

        {/* --- Divider (Optional) --- */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-[var(--color-border)]"></div>
          <span className="flex-shrink mx-4 text-xs text-[var(--color-text-muted)] font-mono">OR</span>
          <div className="flex-grow border-t border-[var(--color-border)]"></div>
        </div>

        {/* --- STEP 1: Add Google Login Button --- */}
        <a
          href={`${backendUrl}/api/auth/google`} // Link to backend initiation route
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded shadow-sm text-sm text-black bg-white hover:bg-gray-200 transition duration-200 font-[var(--font-display)]"
          // Simple white button style for Google, adjust as needed
        >
          {/* Add Google Icon here later if desired */}
          Continue with Google
        </a>
        {/* --- End Google Login Button --- */}

        <p className="mt-6 text-center text-sm text-gray-400 font-[var(--font-body)]">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-[var(--color-neon-pink)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
export default LoginPage;