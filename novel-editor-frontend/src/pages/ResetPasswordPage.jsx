// src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AlertModal from '../components/AlertModal';

function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const { token } = useParams(); // Get token from URL
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    setShowAlert(false);

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (!token) {
        setError('Invalid or missing reset token.'); // Should not happen if route works
        setLoading(false);
        return;
    }

    try {
      // Call backend PUT endpoint
      const response = await axios.put(`http://localhost:5001/api/auth/resetpassword/${token}`, { password });

      setMessage(response.data.message || 'Password reset successfully!');
      setError(''); // Clear any previous error
      setLoading(false);
      setPassword(''); // Clear fields
      setConfirmPassword('');
      // Optional: Show success alert and redirect after a delay
      setShowAlert(true);
      setTimeout(() => navigate('/login'), 3000); // Redirect to login after 3s

    } catch (err) {
      console.error('Reset password error:', err);
      const errMsg = err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.';
      setError(errMsg);
      setMessage(''); // Clear success message
      setLoading(false);
      setShowAlert(true); // Show error in alert
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-cyber-bg)] text-[var(--color-text-base)] px-4">
       <AlertModal
         alert_message={showAlert ? message || error : null} // Show success or error
         onClose={() => {
             setShowAlert(false);
             if (!error) navigate('/login'); // Navigate immediately if user closes success modal
            }}
         title={error ? "Error" : "Success"}
      />

      <Link to="/" className="text-3xl text-[var(--color-neon-cyan)] hover:text-white transition duration-200 mb-8 font-[var(--font-display)]">
         Novel Scribe
      </Link>
      <div className="p-8 bg-gray-900 border border-[var(--color-border)] rounded shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-text-heading)]">Reset Password</h1>
         {/* Display errors not shown in modal, if any */}
         {!showAlert && error && <p className="mb-4 text-center text-red-500 text-sm">{error}</p>}
         {!showAlert && message && <p className="mb-4 text-center text-green-500 text-sm">{message}</p>}

        {/* Don't show form if success message is displayed via modal */}
        {!showAlert || error ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="form-label">
                New Password:
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter new password (min 6 chars)"
                required
                className="form-input focus:ring-[var(--color-neon-cyan)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm New Password:
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm new password"
                required
                className="form-input focus:ring-[var(--color-neon-cyan)]"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary-cyan"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : null}
         <p className="mt-6 text-center text-sm">
             <Link to="/login" className="font-medium text-[var(--color-neon-cyan)] hover:underline">
                 Back to Login
             </Link>
         </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;